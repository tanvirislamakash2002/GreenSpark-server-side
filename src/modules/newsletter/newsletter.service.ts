import { prisma } from "../../lib/prisma";

const subscribe = async (email: string) => {
    try {
        // Check if email already exists
        const existing = await prisma.newsletter.findUnique({
            where: { email },
        });

        if (existing) {
            // If already subscribed but unsubscribed, reactivate
            if (!existing.isSubscribed) {
                await prisma.newsletter.update({
                    where: { email },
                    data: {
                        isSubscribed: true,
                        unsubscribedAt: null,
                    },
                });
                return {
                    success: true,
                    message: "Successfully resubscribed to newsletter!",
                };
            }
            
            // If already active subscriber
            return {
                success: false,
                message: "This email is already subscribed to our newsletter.",
            };
        }

        // Create new subscription
        await prisma.newsletter.create({
            data: {
                email,
                isSubscribed: true,
                subscribedAt: new Date(),
            },
        });

        // Optional: Send welcome email
        // await sendWelcomeEmail(email);

        return {
            success: true,
            message: "Successfully subscribed to newsletter!",
        };
    } catch (error) {
        console.error("Newsletter subscription error:", error);
        return {
            success: false,
            message: "Failed to subscribe. Please try again later.",
        };
    }
};

// Optional: Unsubscribe functionality
const unsubscribe = async (email: string) => {
    try {
        const existing = await prisma.newsletter.findUnique({
            where: { email },
        });

        if (!existing) {
            return {
                success: false,
                message: "Email not found in our newsletter list.",
            };
        }

        await prisma.newsletter.update({
            where: { email },
            data: {
                isSubscribed: false,
                unsubscribedAt: new Date(),
            },
        });

        return {
            success: true,
            message: "Successfully unsubscribed from newsletter.",
        };
    } catch (error) {
        console.error("Newsletter unsubscribe error:", error);
        return {
            success: false,
            message: "Failed to unsubscribe. Please try again later.",
        };
    }
};

// Optional: Get all subscribers (admin only)
const getAllSubscribers = async (params: {
    page: number;
    limit: number;
    search?: string;
}) => {
    try {
        const { page, limit, search } = params;
        const skip = (page - 1) * limit;

        const where: any = { isSubscribed: true };
        
        if (search) {
            where.email = { contains: search, mode: 'insensitive' };
        }

        const subscribers = await prisma.newsletter.findMany({
            where,
            skip,
            take: limit,
            orderBy: { subscribedAt: 'desc' },
        });

        const totalItems = await prisma.newsletter.count({ where });

        return {
            success: true,
            data: {
                subscribers,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: limit,
                },
            },
        };
    } catch (error) {
        console.error("Get subscribers error:", error);
        return {
            success: false,
            message: "Failed to fetch subscribers",
        };
    }
};

// Optional: Export subscribers to CSV (admin only)
const exportSubscribersCSV = async () => {
    try {
        const subscribers = await prisma.newsletter.findMany({
            where: { isSubscribed: true },
            orderBy: { subscribedAt: 'desc' },
        });

        const csvRows = [
            ['Email', 'Subscribed At'],
            ...subscribers.map(sub => [sub.email, sub.subscribedAt.toISOString()]),
        ];

        const csvContent = csvRows.map(row => row.join(',')).join('\n');

        return {
            success: true,
            data: csvContent,
        };
    } catch (error) {
        console.error("Export subscribers error:", error);
        return {
            success: false,
            message: "Failed to export subscribers",
        };
    }
};

export const newsletterService = {
    subscribe,
    unsubscribe,
    getAllSubscribers,
    exportSubscribersCSV,
};