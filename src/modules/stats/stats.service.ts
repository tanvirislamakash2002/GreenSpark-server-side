import { prisma } from "../../lib/prisma";

const getPlatformStats = async () => {
    try {
        const [totalIdeas, activeMembers, approvedIdeas, totalCategories] = await Promise.all([
            prisma.idea.count(),
            prisma.user.count({ where: { accountStatus: 'ACTIVE' } }),
            prisma.idea.count({ where: { status: 'APPROVED' } }),
            prisma.category.count(),
        ]);

        return {
            success: true,
            data: {
                totalIdeas,
                activeMembers,
                approvedIdeas,
                totalCategories,
            },
        };
    } catch (error) {
        console.error("Get platform stats error:", error);
        return { success: false, message: "Failed to fetch platform stats" };
    }
};

export const statsService = {
    getPlatformStats,
};