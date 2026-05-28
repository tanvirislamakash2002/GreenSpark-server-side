import express, { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../generated/prisma/enums";
import { adminIdeasController, memberIdeasController, publicIdeasController } from "./controllers";

const router = express.Router();

// ============ Public Routes (No Authentication Required) ============
router.get("/", publicIdeasController.getIdeas);
router.get("/featured", publicIdeasController.getFeaturedIdeas);
router.get("/top-voted", publicIdeasController.getTopVotedIdeas);
router.get("/recent", publicIdeasController.getRecentIdeas);
router.get("/:id", publicIdeasController.getIdeaById);
router.get("/slug/:slug", publicIdeasController.getIdeaBySlug);

// ============ Member Only Routes ============
router.get("/member/ideas", auth(Role.MEMBER), memberIdeasController.getMemberIdeas);
router.post("/", auth(Role.MEMBER), memberIdeasController.createIdea);
router.patch("/member/:id", auth(Role.MEMBER), memberIdeasController.updateIdea);
router.delete("/:id", auth(Role.MEMBER), memberIdeasController.deleteIdea);
router.patch("/:id/submit", auth(Role.MEMBER), memberIdeasController.submitIdea);


// ============ Admin Only Routes ============
router.get("/admin/ideas", auth(Role.ADMIN), adminIdeasController.getAdminIdeas);
router.delete("/admin/:id", auth(Role.ADMIN), adminIdeasController.adminDeleteIdea);
router.patch("/:id/approve", auth(Role.ADMIN), adminIdeasController.approveIdea);
router.patch("/:id/reject", auth(Role.ADMIN), adminIdeasController.rejectIdea);
router.patch("/:id/feature", auth(Role.ADMIN), adminIdeasController.featureIdea);

export const ideasRouter: Router = router;