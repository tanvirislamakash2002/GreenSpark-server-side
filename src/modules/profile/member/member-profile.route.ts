import express, { Router } from "express";
import auth from "../../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { memberProfileController } from "./member-profile.controller";

const router = express.Router();

// All routes require authentication and MEMBER role
router.use(auth(Role.MEMBER));

// Profile Management
router.get("/profile", memberProfileController.getProfile);
router.patch("/profile", memberProfileController.updateProfile);

// Statistics
router.get("/stats", memberProfileController.getStats);

// Activity
router.get("/activity", memberProfileController.getActivity);

// Password Management
router.post("/change-password", memberProfileController.changePassword);

// Newsletter Subscription
router.patch("/newsletter", memberProfileController.updateNewsletter);

// Account Management
router.delete("/account", memberProfileController.deleteAccount);

export const memberProfileRouter: Router = router;