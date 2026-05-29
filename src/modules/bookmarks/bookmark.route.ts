import express, { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../generated/prisma/enums";
import { bookmarkController } from "./bookmark.controller";

const router = express.Router();

// All bookmark routes require authentication
router.use(auth(Role.MEMBER, Role.ADMIN));

router.post("/:ideaId", bookmarkController.addBookmark);
router.delete("/:ideaId", bookmarkController.removeBookmark);
router.get("/", bookmarkController.getUserBookmarks);
router.get("/check/:ideaId", bookmarkController.checkBookmark);

export const bookmarkRouter: Router = router;