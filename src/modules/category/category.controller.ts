import { Request, Response, NextFunction } from "express";
import { categoryService } from "./category.service";

const getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const sortBy = req.query.sortBy as 'name' | 'ideasCount' | 'createdAt' || 'name';
        const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'asc';

        const result = await categoryService.getCategories({
            page,
            limit,
            search,
            sortBy,
            sortOrder,
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await categoryService.getAllCategories();

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await categoryService.getCategoryById(id as string);

        if (!result.success) {
            return res.status(404).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

const getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { slug } = req.params;
        const result = await categoryService.getCategoryBySlug(slug as string);

        if (!result.success) {
            return res.status(404).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, slug, description, imageUrl } = req.body;

        if (!name || !slug) {
            return res.status(400).json({
                success: false,
                message: "Name and slug are required",
            });
        }

        const result = await categoryService.createCategory({
            name,
            slug,
            description,
            imageUrl,
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(201).json({
            success: true,
            data: result.data,
            message: "Category created successfully",
        });
    } catch (error) {
        next(error);
    }
};

const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID",
            });
        }

        const { name, slug, description, imageUrl } = req.body;

        const result = await categoryService.updateCategory(id, {
            name,
            slug,
            description,
            imageUrl,
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result.data,
            message: "Category updated successfully",
        });
    } catch (error) {
        next(error);
    }
};

const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID",
            });
        }

        const result = await categoryService.deleteCategory(id);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const checkSlug = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { slug, excludeId } = req.query;
        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Slug is required",
            });
        }

        const result = await categoryService.checkSlug(slug as string, excludeId as string);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const categoryController = {
    getCategories,
    getAllCategories,
    getCategoryById,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory,
    checkSlug,
};