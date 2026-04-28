import express, { Router } from "express";
import auth from "../../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { memberController } from "./member.controller";

const router = express.Router();

// All member routes require authentication and MEMBER role
router.use(auth(Role.MEMBER));

router.get("/dashboard", memberController.getDashboard);
router.get("/stats", memberController.getStats);
router.get("/ideas/recent", memberController.getRecentIdeas);
router.get("/ideas", memberController.getMemberIdeas);
router.delete("/ideas/:ideaId", memberController.deleteIdea);
router.patch("/ideas/:ideaId/submit", memberController.submitIdea);

export const memberRouter: Router = router;