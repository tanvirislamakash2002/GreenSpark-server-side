import { Request, Response, NextFunction } from "express";
import { PaymentService } from "./payment.service";
import { stripe } from "../../config/stripe.config";

const createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const userEmail = req.user!.email;
        const userName = req.user!.name;
        const { ideaId, amount, ideaTitle } = req.body;

        if (!ideaId || !amount || !ideaTitle) {
            return res.status(400).json({
                success: false,
                message: "Idea ID, amount, and idea title are required",
            });
        }

        const result = await PaymentService.createPaymentIntent({
            amount,
            userId,
            ideaId,
            ideaTitle,
            userEmail,
            userName,
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    console.log("=== WEBHOOK CALLED ===");
    console.log("Content-Type:", req.headers["content-type"]);
    
    // For raw body, req.body is already a Buffer or string
    let rawBody = req.body;
    if (Buffer.isBuffer(rawBody)) {
        rawBody = rawBody.toString("utf8");
    }
    
    let event;
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    
    try {
        // Construct the event using Stripe's library
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        console.log("✅ Event type:", event.type);
    } catch (err) {
        console.error("❌ Signature verification failed:", err);
        return res.status(400).json({ success: false, message: "Invalid signature" });
    }
    
    try {
        const result = await PaymentService.handleStripeWebhookEvent(event);
        console.log("Webhook processing result:", result);
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error processing webhook:", error);
        return res.status(200).json({ success: false, message: "Processing error but acknowledged" });
    }
};

const checkPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { paymentId } = req.params;

        const result = await PaymentService.checkPaymentStatus(paymentId as string);

        if (!result.success) {
            return res.status(404).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

const checkUserPaidForIdea = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { ideaId } = req.params;

        const result = await PaymentService.hasUserPaidForIdea(userId, ideaId as string);

        return res.status(200).json({
            success: true,
            data: { hasPaid: result.data },
        });
    } catch (error) {
        next(error);
    }
};

const getUserPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await PaymentService.getPaymentsByUser(userId, page, limit);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

const refundPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const { paymentId } = req.params;

        const result = await PaymentService.refundPayment(paymentId as string, adminId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const PaymentController = {
    createPaymentIntent,
    handleWebhook,
    checkPaymentStatus,
    checkUserPaidForIdea,
    getUserPayments,
    refundPayment,
};