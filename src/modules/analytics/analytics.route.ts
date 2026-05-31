import express, { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../generated/prisma/enums";
import { analyticsController } from "./analytics.controller";

const router = express.Router();

// All analytics routes require ADMIN role
router.use(auth(Role.ADMIN));

router.get("/", analyticsController.getAnalytics);
router.get("/export", analyticsController.exportAnalytics);

export const analyticsRouter: Router = router;