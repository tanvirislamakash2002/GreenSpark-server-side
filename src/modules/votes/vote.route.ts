import express, { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../generated/prisma/enums";
import { voteController } from "./vote.controller";

const router = express.Router();

// All vote routes require authentication
router.use(auth(Role.MEMBER, Role.ADMIN));

router.get("/user/votes", voteController.getUserVotes);
router.post("/:ideaId", voteController.castVote);
router.delete("/:ideaId", voteController.removeVote);
router.get("/:ideaId", voteController.getUserVote);

export const voteRouter: Router = router;