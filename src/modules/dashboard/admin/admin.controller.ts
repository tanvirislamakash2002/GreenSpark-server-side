import { Request, Response, NextFunction } from "express";
import { adminService } from "./admin.service";

const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await adminService.getDashboardData();

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
        const result = await adminService.getStats();

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


const getRecentActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await adminService.getRecentActivity(limit);

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

export const adminController = {
    getDashboard,
    getStats,
    getRecentActivity,
};