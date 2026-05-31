import { Request, Response, NextFunction } from "express";
import { analyticsService } from "./analytics.service";

const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const range = req.query.range as string || "30d";

        const result = await analyticsService.getAnalytics(range);

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

const exportAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const format = req.query.format as string || "csv";
        const range = req.query.range as string || "30d";

        const result = await analyticsService.exportAnalytics(format, range);

        if (!result.success) {
            return res.status(400).json(result);
        }

        if (format === "csv") {
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename=analytics_${Date.now()}.csv`);
            return res.send(result.data);
        }
        
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const analyticsController = {
    getAnalytics,
    exportAnalytics,
};