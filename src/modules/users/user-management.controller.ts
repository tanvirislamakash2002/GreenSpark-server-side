import { Request, Response, NextFunction } from "express";
import { userManagementService } from "./user-management.service";

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 15;
        const search = req.query.search as string;
        const role = req.query.role as string;
        const status = req.query.status as string;
        const verified = req.query.verified as string;
        const sort = req.query.sort as string;

        const result = await userManagementService.getAllUsers({
            page,
            limit,
            search,
            role,
            status,
            verified,
            sort,
        });

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

const getUserDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const result = await userManagementService.getUserDetails(userId as string);

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

const banUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const adminId = req.user!.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const result = await userManagementService.banUser(userId as string, adminId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: "User banned successfully",
        });
    } catch (error) {
        next(error);
    }
};

const unbanUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const adminId = req.user!.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const result = await userManagementService.unbanUser(userId as string, adminId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: "User unbanned successfully",
        });
    } catch (error) {
        next(error);
    }
};

const suspendUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const adminId = req.user!.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const result = await userManagementService.suspendUser(userId as string, adminId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: "User suspended successfully",
        });
    } catch (error) {
        next(error);
    }
};

const activateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const adminId = req.user!.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const result = await userManagementService.activateUser(userId as string, adminId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: "User activated successfully",
        });
    } catch (error) {
        next(error);
    }
};

const changeUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        const adminId = req.user!.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        if (!role || !["MEMBER", "ADMIN"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Valid role (MEMBER or ADMIN) is required",
            });
        }

        const result = await userManagementService.changeUserRole(userId as string, role, adminId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: `User role changed to ${role} successfully`,
        });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const adminId = req.user!.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        // Prevent admin from deleting themselves
        if (userId === adminId) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account",
            });
        }

        const result = await userManagementService.deleteUser(userId as string, adminId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

const bulkAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { action, userIds } = req.body;
        const adminId = req.user!.id;

        if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Action and userIds array are required",
            });
        }

        const validActions = ["ban", "unban", "suspend", "activate", "delete"];
        if (!validActions.includes(action)) {
            return res.status(400).json({
                success: false,
                message: `Invalid action. Valid actions: ${validActions.join(", ")}`,
            });
        }

        // Prevent admin from deleting themselves in bulk action
        if (action === "delete" && userIds.includes(adminId)) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account",
            });
        }

        const result = await userManagementService.bulkAction(action, userIds, adminId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

const exportUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const format = req.query.format as string || "csv";
        const search = req.query.search as string;
        const role = req.query.role as string;
        const status = req.query.status as string;
        const verified = req.query.verified as string;

        const result = await userManagementService.exportUsers({
            format,
            search,
            role,
            status,
            verified,
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Set response headers for file download
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=users_export_${Date.now()}.csv`);
        
        return res.send(result.data);
    } catch (error) {
        next(error);
    }
};

export const userManagementController = {
    getAllUsers,
    getUserDetails,
    banUser,
    unbanUser,
    suspendUser,
    activateUser,
    changeUserRole,
    deleteUser,
    bulkAction,
    exportUsers,
};