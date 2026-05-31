import { prisma } from "../../../lib/prisma";
import { updateIdeaCommentCount, logActivity } from "./base-comment.service";

export const createComment = async (
    userId: string,
    ideaId: string,
    data: { content: string; parentId: string | null }
) => {
    try {
        const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
        if (!idea) return { success: false, message: "Idea not found" };

        if (data.parentId) {
            const parentComment = await prisma.comment.findUnique({
                where: { id: data.parentId },
            });
            if (!parentComment) return { success: false, message: "Parent comment not found" };
            if (parentComment.ideaId !== ideaId) {
                return { success: false, message: "Reply must be on a comment from the same idea" };
            }
        }

        const comment = await prisma.comment.create({
            data: {
                content: data.content,
                userId,
                ideaId,
                parentId: data.parentId,
            },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });

        await updateIdeaCommentCount(ideaId, 1);
        await logActivity(userId, "ADD_COMMENT", { ideaId, commentId: comment.id, parentId: data.parentId });

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

export const updateComment = async (
    commentId: string,
    userId: string,
    isAdmin: boolean,
    data: { content: string }
) => {
    try {
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) return { success: false, message: "Comment not found" };
        if (comment.userId !== userId && !isAdmin) {
            return { success: false, message: "You don't have permission to edit this comment" };
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { content: data.content },
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
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

export const deleteComment = async (commentId: string, userId: string, isAdmin: boolean) => {
    try {
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) return { success: false, message: "Comment not found" };
        if (comment.userId !== userId && !isAdmin) {
            return { success: false, message: "You don't have permission to delete this comment" };
        }

        await prisma.comment.update({ where: { id: commentId }, data: { isDeleted: true } });
        await updateIdeaCommentCount(comment.ideaId, -1);
        await logActivity(userId, "DELETE_COMMENT", { commentId, ideaId: comment.ideaId });

        return { success: true, data: { ideaId: comment.ideaId } };
    } catch (error) {
        console.error("Delete comment error:", error);
        return { success: false, message: "Failed to delete comment" };
    }
};

export const reportComment = async (commentId: string, reporterId: string, reason: string) => {
    try {
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) return { success: false, message: "Comment not found" };

        const existingReport = await prisma.commentReport.findFirst({
            where: { commentId, reporterId, status: "PENDING" },
        });
        if (existingReport) return { success: false, message: "You have already reported this comment" };

        await prisma.commentReport.create({
            data: { commentId, reporterId, reason, status: "PENDING" },
        });

        return { success: true };
    } catch (error) {
        console.error("Report comment error:", error);
        return { success: false, message: "Failed to report comment" };
    }
};