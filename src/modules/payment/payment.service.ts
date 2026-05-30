import Stripe from "stripe";
import { PaymentStatus, PaymentMethod } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const createPaymentIntent = async (data: {
    amount: number;
    userId: string;
    ideaId: string;
    ideaTitle: string;
    userEmail: string;
    userName: string;
}) => {
    try {
        const { amount, userId, ideaId, ideaTitle, userEmail, userName } = data;

        // Create payment record first
        const payment = await prisma.payment.create({
            data: {
                amount,
                status: PaymentStatus.PENDING,
                paymentMethod: PaymentMethod.STRIPE,
                userId,
                ideaId,
                metadata: {
                    ideaTitle,
                    userName,
                    userEmail,
                },
            },
        });

        // Create Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: "usd",
            automatic_payment_methods: { enabled: true },
            metadata: {
                paymentId: payment.id,
                ideaId,
                userId,
                ideaTitle,
            },
            receipt_email: userEmail,
            description: `Payment for idea: ${ideaTitle}`,
        });

        // Update payment with Stripe intent ID
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                stripePaymentIntentId: paymentIntent.id,
                transactionId: paymentIntent.id,
            },
        });

        return {
            success: true,
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentId: payment.id,
            },
        };
    } catch (error) {
        return { success: false, message: "Failed to create payment intent" };
    }
};

const handleStripeWebhookEvent = async (event: Stripe.Event) => {
    // Check if event already processed
    const existingPayment = await prisma.payment.findFirst({
        where: {
            stripeEventId: event.id,
        },
    });

    if (existingPayment) {
        return { message: `Event ${event.id} already processed. Skipping` };
    }

    switch (event.type) {
        case "payment_intent.succeeded": {
    try {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        const paymentId = paymentIntent.metadata?.paymentId;
        const ideaId = paymentIntent.metadata?.ideaId;


        if (!paymentId || !ideaId) {
            return { message: "Missing paymentId or ideaId in metadata" };
        }

        // Find the payment
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { idea: true },
        });


        if (!payment) {
            return { message: `Payment with id ${paymentId} not found` };
        }

        // Get receipt URL from latest_charge
        let receiptUrl: string | null = null;
        if (paymentIntent.latest_charge) {
            const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
            receiptUrl = charge.receipt_url;
        }

        // Update payment
        await prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: paymentId },
                data: {
                    status: PaymentStatus.COMPLETED,
                    stripeEventId: event.id,
                    paidAt: new Date(),
                    transactionId: paymentIntent.id,
                    ...(receiptUrl && { receiptUrl }),
                },
            });
        });

    } catch (error) {
        throw error; // Re-throw to see the actual error
    }
    break;
}

        case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const paymentId = paymentIntent.metadata?.paymentId;

            if (!paymentId) {
                return { message: "Missing paymentId in metadata" };
            }

            // Get existing payment to access current metadata
            const existingPayment = await prisma.payment.findUnique({
                where: { id: paymentId },
                select: { metadata: true },
            });

            // Merge existing metadata with new failure message
            const existingMetadata = existingPayment?.metadata as any || {};
            const updatedMetadata = {
                ...existingMetadata,
                failureMessage: paymentIntent.last_payment_error?.message,
                failedAt: new Date().toISOString(),
            };

            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: PaymentStatus.FAILED,
                    stripeEventId: event.id,
                    metadata: updatedMetadata,
                },
            });

            break;
        }

        case "charge.refunded": {
            const charge = event.data.object as Stripe.Charge;
            const paymentIntentId = charge.payment_intent as string;

            const payment = await prisma.payment.findFirst({
                where: { stripePaymentIntentId: paymentIntentId },
            });

            if (!payment) {
                return { message: `Payment not found` };
            }

            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.REFUNDED,
                    stripeEventId: event.id,
                },
            });

            break;
        }

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return { message: `Webhook Event ${event.id} processed successfully` };
};

const checkPaymentStatus = async (paymentId: string) => {
    try {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (!payment) {
            return { success: false, message: "Payment not found" };
        }

        return {
            success: true,
            data: {
                status: payment.status,
                paidAt: payment.paidAt,
                receiptUrl: payment.receiptUrl,
            },
        };
    } catch (error) {
        return { success: false, message: "Failed to check payment status" };
    }
};

const hasUserPaidForIdea = async (userId: string, ideaId: string) => {
    try {
        const payment = await prisma.payment.findFirst({
            where: {
                userId,
                ideaId,
                status: PaymentStatus.COMPLETED,
            },
        });

        return {
            success: true,
            data: !!payment,
        };
    } catch (error) {
        return { success: false, message: "Failed to check payment status" };
    }
};

const getPaymentsByUser = async (userId: string, page: number = 1, limit: number = 10) => {
    try {
        const skip = (page - 1) * limit;

        const payments = await prisma.payment.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
                idea: {
                    select: {
                        id: true,
                        title: true,
                        imageUrl: true,
                    },
                },
            },
        });

        const total = await prisma.payment.count({ where: { userId } });

        return {
            success: true,
            data: {
                payments,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                },
            },
        };
    } catch (error) {
        return { success: false, message: "Failed to fetch payments" };
    }
};

const refundPayment = async (paymentId: string, adminId: string) => {
    try {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (!payment) {
            return { success: false, message: "Payment not found" };
        }

        if (payment.status !== PaymentStatus.COMPLETED) {
            return { success: false, message: "Only completed payments can be refunded" };
        }

        if (!payment.stripePaymentIntentId) {
            return { success: false, message: "No Stripe payment intent found" };
        }

        // Process refund in Stripe
        const refund = await stripe.refunds.create({
            payment_intent: payment.stripePaymentIntentId,
        });

        // Update payment status
        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: PaymentStatus.REFUNDED,
                metadata: {
                    ...(payment.metadata as any),
                    refundId: refund.id,
                    refundedBy: adminId,
                    refundedAt: new Date().toISOString(),
                },
            },
        });

        return { success: true, message: "Payment refunded successfully" };
    } catch (error) {
        return { success: false, message: "Failed to process refund" };
    }
};

export const PaymentService = {
    createPaymentIntent,
    handleStripeWebhookEvent,
    checkPaymentStatus,
    hasUserPaidForIdea,
    getPaymentsByUser,
    refundPayment,
};