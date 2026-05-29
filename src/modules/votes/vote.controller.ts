import { Request, Response, NextFunction } from "express";
import { voteService } from "./vote.service";

const castVote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { ideaId } = req.params;
        const { voteType } = req.body;

        if (!ideaId) {
            return res.status(400).json({
                success: false,
                message: "Idea ID is required",
            });
        }

        if (!voteType || (voteType !== 'UP' && voteType !== 'DOWN')) {
            return res.status(400).json({
                success: false,
                message: "Valid vote type (UP or DOWN) is required",
            });
        }

        const result = await voteService.castVote(userId, ideaId as string, voteType);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const removeVote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { ideaId } = req.params;

        if (!ideaId) {
            return res.status(400).json({
                success: false,
                message: "Idea ID is required",
            });
        }

        const result = await voteService.removeVote(userId, ideaId as string);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getUserVote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { ideaId } = req.params;

        if (!ideaId) {
            return res.status(400).json({
                success: false,
                message: "Idea ID is required",
            });
        }

        const result = await voteService.getUserVote(userId, ideaId as string);

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

export const voteController = {
    castVote,
    removeVote,
    getUserVote,
};