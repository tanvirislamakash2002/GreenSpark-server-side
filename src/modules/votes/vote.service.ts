import { prisma } from "../../lib/prisma";

const castVote = async (userId: string, ideaId: string, voteType: 'UP' | 'DOWN') => {
    try {
        // Check if idea exists
        const idea = await prisma.idea.findUnique({
            where: { id: ideaId },
        });

        if (!idea) {
            return { success: false, message: "Idea not found" };
        }

        // Check if user already voted
        const existingVote = await prisma.vote.findUnique({
            where: {
                userId_ideaId: {
                    userId,
                    ideaId,
                },
            },
        });

        let voteChange = 0;

        if (!existingVote) {
            // New vote
            voteChange = voteType === 'UP' ? 1 : -1;
            await prisma.vote.create({
                data: {
                    userId,
                    ideaId,
                    voteType,
                },
            });
        } else if (existingVote.voteType !== voteType) {
            // Changing vote (up → down or down → up)
            voteChange = voteType === 'UP' ? 2 : -2;
            await prisma.vote.update({
                where: { id: existingVote.id },
                data: { voteType },
            });
        } else {
            // Same vote - remove it (toggle off)
            voteChange = voteType === 'UP' ? -1 : 1;
            await prisma.vote.delete({
                where: { id: existingVote.id },
            });
        }

        // Update idea's voteScore
        if (voteChange !== 0) {
            await prisma.idea.update({
                where: { id: ideaId },
                data: { voteScore: { increment: voteChange } },
            });
        }

        // Get updated vote count
        const updatedIdea = await prisma.idea.findUnique({
            where: { id: ideaId },
            select: { voteScore: true },
        });

        const message = !existingVote 
            ? `${voteType === 'UP' ? 'Upvoted' : 'Downvoted'} successfully`
            : existingVote.voteType !== voteType
                ? `Vote changed to ${voteType === 'UP' ? 'upvote' : 'downvote'}`
                : 'Vote removed';

        return {
            success: true,
            message,
            data: {
                voteScore: updatedIdea?.voteScore || 0,
                userVote: existingVote?.voteType !== voteType ? voteType : null,
            },
        };
    } catch (error) {
        console.error("Cast vote error:", error);
        return { success: false, message: "Failed to cast vote" };
    }
};

const removeVote = async (userId: string, ideaId: string) => {
    try {
        const existingVote = await prisma.vote.findUnique({
            where: {
                userId_ideaId: {
                    userId,
                    ideaId,
                },
            },
        });

        if (!existingVote) {
            return { success: false, message: "No vote found to remove" };
        }

        // Update voteScore
        const voteChange = existingVote.voteType === 'UP' ? -1 : 1;
        await prisma.idea.update({
            where: { id: ideaId },
            data: { voteScore: { increment: voteChange } },
        });

        // Delete vote
        await prisma.vote.delete({
            where: { id: existingVote.id },
        });

        const updatedIdea = await prisma.idea.findUnique({
            where: { id: ideaId },
            select: { voteScore: true },
        });

        return {
            success: true,
            message: "Vote removed successfully",
            data: {
                voteScore: updatedIdea?.voteScore || 0,
                userVote: null,
            },
        };
    } catch (error) {
        console.error("Remove vote error:", error);
        return { success: false, message: "Failed to remove vote" };
    }
};

const getUserVote = async (userId: string, ideaId: string) => {
    try {
        const vote = await prisma.vote.findUnique({
            where: {
                userId_ideaId: {
                    userId,
                    ideaId,
                },
            },
            select: { voteType: true },
        });

        return {
            success: true,
            data: {
                userVote: vote?.voteType || null,
            },
        };
    } catch (error) {
        console.error("Get user vote error:", error);
        return { success: false, message: "Failed to get user vote" };
    }
};

export const voteService = {
    castVote,
    removeVote,
    getUserVote,
};