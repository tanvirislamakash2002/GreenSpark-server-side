import { prisma } from "../../../lib/prisma";

export const formatCommentsWithNestedReplies = (comments: any[]) => {
    return comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        isDeleted: comment.isDeleted,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user,
        parentId: comment.parentId,
        replyCount: comment.replies.length,
        replies: comment.replies.map((reply: any) => ({
            id: reply.id,
            content: reply.content,
            isDeleted: reply.isDeleted,
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt,
            user: reply.user,
            parentId: reply.parentId,
            replyCount: reply.replies.length,
            replies: reply.replies.map((nestedReply: any) => ({
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
};

export const updateIdeaCommentCount = async (ideaId: string, increment: number) => {
    await prisma.idea.update({
        where: { id: ideaId },
        data: { commentCount: { increment } },
    });
};

export const logActivity = async (userId: string, action: string, details: any) => {
    await prisma.activityLog.create({
        data: {
            action: action as any,
            userId,
            details,
            ipAddress: "",
            userAgent: "",
        },
    });
};