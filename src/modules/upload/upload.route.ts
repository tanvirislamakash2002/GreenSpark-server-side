import express, { Router } from "express";
import auth from "../../middlewares/auth";
import { uploadController, uploadMiddleware } from "./upload.controller";
import { Role } from "../../generated/prisma/enums";

const router = express.Router();

// Public route - temporary avatar upload (for registration)
router.post(
    "/avatar/temp",
    uploadMiddleware,
    uploadController.uploadTempAvatar
);

// Protected routes - require authentication
router.post(
    "/avatar",
    auth(Role.MEMBER, Role.ADMIN),
    uploadMiddleware,
    uploadController.uploadAvatar
);

router.delete(
    "/avatar",
    auth(Role.MEMBER, Role.ADMIN),
    uploadController.removeAvatar
);

// Idea image upload (for members creating/editing ideas)
router.post(
    "/idea-image/:ideaId",
    auth(Role.MEMBER),
    uploadMiddleware,
    uploadController.uploadIdeaImage
);

// Category image upload (admin only)
router.post(
    "/category-image/:categoryId",
    auth(Role.ADMIN),
    uploadMiddleware,
    uploadController.uploadCategoryImage
);

export const uploadRouter: Router = router;