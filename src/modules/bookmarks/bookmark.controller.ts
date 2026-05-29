import { Request, Response, NextFunction } from "express";
import { bookmarkService } from "./bookmark.service";

const addBookmark = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { ideaId } = req.params;

        if (!ideaId) {
            return res.status(400).json({
                success: false,
                message: "Idea ID is required",
            });
        }

        const result = await bookmarkService.addBookmark(userId, ideaId as string);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const removeBookmark = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { ideaId } = req.params;

        if (!ideaId) {
            return res.status(400).json({
                success: false,
                message: "Idea ID is required",
            });
        }

        const result = await bookmarkService.removeBookmark(userId, ideaId as string);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getUserBookmarks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await bookmarkService.getUserBookmarks(userId, page, limit);

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

const checkBookmark = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { ideaId } = req.params;

        const result = await bookmarkService.checkBookmark(userId, ideaId as string);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const bookmarkController = {
    addBookmark,
    removeBookmark,
    getUserBookmarks,
    checkBookmark,
};