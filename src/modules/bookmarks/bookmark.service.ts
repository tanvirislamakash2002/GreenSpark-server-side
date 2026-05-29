import { prisma } from "../../lib/prisma";

const addBookmark = async (userId: string, ideaId: string) => {
    try {
        // Check if idea exists
        const idea = await prisma.idea.findUnique({
            where: { id: ideaId },
        });

        if (!idea) {
            return { success: false, message: "Idea not found" };
        }

        // Check if already bookmarked
        const existing = await prisma.bookmark.findUnique({
            where: {
                userId_ideaId: {
                    userId,
                    ideaId,
                },
            },
        });

        if (existing) {
            return { success: false, message: "Idea already bookmarked" };
        }

        // Create bookmark
        await prisma.bookmark.create({
            data: {
                userId,
                ideaId,
            },
        });

        return { success: true, message: "Bookmark added successfully" };
    } catch (error) {
        console.error("Add bookmark error:", error);
        return { success: false, message: "Failed to add bookmark" };
    }
};

const removeBookmark = async (userId: string, ideaId: string) => {
    try {
        const bookmark = await prisma.bookmark.findUnique({
            where: {
                userId_ideaId: {
                    userId,
                    ideaId,
                },
            },
        });

        if (!bookmark) {
            return { success: false, message: "Bookmark not found" };
        }

        await prisma.bookmark.delete({
            where: {
                userId_ideaId: {
                    userId,
                    ideaId,
                },
            },
        });

        return { success: true, message: "Bookmark removed successfully" };
    } catch (error) {
        console.error("Remove bookmark error:", error);
        return { success: false, message: "Failed to remove bookmark" };
    }
};

const getUserBookmarks = async (userId: string, page: number, limit: number) => {
    try {
        const skip = (page - 1) * limit;

        const bookmarks = await prisma.bookmark.findMany({
            where: { userId },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                idea: {
                    include: {
                        author: {
                            select: { id: true, name: true, image: true },
                        },
                        categories: {
                            include: { category: true },
                        },
                    },
                },
            },
        });

        const totalItems = await prisma.bookmark.count({ where: { userId } });

        const transformedBookmarks = bookmarks.map(bookmark => ({
            id: bookmark.id,
            ideaId: bookmark.idea.id,
            ideaTitle: bookmark.idea.title,
            ideaImage: bookmark.idea.imageUrl,
            ideaStatus: bookmark.idea.status,
            ideaVoteScore: bookmark.idea.voteScore,
            authorName: bookmark.idea.author.name,
            authorImage: bookmark.idea.author.image,
            bookmarkedAt: bookmark.createdAt,
        }));

        return {
            success: true,
            data: {
                bookmarks: transformedBookmarks,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: limit,
                },
            },
        };
    } catch (error) {
        console.error("Get user bookmarks error:", error);
        return { success: false, message: "Failed to fetch bookmarks" };
    }
};

const checkBookmark = async (userId: string, ideaId: string) => {
    try {
        const bookmark = await prisma.bookmark.findUnique({
            where: {
                userId_ideaId: {
                    userId,
                    ideaId,
                },
            },
        });

        return {
            success: true,
            data: { isBookmarked: !!bookmark },
        };
    } catch (error) {
        console.error("Check bookmark error:", error);
        return { success: false, message: "Failed to check bookmark" };
    }
};

export const bookmarkService = {
    addBookmark,
    removeBookmark,
    getUserBookmarks,
    checkBookmark,
};