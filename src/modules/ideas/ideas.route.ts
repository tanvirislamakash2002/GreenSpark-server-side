import express, { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../generated/prisma/enums";
import { ideasController } from "./ideas.controller";

const router = express.Router();

// ============ Public Routes (No Authentication Required) ============
router.get("/", ideasController.getIdeas);
router.get("/featured", ideasController.getFeaturedIdeas);
router.get("/top-voted", ideasController.getTopVotedIdeas);
router.get("/recent", ideasController.getRecentIdeas);
router.get("/:id", ideasController.getIdeaById);
router.get("/slug/:slug", ideasController.getIdeaBySlug);

// ============ Member Only Routes ============
router.post("/", auth(Role.MEMBER), ideasController.createIdea);
router.patch("/:id", auth(Role.MEMBER), ideasController.updateIdea);
router.delete("/:id", auth(Role.MEMBER), ideasController.deleteIdea);
router.patch("/:id/submit", auth(Role.MEMBER), ideasController.submitIdea);

// ============ Admin Only Routes ============
router.patch("/:id/approve", auth(Role.ADMIN), ideasController.approveIdea);
router.patch("/:id/reject", auth(Role.ADMIN), ideasController.rejectIdea);
router.patch("/:id/feature", auth(Role.ADMIN), ideasController.featureIdea);

export const ideasRouter: Router = router;