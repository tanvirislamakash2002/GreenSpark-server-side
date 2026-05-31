import { prisma } from "../../lib/prisma";
import { PaymentStatus } from "../../generated/prisma/enums";

const getDateRange = (range: string) => {
    const now = new Date();
    let startDate: Date;

    switch (range) {
        case "7d":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case "30d":
            startDate = new Date(now.setDate(now.getDate() - 30));
            break;
        case "90d":
            startDate = new Date(now.setDate(now.getDate() - 90));
            break;
        case "1y":
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        default:
            startDate = new Date(0); // Beginning of time
    }

    return { startDate, endDate: new Date() };
};

const getOverviewStats = async (range: string) => {
    const { startDate } = getDateRange(range);
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (new Date().getDate() - startDate.getDate()));

    // Current period stats
    const [
        totalUsers,
        activeUsers,
        totalIdeas,
        approvedIdeas,
        pendingIdeas,
        rejectedIdeas,
        totalVotes,
        totalComments,
        paidIdeasSold,
        totalRevenue,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
            where: {
                sessions: { some: { createdAt: { gte: startDate } } },
            },
        }),
        prisma.idea.count(),
        prisma.idea.count({ where: { status: "APPROVED" } }),
        prisma.idea.count({ where: { status: "PENDING" } }),
        prisma.idea.count({ where: { status: "REJECTED" } }),
        prisma.vote.count(),
        prisma.comment.count({ where: { isDeleted: false } }),
        prisma.payment.count({ where: { status: PaymentStatus.COMPLETED } }),
        prisma.payment.aggregate({
            where: { status: PaymentStatus.COMPLETED },
            _sum: { amount: true },
        }),
    ]);

    // Previous period stats for growth calculation
    const [previousUsers, previousIdeas, previousRevenue] = await Promise.all([
        prisma.user.count({ where: { createdAt: { lt: startDate } } }),
        prisma.idea.count({ where: { createdAt: { lt: startDate } } }),
        prisma.payment.aggregate({
            where: {
                status: PaymentStatus.COMPLETED,
                createdAt: { lt: startDate },
            },
            _sum: { amount: true },
        }),
    ]);

    const userGrowth = previousUsers === 0 ? 100 : ((totalUsers - previousUsers) / previousUsers) * 100;
    const ideaGrowth = previousIdeas === 0 ? 100 : ((totalIdeas - previousIdeas) / previousIdeas) * 100;
    const revenueGrowth = previousRevenue._sum.amount === 0 || previousRevenue._sum.amount === null
        ? 100
        : ((totalRevenue._sum.amount || 0) - (previousRevenue._sum.amount || 0)) / (previousRevenue._sum.amount || 0) * 100;

    return {
        totalUsers,
        activeUsers,
        totalIdeas,
        approvedIdeas,
        pendingIdeas,
        rejectedIdeas,
        totalVotes,
        totalComments,
        paidIdeasSold,
        totalRevenue: totalRevenue._sum.amount || 0,
        userGrowth: Math.round(userGrowth),
        ideaGrowth: Math.round(ideaGrowth),
        revenueGrowth: Math.round(revenueGrowth),
    };
};

