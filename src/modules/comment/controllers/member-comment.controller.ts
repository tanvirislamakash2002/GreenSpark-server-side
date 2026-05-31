import { Request, Response, NextFunction } from "express";
import { createComment, updateComment, deleteComment, reportComment } from "../services/member-comment.service";
import { sendSuccessResponse, validateRequiredParams } from "./base-comment.controller";

export const createCommentController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { ideaId } = req.params;
        const { content, parentId } = req.body;

        const validationError = validateRequiredParams(res, { ideaId, content }, ["ideaId", "content"]);
        if (validationError) return validationError;

        if (content.length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot exceed 5000 characters",
            });
        }

        const result = await createComment(userId, ideaId as string, { content: content.trim(), parentId: parentId || null });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return sendSuccessResponse(res, result.data, "Comment posted successfully", 201);
    } catch (error) {
        next(error);
    }
};

export const updateCommentController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const isAdmin = req.user!.role === "ADMIN";
        const { commentId } = req.params;
        const { content } = req.body;

        const validationError = validateRequiredParams(res, { commentId, content }, ["commentId", "content"]);
        if (validationError) return validationError;

        if (content.length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot exceed 5000 characters",
            });
        }

        const result = await updateComment(commentId as string, userId, isAdmin, { content: content.trim() });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return sendSuccessResponse(res, result.data, "Comment updated successfully");
    } catch (error) {
        next(error);
    }
};

export const deleteCommentController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const isAdmin = req.user!.role === "ADMIN";
        const { commentId } = req.params;

        const validationError = validateRequiredParams(res, { commentId }, ["commentId"]);
        if (validationError) return validationError;

        const result = await deleteComment(commentId as string, userId, isAdmin);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return sendSuccessResponse(res, null, "Comment deleted successfully");
    } catch (error) {
        next(error);
    }
};

export const reportCommentController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { commentId } = req.params;
        const { reason } = req.body;

        const validationError = validateRequiredParams(res, { commentId, reason }, ["commentId", "reason"]);
        if (validationError) return validationError;

        if (reason.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Reason cannot exceed 500 characters",
            });
        }

        const result = await reportComment(commentId as string, userId, reason.trim());

        if (!result.success) {
            return res.status(400).json(result);
        }

        return sendSuccessResponse(res, null, "Comment reported successfully. Our moderators will review it.");
    } catch (error) {
        next(error);
    }
};