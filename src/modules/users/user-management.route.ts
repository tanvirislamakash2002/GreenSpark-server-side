import express, { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../generated/prisma/enums";
import { userManagementController } from "./user-management.controller";

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(auth(Role.ADMIN));

// User listing and export
router.get("/", userManagementController.getAllUsers);
router.get("/export", userManagementController.exportUsers);

// Bulk actions
router.post("/bulk", userManagementController.bulkAction);

// Single user operations
router.get("/:userId", userManagementController.getUserDetails);
router.patch("/:userId/role", userManagementController.changeUserRole);
router.post("/:userId/ban", userManagementController.banUser);
router.post("/:userId/unban", userManagementController.unbanUser);
router.post("/:userId/suspend", userManagementController.suspendUser);
router.post("/:userId/activate", userManagementController.activateUser);
router.delete("/:userId", userManagementController.deleteUser);

export const userManagementRouter: Router = router;