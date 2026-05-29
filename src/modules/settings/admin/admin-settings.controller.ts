import { Request, Response, NextFunction } from "express";
import { adminSettingsService } from "./admin-settings.service";

const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const result = await adminSettingsService.getProfile(adminId);

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
        const adminId = req.user!.id;
        const { name, image } = req.body;

        const result = await adminSettingsService.updateProfile(adminId, { name, image });

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

const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
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

        const result = await adminSettingsService.changePassword(adminId, {
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

const getNotificationPreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const result = await adminSettingsService.getNotificationPreferences(adminId);

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

const updateNotificationPreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const { newIdeaSubmissions, pendingReviewReminders, reportedContent, weeklySummary, systemAnnouncements } = req.body;

        const result = await adminSettingsService.updateNotificationPreferences(adminId, {
            newIdeaSubmissions,
            pendingReviewReminders,
            reportedContent,
            weeklySummary,
            systemAnnouncements,
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: "Notification preferences updated successfully",
        });
    } catch (error) {
        next(error);
    }
};

const getSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const token = req.headers.authorization?.replace("Bearer ", "") || "";
        
        const result = await adminSettingsService.getSessions(adminId, token);

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

const revokeSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const { sessionId } = req.params;

        const result = await adminSettingsService.revokeSession(adminId, sessionId as string);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: "Session revoked successfully",
        });
    } catch (error) {
        next(error);
    }
};

const revokeAllSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const currentToken = req.headers.authorization?.replace("Bearer ", "") || "";

        const result = await adminSettingsService.revokeAllSessions(adminId, currentToken);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: "All other sessions revoked successfully",
        });
    } catch (error) {
        next(error);
    }
};

const getActivityLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 20;
        const page = parseInt(req.query.page as string) || 1;

        const result = await adminSettingsService.getActivityLog(adminId, limit, page);

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

const clearCache = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await adminSettingsService.clearCache();

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: "Cache cleared successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const adminSettingsController = {
    getProfile,
    updateProfile,
    changePassword,
    getNotificationPreferences,
    updateNotificationPreferences,
    getSessions,
    revokeSession,
    revokeAllSessions,
    getActivityLog,
    clearCache,
};