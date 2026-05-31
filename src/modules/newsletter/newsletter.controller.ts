import { Request, Response, NextFunction } from "express";
import { newsletterService } from "./newsletter.service";

const subscribe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            });
        }

        const result = await newsletterService.subscribe(email);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
const getSubscribers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 15;
        const search = req.query.search as string;
        const status = req.query.status as string;

        const result = await newsletterService.getAllSubscribers({
            page,
            limit,
            search,
            status,
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

const getSubscribersStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await newsletterService.getSubscribersStats();

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

const exportSubscribers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const format = req.query.format as string || "csv";
        const result = await newsletterService.exportSubscribersCSV();

        if (!result.success) {
            return res.status(400).json(result);
        }

        if (format === "csv") {
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename=subscribers_${Date.now()}.csv`);
            return res.send(result.data);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const deleteSubscriber = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await newsletterService.deleteSubscriber(id as string);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const sendNewsletter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { subject, content, sendTo } = req.body;
        const adminId = req.user!.id;

        if (!subject || !content) {
            return res.status(400).json({
                success: false,
                message: "Subject and content are required",
            });
        }

        const result = await newsletterService.sendNewsletter({
            subject,
            content,
            sendTo,
            adminId,
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const sendTestEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, subject, content } = req.body;

        if (!email || !subject || !content) {
            return res.status(400).json({
                success: false,
                message: "Email, subject, and content are required",
            });
        }

        const result = await newsletterService.sendTestEmail(email, subject, content);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getCampaigns = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await newsletterService.getCampaigns();

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

export const newsletterController = {
    subscribe,
    getSubscribers,
    getSubscribersStats,
    exportSubscribers,
    deleteSubscriber,
    sendNewsletter,
    sendTestEmail,
    getCampaigns,
};