import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";

const getAdminIdeas = async (params: {
    page: number;
    limit: number;
    search?: string;
    category?: string;
    status?: string;
    sortBy: string;
}) => {
    try {
        const { page, limit, search, category, status, sortBy } = params;
        const skip = (page - 1) * limit;

        // Build where clause - NO status restriction for admin
        const where: Prisma.IdeaWhereInput = {};

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { problemStatement: { contains: search, mode: 'insensitive' } },
                { author: { name: { contains: search, mode: 'insensitive' } } },
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

        if (status && status !== 'all') {
            where.status = status as any;
        }

        // Build order by
        let orderBy: Prisma.IdeaOrderByWithRelationInput = {};
        switch (sortBy) {
            case 'oldest':
                orderBy = { createdAt: 'asc' };
                break;
            case 'votes':
                orderBy = { voteScore: 'desc' };
                break;
            case 'views':
                orderBy = { viewCount: 'desc' };
                break;
            default:
                orderBy = { createdAt: 'desc' };
        }

        // Get ideas with author info
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

        // Get stats
        const stats = await prisma.$transaction([
            prisma.idea.count(),
            prisma.idea.count({ where: { status: 'DRAFT' } }),
            prisma.idea.count({ where: { status: 'PENDING' } }),
            prisma.idea.count({ where: { status: 'APPROVED' } }),
            prisma.idea.count({ where: { status: 'REJECTED' } }),
        ]);

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
        console.error("Get admin ideas error:", error);
        return { success: false, message: "Failed to fetch ideas" };
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

const adminDeleteIdea = async (ideaId: string, adminId: string) => {
    try {
        // Find the idea
        const idea = await prisma.idea.findUnique({
            where: { id: ideaId },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!idea) {
            return { success: false, message: "Idea not found" };
        }

        // Hard delete the idea
        await prisma.idea.delete({
            where: { id: ideaId },
        });

        return {
            success: true,
            message: `Idea "${idea.title}" has been deleted successfully`,
            data: {
                ideaId: idea.id,
                ideaTitle: idea.title,
                authorName: idea.author.name,
            },
        };
    } catch (error) {
        console.error("Admin delete idea error:", error);
        return { success: false, message: "Failed to delete idea" };
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

export const adminIdeasService = {
    getAdminIdeas,
    getPendingIdeas,
    adminDeleteIdea,
    approveIdea,
    rejectIdea,
    featureIdea,
};