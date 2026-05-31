import { toNodeHandler } from "better-auth/node";
import express, { Application, Request, Response } from "express"
import { auth } from "./lib/auth";
import cors from "cors"
import errorHandler from "./middlewares/globalErrorHandler";
import { notFound } from "./middlewares/notFound";
import { uploadRouter } from "./modules/upload/upload.route";
import { memberRouter } from "./modules/dashboard/member/member.route";
import { adminRouter } from "./modules/dashboard/admin/admin.route";
import { categoryRouter } from "./modules/category/category.route";
import { ideasRouter } from "./modules/ideas/ideas.route";
import { statsRouter } from "./modules/stats/stats.route";
import { newsletterRouter } from "./modules/newsletter/newsletter.route";
import { bookmarkRouter } from "./modules/bookmarks/bookmark.route";
import { voteRouter } from "./modules/votes/vote.route";
import { memberProfileRouter } from "./modules/profile/member/member-profile.route";
import { adminSettingsRouter } from "./modules/settings/admin/admin-settings.route";
import { userManagementRouter } from "./modules/users/user-management.route";
import { paymentRouter } from "./modules/payment/payment.route";
import { optionalAuth } from "./middlewares/optionalAuth";
import { PaymentController } from "./modules/payment/payment.controller";
import { commentRouter } from "./modules/comment/comment.route";
import { analyticsRouter } from "./modules/analytics/analytics.route";

const app: Application = express()


const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5000",
    "https://greenspark1.vercel.app",
    "https://greenspark-server.vercel.app",
    process.env.APP_URL || "http://localhost:3000",
    process.env.PROD_APP_URL, // Production frontend URL
].filter(Boolean);


app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);

            // Check if origin is in allowedOrigins or matches Vercel preview pattern
            const isAllowed =
                allowedOrigins.includes(origin) ||
                /^https:\/\/invio-.*\.vercel\.app$/.test(origin) ||  // ← CHANGE to your frontend name
                /^https:\/\/.*\.vercel\.app$/.test(origin); // Any Vercel deployment
                
                if (isAllowed) {
                    callback(null, true);
            } else {
                callback(new Error(`Origin ${origin} not allowed by CORS`));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
        exposedHeaders: ["Set-Cookie"],
    }),
);
app.post("/api/v1/payments/webhook", express.raw({ type: "application/json" }), PaymentController.handleWebhook);
app.use(express.json())

app.use(optionalAuth);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use("/api/v1/payments", paymentRouter);
app.use('/api/v1/upload', uploadRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/ideas", ideasRouter);
app.use("/api/v1/votes", voteRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/member", memberRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/members", memberProfileRouter);
app.use("/api/v1/admin/settings", adminSettingsRouter);
app.use("/api/v1/admin/users", userManagementRouter);
app.use("/api/v1/bookmarks", bookmarkRouter);
app.use("/api/v1/admin/analytics", analyticsRouter);
app.use("/api/v1/stats", statsRouter);
app.use("/api/v1/newsletter", newsletterRouter);

app.get("/", (req, res) => {
    res.send("Hello, World!")
})
app.use(notFound)
app.use(errorHandler)

export default app;