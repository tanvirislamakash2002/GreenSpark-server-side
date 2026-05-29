import express, { Router } from "express";
import auth from "../../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { adminSettingsController } from "./admin-settings.controller";

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(auth(Role.ADMIN));

// Profile Management
router.get("/profile", adminSettingsController.getProfile);
router.patch("/profile", adminSettingsController.updateProfile);

// Password Management
router.post("/change-password", adminSettingsController.changePassword);

// Notification Preferences
router.get("/notifications", adminSettingsController.getNotificationPreferences);
router.patch("/notifications", adminSettingsController.updateNotificationPreferences);

// Session Management
router.get("/sessions", adminSettingsController.getSessions);
router.delete("/sessions", adminSettingsController.revokeAllSessions);
router.delete("/sessions/:sessionId", adminSettingsController.revokeSession);

// Activity Log
router.get("/activity", adminSettingsController.getActivityLog);

// System
router.post("/clear-cache", adminSettingsController.clearCache);

export const adminSettingsRouter: Router = router;