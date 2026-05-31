import { Request, Response, NextFunction } from "express";
import { getUserComments } from "../services/user-comment.service";
import { sendSuccessResponse } from "./base-comment.controller";

export const getUserCommentsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const search = req.query.search as string;
        const sortBy = req.query.sortBy as string;
        const dateRange = req.query.dateRange as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await getUserComments(userId, {
            search,
            sortBy,
            dateRange,
            page,
            limit,
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return sendSuccessResponse(res, result.data);
    } catch (error) {
        next(error);
    }
};