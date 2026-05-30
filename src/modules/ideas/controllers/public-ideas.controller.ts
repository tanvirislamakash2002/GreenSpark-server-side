import { Request, Response, NextFunction } from "express";
import { publicIdeasService } from "../services/public-ideas.service";

const getIdeas = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 12;
        const search = req.query.search as string;
        const category = req.query.category as string;
        const status = req.query.status as string;
        const sortBy = req.query.sortBy as 'recent' | 'topVoted' | 'mostViewed' || 'recent';

        const result = await publicIdeasService.getIdeas({
            page,
            limit,
            search,
            category,
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

const getFeaturedIdeas = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 3;
        const result = await publicIdeasService.getFeaturedIdeas(limit);

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

const getTopVotedIdeas = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 3;
        const result = await publicIdeasService.getTopVotedIdeas(limit);

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
        const limit = parseInt(req.query.limit as string) || 6;
        const result = await publicIdeasService.getRecentIdeas(limit);

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

const getIdeaById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Invalid idea ID",
            });
        }

        const result = await publicIdeasService.getIdeaById(id, userId);

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

const getIdeaBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { slug } = req.params;
        
        if (!slug || typeof slug !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Invalid idea slug",
            });
        }

        const result = await publicIdeasService.getIdeaBySlug(slug);

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

export const publicIdeasController = {
    getIdeas,
    getFeaturedIdeas,
    getTopVotedIdeas,
    getRecentIdeas,
    getIdeaById,
    getIdeaBySlug,
};