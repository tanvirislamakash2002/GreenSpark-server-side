import {
  Role,
  auth,
  prisma,
  prismaNamespace_exports
} from "./chunk-7SUANLHA.js";

// src/app.ts
import { toNodeHandler } from "better-auth/node";
import express2 from "express";
import cors from "cors";

// src/middlewares/globalErrorHandler.ts
function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let errorMessage = "Internal Server Error";
  let errorDetails = err;
  if (err instanceof prismaNamespace_exports.PrismaClientValidationError) {
    statusCode = 400;
    errorMessage = "You provide incorrect field type or missing fields!";
  } else if (err instanceof prismaNamespace_exports.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      statusCode = 400;
      errorMessage = "An operation failed because it depends on one or more records that were required but not found.";
    } else if (err.code === "P2002") {
      statusCode = 400;
      errorMessage = "Duplicate key error";
    } else if (err.code === "P2003") {
      statusCode = 400;
      errorMessage = "Foreign key constraint failed";
    }
  } else if (err instanceof prismaNamespace_exports.PrismaClientUnknownRequestError) {
    statusCode = 500;
    errorMessage = "Error occurred during query execution";
  } else if (err instanceof prismaNamespace_exports.PrismaClientRustPanicError) {
    statusCode = 500;
    errorMessage = "Prisma internal issue";
  } else if (err instanceof prismaNamespace_exports.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = 401;
      errorMessage = "Authentication failed. Please check your credential!";
    }
    if (err.errorCode === "P1001") {
      statusCode = 400;
      errorMessage = "Can't reach database server!";
    }
  }
  res.status(statusCode);
  res.json({
    message: errorMessage,
    error: errorDetails
  });
}
var globalErrorHandler_default = errorHandler;

// src/middlewares/notFound.ts
var notFound = (req, res) => {
  res.status(404).json({
    message: "Route not found!",
    path: req.originalUrl,
    date: Date()
  });
};

// src/modules/upload/upload.route.ts
import express from "express";

