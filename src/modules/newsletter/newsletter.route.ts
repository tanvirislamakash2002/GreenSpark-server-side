import express, { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../generated/prisma/enums";
import { newsletterController } from "./newsletter.controller";

const router = express.Router();

// Public route - no authentication required
router.post("/subscribe", newsletterController.subscribe);

// Admin routes - require ADMIN role
router.use(auth(Role.ADMIN));

router.get("/subscribers", newsletterController.getSubscribers);
router.get("/subscribers/stats", newsletterController.getSubscribersStats);
router.get("/export", newsletterController.exportSubscribers);
router.delete("/subscribers/:id", newsletterController.deleteSubscriber);
router.post("/send", newsletterController.sendNewsletter);
router.post("/test", newsletterController.sendTestEmail);
router.get("/campaigns", newsletterController.getCampaigns);

export const newsletterRouter: Router = router;