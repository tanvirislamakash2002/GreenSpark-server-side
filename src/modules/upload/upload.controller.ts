import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { uploadService } from "./upload.service";

// Configure multer for images
const storage = multer.memoryStorage();
const fileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed (JPEG, PNG, GIF, WEBP)"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Upload temporary avatar for signup (no user ID yet)
const uploadTempAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const file = (req as any).file;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        // Upload to ImgBB and return URL without saving to DB
        const imageUrl = await uploadService.uploadToImgbb(file.buffer, file.originalname);

        return res.status(200).json({
            success: true,
            message: "Avatar uploaded temporarily",
            data: { url: imageUrl }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to upload image"
        });
    }
};

// Upload avatar (authenticated users)
const uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const file = (req as any).file;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const result = await uploadService.uploadAvatar(
            user.id,
            file.buffer,
            file.originalname
        );

        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        next(error);
    }
};

// Remove avatar
const removeAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const result = await uploadService.removeAvatar(user.id);

        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        next(error);
    }
};

// Upload idea image
const uploadIdeaImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        const { ideaId } = req.params;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (!ideaId) {
            return res.status(400).json({
                success: false,
                message: "Idea ID is required"
            });
        }

        const file = (req as any).file;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const result = await uploadService.uploadIdeaImage(
            ideaId as string,
            user.id,
            file.buffer,
            file.originalname
        );

        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        next(error);
    }
};

// Upload category image (admin only)
const uploadCategoryImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        const { categoryId } = req.params;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (user.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Only admins can upload category images"
            });
        }

        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: "Category ID is required"
            });
        }

        const file = (req as any).file;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const result = await uploadService.uploadCategoryImage(
            categoryId as string,
            file.buffer,
            file.originalname
        );

        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        next(error);
    }
};

// Export multer middleware
export const uploadMiddleware = upload.single("image");

export const uploadController = {
    uploadTempAvatar,
    uploadAvatar,
    removeAvatar,
    uploadIdeaImage,
    uploadCategoryImage,
};