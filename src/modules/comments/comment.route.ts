import express, { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../generated/prisma/enums";
import { commentController } from "./comment.controller";

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

export const commentRouter: Router = router;