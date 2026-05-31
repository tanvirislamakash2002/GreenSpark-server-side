import { prisma } from "../../../lib/prisma";
import { updateIdeaCommentCount, logActivity } from "./base-comment.service";

export const getAdminComments = async (params: {
    search?: string;
    status?: string;
    reportStatus?: string;
    sortBy?: string;
    page: number;
    limit: number;
}) => {
    try {
        const { search, status, reportStatus, sortBy, page, limit } = params;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (status === 'reported') {
            where.reports = { some: {} };
        } else if (status === 'deleted') {
            where.isDeleted = true;
        } else {
            where.isDeleted = false;
        }

        if (search) {
            where.OR = [
                { content: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { idea: { title: { contains: search, mode: 'insensitive' } } },
            ];
        }

        if (reportStatus && reportStatus !== 'all') {
            where.reports = { some: { status: reportStatus } };
        }

        const orderBy: any = sortBy === 'oldest' ? { createdAt: 'asc' } :
                            sortBy === 'mostReported' ? { reports: { _count: 'desc' } } :
                            { createdAt: 'desc' };

        const [comments, totalItems] = await Promise.all([
            prisma.comment.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    user: { select: { id: true, name: true, email: true, image: true } },
                    idea: { select: { id: true, title: true } },
                    reports: {
                        select: { id: true, status: true },
                        ...(reportStatus && reportStatus !== 'all' && {
                            where: { status: reportStatus as any },
                        }),
                    },
                },
            }),
            prisma.comment.count({ where }),
        ]);

        const [totalComments, reportedComments, resolvedReports, deletedComments] = await Promise.all([
            prisma.comment.count(),
            prisma.comment.count({ where: { reports: { some: {} } } }),
            prisma.commentReport.count({ where: { status: 'RESOLVED' } }),
            prisma.comment.count({ where: { isDeleted: true } }),
        ]);

        return {
            success: true,
            data: {
                comments: comments.map(c => ({
                    id: c.id,
                    content: c.content,
                    isDeleted: c.isDeleted,
                    createdAt: c.createdAt,
                    updatedAt: c.updatedAt,
                    user: c.user,
                    idea: c.idea,
                    reportCount: c.reports.length,
                })),
                stats: { totalComments, reportedComments, resolvedReports, deletedComments },
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: limit,
                },
            },
        };
    } catch (error) {
        console.error("Get admin comments error:", error);
        return { success: false, message: "Failed to fetch comments" };
    }
};

export const getCommentReports = async (commentId: string) => {
    try {
        const reports = await prisma.commentReport.findMany({
            where: { commentId },
            include: { reporter: { select: { id: true, name: true, email: true, image: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return {
            success: true,
            data: reports.map(r => ({
                id: r.id,
                reason: r.reason,
                status: r.status,
                createdAt: r.createdAt,
                reporter: r.reporter,
            })),
        };
    } catch (error) {
        console.error("Get comment reports error:", error);
        return { success: false, message: "Failed to fetch reports" };
    }
};

export const adminDeleteComment = async (commentId: string, adminId: string) => {
    try {
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) return { success: false, message: "Comment not found" };

        await prisma.comment.update({ where: { id: commentId }, data: { isDeleted: true } });
        await updateIdeaCommentCount(comment.ideaId, -1);
        await logActivity(adminId, "DELETE_COMMENT", { commentId, ideaId: comment.ideaId, actionBy: "ADMIN" });

        return { success: true, message: "Comment deleted successfully", data: { ideaId: comment.ideaId } };
    } catch (error) {
        console.error("Admin delete comment error:", error);
        return { success: false, message: "Failed to delete comment" };
    }
};

export const adminRestoreComment = async (commentId: string, adminId: string) => {
    try {
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) return { success: false, message: "Comment not found" };
        if (!comment.isDeleted) return { success: false, message: "Comment is not deleted" };

        await prisma.comment.update({ where: { id: commentId }, data: { isDeleted: false } });
        await updateIdeaCommentCount(comment.ideaId, 1);
        await logActivity(adminId, "ADMIN_ACTION", { action: "RESTORE_COMMENT", commentId, ideaId: comment.ideaId });

        return { success: true, message: "Comment restored successfully" };
    } catch (error) {
        console.error("Admin restore comment error:", error);
        return { success: false, message: "Failed to restore comment" };
    }
};

export const adminResolveReports = async (commentId: string, adminId: string) => {
    try {
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) return { success: false, message: "Comment not found" };

        await prisma.commentReport.updateMany({
            where: { commentId, status: 'PENDING' },
            data: { status: 'RESOLVED', resolvedAt: new Date(), moderatorId: adminId },
        });
        await logActivity(adminId, "ADMIN_ACTION", { action: "RESOLVE_REPORTS", commentId, ideaId: comment.ideaId });

        return { success: true, message: "Reports resolved successfully" };
    } catch (error) {
        console.error("Admin resolve reports error:", error);
        return { success: false, message: "Failed to resolve reports" };
    }
};

export const adminBulkAction = async (action: string, commentIds: string[], adminId: string) => {
    try {
        const results = await Promise.all(
            commentIds.map(async (commentId) => {
                switch (action) {
                    case "delete": return await adminDeleteComment(commentId, adminId);
                    case "restore": return await adminRestoreComment(commentId, adminId);
                    case "resolve": return await adminResolveReports(commentId, adminId);
                    default: return { success: false };
                }
            })
        );

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return {
            success: true,
            message: `${successful} comment(s) ${action}ed successfully${failed > 0 ? `, ${failed} failed` : ""}`,
        };
    } catch (error) {
        console.error("Admin bulk action error:", error);
        return { success: false, message: "Failed to perform bulk action" };
    }
};