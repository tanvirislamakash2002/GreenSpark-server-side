import { prisma } from "../../../lib/prisma";

const getDashboardData = async () => {
    try {
        // Get all stats
        const [
            totalUsers,
            activeUsers,
            suspendedUsers,
            totalIdeas,
            pendingIdeas,
            approvedIdeas,
            rejectedIdeas,
            totalVotes,
            totalComments,
            totalBookmarks,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { accountStatus: "ACTIVE" } }),
            prisma.user.count({ where: { accountStatus: "SUSPENDED" } }),
            prisma.idea.count(),
            prisma.idea.count({ where: { status: "PENDING" } }),
            prisma.idea.count({ where: { status: "APPROVED" } }),
            prisma.idea.count({ where: { status: "REJECTED" } }),
            prisma.vote.count(),
            prisma.comment.count({ where: { isDeleted: false } }),
            prisma.bookmark.count(),
        ]);

        // Get pending ideas with author and category
        const pendingIdeasList = await prisma.idea.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
                author: {
                    select: { id: true, name: true, email: true, image: true },
                },
                categories: {
                    include: {
                        category: { select: { id: true, name: true } },
                    },
                },
            },
        });

        // Get recent activity (last 10 actions)
        const recentIdeas = await prisma.idea.findMany({
            where: { status: { in: ["PENDING", "APPROVED", "REJECTED"] } },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { author: { select: { name: true } } },
        });

        const recentUsers = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
        });

        const recentComments = await prisma.comment.findMany({
            where: { isDeleted: false },
            orderBy: { createdAt: "desc" },
            take: 3,
            include: { user: { select: { name: true } }, idea: { select: { title: true } } },
        });

        // Combine activities
        const activities = [
            ...recentIdeas.map(idea => ({
                id: `idea-${idea.id}`,
                type: idea.status === "PENDING" ? "SUBMIT_IDEA" : idea.status === "APPROVED" ? "APPROVE_IDEA" : "REJECT_IDEA",
                message: idea.status === "PENDING"
                    ? `New idea submitted: "${idea.title}" by ${idea.author.name}`
                    : idea.status === "APPROVED"
                        ? `Idea "${idea.title}" was approved`
                        : `Idea "${idea.title}" was rejected`,
                userId: idea.authorId,
                userName: idea.author.name,
                ideaId: idea.id,
                ideaTitle: idea.title,
                createdAt: idea.createdAt,
            })),
            ...recentUsers.map(user => ({
                id: `user-${user.id}`,
                type: "USER_REGISTER",
                message: `New user registered: ${user.name} (${user.email})`,
                userId: user.id,
                userName: user.name,
                createdAt: user.createdAt,
            })),
            ...recentComments.map(comment => ({
                id: `comment-${comment.id}`,
                type: "NEW_COMMENT",
                message: `New comment on "${comment.idea.title}" by ${comment.user.name}`,
                userId: comment.userId,
                userName: comment.user.name,
                ideaId: comment.ideaId,
                ideaTitle: comment.idea.title,
                createdAt: comment.createdAt,
            })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);

        //  Get top contributors using include instead of select
        const topContributors = await prisma.user.findMany({
            where: { role: "MEMBER" },
            take: 5,
            include: {
                ideas: {
                    where: { status: "APPROVED" },
                    select: {
                        voteScore: true,
                    },
                },
                comments: {
                    where: { isDeleted: false },
                    select: { id: true },
                },
            },
            orderBy: {
                ideas: {
                    _count: "desc",
                },
            },
        });

        const contributors = topContributors.map(user => ({
            userId: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            approvedIdeas: user.ideas.length,
            upvotesReceived: user.ideas.reduce((sum: number, idea: { voteScore: number }) => sum + (idea.voteScore > 0 ? idea.voteScore : 0), 0),
            totalComments: user.comments.length,
        }));

        // Get recent users
        const recentUsersList = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                accountStatus: true,
                createdAt: true,
            },
        });

        // Get reported comments count
        const reportedCommentsCount = await prisma.commentReport.count({
            where: { status: "PENDING" },
        });

        // Get chart data
        const last30Days: string[] = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            // Ensure we return a string, never undefined
            return dateString ?? new Date().toISOString().split('T')[0] ?? 'unknown';
        }).reverse();

        const ideasOverTime = await Promise.all(
            last30Days.map(async (dateStr: string) => {
                // Ensure dateStr is defined and valid
                if (!dateStr) {
                    return { date: dateStr || 'unknown', count: 0 };
                }

                const start = new Date(dateStr);
                // Check if date is valid
                if (isNaN(start.getTime())) {
                    return { date: dateStr, count: 0 };
                }

                const end = new Date(dateStr);
                end.setDate(end.getDate() + 1);
                const count = await prisma.idea.count({
                    where: {
                        createdAt: { gte: start, lt: end },
                    },
                });
                return { date: dateStr, count };
            })
        );

        const usersOverTime = await Promise.all(
            last30Days.slice(-7).map(async (dateStr: string) => {
                // Ensure dateStr is defined and valid
                if (!dateStr) {
                    return { date: dateStr || 'unknown', count: 0 };
                }

                const start = new Date(dateStr);
                // Check if date is valid
                if (isNaN(start.getTime())) {
                    return { date: dateStr, count: 0 };
                }

                const end = new Date(dateStr);
                end.setDate(end.getDate() + 1);
                const count = await prisma.user.count({
                    where: {
                        createdAt: { gte: start, lt: end },
                    },
                });
                return { date: dateStr, count };
            })
        );

        const ideasByCategory = await prisma.$queryRaw`
            SELECT c.id as "categoryId", c.name as "categoryName", COUNT(ic."ideaId") as count
            FROM categories c
            LEFT JOIN idea_categories ic ON c.id = ic."categoryId"
            GROUP BY c.id, c.name
            ORDER BY count DESC
        `;

        const ideasByStatus = await prisma.idea.groupBy({
            by: ["status"],
            _count: { status: true },
        });

        return {
            success: true,
            data: {
                stats: {
                    totalUsers,
                    activeUsers,
                    suspendedUsers,
                    totalIdeas,
                    pendingIdeas,
                    approvedIdeas,
                    rejectedIdeas,
                    totalVotes,
                    totalComments,
                    totalBookmarks,
                },
                pendingIdeas: pendingIdeasList.map(idea => ({
                    id: idea.id,
                    title: idea.title,
                    problemStatement: idea.problemStatement,
                    author: idea.author,
                    category: idea.categories[0]?.category || { id: "", name: "Uncategorized" },
                    createdAt: idea.createdAt,
                    voteScore: idea.voteScore,
                })),
                recentActivity: activities,
                topContributors: contributors,
                recentUsers: recentUsersList,
                reportedCommentsCount,
                chartData: {
                    ideasOverTime,
                    usersOverTime,
                    ideasByCategory: ideasByCategory as any[],
                    ideasByStatus: ideasByStatus.map(item => ({
                        status: item.status,
                        count: item._count.status,
                    })),
                },
            },
        };
    } catch (error) {
        console.error("Get dashboard data error:", error);
        return { success: false, message: "Failed to fetch dashboard data" };
    }
};

