import { Request, Response, NextFunction } from "express";
import {
    getAdminComments,
    getCommentReports,
    adminDeleteComment,
    adminRestoreComment,
    adminResolveReports,
    adminBulkAction,
    adminDismissReports,
} from "../services/admin-comment.service";
import { sendSuccessResponse, validateRequiredParams } from "./base-comment.controller";

export const getAdminCommentsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const search = req.query.search as string;
        const status = req.query.status as string;
        const reportStatus = req.query.reportStatus as string;
        const sortBy = req.query.sortBy as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 15;

        const result = await getAdminComments({
            search,
            status,
            reportStatus,
            sortBy,
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

export const getCommentReportsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { commentId } = req.params;

        const validationError = validateRequiredParams(res, { commentId }, ["commentId"]);
        if (validationError) return validationError;

        const result = await getCommentReports(commentId as string);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return sendSuccessResponse(res, result.data);
    } catch (error) {
        next(error);
    }
};

export const adminDeleteCommentController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const { commentId } = req.params;

        const validationError = validateRequiredParams(res, { commentId }, ["commentId"]);
        if (validationError) return validationError;

        const result = await adminDeleteComment(commentId as string, adminId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return sendSuccessResponse(res, null, result.message);
    } catch (error) {
        next(error);
    }
};

export const adminRestoreCommentController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const { commentId } = req.params;

        const validationError = validateRequiredParams(res, { commentId }, ["commentId"]);
        if (validationError) return validationError;

        const result = await adminRestoreComment(commentId as string, adminId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return sendSuccessResponse(res, null, result.message);
    } catch (error) {
        next(error);
    }
};

export const adminResolveReportsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const { commentId } = req.params;

        const validationError = validateRequiredParams(res, { commentId }, ["commentId"]);
        if (validationError) return validationError;

        const result = await adminResolveReports(commentId as string, adminId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return sendSuccessResponse(res, null, result.message);
    } catch (error) {
        next(error);
    }
};

export const adminDismissReportsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const { commentId } = req.params;

        const validationError = validateRequiredParams(res, { commentId }, ["commentId"]);
        if (validationError) return validationError;

        const result = await adminDismissReports(commentId as string, adminId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return sendSuccessResponse(res, null, result.message);
    } catch (error) {
        next(error);
    }
};

export const adminBulkActionController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const { action, commentIds } = req.body;

        const validationError = validateRequiredParams(res, { action, commentIds }, ["action", "commentIds"]);
        if (validationError) return validationError;

        if (!Array.isArray(commentIds) || commentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "commentIds must be a non-empty array",
            });
        }

        const validActions = ["delete", "restore", "resolve", "dismiss"];
        if (!validActions.includes(action)) {
            return res.status(400).json({
                success: false,
                message: `Invalid action. Valid actions: ${validActions.join(", ")}`,
            });
        }

        const result = await adminBulkAction(action, commentIds, adminId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return sendSuccessResponse(res, null, result.message);
    } catch (error) {
        next(error);
    }
};