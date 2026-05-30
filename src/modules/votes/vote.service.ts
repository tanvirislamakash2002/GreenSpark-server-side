import { prisma } from "../../lib/prisma";

const castVote = async (userId: string, ideaId: string, voteType: 'UP' | 'DOWN') => {
    try {
        // Check if idea exists
        const idea = await prisma.idea.findUnique({
            where: { id: ideaId },
        });

        if (!idea) {
            return { success: false, message: "Idea not found" };
        }

        // Check if user already voted
        const existingVote = await prisma.vote.findUnique({
            where: {
                userId_ideaId: {
                    userId,
                    ideaId,
                },
            },
        });

        let voteChange = 0;

        if (!existingVote) {
            // New vote
            voteChange = voteType === 'UP' ? 1 : -1;
            await prisma.vote.create({
                data: {
                    userId,
                    ideaId,
                    voteType,
                },
            });
        } else if (existingVote.voteType !== voteType) {
            // Changing vote (up → down or down → up)
            voteChange = voteType === 'UP' ? 2 : -2;
            await prisma.vote.update({
                where: { id: existingVote.id },
                data: { voteType },
            });
        } else {
            // Same vote - remove it (toggle off)
            voteChange = voteType === 'UP' ? -1 : 1;
            await prisma.vote.delete({
                where: { id: existingVote.id },
            });
        }

        // Update idea's voteScore
        if (voteChange !== 0) {
            await prisma.idea.update({
                where: { id: ideaId },
                data: { voteScore: { increment: voteChange } },
            });
        }

        // Get updated vote count
        const updatedIdea = await prisma.idea.findUnique({
            where: { id: ideaId },
            select: { voteScore: true },
        });

        const message = !existingVote 
            ? `${voteType === 'UP' ? 'Upvoted' : 'Downvoted'} successfully`
            : existingVote.voteType !== voteType
                ? `Vote changed to ${voteType === 'UP' ? 'upvote' : 'downvote'}`
                : 'Vote removed';

        return {
            success: true,
            message,
            data: {
                voteScore: updatedIdea?.voteScore || 0,
                userVote: existingVote?.voteType !== voteType ? voteType : null,
            },
        };
    } catch (error) {
        console.error("Cast vote error:", error);
        return { success: false, message: "Failed to cast vote" };
    }
};

const removeVote = async (userId: string, ideaId: string) => {
    try {
        const existingVote = await prisma.vote.findUnique({
            where: {
                userId_ideaId: {
                    userId,
                    ideaId,
                },
            },
        });

        if (!existingVote) {
            return { success: false, message: "No vote found to remove" };
        }

        // Update voteScore
        const voteChange = existingVote.voteType === 'UP' ? -1 : 1;
        await prisma.idea.update({
            where: { id: ideaId },
            data: { voteScore: { increment: voteChange } },
        });

        // Delete vote
        await prisma.vote.delete({
            where: { id: existingVote.id },
        });

        const updatedIdea = await prisma.idea.findUnique({
            where: { id: ideaId },
            select: { voteScore: true },
        });

        return {
            success: true,
            message: "Vote removed successfully",
            data: {
                voteScore: updatedIdea?.voteScore || 0,
                userVote: null,
            },
        };
    } catch (error) {
        console.error("Remove vote error:", error);
        return { success: false, message: "Failed to remove vote" };
    }
};

const getUserVote = async (userId: string, ideaId: string) => {
    try {
        const vote = await prisma.vote.findUnique({
            where: {
                userId_ideaId: {
                    userId,
                    ideaId,
                },
            },
            select: { voteType: true },
        });

        return {
            success: true,
            data: {
                userVote: vote?.voteType || null,
            },
        };
    } catch (error) {
        console.error("Get user vote error:", error);
        return { success: false, message: "Failed to get user vote" };
    }
};

const getUserVotes = async (
    userId: string,
    params: {
        voteType?: string;
        sortBy?: string;
        search?: string;
        category?: string;
        page: number;
        limit: number;
    }
) => {
    try {
        const { voteType, sortBy, search, category, page, limit } = params;
        const skip = (page - 1) * limit;

        // Build where clause for votes
        const where: any = {
            userId,
        };

        if (voteType && voteType !== 'all') {
            where.voteType = voteType;
        }

        // Build where clause for ideas (for search and category)
        const ideaWhere: any = {};

        if (search) {
            ideaWhere.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (category) {
            ideaWhere.categories = {
                some: {
                    category: {
                        slug: category,
                    },
                },
            };
        }

        // Get votes with idea details
        const votes = await prisma.vote.findMany({
            where: {
                ...where,
                idea: ideaWhere,
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: sortBy === 'oldest' ? 'asc' : 'desc',
            },
            include: {
                idea: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        imageUrl: true,
                        voteScore: true,
                        status: true,
                        categories: {
                            include: {
                                category: {
                                    select: {
                                        id: true,
                                        name: true,
                                        slug: true,
                                    },
                                },
                            },
                        },
                        author: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
            },
        });

        // Get total count for pagination
        const totalItems = await prisma.vote.count({
            where: {
                ...where,
                idea: ideaWhere,
            },
        });

        // Get stats
        const stats = await prisma.$transaction([
            prisma.vote.count({ where: { userId } }),
            prisma.vote.count({ where: { userId, voteType: 'UP' } }),
            prisma.vote.count({ where: { userId, voteType: 'DOWN' } }),
        ]);

        // Format the response
        const formattedVotes = votes.map(vote => ({
            id: vote.id,
            voteType: vote.voteType,
            createdAt: vote.createdAt,
            idea: {
                id: vote.idea.id,
                title: vote.idea.title,
                description: vote.idea.description,
                imageUrl: vote.idea.imageUrl,
                voteScore: vote.idea.voteScore,
                status: vote.idea.status,
                categories: vote.idea.categories.map(c => ({
                    id: c.category.id,
                    name: c.category.name,
                    slug: c.category.slug,
                })),
                author: vote.idea.author,
            },
        }));

        return {
            success: true,
            data: {
                votes: formattedVotes,
                stats: {
                    totalVotes: stats[0],
                    upvotes: stats[1],
                    downvotes: stats[2],
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
        console.error("Get user votes error:", error);
        return { success: false, message: "Failed to fetch votes" };
    }
};

export const voteService = {
    castVote,
    removeVote,
    getUserVote,
    getUserVotes
};