import { Request, Response, NextFunction } from "express";
import { getComments } from "../services/public-comment.service";
import { sendSuccessResponse, handleControllerError } from "./base-comment.controller";

export const getCommentsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ideaId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        if (!ideaId) {
            return res.status(400).json({
                success: false,
                message: "Idea ID is required",
            });
        }

        const result = await getComments(ideaId as string, page, limit);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return sendSuccessResponse(res, result.data);
    } catch (error) {
        next(error);
    }
};