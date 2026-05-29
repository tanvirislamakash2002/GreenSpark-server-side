import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

const getProfile = async (adminId: string) => {
    try {
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                accountStatus: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!admin) {
            return { success: false, message: "Admin not found" };
        }

        return { success: true, data: admin };
    } catch (error) {
        console.error("Get admin profile error:", error);
        return { success: false, message: "Failed to fetch profile" };
    }
};

const updateProfile = async (
    adminId: string,
    data: { name?: string; image?: string }
) => {
    try {
        const updateData: Prisma.UserUpdateInput = {};
        
        if (data.name !== undefined) updateData.name = data.name;
        if (data.image !== undefined) updateData.image = data.image;

        const updatedAdmin = await prisma.user.update({
            where: { id: adminId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                accountStatus: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return { success: true, data: updatedAdmin };
    } catch (error) {
        console.error("Update admin profile error:", error);
        return { success: false, message: "Failed to update profile" };
    }
};

const changePassword = async (
    adminId: string,
    data: { currentPassword: string; newPassword: string }
) => {
    try {
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            include: {
                accounts: {
                    where: { providerId: "email" },
                    take: 1,
                },
            },
        });

        if (!admin) {
            return { success: false, message: "Admin not found" };
        }

        const account = admin.accounts[0];
        if (!account || !account.password) {
            return { success: false, message: "No password set for this account" };
        }

        const isValidPassword = await bcrypt.compare(data.currentPassword, account.password);
        if (!isValidPassword) {
            return { success: false, message: "Current password is incorrect" };
        }

        const hashedPassword = await bcrypt.hash(data.newPassword, 10);

        await prisma.account.update({
            where: { id: account.id },
            data: { password: hashedPassword },
        });

        return { success: true };
    } catch (error) {
        console.error("Change password error:", error);
        return { success: false, message: "Failed to change password" };
    }
};

const getNotificationPreferences = async (adminId: string) => {
    try {
        // You can store preferences in a separate table or use a JSON field in User table
        // For now, returning default preferences
        const defaultPreferences = {
            newIdeaSubmissions: true,
            pendingReviewReminders: true,
            reportedContent: true,
            weeklySummary: false,
            systemAnnouncements: true,
        };

        // If you have a preferences table, fetch from there
        // const preferences = await prisma.adminPreferences.findUnique({
        //     where: { adminId },
        // });

        return { success: true, data: defaultPreferences };
    } catch (error) {
        console.error("Get notification preferences error:", error);
        return { success: false, message: "Failed to fetch preferences" };
    }
};

const updateNotificationPreferences = async (
    adminId: string,
    preferences: {
        newIdeaSubmissions: boolean;
        pendingReviewReminders: boolean;
        reportedContent: boolean;
        weeklySummary: boolean;
        systemAnnouncements: boolean;
    }
) => {
    try {
        // Update preferences in database
        // await prisma.adminPreferences.upsert({
        //     where: { adminId },
        //     update: preferences,
        //     create: { adminId, ...preferences },
        // });

        return { success: true };
    } catch (error) {
        console.error("Update notification preferences error:", error);
        return { success: false, message: "Failed to update preferences" };
    }
};

const getSessions = async (adminId: string, currentToken: string) => {
    try {
        const sessions = await prisma.session.findMany({
            where: { userId: adminId },
            orderBy: { createdAt: "desc" },
        });

        const formattedSessions = sessions.map(session => ({
            id: session.id,
            userAgent: session.userAgent || "Unknown Device",
            ipAddress: session.ipAddress || "Unknown IP",
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            isCurrent: session.token === currentToken,
        }));

        return { success: true, data: formattedSessions };
    } catch (error) {
        console.error("Get sessions error:", error);
        return { success: false, message: "Failed to fetch sessions" };
    }
};

const revokeSession = async (adminId: string, sessionId: string) => {
    try {
        const session = await prisma.session.findFirst({
            where: { id: sessionId, userId: adminId },
        });

        if (!session) {
            return { success: false, message: "Session not found" };
        }

        await prisma.session.delete({
            where: { id: sessionId },
        });

        return { success: true };
    } catch (error) {
        console.error("Revoke session error:", error);
        return { success: false, message: "Failed to revoke session" };
    }
};

const revokeAllSessions = async (adminId: string, currentToken: string) => {
    try {
        await prisma.session.deleteMany({
            where: {
                userId: adminId,
                token: { not: currentToken },
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Revoke all sessions error:", error);
        return { success: false, message: "Failed to revoke sessions" };
    }
};

const getActivityLog = async (adminId: string, limit: number, page: number) => {
    try {
        const skip = (page - 1) * limit;

        const activities = await prisma.activityLog.findMany({
            where: { userId: adminId },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        });

        const total = await prisma.activityLog.count({
            where: { userId: adminId },
        });

        const formattedActivities = activities.map(activity => ({
            id: activity.id,
            action: activity.action,
            details: activity.details,
            ipAddress: activity.ipAddress,
            createdAt: activity.createdAt,
        }));

        return {
            success: true,
            data: {
                activities: formattedActivities,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                },
            },
        };
    } catch (error) {
        console.error("Get activity log error:", error);
        return { success: false, message: "Failed to fetch activity log" };
    }
};

const clearCache = async () => {
    try {
        // Implement cache clearing logic based on your caching strategy
        // This could be Redis flush, Next.js revalidation, etc.
        
        // For now, returning success
        return { success: true };
    } catch (error) {
        console.error("Clear cache error:", error);
        return { success: false, message: "Failed to clear cache" };
    }
};

export const adminSettingsService = {
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