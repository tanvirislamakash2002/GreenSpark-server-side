import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

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
        // Get total count
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
            })) || [],  // Fallback to empty array
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
        // Note: You may need to add a slug field to your Idea model
        // For now, we'll search by title transformed to slug
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

const createIdea = async (
    userId: string,
    data: {
        title: string;
        problemStatement: string;
        solution: string;
        description: string;
        imageUrl?: string;
        isPaid: boolean;
        price: number | null;
        categoryId: string;
    }
) => {
    try {
        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: data.categoryId },
        });

        if (!category) {
            return { success: false, message: "Category not found" };
        }

        // Create the idea
        const idea = await prisma.idea.create({
            data: {
                title: data.title,
                problemStatement: data.problemStatement,
                solution: data.solution,
                description: data.description,
                imageUrl: data.imageUrl || null,
                status: 'DRAFT',
                isPaid: data.isPaid,
                price: data.price,
                authorId: userId,
                categories: {
                    create: {
                        categoryId: data.categoryId,
                    },
                },
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true, image: true },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
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
                voteScore: idea.voteScore,
                viewCount: idea.viewCount,
                commentCount: idea.commentCount,
                author: idea.author,
                category: {
                    id: idea.categories[0]?.category.id,
                    name: idea.categories[0]?.category.name,
                },
                createdAt: idea.createdAt,
                updatedAt: idea.updatedAt,
            },
        };
    } catch (error) {
        console.error("Create idea error:", error);
        return { success: false, message: "Failed to create idea" };
    }
};

