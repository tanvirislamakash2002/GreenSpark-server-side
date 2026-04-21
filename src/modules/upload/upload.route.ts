import express, { Router } from "express";
import auth from "../../middlewares/auth";
import { uploadController, uploadMiddleware, documentUploadMiddleware } from "./upload.controller";
import { Role } from "../../generated/prisma/enums";

const router = express.Router();

router.post(
    "/avatar/temp",
    uploadMiddleware,
    uploadController.uploadTempAvatar
);

// Protected routes
router.post(
    "/avatar",
    auth(Role.ADMIN, Role.SELLER, Role.CUSTOMER),
    uploadMiddleware,
    uploadController.uploadAvatar
);

router.delete(
    "/avatar",
    auth(Role.ADMIN, Role.SELLER, Role.CUSTOMER),
    uploadController.removeAvatar
);

router.post(
    "/store-logo",
    auth(Role.SELLER),
    uploadMiddleware,
    uploadController.uploadStoreLogo
);

router.post(
    "/product-image/:medicineId",
    auth(Role.SELLER),
    uploadMiddleware,
    uploadController.uploadProductImage
);

router.post(
    "/document",
    auth(Role.SELLER),
    documentUploadMiddleware,
    uploadController.uploadDocument
);

export const uploadRouter: Router = router;