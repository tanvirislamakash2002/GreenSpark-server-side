import { Request, Response, NextFunction } from "express";
import { memberProfileService } from "./member-profile.service";

const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const result = await memberProfileService.getProfile(userId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { name, phone, address } = req.body;

        const result = await memberProfileService.updateProfile(userId, {
            name,
            phone,
            address,
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result.data,
            message: "Profile updated successfully",
        });
    } catch (error) {
        next(error);
    }
};

const getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const result = await memberProfileService.getStats(userId);

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

const getActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 10;
        
        const result = await memberProfileService.getActivity(userId, limit);

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

const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New passwords do not match",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        const result = await memberProfileService.changePassword(userId, {
            currentPassword,
            newPassword,
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        next(error);
    }
};

const updateNewsletter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { isSubscribed } = req.body;

        if (typeof isSubscribed !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: "isSubscribed must be a boolean value",
            });
        }

        const result = await memberProfileService.updateNewsletter(userId, isSubscribed);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: isSubscribed ? "Subscribed to newsletter" : "Unsubscribed from newsletter",
        });
    } catch (error) {
        next(error);
    }
};

const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const result = await memberProfileService.deleteAccount(userId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Clear session cookie
        res.clearCookie("better-auth");

        return res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const memberProfileController = {
    getProfile,
    updateProfile,
    getStats,
    getActivity,
    changePassword,
    updateNewsletter,
    deleteAccount,
};