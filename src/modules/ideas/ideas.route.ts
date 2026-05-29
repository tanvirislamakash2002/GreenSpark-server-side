import express, { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../generated/prisma/enums";
import { adminIdeasController, memberIdeasController, publicIdeasController } from "./controllers";

const router = express.Router();

// ============ Admin Only Routes ============
router.get("/admin/ideas", auth(Role.ADMIN), adminIdeasController.getAdminIdeas);
router.get("/ideas/pending",auth(Role.ADMIN), adminIdeasController.getPendingIdeas);
router.delete("/admin/:id", auth(Role.ADMIN), adminIdeasController.adminDeleteIdea);
router.patch("/:id/approve", auth(Role.ADMIN), adminIdeasController.approveIdea);
router.patch("/:id/reject", auth(Role.ADMIN), adminIdeasController.rejectIdea);
router.patch("/:id/feature", auth(Role.ADMIN), adminIdeasController.featureIdea);

// ============ Member Only Routes ============
router.get("/member/ideas", auth(Role.MEMBER), memberIdeasController.getMemberIdeas);
router.get("/ideas/recent", auth(Role.MEMBER), memberIdeasController.getRecentIdeas);
router.post("/", auth(Role.MEMBER), memberIdeasController.createIdea);
router.patch("/member/:id", auth(Role.MEMBER), memberIdeasController.updateIdea);
router.delete("/:id", auth(Role.MEMBER), memberIdeasController.deleteIdea);
router.patch("/:id/submit", auth(Role.MEMBER), memberIdeasController.submitIdea);

// ============ Public Routes (No Authentication Required) ============
router.get("/", publicIdeasController.getIdeas);
router.get("/featured", publicIdeasController.getFeaturedIdeas);
router.get("/top-voted", publicIdeasController.getTopVotedIdeas);
router.get("/recent", publicIdeasController.getRecentIdeas);
router.get("/:id", publicIdeasController.getIdeaById);
router.get("/slug/:slug", publicIdeasController.getIdeaBySlug);


export const ideasRouter: Router = router;