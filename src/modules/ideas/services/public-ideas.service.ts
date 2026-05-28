import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";

const getIdeas = async (params: {
    page: number;
    limit: number;
    search?: string;
    category?: string;
    status?: string;
    sortBy: 'recent' | 'topVoted' | 'mostViewed';
}) => {
    try {
        const { page, limit, search, category, status, sortBy } = params;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.IdeaWhereInput = {};

        // Only show approved ideas for public
        if (!status) {
            where.status = 'APPROVED';
        } else if (status !== 'all') {
            where.status = status as any;
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

const getIdeaById = async (id: string) => {
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

        // Increment view count
        await prisma.idea.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });

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
                feedback: idea.feedback,
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
            },
        };
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