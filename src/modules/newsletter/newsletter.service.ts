import { prisma } from "../../lib/prisma";
import nodemailer from "nodemailer";

// Email transporter setup
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.APP_USER,
        pass: process.env.APP_PASSWORD,
    },
});
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
const getAllSubscribers = async (params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
}) => {
    try {
        const { page, limit, search, status } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        
        if (status === 'active') {
            where.isSubscribed = true;
        } else if (status === 'unsubscribed') {
            where.isSubscribed = false;
        }

        if (search) {
            where.email = { contains: search, mode: 'insensitive' };
        }

        const subscribers = await prisma.newsletter.findMany({
            where,
            skip,
            take: limit,
            orderBy: { subscribedAt: 'desc' },
            include: {
                user: {
                    select: {
                        name: true,
                        image: true,
                    },
                },
            },
        });

        const totalItems = await prisma.newsletter.count({ where });

        // Get stats
        const [totalSubscribers, activeSubscribers, unsubscribed, newThisMonth] = await Promise.all([
            prisma.newsletter.count(),
            prisma.newsletter.count({ where: { isSubscribed: true } }),
            prisma.newsletter.count({ where: { isSubscribed: false } }),
            prisma.newsletter.count({
                where: {
                    subscribedAt: { gte: new Date(new Date().setDate(1)) },
                },
            }),
        ]);

        return {
            success: true,
            data: {
                subscribers,
                stats: {
                    totalSubscribers,
                    activeSubscribers,
                    unsubscribed,
                    newThisMonth,
                },
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

const getSubscribersStats = async () => {
    try {
        const [totalSubscribers, activeSubscribers, unsubscribed, newThisMonth] = await Promise.all([
            prisma.newsletter.count(),
            prisma.newsletter.count({ where: { isSubscribed: true } }),
            prisma.newsletter.count({ where: { isSubscribed: false } }),
            prisma.newsletter.count({
                where: {
                    subscribedAt: { gte: new Date(new Date().setDate(1)) },
                },
            }),
        ]);

        return {
            success: true,
            data: {
                totalSubscribers,
                activeSubscribers,
                unsubscribed,
                newThisMonth,
            },
        };
    } catch (error) {
        console.error("Get subscribers stats error:", error);
        return { success: false, message: "Failed to fetch stats" };
    }
};

const deleteSubscriber = async (subscriberId: string) => {
    try {
        await prisma.newsletter.delete({
            where: { id: subscriberId },
        });

        return { success: true, message: "Subscriber removed successfully" };
    } catch (error) {
        console.error("Delete subscriber error:", error);
        return { success: false, message: "Failed to remove subscriber" };
    }
};

const sendNewsletter = async (data: {
    subject: string;
    content: string;
    sendTo: string;
    adminId: string;
}) => {
    try {
        const { subject, content, sendTo, adminId } = data;

        // Get subscribers based on sendTo filter
        const where: any = { isSubscribed: true };
        
        const subscribers = await prisma.newsletter.findMany({
            where,
            select: { email: true },
        });

        if (subscribers.length === 0) {
            return { success: false, message: "No subscribers found" };
        }

        // Send emails (in production, use a queue system)
        let sentCount = 0;
        for (const subscriber of subscribers) {
            try {
                await transporter.sendMail({
                    from: `"GreenSpark" <${process.env.APP_USER}>`,
                    to: subscriber.email,
                    subject: subject,
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head><meta charset="UTF-8"></head>
                        <body style="font-family: Arial, sans-serif;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #15803d 0%, #166534 100%); border-radius: 10px;">
                                    <h1 style="color: white;">🌿 GreenSpark</h1>
                                </div>
                                <div style="padding: 20px;">
                                    ${content.replace(/\n/g, '<br>')}
                                </div>
                                <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                                    <p>You're receiving this email because you subscribed to GreenSpark newsletter.</p>
                                    <p><a href="${process.env.APP_URL}/unsubscribe?email=${subscriber.email}" style="color: #15803d;">Unsubscribe</a></p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `,
                });
                sentCount++;
            } catch (emailError) {
                console.error(`Failed to send to ${subscriber.email}:`, emailError);
            }
        }

        // Log campaign
        await prisma.newsletterCampaign.create({
            data: {
                subject,
                content,
                recipients: sentCount,
                sentBy: adminId,
                sentAt: new Date(),
                status: "SENT",
            },
        });

        return { success: true, message: `Newsletter sent to ${sentCount} subscribers` };
    } catch (error) {
        console.error("Send newsletter error:", error);
        return { success: false, message: "Failed to send newsletter" };
    }
};

const sendTestEmail = async (email: string, subject: string, content: string) => {
    try {
        await transporter.sendMail({
            from: `"GreenSpark" <${process.env.APP_USER}>`,
            to: email,
            subject: `[TEST] ${subject}`,
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #f0fdf4; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                        <p style="color: #166534;">⚠️ This is a test email</p>
                    </div>
                    ${content.replace(/\n/g, '<br>')}
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">This is a test email from GreenSpark.</p>
                </div>
            `,
        });

        return { success: true, message: "Test email sent successfully" };
    } catch (error) {
        console.error("Send test email error:", error);
        return { success: false, message: "Failed to send test email" };
    }
};

const getCampaigns = async () => {
    try {
        const campaigns = await prisma.newsletterCampaign.findMany({
            orderBy: { sentAt: 'desc' },
            include: {
                sentByUser: {
                    select: { name: true, email: true },
                },
            },
        });

        return {
            success: true,
            data: campaigns,
        };
    } catch (error) {
        console.error("Get campaigns error:", error);
        return { success: false, message: "Failed to fetch campaigns" };
    }
};

// Update export
export const newsletterService = {
    subscribe,
    unsubscribe,
    getAllSubscribers,
    getSubscribersStats,
    exportSubscribersCSV,
    deleteSubscriber,
    sendNewsletter,
    sendTestEmail,
    getCampaigns,
};