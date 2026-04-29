import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const getCategories = async (params: {
    page: number;
    limit: number;
    search?: string;
    sortBy: 'name' | 'ideasCount' | 'createdAt';
    sortOrder: 'asc' | 'desc';
}) => {
    try {
        const { page, limit, search, sortBy, sortOrder } = params;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.CategoryWhereInput = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Build order by
        let orderBy: Prisma.CategoryOrderByWithRelationInput = {};
        if (sortBy === 'name') {
            orderBy = { name: sortOrder };
        } else if (sortBy === 'createdAt') {
            orderBy = { createdAt: sortOrder };
        } else {
            orderBy = { name: 'asc' };
        }

        // Get categories
        const categories = await prisma.category.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                ideas: {
                    select: { ideaId: true },
                },
            },
        });

        // Get total count
        const totalItems = await prisma.category.count({ where });

        // Transform data and calculate ideas count
        let categoriesWithCount = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            imageUrl: cat.imageUrl,
            ideasCount: cat.ideas.length,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt,
        }));

        // Sort by ideasCount if requested
        if (sortBy === 'ideasCount') {
            categoriesWithCount.sort((a, b) => {
                if (sortOrder === 'asc') {
                    return a.ideasCount - b.ideasCount;
                } else {
                    return b.ideasCount - a.ideasCount;
                }
            });
        }

        return {
            success: true,
            data: {
                categories: categoriesWithCount,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: limit,
                },
            },
        };
    } catch (error) {
        console.error("Get categories error:", error);
        return { success: false, message: "Failed to fetch categories" };
    }
};

const getAllCategories = async () => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                ideas: {
                    select: { ideaId: true },
                },
            },
        });

        const categoriesWithCount = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            imageUrl: cat.imageUrl,
            ideasCount: cat.ideas.length,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt,
        }));

        return {
            success: true,
            data: categoriesWithCount,
        };
    } catch (error) {
        console.error("Get all categories error:", error);
        return { success: false, message: "Failed to fetch categories" };
    }
};

const getCategoryById = async (id: string) => {
    try {
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                ideas: {
                    select: { ideaId: true },
                },
            },
        });

        if (!category) {
            return { success: false, message: "Category not found" };
        }

        return {
            success: true,
            data: {
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                imageUrl: category.imageUrl,
                ideasCount: category.ideas.length,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            },
        };
    } catch (error) {
        console.error("Get category by ID error:", error);
        return { success: false, message: "Failed to fetch category" };
    }
};

const getCategoryBySlug = async (slug: string) => {
    try {
        const category = await prisma.category.findUnique({
            where: { slug },
            include: {
                ideas: {
                    select: { ideaId: true },
                },
            },
        });

        if (!category) {
            return { success: false, message: "Category not found" };
        }

        return {
            success: true,
            data: {
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                imageUrl: category.imageUrl,
                ideasCount: category.ideas.length,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            },
        };
    } catch (error) {
        console.error("Get category by slug error:", error);
        return { success: false, message: "Failed to fetch category" };
    }
};

const createCategory = async (data: {
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
}) => {
    try {
        // Check if name already exists
        const existingByName = await prisma.category.findUnique({
            where: { name: data.name },
        });

        if (existingByName) {
            return { success: false, message: "Category with this name already exists" };
        }

        // Check if slug already exists
        const existingBySlug = await prisma.category.findUnique({
            where: { slug: data.slug },
        });

        if (existingBySlug) {
            return { success: false, message: "Category with this slug already exists" };
        }

        const category = await prisma.category.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description ?? null,
                imageUrl: data.imageUrl ?? null,
            },
        });

        return {
            success: true,
            data: {
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                imageUrl: category.imageUrl,
                ideasCount: 0,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            },
        };
    } catch (error) {
        console.error("Create category error:", error);
        return { success: false, message: "Failed to create category" };
    }
};

const updateCategory = async (
    id: string,
    data: {
        name?: string;
        slug?: string;
        description?: string;
        imageUrl?: string;
    }
) => {
    try {
        const category = await prisma.category.findUnique({
            where: { id },
        });

        if (!category) {
            return { success: false, message: "Category not found" };
        }

        // Check if new name already exists (excluding current category)
        if (data.name && data.name !== category.name) {
            const existingByName = await prisma.category.findUnique({
                where: { name: data.name },
            });
            if (existingByName) {
                return { success: false, message: "Category with this name already exists" };
            }
        }

        // Check if new slug already exists (excluding current category)
        if (data.slug && data.slug !== category.slug) {
            const existingBySlug = await prisma.category.findUnique({
                where: { slug: data.slug },
            });
            if (existingBySlug) {
                return { success: false, message: "Category with this slug already exists" };
            }
        }

        // only include fields that are provided
        const updateData: {
            name?: string;
            slug?: string;
            description?: string | null;
            imageUrl?: string | null;
        } = {};

        if (data.name !== undefined) {
            updateData.name = data.name;
        }
        if (data.slug !== undefined) {
            updateData.slug = data.slug;
        }
        if (data.description !== undefined) {
            updateData.description = data.description ?? null;
        }
        if (data.imageUrl !== undefined) {
            updateData.imageUrl = data.imageUrl ?? null;
        }

        const updated = await prisma.category.update({
            where: { id },
            data: updateData,
            include: {
                ideas: {
                    select: { ideaId: true },
                },
            },
        });

        return {
            success: true,
            data: {
                id: updated.id,
                name: updated.name,
                slug: updated.slug,
                description: updated.description,
                imageUrl: updated.imageUrl,
                ideasCount: updated.ideas.length,
                createdAt: updated.createdAt,
                updatedAt: updated.updatedAt,
            },
        };
    } catch (error) {
        console.error("Update category error:", error);
        return { success: false, message: "Failed to update category" };
    }
};

const deleteCategory = async (id: string) => {
    try {
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                ideas: {
                    select: { ideaId: true },
                },
            },
        });

        if (!category) {
            return { success: false, message: "Category not found" };
        }

        const ideasCount = category.ideas.length;

        // Delete the category (idea_categories will be automatically deleted due to onDelete: Cascade)
        await prisma.category.delete({
            where: { id },
        });

        return {
            success: true,
            message: "Category deleted successfully",
            hasIdeas: ideasCount > 0,
            ideasCount,
        };
    } catch (error) {
        console.error("Delete category error:", error);
        return { success: false, message: "Failed to delete category" };
    }
};

const checkSlug = async (slug: string, excludeId?: string) => {
    try {
        const where: Prisma.CategoryWhereUniqueInput = { slug };

        const existing = await prisma.category.findUnique({
            where,
        });

        if (!existing) {
            return { available: true };
        }

        if (excludeId && existing.id === excludeId) {
            return { available: true };
        }

        // Generate suggestions
        const suggestions = [
            `${slug}-1`,
            `${slug}-2`,
            `${slug}-new`,
            `${slug}-alt`,
        ];

        return {
            available: false,
            suggestions,
        };
    } catch (error) {
        console.error("Check slug error:", error);
        return { available: false };
    }
};

export const categoryService = {
    getCategories,
    getAllCategories,
    getCategoryById,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory,
    checkSlug,
};