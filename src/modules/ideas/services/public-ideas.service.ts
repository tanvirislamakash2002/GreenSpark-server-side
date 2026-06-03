import { PaymentStatus, Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";

const getIdeas = async (params: {
    page: number;
    limit: number;
    search?: string;
    category?: string;
    paymentStatus?: string;
    sortBy: 'recent' | 'topVoted' | 'mostViewed';
}) => {
    try {
        const { page, limit, search, category, paymentStatus, sortBy } = params;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.IdeaWhereInput = {};

        where.status = 'APPROVED';

        if (paymentStatus === 'free') {
            where.isPaid = false;
        } else if (paymentStatus === 'paid') {
            where.isPaid = true;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { problemStatement: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (category) {
            where.categories = {
                some: {
                    category: {
                        slug: category,
                    },
                },
            };
        }

        // Build order by
        let orderBy: Prisma.IdeaOrderByWithRelationInput = {};
        switch (sortBy) {
            case 'topVoted':
                orderBy = { voteScore: 'desc' };
                break;
            case 'mostViewed':
                orderBy = { viewCount: 'desc' };
                break;
            case 'recent':
            default:
                orderBy = { createdAt: 'desc' };
                break;
        }

        // Get ideas
        const ideas = await prisma.idea.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        const totalItems = await prisma.idea.count({ where });

        // Transform data
        const transformedIdeas = ideas.map(idea => ({
            id: idea.id,
            title: idea.title,
            problemStatement: idea.problemStatement,
            solution: idea.solution,
            description: idea.description,
            imageUrl: idea.imageUrl,
            status: idea.status,
            isPaid: idea.isPaid,
            price: idea.price,
            voteScore: idea.voteScore,
            viewCount: idea.viewCount,
            commentCount: idea.commentCount,
            author: idea.author,
            categories: idea.categories.map(c => ({
                id: c.category.id,
                name: c.category.name,
                slug: c.category.slug,
            })),
            createdAt: idea.createdAt,
            updatedAt: idea.updatedAt,
        }));

        return {
            success: true,
            data: {
                ideas: transformedIdeas,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: limit,
                },
            },
        };
    } catch (error) {
        console.error("Get ideas error:", error);
        return { success: false, message: "Failed to fetch ideas" };
    }
};

const getFeaturedIdeas = async (limit: number) => {
    try {
        const ideas = await prisma.idea.findMany({
            where: { status: 'APPROVED' },
            orderBy: { voteScore: 'desc' },
            take: limit,
            include: {
                author: {
                    select: { id: true, name: true, image: true },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        const transformedIdeas = ideas.map(idea => ({
            id: idea.id,
            title: idea.title,
            description: idea.description,
            imageUrl: idea.imageUrl,
            voteScore: idea.voteScore,
            viewCount: idea.viewCount,
            isPaid: idea.isPaid,
            author: idea.author,
            categories: idea.categories.map(c => ({
                id: c.category.id,
                name: c.category.name,
                slug: c.category.slug,
            })) || [],
            createdAt: idea.createdAt,
        }));

        return { success: true, data: transformedIdeas };
    } catch (error) {
        console.error("Get featured ideas error:", error);
        return { success: false, message: "Failed to fetch featured ideas" };
    }
};

const getTopVotedIdeas = async (limit: number) => {
    try {
        const ideas = await prisma.idea.findMany({
            where: { status: 'APPROVED' },
            orderBy: { voteScore: 'desc' },
            take: limit,
            include: {
                author: {
                    select: { id: true, name: true, image: true },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        const transformedIdeas = ideas.map(idea => ({
            id: idea.id,
            title: idea.title,
            description: idea.description,
            imageUrl: idea.imageUrl,
            voteScore: idea.voteScore,
            author: idea.author,
            category: idea.categories[0]?.category,
            createdAt: idea.createdAt,
        }));

        return { success: true, data: transformedIdeas };
    } catch (error) {
        console.error("Get top voted ideas error:", error);
        return { success: false, message: "Failed to fetch top voted ideas" };
    }
};

const getRecentIdeas = async (limit: number) => {
    try {
        const ideas = await prisma.idea.findMany({
            where: { status: 'APPROVED' },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                author: {
                    select: { id: true, name: true, image: true },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        const transformedIdeas = ideas.map(idea => ({
            id: idea.id,
            title: idea.title,
            description: idea.description,
            imageUrl: idea.imageUrl,
            voteScore: idea.voteScore,
            author: idea.author,
            category: idea.categories[0]?.category,
            createdAt: idea.createdAt,
        }));

        return { success: true, data: transformedIdeas };
    } catch (error) {
        console.error("Get recent ideas error:", error);
        return { success: false, message: "Failed to fetch recent ideas" };
    }
};

const getIdeaById = async (id: string, userId?: string, userRole?: string) => {
    try {
        const idea = await prisma.idea.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        createdAt: true,
                    },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        if (!idea) {
            return { success: false, message: "Idea not found" };
        }

        // Check if user has full access
        let hasFullAccess = false;
        
        if (userRole === "ADMIN" || userId === idea?.author?.id) {
            hasFullAccess = true;
        }
        else if (idea.isPaid && idea.status === "APPROVED") {
            // Check if user is logged in and has paid
            if (userId) {
                const payment = await prisma.payment.findFirst({
                    where: {
                        userId,
                        ideaId: id,
                        status: PaymentStatus.COMPLETED,
                    },
                });
                hasFullAccess = !!payment;
            }
        } else {
            // Free ideas - always full access
            hasFullAccess = true;
        }

        // Increment view count (always increment)
        await prisma.idea.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });

        // Prepare response based on access level
        const baseData = {
            id: idea.id,
            title: idea.title,
            imageUrl: idea.imageUrl,
            status: idea.status,
            isPaid: idea.isPaid,
            price: idea.price,
            voteScore: idea.voteScore,
            viewCount: idea.viewCount + 1,
            commentCount: idea.commentCount,
            author: idea.author,
            categories: idea.categories.map(c => ({
                id: c.category.id,
                name: c.category.name,
                slug: c.category.slug,
            })),
            createdAt: idea.createdAt,
            updatedAt: idea.updatedAt,
        };

        if (hasFullAccess) {
            // Full access - show everything
            return {
                success: true,
                data: {
                    ...baseData,
                    problemStatement: idea.problemStatement,
                    solution: idea.solution,
                    description: idea.description,
                    feedback: idea.feedback,
                    hasFullAccess: true,
                },
            };
        } else {
            // Limited access - only show problem statement, hide solution and description
            return {
                success: true,
                data: {
                    ...baseData,
                    problemStatement: idea.problemStatement, // Show this as preview
                    solution: "Purchase this idea to see the complete solution.",
                    description: "Purchase this idea to see the complete description.",
                    feedback: idea.feedback,
                    hasFullAccess: false,
                    requiresPayment: true,
                },
            };
        }
    } catch (error) {
        console.error("Get idea by ID error:", error);
        return { success: false, message: "Failed to fetch idea" };
    }
};

const getIdeaBySlug = async (slug: string) => {
    try {
        const idea = await prisma.idea.findFirst({
            where: {
                title: {
                    mode: 'insensitive',
                    equals: slug.replace(/-/g, ' '),
                },
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        if (!idea) {
            return { success: false, message: "Idea not found" };
        }

        return {
            success: true,
            data: {
                id: idea.id,
                title: idea.title,
                problemStatement: idea.problemStatement,
                solution: idea.solution,
                description: idea.description,
                imageUrl: idea.imageUrl,
                status: idea.status,
                isPaid: idea.isPaid,
                price: idea.price,
                voteScore: idea.voteScore,
                viewCount: idea.viewCount,
                author: idea.author,
                categories: idea.categories.map(c => ({
                    id: c.category.id,
                    name: c.category.name,
                    slug: c.category.slug,
                })),
                createdAt: idea.createdAt,
                updatedAt: idea.updatedAt,
            },
        };
    } catch (error) {
        console.error("Get idea by slug error:", error);
        return { success: false, message: "Failed to fetch idea" };
    }
};

export const publicIdeasService = {
    getIdeas,
    getFeaturedIdeas,
    getTopVotedIdeas,
    getRecentIdeas,
    getIdeaById,
    getIdeaBySlug,
};