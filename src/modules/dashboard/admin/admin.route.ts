import express, { Router } from "express";
import auth from "../../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { adminController } from "./admin.controller";

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(auth(Role.ADMIN));

router.get("/dashboard", adminController.getDashboard);
router.get("/stats", adminController.getStats);
router.get("/activity/recent", adminController.getRecentActivity);

export const adminRouter: Router = router;