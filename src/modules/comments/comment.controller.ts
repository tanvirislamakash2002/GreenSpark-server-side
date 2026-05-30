import { Request, Response, NextFunction } from "express";
import { commentService } from "./comment.service";

const getComments = async (req: Request, res: Response, next: NextFunction) => {
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

        const result = await commentService.getComments(ideaId as string, page, limit);

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

const createComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { ideaId } = req.params;
        const { content, parentId } = req.body;

        if (!ideaId) {
            return res.status(400).json({
                success: false,
                message: "Idea ID is required",
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Comment content is required",
            });
        }

        if (content.length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot exceed 5000 characters",
            });
        }

        const result = await commentService.createComment(userId, ideaId as string, {
            content: content.trim(),
            parentId: parentId || null,
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(201).json({
            success: true,
            data: result.data,
            message: "Comment posted successfully",
        });
    } catch (error) {
        next(error);
    }
};

const updateComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { commentId } = req.params;
        const { content } = req.body;
        const isAdmin = req.user!.role === "ADMIN";

        if (!commentId) {
            return res.status(400).json({
                success: false,
                message: "Comment ID is required",
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Comment content is required",
            });
        }

        if (content.length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot exceed 5000 characters",
            });
        }

        const result = await commentService.updateComment(commentId as string, userId, isAdmin, {
            content: content.trim(),
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result.data,
            message: "Comment updated successfully",
        });
    } catch (error) {
        next(error);
    }
};

const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { commentId } = req.params;
        const isAdmin = req.user!.role === "ADMIN";

        if (!commentId) {
            return res.status(400).json({
                success: false,
                message: "Comment ID is required",
            });
        }

        const result = await commentService.deleteComment(commentId as string, userId, isAdmin);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

const reportComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { commentId } = req.params;
        const { reason } = req.body;

        if (!commentId) {
            return res.status(400).json({
                success: false,
                message: "Comment ID is required",
            });
        }

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Report reason is required",
            });
        }

        if (reason.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Reason cannot exceed 500 characters",
            });
        }

        const result = await commentService.reportComment(commentId as string, userId, reason.trim());

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: "Comment reported successfully. Our moderators will review it.",
        });
    } catch (error) {
        next(error);
    }
};

export const commentController = {
    getComments,
    createComment,
    updateComment,
    deleteComment,
    reportComment,
};