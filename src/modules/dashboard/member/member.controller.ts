import { Request, Response, NextFunction } from "express";
import { memberService } from "./member.service";

const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const result = await memberService.getDashboardData(userId);

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

const getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const result = await memberService.getStats(userId);

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
        const result = await memberService.getRecentIdeas(userId, limit);

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

const getMemberIdeas = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const status = req.query.status as string;
        const sortBy = req.query.sortBy as string;

        const result = await memberService.getMemberIdeas(userId, {
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

const deleteIdea = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { ideaId } = req.params;

        const result = await memberService.deleteIdea(userId, ideaId as string);

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
        const { ideaId } = req.params;

        const result = await memberService.submitIdea(userId, ideaId as string);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const memberController = {
    getDashboard,
    getStats,
    getRecentIdeas,
    getMemberIdeas,
    deleteIdea,
    submitIdea,
};