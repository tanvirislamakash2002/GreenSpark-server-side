import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";

const getDashboardData = async (userId: string) => {
    try {
        // Get user info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
            },
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        // Get stats
        const [
            totalIdeas,
            draftIdeas,
            pendingIdeas,
            approvedIdeas,
            rejectedIdeas,
            totalVotes,
            totalComments,
            totalBookmarks,
        ] = await Promise.all([
            prisma.idea.count({ where: { authorId: userId } }),
            prisma.idea.count({ where: { authorId: userId, status: "DRAFT" } }),
            prisma.idea.count({ where: { authorId: userId, status: "PENDING" } }),
            prisma.idea.count({ where: { authorId: userId, status: "APPROVED" } }),
            prisma.idea.count({ where: { authorId: userId, status: "REJECTED" } }),
            prisma.vote.count({ where: { userId } }),
            prisma.comment.count({ where: { userId, isDeleted: false } }),
            prisma.bookmark.count({ where: { userId } }),
        ]);

        // Get recent ideas
        const recentIdeas = await prisma.idea.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                title: true,
                status: true,
                voteScore: true,
                viewCount: true,
                commentCount: true,
                createdAt: true,
            },
        });

        // Get recent activity (votes, comments, idea submissions)
        const [recentVotes, recentComments, recentSubmissions] = await Promise.all([
            prisma.vote.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: 3,
                include: { idea: { select: { id: true, title: true } } },
            }),
            prisma.comment.findMany({
                where: { userId, isDeleted: false },
                orderBy: { createdAt: "desc" },
                take: 3,
                include: { idea: { select: { id: true, title: true } } },
            }),
            prisma.idea.findMany({
                where: { authorId: userId },
                orderBy: { createdAt: "desc" },
                take: 3,
                select: { id: true, title: true, createdAt: true },
            }),
        ]);

        // Combine and sort activities
        const activities = [
            ...recentSubmissions.map(idea => ({
                id: `submit-${idea.id}`,
                type: "SUBMIT_IDEA" as const,
                ideaId: idea.id,
                ideaTitle: idea.title,
                createdAt: idea.createdAt,
            })),
            ...recentVotes.map(vote => ({
                id: `vote-${vote.id}`,
                type: "VOTE" as const,
                ideaId: vote.ideaId,
                ideaTitle: vote.idea.title,
                voteType: vote.voteType,
                createdAt: vote.createdAt,
            })),
            ...recentComments.map(comment => ({
                id: `comment-${comment.id}`,
                type: "COMMENT" as const,
                ideaId: comment.ideaId,
                ideaTitle: comment.idea.title,
                createdAt: comment.createdAt,
            })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);

        // Get recent bookmarks
        const recentBookmarks = await prisma.bookmark.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 3,
            include: {
                idea: {
                    select: {
                        id: true,
                        title: true,
                        imageUrl: true,
                        author: { select: { name: true } },
                        voteScore: true,
                    },
                },
            },
        });

        // Get recent votes for preview
        const recentVotesPreview = await prisma.vote.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 3,
            include: { idea: { select: { id: true, title: true, voteScore: true } } },
        });

        return {
            success: true,
            data: {
                stats: {
                    totalIdeas,
                    draftIdeas,
                    pendingIdeas,
                    approvedIdeas,
                    rejectedIdeas,
                    totalVotes,
                    totalComments,
                    totalBookmarks,
                    memberSince: user.createdAt.toISOString(),
                },
                recentIdeas,
                recentActivity: activities,
                recentBookmarks: recentBookmarks.map(b => ({
                    id: b.id,
                    ideaId: b.idea.id,
                    ideaTitle: b.idea.title,
                    ideaImage: b.idea.imageUrl,
                    authorName: b.idea.author.name,
                    voteScore: b.idea.voteScore,
                    bookmarkedAt: b.createdAt,
                })),
                recentVotes: recentVotesPreview.map(v => ({
                    id: v.id,
                    ideaId: v.ideaId,
                    ideaTitle: v.idea.title,
                    voteType: v.voteType,
                    voteScore: v.idea.voteScore,
                    votedAt: v.createdAt,
                })),
                pendingCount: pendingIdeas,
            },
        };
    } catch (error) {
        console.error("Get dashboard data error:", error);
        return { success: false, message: "Failed to fetch dashboard data" };
    }
};

const getStats = async (userId: string) => {
    try {
        const [totalIdeas, draftIdeas, pendingIdeas, approvedIdeas, rejectedIdeas, totalVotes, totalComments, totalBookmarks, user] =
            await Promise.all([
                prisma.idea.count({ where: { authorId: userId } }),
                prisma.idea.count({ where: { authorId: userId, status: "DRAFT" } }),
                prisma.idea.count({ where: { authorId: userId, status: "PENDING" } }),
                prisma.idea.count({ where: { authorId: userId, status: "APPROVED" } }),
                prisma.idea.count({ where: { authorId: userId, status: "REJECTED" } }),
                prisma.vote.count({ where: { userId } }),
                prisma.comment.count({ where: { userId, isDeleted: false } }),
                prisma.bookmark.count({ where: { userId } }),
                prisma.user.findUnique({
                    where: { id: userId },
                    select: { createdAt: true },
                }),
            ]);

        return {
            success: true,
            data: {
                totalIdeas,
                draftIdeas,
                pendingIdeas,
                approvedIdeas,
                rejectedIdeas,
                totalVotes,
                totalComments,
                totalBookmarks,
                memberSince: user?.createdAt.toISOString(),
            },
        };
    } catch (error) {
        console.error("Get stats error:", error);
        return { success: false, message: "Failed to fetch stats" };
    }
};

