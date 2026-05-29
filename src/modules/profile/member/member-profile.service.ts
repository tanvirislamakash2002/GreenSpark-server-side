
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";

const getProfile = async (userId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                phone: true,
                address: true,
                role: true,
                accountStatus: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        return { success: true, data: user };
    } catch (error) {
        console.error("Get profile error:", error);
        return { success: false, message: "Failed to fetch profile" };
    }
};

const updateProfile = async (
    userId: string,
    data: { name?: string; phone?: string; address?: string }
) => {
    try {
        const updateData: Prisma.UserUpdateInput = {};
        
        if (data.name !== undefined) updateData.name = data.name;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.address !== undefined) updateData.address = data.address;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                phone: true,
                address: true,
                role: true,
                accountStatus: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return { success: true, data: updatedUser };
    } catch (error) {
        console.error("Update profile error:", error);
        return { success: false, message: "Failed to update profile" };
    }
};

const getStats = async (userId: string) => {
    try {
        // Get all ideas by user with their vote scores
        const userIdeas = await prisma.idea.findMany({
            where: { authorId: userId },
            select: {
                id: true,
                status: true,
                voteScore: true,
                isPaid: true,
            },
        });

        // Count ideas by status
        const totalIdeas = userIdeas.length;
        const draftIdeas = userIdeas.filter(idea => idea.status === 'DRAFT').length;
        const pendingIdeas = userIdeas.filter(idea => idea.status === 'PENDING').length;
        const approvedIdeas = userIdeas.filter(idea => idea.status === 'APPROVED').length;
        const rejectedIdeas = userIdeas.filter(idea => idea.status === 'REJECTED').length;

        // Calculate total upvotes received (only positive vote scores)
        const totalUpvotesReceived = userIdeas.reduce((sum, idea) => {
            return sum + (idea.voteScore > 0 ? idea.voteScore : 0);
        }, 0);

        // Count total comments made by user
        const totalComments = await prisma.comment.count({
            where: { 
                userId,
                isDeleted: false,
            },
        });

        // Count total bookmarks
        const totalBookmarks = await prisma.bookmark.count({
            where: { userId },
        });

        // Calculate approval rate
        const approvalRate = approvedIdeas > 0 
            ? Math.round((approvedIdeas / (approvedIdeas + rejectedIdeas)) * 100) 
            : 0;

        const stats = {
            totalIdeas,
            draftIdeas,
            pendingIdeas,
            approvedIdeas,
            rejectedIdeas,
            totalUpvotesReceived,
            totalComments,
            totalBookmarks,
            approvalRate,
        };

        return { success: true, data: stats };
    } catch (error) {
        console.error("Get stats error:", error);
        return { success: false, message: "Failed to fetch stats" };
    }
};

const getActivity = async (userId: string, limit: number) => {
    try {
        // Get recent ideas submitted
        const recentIdeas = await prisma.idea.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
            },
        });

        // Get recent comments
        const recentComments = await prisma.comment.findMany({
            where: { 
                userId,
                isDeleted: false,
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
                id: true,
                ideaId: true,
                idea: {
                    select: { title: true },
                },
                createdAt: true,
            },
        });

        // Get recent votes
        const recentVotes = await prisma.vote.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
                id: true,
                voteType: true,
                ideaId: true,
                idea: {
                    select: { title: true },
                },
                createdAt: true,
            },
        });

        // Combine and format activities
        const activities = [
            ...recentIdeas.map(idea => ({
                id: `idea-${idea.id}`,
                type: idea.status === "PENDING" ? "SUBMIT_IDEA" : 
                      idea.status === "APPROVED" ? "APPROVE_IDEA" : 
                      idea.status === "REJECTED" ? "REJECT_IDEA" : "SUBMIT_IDEA",
                message: idea.status === "PENDING"
                    ? `You submitted "${idea.title}" for review`
                    : idea.status === "APPROVED"
                        ? `Your idea "${idea.title}" was approved!`
                        : idea.status === "REJECTED"
                            ? `Your idea "${idea.title}" was rejected`
                            : `You created "${idea.title}"`,
                ideaId: idea.id,
                ideaTitle: idea.title,
                createdAt: idea.createdAt,
            })),
            ...recentComments.map(comment => ({
                id: `comment-${comment.id}`,
                type: "NEW_COMMENT",
                message: `You commented on "${comment.idea.title}"`,
                ideaId: comment.ideaId,
                ideaTitle: comment.idea.title,
                createdAt: comment.createdAt,
            })),
            ...recentVotes.map(vote => ({
                id: `vote-${vote.id}`,
                type: "VOTE",
                message: `You ${vote.voteType === 'UP' ? 'upvoted' : 'downvoted'} "${vote.idea.title}"`,
                ideaId: vote.ideaId,
                ideaTitle: vote.idea.title,
                createdAt: vote.createdAt,
            })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

        return { success: true, data: activities };
    } catch (error) {
        console.error("Get activity error:", error);
        return { success: false, message: "Failed to fetch activity" };
    }
};

const changePassword = async (
    userId: string,
    data: { currentPassword: string; newPassword: string }
) => {
    try {
        // Get user with account from better-auth
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                accounts: {
                    where: { providerId: "email" },
                    take: 1,
                },
            },
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        const account = user.accounts[0];
        if (!account || !account.password) {
            return { success: false, message: "No password set for this account" };
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(data.currentPassword, account.password);
        if (!isValidPassword) {
            return { success: false, message: "Current password is incorrect" };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(data.newPassword, 10);

        // Update password in account
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

const updateNewsletter = async (userId: string, isSubscribed: boolean) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        if (isSubscribed) {
            // Create or update newsletter subscription
            await prisma.newsletter.upsert({
                where: { email: user.email },
                update: { 
                    isSubscribed: true,
                    unsubscribedAt: null,
                },
                create: {
                    email: user.email,
                    isSubscribed: true,
                    userId,
                },
            });
        } else {
            // Unsubscribe
            await prisma.newsletter.update({
                where: { email: user.email },
                data: {
                    isSubscribed: false,
                    unsubscribedAt: new Date(),
                },
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Update newsletter error:", error);
        return { success: false, message: "Failed to update newsletter subscription" };
    }
};

const deleteAccount = async (userId: string) => {
    try {
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        // Delete user (cascade will handle related records due to schema relations)
        await prisma.user.delete({
            where: { id: userId },
        });

        return { success: true };
    } catch (error) {
        console.error("Delete account error:", error);
        return { success: false, message: "Failed to delete account" };
    }
};

export const memberProfileService = {
    getProfile,
    updateProfile,
    getStats,
    getActivity,
    changePassword,
    updateNewsletter,
    deleteAccount,
};