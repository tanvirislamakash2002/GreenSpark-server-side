import { Request, Response, NextFunction } from "express";
import { statsService } from "./stats.service";

const getPlatformStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await statsService.getPlatformStats();

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

export const statsController = {
    getPlatformStats,
};