import express, { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../generated/prisma/enums";
import { PaymentController } from "./payment.controller";

const router = express.Router();

// Webhook (no auth required, raw body needed)
router.post("/webhook", express.raw({ type: "application/json" }), PaymentController.handleWebhook);

// Member routes (require authentication)
router.post("/create-payment-intent", auth(Role.MEMBER), PaymentController.createPaymentIntent);
router.get("/status/:paymentId", auth(Role.MEMBER), PaymentController.checkPaymentStatus);
router.get("/check-paid/:ideaId", auth(Role.MEMBER), PaymentController.checkUserPaidForIdea);
router.get("/my-payments", auth(Role.MEMBER), PaymentController.getUserPayments);

// Admin routes
router.post("/refund/:paymentId", auth(Role.ADMIN), PaymentController.refundPayment);

export const paymentRouter: Router = router;