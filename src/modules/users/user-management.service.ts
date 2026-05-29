import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const getAllUsers = async (params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    status?: string;
    verified?: string;
    sort?: string;
}) => {
    try {
        const { page, limit, search, role, status, verified, sort } = params;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.UserWhereInput = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role && role !== "all") {
            where.role = role as any;
        }

        if (status && status !== "all") {
            where.accountStatus = status as any;
        }

        if (verified === "verified") {
            where.emailVerified = true;
        } else if (verified === "unverified") {
            where.emailVerified = false;
        }

        // Build order by
        let orderBy: Prisma.UserOrderByWithRelationInput = {};
        switch (sort) {
            case "oldest":
                orderBy = { createdAt: "asc" };
                break;
            case "name_asc":
                orderBy = { name: "asc" };
                break;
            case "name_desc":
                orderBy = { name: "desc" };
                break;
            case "most_ideas":
                orderBy = { ideas: { _count: "desc" } };
                break;
            case "most_comments":
                orderBy = { comments: { _count: "desc" } };
                break;
            default:
                orderBy = { createdAt: "desc" };
        }

        // Get users with counts
        const users = await prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                role: true,
                accountStatus: true,
                phone: true,
                address: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        ideas: true,
                        comments: true,
                        votes: true,
                    },
                },
            },
        });

        // Get total count for pagination
        const totalItems = await prisma.user.count({ where });

        // Get stats
        const stats = await prisma.$transaction([
            prisma.user.count(),
            prisma.user.count({ where: { accountStatus: "ACTIVE" } }),
            prisma.user.count({ where: { accountStatus: "SUSPENDED" } }),
            prisma.user.count({ where: { accountStatus: "BANNED" } }),
            prisma.user.count({ where: { role: "ADMIN" } }),
            prisma.user.count({ where: { role: "MEMBER" } }),
            prisma.user.count({ where: { emailVerified: true } }),
            prisma.user.count({ where: { emailVerified: false } }),
        ]);

        // Get new users this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const newUsersThisMonth = await prisma.user.count({
            where: {
                createdAt: { gte: startOfMonth },
            },
        });

        // Get last month's new users for trend
        const startOfLastMonth = new Date();
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
        startOfLastMonth.setDate(1);
        startOfLastMonth.setHours(0, 0, 0, 0);
        
        const endOfLastMonth = new Date();
        endOfLastMonth.setDate(0);
        endOfLastMonth.setHours(23, 59, 59, 999);
        
        const lastMonthNewUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: startOfLastMonth,
                    lte: endOfLastMonth,
                },
            },
        });

        const newUsersTrend = lastMonthNewUsers === 0 
            ? 100 
            : Math.round(((newUsersThisMonth - lastMonthNewUsers) / lastMonthNewUsers) * 100);

        return {
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: limit,
                },
                stats: {
                    totalUsers: stats[0],
                    activeUsers: stats[1],
                    suspendedUsers: stats[2],
                    bannedUsers: stats[3],
                    adminUsers: stats[4],
                    memberUsers: stats[5],
                    verifiedEmails: stats[6],
                    unverifiedEmails: stats[7],
                    newUsersThisMonth,
                    newUsersTrend,
                },
            },
        };
    } catch (error) {
        console.error("Get all users error:", error);
        return { success: false, message: "Failed to fetch users" };
    }
};

const getUserDetails = async (userId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                role: true,
                accountStatus: true,
                phone: true,
                address: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        ideas: true,
                        comments: true,
                        votes: true,
                        bookmarks: true,
                    },
                },
                // Get last active session
                sessions: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { createdAt: true },
                },
            },
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        // Get recent activities
        const recentActivities = await prisma.activityLog.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        return {
            success: true,
            data: {
                ...user,
                lastActive: user.sessions[0]?.createdAt || user.createdAt,
                recentActivities,
            },
        };
    } catch (error) {
        console.error("Get user details error:", error);
        return { success: false, message: "Failed to fetch user details" };
    }
};

const banUser = async (userId: string, adminId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        if (user.role === "ADMIN") {
            return { success: false, message: "Cannot ban another admin" };
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { accountStatus: "BANNED" },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: "ADMIN_ACTION",
                userId: adminId,
                details: {
                    action: "BAN_USER",
                    targetUserId: userId,
                    targetUserEmail: user.email,
                },
                ipAddress: "",
                userAgent: "",
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Ban user error:", error);
        return { success: false, message: "Failed to ban user" };
    }
};