const getRecentIdeas = async (userId: string, limit: number) => {
    try {
        const ideas = await prisma.idea.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
                id: true,
                title: true,
                status: true,
                voteScore: true,
                viewCount: true,
                commentCount: true,
                createdAt: true,
            },
        });

        return { success: true, data: ideas };
    } catch (error) {
        console.error("Get recent ideas error:", error);
        return { success: false, message: "Failed to fetch recent ideas" };
    }
};

const getMemberIdeas = async (
    userId: string,
    params: {
        page: number;
        limit: number;
        search?: string;
        status?: string;
        sortBy?: string;
    }
) => {
    try {
        const { page, limit, search, status, sortBy } = params;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.IdeaWhereInput = {
            authorId: userId,
        };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status && status !== 'all') {
            where.status = status as any;
        }

        // Build order by
        let orderBy: Prisma.IdeaOrderByWithRelationInput = {};
        switch (sortBy) {
            case 'oldest':
                orderBy = { createdAt: 'asc' };
                break;
            case 'title_asc':
                orderBy = { title: 'asc' };
                break;
            case 'title_desc':
                orderBy = { title: 'desc' };
                break;
            case 'votes':
                orderBy = { voteScore: 'desc' };
                break;
            default:
                orderBy = { createdAt: 'desc' };
        }

        // Get ideas
        const ideas = await prisma.idea.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        // Get total count for pagination
        const totalItems = await prisma.idea.count({ where });

        // Get stats
        const stats = await prisma.$transaction([
            prisma.idea.count({ where: { authorId: userId } }),
            prisma.idea.count({ where: { authorId: userId, status: 'DRAFT' } }),
            prisma.idea.count({ where: { authorId: userId, status: 'PENDING' } }),
            prisma.idea.count({ where: { authorId: userId, status: 'APPROVED' } }),
            prisma.idea.count({ where: { authorId: userId, status: 'REJECTED' } }),
        ]);

        // Get comment counts for each idea
        const ideasWithComments = await Promise.all(
            ideas.map(async (idea) => {
                const commentCount = await prisma.comment.count({
                    where: { ideaId: idea.id, isDeleted: false },
                });
                return {
                    id: idea.id,
                    title: idea.title,
                    problemStatement: idea.problemStatement,
                    solution: idea.solution,
                    description: idea.description,
                    imageUrl: idea.imageUrl,
                    status: idea.status,
                    isPaid: idea.isPaid,
                    price: idea.price,
                    feedback: idea.feedback,
                    voteScore: idea.voteScore,
                    viewCount: idea.viewCount,
                    commentCount,
                    category: idea.categories[0]?.category || { id: '', name: 'Uncategorized' },
                    createdAt: idea.createdAt,
                    updatedAt: idea.updatedAt,
                };
            })
        );

        return {
            success: true,
            data: {
                ideas: ideasWithComments,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: limit,
                },
                stats: {
                    total: stats[0],
                    draft: stats[1],
                    pending: stats[2],
                    approved: stats[3],
                    rejected: stats[4],
                },
            },
        };
    } catch (error) {
        console.error("Get member ideas error:", error);
        return { success: false, message: "Failed to fetch ideas" };
    }
};

const deleteIdea = async (userId: string, ideaId: string) => {
    try {
        const idea = await prisma.idea.findFirst({
            where: { id: ideaId, authorId: userId },
        });

        if (!idea) {
            return { success: false, message: "Idea not found" };
        }

        if (idea.status !== 'DRAFT' && idea.status !== 'REJECTED') {
            return { success: false, message: "Only draft or rejected ideas can be deleted" };
        }

        await prisma.idea.delete({ where: { id: ideaId } });

        return { success: true, message: "Idea deleted successfully" };
    } catch (error) {
        console.error("Delete idea error:", error);
        return { success: false, message: "Failed to delete idea" };
    }
};

const submitIdea = async (userId: string, ideaId: string) => {
    try {
        const idea = await prisma.idea.findFirst({
            where: { id: ideaId, authorId: userId },
        });

        if (!idea) {
            return { success: false, message: "Idea not found" };
        }

        if (idea.status !== 'DRAFT') {
            return { success: false, message: "Only draft ideas can be submitted for review" };
        }

        await prisma.idea.update({
            where: { id: ideaId },
            data: { status: 'PENDING' },
        });

        return { success: true, message: "Idea submitted for review successfully" };
    } catch (error) {
        console.error("Submit idea error:", error);
        return { success: false, message: "Failed to submit idea" };
    }
};

export const memberService = {
    getDashboardData,
    getStats,
    getRecentIdeas,
    getMemberIdeas,
    deleteIdea,
    submitIdea,
};