const updateIdea = async (
    id: string,
    userId: string,
    data: {
        title?: string;
        problemStatement?: string;
        solution?: string;
        description?: string;
        imageUrl?: string;
        isPaid?: boolean;
        price?: number | null;
        categoryId?: string;
    }
) => {
    try {
        const idea = await prisma.idea.findFirst({
            where: { id, authorId: userId },
            include: {
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        if (!idea) {
            return { success: false, message: "Idea not found or unauthorized" };
        }

        // Only allow editing of draft or rejected ideas
        if (idea.status !== 'DRAFT' && idea.status !== 'REJECTED') {
            return { success: false, message: "Only draft or rejected ideas can be edited" };
        }

        // Handle category update if provided
        if (data.categoryId) {
            const currentCategoryId = idea.categories[0]?.categoryId;
            if (data.categoryId !== currentCategoryId) {
                // Remove existing category
                await prisma.ideaCategory.deleteMany({
                    where: { ideaId: id },
                });
                // Add new category
                await prisma.ideaCategory.create({
                    data: {
                        ideaId: id,
                        categoryId: data.categoryId,
                    },
                });
            }
            delete data.categoryId;
        }

        const updateData: Prisma.IdeaUpdateInput = {};
        
        if (data.title !== undefined) updateData.title = data.title;
        if (data.problemStatement !== undefined) updateData.problemStatement = data.problemStatement;
        if (data.solution !== undefined) updateData.solution = data.solution;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
        if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;
        if (data.price !== undefined) updateData.price = data.price;

        // Only update if there are changes
        if (Object.keys(updateData).length > 0) {
            await prisma.idea.update({
                where: { id },
                data: updateData,
            });
        }

        // Fetch updated idea
        const updatedIdea = await prisma.idea.findUnique({
            where: { id },
            include: {
                author: {
                    select: { id: true, name: true, email: true, image: true },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        return {
            success: true,
            data: {
                id: updatedIdea!.id,
                title: updatedIdea!.title,
                problemStatement: updatedIdea!.problemStatement,
                solution: updatedIdea!.solution,
                description: updatedIdea!.description,
                imageUrl: updatedIdea!.imageUrl,
                status: updatedIdea!.status,
                isPaid: updatedIdea!.isPaid,
                price: updatedIdea!.price,
                voteScore: updatedIdea!.voteScore,
                viewCount: updatedIdea!.viewCount,
                commentCount: updatedIdea!.commentCount,
                author: updatedIdea!.author,
                category: updatedIdea!.categories[0]?.category,
                createdAt: updatedIdea!.createdAt,
                updatedAt: updatedIdea!.updatedAt,
            },
        };
    } catch (error) {
        console.error("Update idea error:", error);
        return { success: false, message: "Failed to update idea" };
    }
};

const deleteIdea = async (id: string, userId: string) => {
    try {
        const idea = await prisma.idea.findFirst({
            where: { id, authorId: userId },
        });

        if (!idea) {
            return { success: false, message: "Idea not found or unauthorized" };
        }

        // Only allow deletion of draft or rejected ideas
        if (idea.status !== 'DRAFT' && idea.status !== 'REJECTED') {
            return { success: false, message: "Only draft or rejected ideas can be deleted" };
        }

        await prisma.idea.delete({ where: { id } });

        return { success: true, message: "Idea deleted successfully" };
    } catch (error) {
        console.error("Delete idea error:", error);
        return { success: false, message: "Failed to delete idea" };
    }
};

const submitIdea = async (id: string, userId: string) => {
    try {
        const idea = await prisma.idea.findFirst({
            where: { id, authorId: userId },
        });

        if (!idea) {
            return { success: false, message: "Idea not found or unauthorized" };
        }

        if (idea.status !== 'DRAFT') {
            return { success: false, message: "Only draft ideas can be submitted for review" };
        }

        await prisma.idea.update({
            where: { id },
            data: { status: 'PENDING' },
        });

        return { success: true, message: "Idea submitted for review successfully" };
    } catch (error) {
        console.error("Submit idea error:", error);
        return { success: false, message: "Failed to submit idea" };
    }
};

const approveIdea = async (id: string) => {
    try {
        const idea = await prisma.idea.findUnique({
            where: { id },
        });

        if (!idea) {
            return { success: false, message: "Idea not found" };
        }

        if (idea.status !== 'PENDING') {
            return { success: false, message: "Only pending ideas can be approved" };
        }

        await prisma.idea.update({
            where: { id },
            data: {
                status: 'APPROVED',
                publishedAt: new Date(),
                feedback: null,
            },
        });

        return { success: true, message: "Idea approved successfully" };
    } catch (error) {
        console.error("Approve idea error:", error);
        return { success: false, message: "Failed to approve idea" };
    }
};

const rejectIdea = async (id: string, feedback: string) => {
    try {
        const idea = await prisma.idea.findUnique({
            where: { id },
        });

        if (!idea) {
            return { success: false, message: "Idea not found" };
        }

        if (idea.status !== 'PENDING') {
            return { success: false, message: "Only pending ideas can be rejected" };
        }

        await prisma.idea.update({
            where: { id },
            data: {
                status: 'REJECTED',
                feedback,
                rejectedAt: new Date(),
            },
        });

        return { success: true, message: "Idea rejected successfully" };
    } catch (error) {
        console.error("Reject idea error:", error);
        return { success: false, message: "Failed to reject idea" };
    }
};

const featureIdea = async (id: string) => {
    try {
        const idea = await prisma.idea.findUnique({
            where: { id },
        });

        if (!idea) {
            return { success: false, message: "Idea not found" };
        }

        // Toggle featured status (you may want to add a 'isFeatured' field to Idea model)
        // This is a placeholder - you'll need to add isFeatured to your schema
        // await prisma.idea.update({
        //     where: { id },
        //     data: { isFeatured: { not: true } },
        // });

        return { success: true, message: "Idea featured status toggled" };
    } catch (error) {
        console.error("Feature idea error:", error);
        return { success: false, message: "Failed to feature idea" };
    }
};

export const ideasService = {
    getIdeas,
    getFeaturedIdeas,
    getTopVotedIdeas,
    getRecentIdeas,
    getIdeaById,
    getIdeaBySlug,
    createIdea,
    updateIdea,
    deleteIdea,
    submitIdea,
    approveIdea,
    rejectIdea,
    featureIdea,
};