const unbanUser = async (userId: string, adminId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { accountStatus: "ACTIVE" },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: "ADMIN_ACTION",
                userId: adminId,
                details: {
                    action: "UNBAN_USER",
                    targetUserId: userId,
                    targetUserEmail: user.email,
                },
                ipAddress: "",
                userAgent: "",
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Unban user error:", error);
        return { success: false, message: "Failed to unban user" };
    }
};

const suspendUser = async (userId: string, adminId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        if (user.role === "ADMIN") {
            return { success: false, message: "Cannot suspend another admin" };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { accountStatus: "SUSPENDED" },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: "ADMIN_ACTION",
                userId: adminId,
                details: {
                    action: "SUSPEND_USER",
                    targetUserId: userId,
                    targetUserEmail: user.email,
                },
                ipAddress: "",
                userAgent: "",
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Suspend user error:", error);
        return { success: false, message: "Failed to suspend user" };
    }
};

const activateUser = async (userId: string, adminId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { accountStatus: "ACTIVE" },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: "ADMIN_ACTION",
                userId: adminId,
                details: {
                    action: "ACTIVATE_USER",
                    targetUserId: userId,
                    targetUserEmail: user.email,
                },
                ipAddress: "",
                userAgent: "",
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Activate user error:", error);
        return { success: false, message: "Failed to activate user" };
    }
};

const changeUserRole = async (userId: string, newRole: string, adminId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        // Prevent changing own role
        if (userId === adminId) {
            return { success: false, message: "You cannot change your own role" };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole as any },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: "ADMIN_ACTION",
                userId: adminId,
                details: {
                    action: "CHANGE_ROLE",
                    targetUserId: userId,
                    targetUserEmail: user.email,
                    newRole,
                    oldRole: user.role,
                },
                ipAddress: "",
                userAgent: "",
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Change user role error:", error);
        return { success: false, message: "Failed to change user role" };
    }
};

const deleteUser = async (userId: string, adminId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        // Cascade delete will handle related records
        await prisma.user.delete({
            where: { id: userId },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: "ADMIN_ACTION",
                userId: adminId,
                details: {
                    action: "DELETE_USER",
                    targetUserId: userId,
                    targetUserEmail: user.email,
                },
                ipAddress: "",
                userAgent: "",
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Delete user error:", error);
        return { success: false, message: "Failed to delete user" };
    }
};

const bulkAction = async (action: string, userIds: string[], adminId: string) => {
    try {
        const results = await Promise.all(
            userIds.map(async (userId) => {
                switch (action) {
                    case "ban":
                        return await banUser(userId, adminId);
                    case "unban":
                        return await unbanUser(userId, adminId);
                    case "suspend":
                        return await suspendUser(userId, adminId);
                    case "activate":
                        return await activateUser(userId, adminId);
                    case "delete":
                        return await deleteUser(userId, adminId);
                    default:
                        return { success: false };
                }
            })
        );

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return {
            success: true,
            message: `${successful} user(s) ${action}ed successfully${failed > 0 ? `, ${failed} failed` : ""}`,
        };
    } catch (error) {
        console.error("Bulk action error:", error);
        return { success: false, message: "Failed to perform bulk action" };
    }
};

const exportUsers = async (params: {
    format: string;
    search?: string;
    role?: string;
    status?: string;
    verified?: string;
}) => {
    try {
        const { search, role, status, verified } = params;

        const where: Prisma.UserWhereInput = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role && role !== "all") {
            where.role = role as any;
        }

        if (status && status !== "all") {
            where.accountStatus = status as any;
        }

        if (verified === "verified") {
            where.emailVerified = true;
        } else if (verified === "unverified") {
            where.emailVerified = false;
        }

        const users = await prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            select: {
                name: true,
                email: true,
                role: true,
                accountStatus: true,
                emailVerified: true,
                createdAt: true,
            },
        });

        // Generate CSV
        const headers = ["Name", "Email", "Role", "Status", "Email Verified", "Joined Date"];
        const csvRows = [headers];

        for (const user of users) {
            csvRows.push([
                user.name,
                user.email,
                user.role,
                user.accountStatus,
                user.emailVerified ? "Yes" : "No",
                new Date(user.createdAt).toLocaleDateString(),
            ]);
        }

        const csvContent = csvRows.map(row => row.join(",")).join("\n");

        return { success: true, data: csvContent };
    } catch (error) {
        console.error("Export users error:", error);
        return { success: false, message: "Failed to export users" };
    }
};

export const userManagementService = {
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