import { prisma } from "../../../lib/prisma";

export const getUserComments = async (
    userId: string,
    params: { search?: string; sortBy?: string; dateRange?: string; page: number; limit: number }
) => {
    try {
        const { search, sortBy, dateRange, page, limit } = params;
        const skip = (page - 1) * limit;

        const where: any = { userId, isDeleted: false };

        if (search) {
            where.OR = [
                { content: { contains: search, mode: 'insensitive' } },
                { idea: { title: { contains: search, mode: 'insensitive' } } },
            ];
        }

        if (dateRange && dateRange !== 'all') {
            const now = new Date();
            let startDate: Date;
            switch (dateRange) {
                case 'week': startDate = new Date(now.setDate(now.getDate() - 7)); break;
                case 'month': startDate = new Date(now.setDate(now.getDate() - 30)); break;
                default: startDate = new Date(0);
            }
            where.createdAt = { gte: startDate };
        }

        const orderBy: any = sortBy === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

        const [comments, totalItems, totalComments] = await Promise.all([
            prisma.comment.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    idea: { select: { id: true, title: true, imageUrl: true, voteScore: true } },
                    _count: { select: { replies: { where: { isDeleted: false } } } },
                },
            }),
            prisma.comment.count({ where }),
            prisma.comment.count({ where: { userId, isDeleted: false } }),
        ]);

        // Get most active idea
        const mostActiveIdeaResult = await prisma.comment.groupBy({
            by: ['ideaId'],
            where: { userId, isDeleted: false },
            _count: { ideaId: true },
            orderBy: { _count: { ideaId: 'desc' } },
            take: 1,
        });

        let mostActiveIdea: string | null = null;
        if (mostActiveIdeaResult?.[0]) {
            const idea = await prisma.idea.findUnique({
                where: { id: mostActiveIdeaResult[0].ideaId },
                select: { title: true },
            });
            mostActiveIdea = idea?.title || null;
        }

        const lastComment = await prisma.comment.findFirst({
            where: { userId, isDeleted: false },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
        });

        return {
            success: true,
            data: {
                comments: comments.map(c => ({
                    id: c.id,
                    content: c.content,
                    isDeleted: c.isDeleted,
                    createdAt: c.createdAt,
                    updatedAt: c.updatedAt,
                    idea: c.idea,
                    replyCount: c._count.replies,
                })),
                stats: {
                    totalComments,
                    mostActiveIdea,
                    lastCommentDate: lastComment?.createdAt?.toISOString() || null,
                },
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: limit,
                },
            },
        };
    } catch (error) {
        console.error("Get user comments error:", error);
        return { success: false, message: "Failed to fetch comments" };
    }
};