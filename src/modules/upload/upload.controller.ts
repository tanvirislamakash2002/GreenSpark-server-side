import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { uploadService } from "./upload.service";

// Configure multer
const storage = multer.memoryStorage();
const fileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// Configure multer for documents (larger size)
const documentUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
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
        // next(error);
        res.status(200).json({
            success: false,
            message: 'do not try at home'
        })
    }
};


// Upload avatar
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
}

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

// Upload store logo (seller)
const uploadStoreLogo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (user.role !== "SELLER") {
            return res.status(403).json({
                success: false,
                message: "Only sellers can upload store logos"
            });
        }

        const file = (req as any).file;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const result = await uploadService.uploadStoreLogo(
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
}

// Upload product image
const uploadProductImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        const { medicineId } = req.params;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (user.role !== "SELLER") {
            return res.status(403).json({
                success: false,
                message: "Only sellers can upload product images"
            });
        }

        if (!medicineId) {
            return res.status(400).json({
                success: false,
                message: "Medicine ID is required"
            });
        }

        const file = (req as any).file;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const result = await uploadService.uploadProductImage(
            medicineId as string,
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
}

// Upload seller document
const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        const { documentType } = req.body;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (user.role !== "SELLER") {
            return res.status(403).json({
                success: false,
                message: "Only sellers can upload documents"
            });
        }

        const file = (req as any).file;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const result = await uploadService.uploadDocument(
            user.id,
            file.buffer,
            file.originalname,
            documentType
        );

        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        next(error);
    }
}


// Export multer middleware
export const uploadMiddleware = upload.single("avatar");
export const documentUploadMiddleware = documentUpload.single("file");

export const uploadController = {
    uploadTempAvatar,
    uploadAvatar,
    removeAvatar,
    uploadStoreLogo,
    uploadProductImage,
    uploadDocument,
}