const getTimeSeriesData = async (range: string) => {
    const { startDate, endDate } = getDateRange(range);
    
    // Generate date labels
    const labels: string[] = [];
    const usersData: number[] = [];
    const ideasData: number[] = [];
    const votesData: number[] = [];
    const revenueData: number[] = [];

    let currentDate = new Date(startDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const interval = range === "90d" || range === "1y" ? "week" : "day";

    while (currentDate <= endDate) {
        const nextDate = new Date(currentDate);
        if (interval === "week") {
            nextDate.setDate(nextDate.getDate() + 7);
        } else {
            nextDate.setDate(nextDate.getDate() + 1);
        }

        const label = interval === "week"
            ? `${currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${nextDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
            : currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        labels.push(label);

        // Count users created in this period
        const users = await prisma.user.count({
            where: {
                createdAt: { gte: currentDate, lt: nextDate },
            },
        });
        usersData.push(users);

        // Count ideas created in this period
        const ideas = await prisma.idea.count({
            where: {
                createdAt: { gte: currentDate, lt: nextDate },
            },
        });
        ideasData.push(ideas);

        // Count votes cast in this period
        const votes = await prisma.vote.count({
            where: {
                createdAt: { gte: currentDate, lt: nextDate },
            },
        });
        votesData.push(votes);

        // Sum revenue from this period
        const revenue = await prisma.payment.aggregate({
            where: {
                status: PaymentStatus.COMPLETED,
                createdAt: { gte: currentDate, lt: nextDate },
            },
            _sum: { amount: true },
        });
        revenueData.push(revenue._sum.amount || 0);

        currentDate = nextDate;
    }

    return { labels, users: usersData, ideas: ideasData, votes: votesData, revenue: revenueData };
};

const getCategoryDistribution = async () => {
    const categories = await prisma.category.findMany({
        include: {
            ideas: {
                select: { ideaId: true },
            },
        },
    });

    const totalIdeas = await prisma.idea.count();

    return categories.map(category => ({
        name: category.name,
        count: category.ideas.length,
        percentage: totalIdeas === 0 ? 0 : Math.round((category.ideas.length / totalIdeas) * 100),
    }));
};

const getStatusDistribution = async () => {
    const statuses = await prisma.idea.groupBy({
        by: ["status"],
        _count: { status: true },
    });

    const statusColors: Record<string, string> = {
        DRAFT: "#6b7280",
        PENDING: "#f59e0b",
        APPROVED: "#10b981",
        REJECTED: "#ef4444",
    };

    return statuses.map(s => ({
        status: s.status,
        count: s._count.status,
        color: statusColors[s.status] || "#6b7280",
    }));
};

const getTopContributors = async (limit: number = 5) => {
    const users = await prisma.user.findMany({
        where: { role: "MEMBER" },
        take: limit,
        include: {
            ideas: {
                where: { status: "APPROVED" },
                select: { voteScore: true },
            },
            comments: {
                where: { isDeleted: false },
                select: { id: true },
            },
        },
        orderBy: {
            ideas: { _count: "desc" },
        },
    });

    return users.map(user => ({
        userId: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        approvedIdeas: user.ideas.length,
        upvotesReceived: user.ideas.reduce((sum, idea) => sum + (idea.voteScore > 0 ? idea.voteScore : 0), 0),
        totalComments: user.comments.length,
    }));
};

const getTopIdeas = async (limit: number = 5) => {
    const ideas = await prisma.idea.findMany({
        where: { status: "APPROVED" },
        orderBy: { voteScore: "desc" },
        take: limit,
        include: {
            author: {
                select: { name: true },
            },
        },
    });

    return ideas.map(idea => ({
        id: idea.id,
        title: idea.title,
        voteScore: idea.voteScore,
        commentCount: idea.commentCount,
        viewCount: idea.viewCount,
        author: idea.author.name,
    }));
};

const getEngagementMetrics = async (range: string) => {
    const { startDate } = getDateRange(range);

    // Vote-to-View Ratio
    const totalViews = await prisma.idea.aggregate({
        _sum: { viewCount: true },
    });
    const totalViewCount = totalViews._sum.viewCount ?? 0; // ✅ Add null coalescing
    const totalVotes = await prisma.vote.count();
    const voteToViewRatio = totalViewCount === 0 ? 0 : (totalVotes / totalViewCount) * 100;

    // Comment-to-View Ratio
    const totalComments = await prisma.comment.count({ where: { isDeleted: false } });
    const commentToViewRatio = totalViewCount === 0 ? 0 : (totalComments / totalViewCount) * 100;

    // Approval Rate
    const totalSubmissions = await prisma.idea.count();
    const approvedIdeas = await prisma.idea.count({ where: { status: "APPROVED" } });
    const approvalRate = totalSubmissions === 0 ? 0 : (approvedIdeas / totalSubmissions) * 100;

    // Conversion Rate (paid idea purchases)
    const paidIdeaViews = await prisma.idea.aggregate({
        where: { isPaid: true },
        _sum: { viewCount: true },
    });
    const paidViewCount = paidIdeaViews._sum.viewCount ?? 0; // ✅ Add null coalescing
    const paidPurchases = await prisma.payment.count({ where: { status: PaymentStatus.COMPLETED } });
    const conversionRate = paidViewCount === 0 ? 0 : (paidPurchases / paidViewCount) * 100;

    // User Retention
    const usersCreated7dAgo = await prisma.user.count({
        where: { createdAt: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    });
    const usersActive7d = await prisma.user.count({
        where: {
            sessions: { some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        },
    });
    const userRetention7d = usersCreated7dAgo === 0 ? 0 : (usersActive7d / usersCreated7dAgo) * 100;

    const usersCreated30dAgo = await prisma.user.count({
        where: { createdAt: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });
    const usersActive30d = await prisma.user.count({
        where: {
            sessions: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        },
    });
    const userRetention30d = usersCreated30dAgo === 0 ? 0 : (usersActive30d / usersCreated30dAgo) * 100;

    // Average Response Time for reports
    const resolvedReports = await prisma.commentReport.findMany({
        where: { resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
    });
    const avgResponseTime = resolvedReports.length === 0
        ? 0
        : resolvedReports.reduce((sum, report) => {
            const diff = (report.resolvedAt!.getTime() - report.createdAt.getTime()) / (1000 * 60 * 60);
            return sum + diff;
        }, 0) / resolvedReports.length;

    // Pending Reports
    const pendingReports = await prisma.commentReport.count({ where: { status: "PENDING" } });

    return {
        voteToViewRatio: Math.round(voteToViewRatio * 100) / 100,
        commentToViewRatio: Math.round(commentToViewRatio * 100) / 100,
        approvalRate: Math.round(approvalRate),
        conversionRate: Math.round(conversionRate),
        userRetention7d: Math.round(userRetention7d),
        userRetention30d: Math.round(userRetention30d),
        avgResponseTime: Math.round(avgResponseTime),
        pendingReports,
    };
};

const getAnalytics = async (range: string) => {
    try {
        const [overview, timeSeries, categoryDistribution, statusDistribution, topContributors, topIdeas, engagement] = await Promise.all([
            getOverviewStats(range),
            getTimeSeriesData(range),
            getCategoryDistribution(),
            getStatusDistribution(),
            getTopContributors(5),
            getTopIdeas(5),
            getEngagementMetrics(range),
        ]);

        return {
            success: true,
            data: {
                overview,
                timeSeries,
                categoryDistribution,
                statusDistribution,
                topContributors,
                topIdeas,
                engagement,
            },
        };
    } catch (error) {
        console.error("Get analytics error:", error);
        return { success: false, message: "Failed to fetch analytics" };
    }
};

const exportAnalytics = async (format: string, range: string) => {
    try {
        const analyticsResult = await getAnalytics(range);
        
        if (!analyticsResult.success || !analyticsResult.data) {
            return { success: false, message: analyticsResult.message || "Failed to fetch analytics data" };
        }

        const { overview, categoryDistribution, topContributors, topIdeas } = analyticsResult.data;

        // Generate CSV content with more comprehensive data
        const rows: string[][] = [];
        
        // Header
        rows.push(["GreenSpark Analytics Report"]);
        rows.push([`Generated: ${new Date().toLocaleString()}`]);
        rows.push([`Date Range: ${range}`]);
        rows.push([]);
        
        // Overview Section
        rows.push(["OVERVIEW STATS"]);
        rows.push(["Metric", "Value"]);
        rows.push(["Total Users", overview.totalUsers.toString()]);
        rows.push(["Active Users", overview.activeUsers.toString()]);
        rows.push(["Total Ideas", overview.totalIdeas.toString()]);
        rows.push(["Approved Ideas", overview.approvedIdeas.toString()]);
        rows.push(["Pending Ideas", overview.pendingIdeas.toString()]);
        rows.push(["Rejected Ideas", overview.rejectedIdeas.toString()]);
        rows.push(["Total Votes", overview.totalVotes.toString()]);
        rows.push(["Total Comments", overview.totalComments.toString()]);
        rows.push(["Paid Ideas Sold", overview.paidIdeasSold.toString()]);
        rows.push(["Total Revenue", `$${overview.totalRevenue}`]);
        rows.push(["User Growth", `${overview.userGrowth}%`]);
        rows.push(["Idea Growth", `${overview.ideaGrowth}%`]);
        rows.push(["Revenue Growth", `${overview.revenueGrowth}%`]);
        rows.push([]);
        
        // Category Distribution
        rows.push(["CATEGORY DISTRIBUTION"]);
        rows.push(["Category", "Count", "Percentage"]);
        categoryDistribution.forEach(cat => {
            rows.push([cat.name, cat.count.toString(), `${cat.percentage}%`]);
        });
        rows.push([]);
        
        // Top Contributors
        rows.push(["TOP CONTRIBUTORS"]);
        rows.push(["Name", "Email", "Approved Ideas", "Upvotes Received", "Total Comments"]);
        topContributors.forEach(contributor => {
            rows.push([
                contributor.name,
                contributor.email,
                contributor.approvedIdeas.toString(),
                contributor.upvotesReceived.toString(),
                contributor.totalComments.toString(),
            ]);
        });
        rows.push([]);
        
        // Top Ideas
        rows.push(["TOP IDEAS"]);
        rows.push(["Title", "Author", "Votes", "Comments", "Views"]);
        topIdeas.forEach(idea => {
            rows.push([
                idea.title,
                idea.author,
                idea.voteScore.toString(),
                idea.commentCount.toString(),
                idea.viewCount.toString(),
            ]);
        });

        // Convert to CSV string with proper escaping
        const csvContent = rows.map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ).join("\n");

        return { success: true, data: csvContent };
    } catch (error) {
        return { success: false, message: "Failed to export analytics" };
    }
};

export const analyticsService = {
    getAnalytics,
    exportAnalytics,
};