// src/middlewares/auth.ts
var betterAuth;
var loadAuth = async () => {
  if (!betterAuth) {
    const authModule = await import("./auth-JLBTIFZW.js");
    betterAuth = await authModule.auth;
  }
  return betterAuth;
};
var auth2 = (...roles) => {
  return async (req, res, next) => {
    try {
      const authInstance = await loadAuth();
      const session = await authInstance.api.getSession({
        headers: req.headers
      });
      if (!session) {
        return res.status(401).json({
          success: false,
          message: "You are not authorized!"
        });
      }
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        emailVerified: session.user.emailVerified
      };
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden! You don't have permission to access this resources"
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth2;

// src/modules/upload/upload.controller.ts
import multer from "multer";

// src/modules/upload/upload.service.ts
import FormData from "form-data";
import axios from "axios";
var uploadToImgbb = async (fileBuffer, fileName) => {
  if (!fileBuffer) {
    throw new Error("No file provided");
  }
  const formData = new FormData();
  const base64Image = fileBuffer.toString("base64");
  formData.append("image", base64Image);
  if (fileName) {
    const name = fileName.split(".")[0];
    formData.append("name", `upload_${Date.now()}_${name}`);
  }
  try {
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      formData,
      {
        headers: { ...formData.getHeaders() },
        timeout: 3e4
      }
    );
    if (response.data.success) {
      return response.data.data.url;
    } else {
      throw new Error(response.data.error?.message || "Upload failed");
    }
  } catch (error) {
    console.error("ImgBB upload error:", error);
    throw new Error(error instanceof Error ? error.message : "Upload service unavailable");
  }
};
var uploadAvatar = async (userId, fileBuffer, fileName) => {
  try {
    const imageUrl = await uploadToImgbb(fileBuffer, fileName);
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });
    return {
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        url: updatedUser.image,
        user: updatedUser
      }
    };
  } catch (error) {
    console.error("Avatar upload error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to upload avatar"
    };
  }
};
var removeAvatar = async (userId) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: null },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });
    return {
      success: true,
      message: "Avatar removed successfully",
      data: {
        user: updatedUser
      }
    };
  } catch (error) {
    console.error("Avatar removal error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to remove avatar"
    };
  }
};
var uploadStoreLogo = async (userId, fileBuffer, fileName) => {
  try {
    const imageUrl = await uploadToImgbb(fileBuffer, fileName);
    const updatedSeller = await prisma.seller.update({
      where: { userId },
      data: { storeLogo: imageUrl },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    return {
      success: true,
      message: "Store logo uploaded successfully",
      data: {
        url: updatedSeller.storeLogo,
        seller: updatedSeller
      }
    };
  } catch (error) {
    console.error("Store logo upload error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to upload store logo"
    };
  }
};
var uploadProductImage = async (medicineId, sellerId, fileBuffer, fileName) => {
  try {
    const medicine = await prisma.medicine.findFirst({
      where: {
        id: medicineId,
        sellerId
      }
    });
    if (!medicine) {
      return {
        success: false,
        message: "Medicine not found or unauthorized"
      };
    }
    const imageUrl = await uploadToImgbb(fileBuffer, fileName);
    const updatedMedicine = await prisma.medicine.update({
      where: { id: medicineId },
      data: { imageUrl },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        price: true
      }
    });
    return {
      success: true,
      message: "Product image uploaded successfully",
      data: updatedMedicine
    };
  } catch (error) {
    console.error("Product image upload error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to upload product image"
    };
  }
};
var uploadDocument = async (sellerId, fileBuffer, fileName, documentType) => {
  try {
    const imageUrl = await uploadToImgbb(fileBuffer, fileName);
    const document = await prisma.sellerDocument.create({
      data: {
        sellerId,
        documentType: documentType || "BUSINESS_LICENSE",
        documentUrl: imageUrl,
        status: "PENDING"
      }
    });
    return {
      success: true,
      message: "Document uploaded successfully",
      data: document
    };
  } catch (error) {
    console.error("Document upload error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to upload document"
    };
  }
};
var uploadService = {
  uploadToImgbb,
  uploadAvatar,
  removeAvatar,
  uploadStoreLogo,
  uploadProductImage,
  uploadDocument
};

// src/modules/upload/upload.controller.ts
var storage = multer.memoryStorage();
var fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};
var upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
  // 2MB
});
var documentUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
  // 5MB
});
var uploadTempAvatar = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }
    const imageUrl = await uploadService.uploadToImgbb(file.buffer, file.originalname);
    return res.status(200).json({
      success: true,
      message: "Avatar uploaded temporarily",
      data: { url: imageUrl }
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      message: "do not try at home"
    });
  }
};
var uploadAvatar2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
    const file = req.file;
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
var removeAvatar2 = async (req, res, next) => {
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
var uploadStoreLogo2 = async (req, res, next) => {
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
    const file = req.file;
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
};
var uploadProductImage2 = async (req, res, next) => {
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
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }
    const result = await uploadService.uploadProductImage(
      medicineId,
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
var uploadDocument2 = async (req, res, next) => {
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
    const file = req.file;
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
};
var uploadMiddleware = upload.single("avatar");
var documentUploadMiddleware = documentUpload.single("file");
var uploadController = {
  uploadTempAvatar,
  uploadAvatar: uploadAvatar2,
  removeAvatar: removeAvatar2,
  uploadStoreLogo: uploadStoreLogo2,
  uploadProductImage: uploadProductImage2,
  uploadDocument: uploadDocument2
};

// src/modules/upload/upload.route.ts
var router = express.Router();
router.post(
  "/avatar/temp",
  uploadMiddleware,
  uploadController.uploadTempAvatar
);
router.post(
  "/avatar",
  auth_default(Role.ADMIN, Role.SELLER, Role.CUSTOMER),
  uploadMiddleware,
  uploadController.uploadAvatar
);
router.delete(
  "/avatar",
  auth_default(Role.ADMIN, Role.SELLER, Role.CUSTOMER),
  uploadController.removeAvatar
);
router.post(
  "/store-logo",
  auth_default(Role.SELLER),
  uploadMiddleware,
  uploadController.uploadStoreLogo
);
router.post(
  "/product-image/:medicineId",
  auth_default(Role.SELLER),
  uploadMiddleware,
  uploadController.uploadProductImage
);
router.post(
  "/document",
  auth_default(Role.SELLER),
  documentUploadMiddleware,
  uploadController.uploadDocument
);
var uploadRouter = router;

// src/app.ts
var app = express2();
var allowedOrigins = [
  process.env.APP_URL || "http://localhost:3000",
  process.env.PROD_APP_URL
  // Production frontend URL
].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.includes(origin) || /^https:\/\/invio-.*\.vercel\.app$/.test(origin) || // ← CHANGE to your frontend name
      /^https:\/\/.*\.vercel\.app$/.test(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"]
  })
);
app.use(express2.json());
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api/v1/upload", uploadRouter);
app.get("/", (req, res) => {
  res.send("Hello, World!");
});
app.use(notFound);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var PORT = process.env.PORT || 3e3;
async function main() {
  try {
    await prisma.$connect();
    console.log("Connect to the database successfully");
    app_default.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("An error occurred:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}
main();
