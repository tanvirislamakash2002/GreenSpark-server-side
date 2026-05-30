import { prisma } from "../../lib/prisma";

const getComments = async (ideaId: string, page: number, limit: number) => {
    try {
        const skip = (page - 1) * limit;

        // Check if idea exists
        const idea = await prisma.idea.findUnique({
            where: { id: ideaId },
        });

        if (!idea) {
            return { success: false, message: "Idea not found" };
        }

        // Get top-level comments (parentId = null)
        const comments = await prisma.comment.findMany({
            where: {
                ideaId,
                parentId: null,
                isDeleted: false,
            },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                replies: {
                    where: { isDeleted: false },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                        replies: {
                            where: { isDeleted: false },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        image: true,
                                    },
                                },
                                replies: {
                                    where: { isDeleted: false },
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                name: true,
                                                email: true,
                                                image: true,
                                            },
                                        },
                                    },
                                    orderBy: { createdAt: "asc" },
                                },
                            },
                            orderBy: { createdAt: "asc" },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        // Get total count for pagination
        const totalItems = await prisma.comment.count({
            where: {
                ideaId,
                parentId: null,
                isDeleted: false,
            },
        });

        // Format comments with nested structure
        const formattedComments = comments.map((comment) => ({
            id: comment.id,
            content: comment.content,
            isDeleted: comment.isDeleted,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user: comment.user,
            parentId: comment.parentId,
            replyCount: comment.replies.length,
            replies: comment.replies.map((reply) => ({
                id: reply.id,
                content: reply.content,
                isDeleted: reply.isDeleted,
                createdAt: reply.createdAt,
                updatedAt: reply.updatedAt,
                user: reply.user,
                parentId: reply.parentId,
                replyCount: reply.replies.length,
                replies: reply.replies.map((nestedReply) => ({
                    id: nestedReply.id,
                    content: nestedReply.content,
                    isDeleted: nestedReply.isDeleted,
                    createdAt: nestedReply.createdAt,
                    updatedAt: nestedReply.updatedAt,
                    user: nestedReply.user,
                    parentId: nestedReply.parentId,
                    replyCount: 0,
                    replies: [],
                })),
            })),
        }));

        return {
            success: true,
            data: {
                comments: formattedComments,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: limit,
                },
            },
        };
    } catch (error) {
        console.error("Get comments error:", error);
        return { success: false, message: "Failed to fetch comments" };
    }
};

const createComment = async (
    userId: string,
    ideaId: string,
    data: { content: string; parentId: string | null }
) => {
    try {
        // Check if idea exists
        const idea = await prisma.idea.findUnique({
            where: { id: ideaId },
        });

        if (!idea) {
            return { success: false, message: "Idea not found" };
        }

        // If replying, check if parent comment exists
        if (data.parentId) {
            const parentComment = await prisma.comment.findUnique({
                where: { id: data.parentId },
            });

            if (!parentComment) {
                return { success: false, message: "Parent comment not found" };
            }

            // Check if parent comment belongs to the same idea
            if (parentComment.ideaId !== ideaId) {
                return { success: false, message: "Reply must be on a comment from the same idea" };
            }
        }

        // Create comment
        const comment = await prisma.comment.create({
            data: {
                content: data.content,
                userId,
                ideaId,
                parentId: data.parentId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
        });

        // Update idea's comment count
        await prisma.idea.update({
            where: { id: ideaId },
            data: { commentCount: { increment: 1 } },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: "ADD_COMMENT",
                userId,
                details: {
                    ideaId,
                    commentId: comment.id,
                    parentId: data.parentId,
                },
                ipAddress: "",
                userAgent: "",
            },
        });

        return {
            success: true,
            data: {
                id: comment.id,
                content: comment.content,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                user: comment.user,
                parentId: comment.parentId,
                replies: [],
                replyCount: 0,
            },
        };
    } catch (error) {
        console.error("Create comment error:", error);
        return { success: false, message: "Failed to create comment" };
    }
};

const updateComment = async (
    commentId: string,
    userId: string,
    isAdmin: boolean,
    data: { content: string }
) => {
    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            return { success: false, message: "Comment not found" };
        }

        // Check if user is author or admin
        if (comment.userId !== userId && !isAdmin) {
            return { success: false, message: "You don't have permission to edit this comment" };
        }

        // Update comment
        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: {
                content: data.content,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
        });

        return {
            success: true,
            data: {
                id: updatedComment.id,
                content: updatedComment.content,
                createdAt: updatedComment.createdAt,
                updatedAt: updatedComment.updatedAt,
                user: updatedComment.user,
                parentId: updatedComment.parentId,
            },
        };
    } catch (error) {
        console.error("Update comment error:", error);
        return { success: false, message: "Failed to update comment" };
    }
};

const deleteComment = async (commentId: string, userId: string, isAdmin: boolean) => {
    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            return { success: false, message: "Comment not found" };
        }

        // Check if user is author or admin
        if (comment.userId !== userId && !isAdmin) {
            return { success: false, message: "You don't have permission to delete this comment" };
        }

        // Soft delete - mark as deleted
        await prisma.comment.update({
            where: { id: commentId },
            data: { isDeleted: true },
        });

        // Update idea's comment count
        await prisma.idea.update({
            where: { id: comment.ideaId },
            data: { commentCount: { decrement: 1 } },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: "DELETE_COMMENT",
                userId,
                details: {
                    commentId,
                    ideaId: comment.ideaId,
                },
                ipAddress: "",
                userAgent: "",
            },
        });

        return {
            success: true,
            data: { ideaId: comment.ideaId },
        };
    } catch (error) {
        console.error("Delete comment error:", error);
        return { success: false, message: "Failed to delete comment" };
    }
};

const reportComment = async (commentId: string, reporterId: string, reason: string) => {
    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            return { success: false, message: "Comment not found" };
        }

        // Check if already reported by this user
        const existingReport = await prisma.commentReport.findFirst({
            where: {
                commentId,
                reporterId,
                status: "PENDING",
            },
        });

        if (existingReport) {
            return { success: false, message: "You have already reported this comment" };
        }

        // Create report
        await prisma.commentReport.create({
            data: {
                commentId,
                reporterId,
                reason,
                status: "PENDING",
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Report comment error:", error);
        return { success: false, message: "Failed to report comment" };
    }
};

export const commentService = {
    getComments,
    createComment,
    updateComment,
    deleteComment,
    reportComment,
};