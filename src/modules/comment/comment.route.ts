import express, { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../generated/prisma/enums";
import * as commentController from "./comment.controller";

const router = express.Router();

// Public routes (no auth required)
router.get("/idea/:ideaId", commentController.getComments);

// Authenticated routes
router.use(auth(Role.MEMBER, Role.ADMIN));

router.get("/user/comments", commentController.getUserComments);
router.post("/idea/:ideaId", commentController.createComment);
router.patch("/:commentId", commentController.updateComment);
router.delete("/:commentId", commentController.deleteComment);
router.post("/:commentId/report", commentController.reportComment);

// Admin routes (require ADMIN role)
router.use(auth(Role.ADMIN));
router.get("/admin/comments", commentController.getAdminComments);
router.get("/admin/comments/:commentId/reports", commentController.getCommentReports);
router.delete("/admin/comments/:commentId", commentController.adminDeleteComment);
router.patch("/admin/comments/:commentId/restore", commentController.adminRestoreComment);
router.patch("/admin/comments/:commentId/resolve", commentController.adminResolveReports);
router.post("/admin/comments/bulk", commentController.adminBulkAction);

export const commentRouter: Router = router;