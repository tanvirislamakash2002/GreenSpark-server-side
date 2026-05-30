import { Request, Response, NextFunction } from "express";
import { PaymentService } from "../modules/payment/payment.service";
import { prisma } from "../lib/prisma";

export const requirePaidIdeaAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const ideaId = req.params.id;

        const idea = await prisma.idea.findUnique({
            where: { id: ideaId as string },
            select: { isPaid: true, status: true },
        });

        if (!idea) {
            return res.status(404).json({ success: false, message: "Idea not found" });
        }

        // Free ideas - always allow access (even for unauthenticated users)
        if (!idea.isPaid) {
            return next();
        }

        // Paid ideas - require authentication
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to access this paid idea",
                requiresAuth: true,
            });
        }

        // Check if user has paid
        const hasPaid = await PaymentService.hasUserPaidForIdea(userId, ideaId as string);

        if (!hasPaid.data) {
            return res.status(403).json({
                success: false,
                message: "This is a paid idea. Please purchase to access the full content.",
                requiresPayment: true,
                ideaId: ideaId,
            });
        }

        next();
    } catch (error) {
        console.error("Paid idea guard error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};