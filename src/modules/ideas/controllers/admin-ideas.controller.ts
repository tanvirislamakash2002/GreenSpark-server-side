import { Request, Response, NextFunction } from "express";
import { adminIdeasService } from "../services";

const getAdminIdeas = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const category = req.query.category as string;
        const status = req.query.status as string;
        const sortBy = req.query.sortBy as string || 'newest';

        const result = await adminIdeasService.getAdminIdeas({
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

const getPendingIdeas = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await adminIdeasService.getPendingIdeas(limit);

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


const adminDeleteIdea = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const adminId = req.user!.id;
        const { reason } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Invalid idea ID",
            });
        }

        const result = await adminIdeasService.adminDeleteIdea(id, adminId, reason);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const approveIdea = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Invalid idea ID",
            });
        }

        const result = await adminIdeasService.approveIdea(id);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const rejectIdea = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Invalid idea ID",
            });
        }

        if (!feedback) {
            return res.status(400).json({
                success: false,
                message: "Feedback is required for rejection",
            });
        }

        const result = await adminIdeasService.rejectIdea(id, feedback);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const featureIdea = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Invalid idea ID",
            });
        }

        const result = await adminIdeasService.featureIdea(id);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const adminIdeasController = {
    getAdminIdeas,
    getPendingIdeas,
    adminDeleteIdea,
    approveIdea,
    rejectIdea,
    featureIdea,
};