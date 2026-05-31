import { prisma } from "../../../lib/prisma";
import { formatCommentsWithNestedReplies } from "./base-comment.service";

export const getComments = async (ideaId: string, page: number, limit: number) => {
    try {
        const skip = (page - 1) * limit;

        const idea = await prisma.idea.findUnique({
            where: { id: ideaId },
        });

        if (!idea) {
            return { success: false, message: "Idea not found" };
        }

        const comments = await prisma.comment.findMany({
            where: { ideaId, parentId: null, isDeleted: false },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
                replies: {
                    where: { isDeleted: false },
                    include: {
                        user: { select: { id: true, name: true, email: true, image: true } },
                        replies: {
                            where: { isDeleted: false },
                            include: {
                                user: { select: { id: true, name: true, email: true, image: true } },
                                replies: {
                                    where: { isDeleted: false },
                                    include: {
                                        user: { select: { id: true, name: true, email: true, image: true } },
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

        const totalItems = await prisma.comment.count({
            where: { ideaId, parentId: null, isDeleted: false },
        });

        return {
            success: true,
            data: {
                comments: formatCommentsWithNestedReplies(comments),
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