const getStats = async () => {
    try {
        const [
            totalUsers,
            activeUsers,
            suspendedUsers,
            totalIdeas,
            pendingIdeas,
            approvedIdeas,
            rejectedIdeas,
            totalVotes,
            totalComments,
            totalBookmarks,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { accountStatus: "ACTIVE" } }),
            prisma.user.count({ where: { accountStatus: "SUSPENDED" } }),
            prisma.idea.count(),
            prisma.idea.count({ where: { status: "PENDING" } }),
            prisma.idea.count({ where: { status: "APPROVED" } }),
            prisma.idea.count({ where: { status: "REJECTED" } }),
            prisma.vote.count(),
            prisma.comment.count({ where: { isDeleted: false } }),
            prisma.bookmark.count(),
        ]);

        return {
            success: true,
            data: {
                totalUsers,
                activeUsers,
                suspendedUsers,
                totalIdeas,
                pendingIdeas,
                approvedIdeas,
                rejectedIdeas,
                totalVotes,
                totalComments,
                totalBookmarks,
            },
        };
    } catch (error) {
        console.error("Get stats error:", error);
        return { success: false, message: "Failed to fetch stats" };
    }
};

const getPendingIdeas = async (limit: number) => {
    try {
        const ideas = await prisma.idea.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                author: {
                    select: { id: true, name: true, email: true, image: true },
                },
                categories: {
                    include: {
                        category: { select: { id: true, name: true } },
                    },
                },
            },
        });

        return {
            success: true,
            data: ideas.map(idea => ({
                id: idea.id,
                title: idea.title,
                problemStatement: idea.problemStatement,
                author: idea.author,
                category: idea.categories[0]?.category || { id: "", name: "Uncategorized" },
                createdAt: idea.createdAt,
                voteScore: idea.voteScore,
            })),
        };
    } catch (error) {
        console.error("Get pending ideas error:", error);
        return { success: false, message: "Failed to fetch pending ideas" };
    }
};

const getRecentActivity = async (limit: number) => {
    try {
        const recentIdeas = await prisma.idea.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
            include: { author: { select: { name: true } } },
        });

        const recentUsers = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        const recentComments = await prisma.comment.findMany({
            where: { isDeleted: false },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: { user: { select: { name: true } }, idea: { select: { title: true } } },
        });

        const activities = [
            ...recentIdeas.map(idea => ({
                id: `idea-${idea.id}`,
                type: idea.status === "PENDING" ? "SUBMIT_IDEA" as const : idea.status === "APPROVED" ? "APPROVE_IDEA" as const : "REJECT_IDEA" as const,
                message: idea.status === "PENDING"
                    ? `New idea submitted: "${idea.title}" by ${idea.author.name}`
                    : idea.status === "APPROVED"
                        ? `Idea "${idea.title}" was approved`
                        : `Idea "${idea.title}" was rejected`,
                userId: idea.authorId,
                userName: idea.author.name,
                ideaId: idea.id,
                ideaTitle: idea.title,
                createdAt: idea.createdAt,
            })),
            ...recentUsers.map(user => ({
                id: `user-${user.id}`,
                type: "USER_REGISTER" as const,
                message: `New user registered: ${user.name} (${user.email})`,
                userId: user.id,
                userName: user.name,
                createdAt: user.createdAt,
            })),
            ...recentComments.map(comment => ({
                id: `comment-${comment.id}`,
                type: "NEW_COMMENT" as const,
                message: `New comment on "${comment.idea.title}" by ${comment.user.name}`,
                userId: comment.userId,
                userName: comment.user.name,
                ideaId: comment.ideaId,
                ideaTitle: comment.idea.title,
                createdAt: comment.createdAt,
            })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);

        return { success: true, data: activities };
    } catch (error) {
        console.error("Get recent activity error:", error);
        return { success: false, message: "Failed to fetch recent activity" };
    }
};

export const adminService = {
    getDashboardData,
    getStats,
    getPendingIdeas,
    getRecentActivity,
};