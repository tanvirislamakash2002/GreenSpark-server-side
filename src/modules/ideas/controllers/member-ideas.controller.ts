import { Request, Response, NextFunction } from "express";
import { memberIdeasService } from "../services";

const getMemberIdeas = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const status = req.query.status as string;
        const sortBy = req.query.sortBy as string;

        const result = await memberIdeasService.getMemberIdeas(userId, {
            page,
            limit,
            search,
            status,
            sortBy,
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

const getRecentIdeas = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 5;
        const result = await memberIdeasService.getRecentIdeas(userId, limit);

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

const createIdea = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { title, problemStatement, solution, description, imageUrl, isPaid, price, categoryId, status } = req.body;

        // Validation
        if (!title || title.length < 5) {
            return res.status(400).json({
                success: false,
                message: "Title must be at least 5 characters",
            });
        }
        if (!problemStatement || problemStatement.length < 20) {
            return res.status(400).json({
                success: false,
                message: "Problem statement must be at least 20 characters",
            });
        }
        if (!solution || solution.length < 50) {
            return res.status(400).json({
                success: false,
                message: "Proposed solution must be at least 50 characters",
            });
        }
        if (!description || description.length < 100) {
            return res.status(400).json({
                success: false,
                message: "Description must be at least 100 characters",
            });
        }
        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: "Category is required",
            });
        }
        if (isPaid && (!price || price <= 0)) {
            return res.status(400).json({
                success: false,
                message: "Valid price is required for paid ideas",
            });
        }

        const result = await memberIdeasService.createIdea(userId, {
            title,
            problemStatement,
            solution,
            description,
            imageUrl,
            isPaid: isPaid || false,
            price: isPaid ? price : null,
            categoryId,
            status
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(201).json({
            success: true,
            data: result.data,
            message: "Idea created successfully",
        });
    } catch (error) {
        next(error);
    }
};

const updateIdea = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;
        const { title, problemStatement, solution, description, imageUrl, isPaid, price, categoryId } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Invalid idea ID",
            });
        }

        const result = await memberIdeasService.updateIdea(id, userId, {
            title,
            problemStatement,
            solution,
            description,
            imageUrl,
            isPaid,
            price,
            categoryId,
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result.data,
            message: "Idea updated successfully",
        });
    } catch (error) {
        next(error);
    }
};

const deleteIdea = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Invalid idea ID",
            });
        }

        const result = await memberIdeasService.deleteIdea(id, userId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const submitIdea = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Invalid idea ID",
            });
        }

        const result = await memberIdeasService.submitIdea(id, userId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};




export const memberIdeasController = {
    getMemberIdeas,
    getRecentIdeas,
    createIdea,
    updateIdea,
    deleteIdea,
    submitIdea,
};