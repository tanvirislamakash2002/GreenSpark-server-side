import { IdeaStatus, Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";


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
        status: IdeaStatus;
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
                status: data.status || 'DRAFT',
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

export const memberIdeasService = {
    getMemberIdeas,
    getRecentIdeas,
    createIdea,
    updateIdea,
    deleteIdea,
    submitIdea,
};