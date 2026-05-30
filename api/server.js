import {
  PaymentMethod,
  PaymentStatus,
  Role,
  auth,
  prisma,
  prismaNamespace_exports
} from "./chunk-VGRVNKBL.js";

// src/app.ts
import { toNodeHandler } from "better-auth/node";
import express15 from "express";
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
    const authModule = await import("./auth-NZDB23BW.js");
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
      const userFromDb = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { accountStatus: true }
      });
      if (userFromDb?.accountStatus !== "ACTIVE") {
        return res.status(403).json({
          success: false,
          message: "Your account has been suspended. Please contact support."
        });
      }
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        emailVerified: session.user.emailVerified,
        accountStatus: userFromDb?.accountStatus
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
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error("No file provided");
  }
  const formData = new FormData();
  const base64Image = fileBuffer.toString("base64");
  formData.append("image", base64Image);
  if (fileName) {
    const name = fileName.split(".")[0];
    formData.append("name", `greenspark_${Date.now()}_${name}`);
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
        image: true,
        role: true
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
        image: true,
        role: true
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
var uploadIdeaImage = async (ideaId, userId, fileBuffer, fileName) => {
  try {
    const idea = await prisma.idea.findFirst({
      where: {
        id: ideaId,
        authorId: userId
      }
    });
    if (!idea) {
      return {
        success: false,
        message: "Idea not found or unauthorized"
      };
    }
    if (idea.status === "APPROVED") {
      return {
        success: false,
        message: "Cannot modify approved ideas. Please contact admin."
      };
    }
    const imageUrl = await uploadToImgbb(fileBuffer, fileName);
    const updatedIdea = await prisma.idea.update({
      where: { id: ideaId },
      data: { imageUrl },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        status: true
      }
    });
    return {
      success: true,
      message: "Idea image uploaded successfully",
      data: updatedIdea
    };
  } catch (error) {
    console.error("Idea image upload error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to upload idea image"
    };
  }
};
var uploadCategoryImage = async (categoryId, fileBuffer, fileName) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    if (!category) {
      return {
        success: false,
        message: "Category not found"
      };
    }
    const imageUrl = await uploadToImgbb(fileBuffer, fileName);
    return {
      success: true,
      message: "Category image uploaded successfully",
      data: {
        categoryId,
        url: imageUrl
      }
    };
  } catch (error) {
    console.error("Category image upload error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to upload category image"
    };
  }
};
var uploadService = {
  uploadToImgbb,
  uploadAvatar,
  removeAvatar,
  uploadIdeaImage,
  uploadCategoryImage
};

// src/modules/upload/upload.controller.ts
var storage = multer.memoryStorage();
var fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPEG, PNG, GIF, WEBP)"), false);
  }
};
var upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
  // 2MB limit
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
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to upload image"
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
var uploadIdeaImage2 = async (req, res, next) => {
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
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }
    const result = await uploadService.uploadIdeaImage(
      ideaId,
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
var uploadCategoryImage2 = async (req, res, next) => {
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
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }
    const result = await uploadService.uploadCategoryImage(
      categoryId,
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
var uploadMiddleware = upload.single("image");
var uploadController = {
  uploadTempAvatar,
  uploadAvatar: uploadAvatar2,
  removeAvatar: removeAvatar2,
  uploadIdeaImage: uploadIdeaImage2,
  uploadCategoryImage: uploadCategoryImage2
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
  auth_default(Role.MEMBER, Role.ADMIN),
  uploadMiddleware,
  uploadController.uploadAvatar
);
router.delete(
  "/avatar",
  auth_default(Role.MEMBER, Role.ADMIN),
  uploadController.removeAvatar
);
router.post(
  "/idea-image/:ideaId",
  auth_default(Role.MEMBER),
  uploadMiddleware,
  uploadController.uploadIdeaImage
);
router.post(
  "/category-image/:categoryId",
  auth_default(Role.ADMIN),
  uploadMiddleware,
  uploadController.uploadCategoryImage
);
var uploadRouter = router;

// src/modules/dashboard/member/member.route.ts
import express2 from "express";

// src/modules/dashboard/member/member.service.ts
var getDashboardData = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true
      }
    });
    if (!user) {
      return { success: false, message: "User not found" };
    }
    const [
      totalIdeas,
      draftIdeas,
      pendingIdeas,
      approvedIdeas,
      rejectedIdeas,
      totalVotes,
      totalComments,
      totalBookmarks
    ] = await Promise.all([
      prisma.idea.count({ where: { authorId: userId } }),
      prisma.idea.count({ where: { authorId: userId, status: "DRAFT" } }),
      prisma.idea.count({ where: { authorId: userId, status: "PENDING" } }),
      prisma.idea.count({ where: { authorId: userId, status: "APPROVED" } }),
      prisma.idea.count({ where: { authorId: userId, status: "REJECTED" } }),
      prisma.vote.count({ where: { userId } }),
      prisma.comment.count({ where: { userId, isDeleted: false } }),
      prisma.bookmark.count({ where: { userId } })
    ]);
    const recentIdeas = await prisma.idea.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        voteScore: true,
        viewCount: true,
        commentCount: true,
        createdAt: true
      }
    });
    const [recentVotes, recentComments, recentSubmissions] = await Promise.all([
      prisma.vote.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { idea: { select: { id: true, title: true } } }
      }),
      prisma.comment.findMany({
        where: { userId, isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { idea: { select: { id: true, title: true } } }
      }),
      prisma.idea.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, title: true, createdAt: true }
      })
    ]);
    const activities = [
      ...recentSubmissions.map((idea) => ({
        id: `submit-${idea.id}`,
        type: "SUBMIT_IDEA",
        ideaId: idea.id,
        ideaTitle: idea.title,
        createdAt: idea.createdAt
      })),
      ...recentVotes.map((vote) => ({
        id: `vote-${vote.id}`,
        type: "VOTE",
        ideaId: vote.ideaId,
        ideaTitle: vote.idea.title,
        voteType: vote.voteType,
        createdAt: vote.createdAt
      })),
      ...recentComments.map((comment) => ({
        id: `comment-${comment.id}`,
        type: "COMMENT",
        ideaId: comment.ideaId,
        ideaTitle: comment.idea.title,
        createdAt: comment.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
    const recentBookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            author: { select: { name: true } },
            voteScore: true
          }
        }
      }
    });
    const recentVotesPreview = await prisma.vote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { idea: { select: { id: true, title: true, voteScore: true } } }
    });
    return {
      success: true,
      data: {
        stats: {
          totalIdeas,
          draftIdeas,
          pendingIdeas,
          approvedIdeas,
          rejectedIdeas,
          totalVotes,
          totalComments,
          totalBookmarks,
          memberSince: user.createdAt.toISOString()
        },
        recentIdeas,
        recentActivity: activities,
        recentBookmarks: recentBookmarks.map((b) => ({
          id: b.id,
          ideaId: b.idea.id,
          ideaTitle: b.idea.title,
          ideaImage: b.idea.imageUrl,
          authorName: b.idea.author.name,
          voteScore: b.idea.voteScore,
          bookmarkedAt: b.createdAt
        })),
        recentVotes: recentVotesPreview.map((v) => ({
          id: v.id,
          ideaId: v.ideaId,
          ideaTitle: v.idea.title,
          voteType: v.voteType,
          voteScore: v.idea.voteScore,
          votedAt: v.createdAt
        })),
        pendingCount: pendingIdeas
      }
    };
  } catch (error) {
    console.error("Get dashboard data error:", error);
    return { success: false, message: "Failed to fetch dashboard data" };
  }
};
var getStats = async (userId) => {
  try {
    const [totalIdeas, draftIdeas, pendingIdeas, approvedIdeas, rejectedIdeas, totalVotes, totalComments, totalBookmarks, user] = await Promise.all([
      prisma.idea.count({ where: { authorId: userId } }),
      prisma.idea.count({ where: { authorId: userId, status: "DRAFT" } }),
      prisma.idea.count({ where: { authorId: userId, status: "PENDING" } }),
      prisma.idea.count({ where: { authorId: userId, status: "APPROVED" } }),
      prisma.idea.count({ where: { authorId: userId, status: "REJECTED" } }),
      prisma.vote.count({ where: { userId } }),
      prisma.comment.count({ where: { userId, isDeleted: false } }),
      prisma.bookmark.count({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true }
      })
    ]);
    return {
      success: true,
      data: {
        totalIdeas,
        draftIdeas,
        pendingIdeas,
        approvedIdeas,
        rejectedIdeas,
        totalVotes,
        totalComments,
        totalBookmarks,
        memberSince: user?.createdAt.toISOString()
      }
    };
  } catch (error) {
    console.error("Get stats error:", error);
    return { success: false, message: "Failed to fetch stats" };
  }
};
var memberService = {
  getDashboardData,
  getStats
};

// src/modules/dashboard/member/member.controller.ts
var getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await memberService.getDashboardData(userId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getStats2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await memberService.getStats(userId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var memberController = {
  getDashboard,
  getStats: getStats2
};

// src/modules/dashboard/member/member.route.ts
var router2 = express2.Router();
router2.use(auth_default(Role.MEMBER));
router2.get("/dashboard", memberController.getDashboard);
router2.get("/stats", memberController.getStats);
var memberRouter = router2;

// src/modules/dashboard/admin/admin.route.ts
import express3 from "express";

// src/helpers/bigintHelper.ts
var toNumber = (value) => {
  return typeof value === "bigint" ? Number(value) : value;
};
var convertBigIntInObject = (obj) => {
  if (obj === null || obj === void 0) return obj;
  if (typeof obj === "bigint") return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigIntInObject);
  if (typeof obj === "object") {
    const result = {};
    for (const key in obj) {
      result[key] = convertBigIntInObject(obj[key]);
    }
    return result;
  }
  return obj;
};

// src/modules/dashboard/admin/admin.service.ts
var getDashboardData2 = async () => {
  try {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalIdeas,
      pendingIdeas,
      approvedIdeas,
      rejectedIdeas,
      totalVotes,
      totalComments,
      totalBookmarks
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { accountStatus: "ACTIVE" } }),
      prisma.user.count({ where: { accountStatus: "SUSPENDED" } }),
      prisma.idea.count(),
      prisma.idea.count({ where: { status: "PENDING" } }),
      prisma.idea.count({ where: { status: "APPROVED" } }),
      prisma.idea.count({ where: { status: "REJECTED" } }),
      prisma.vote.count(),
      prisma.comment.count({ where: { isDeleted: false } }),
      prisma.bookmark.count()
    ]);
    const pendingIdeasList = await prisma.idea.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true }
        },
        categories: {
          include: {
            category: { select: { id: true, name: true } }
          }
        }
      }
    });
    const recentIdeas = await prisma.idea.findMany({
      where: { status: { in: ["PENDING", "APPROVED", "REJECTED"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { author: { select: { name: true } } }
    });
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    });
    const recentComments = await prisma.comment.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { user: { select: { name: true } }, idea: { select: { title: true } } }
    });
    const activities = [
      ...recentIdeas.map((idea) => ({
        id: `idea-${idea.id}`,
        type: idea.status === "PENDING" ? "SUBMIT_IDEA" : idea.status === "APPROVED" ? "APPROVE_IDEA" : "REJECT_IDEA",
        message: idea.status === "PENDING" ? `New idea submitted: "${idea.title}" by ${idea.author.name}` : idea.status === "APPROVED" ? `Idea "${idea.title}" was approved` : `Idea "${idea.title}" was rejected`,
        userId: idea.authorId,
        userName: idea.author.name,
        ideaId: idea.id,
        ideaTitle: idea.title,
        createdAt: idea.createdAt
      })),
      ...recentUsers.map((user) => ({
        id: `user-${user.id}`,
        type: "USER_REGISTER",
        message: `New user registered: ${user.name} (${user.email})`,
        userId: user.id,
        userName: user.name,
        createdAt: user.createdAt
      })),
      ...recentComments.map((comment) => ({
        id: `comment-${comment.id}`,
        type: "NEW_COMMENT",
        message: `New comment on "${comment.idea.title}" by ${comment.user.name}`,
        userId: comment.userId,
        userName: comment.user.name,
        ideaId: comment.ideaId,
        ideaTitle: comment.idea.title,
        createdAt: comment.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
    const topContributors = await prisma.user.findMany({
      where: { role: "MEMBER" },
      take: 5,
      include: {
        ideas: {
          where: { status: "APPROVED" },
          select: {
            voteScore: true
          }
        },
        comments: {
          where: { isDeleted: false },
          select: { id: true }
        }
      },
      orderBy: {
        ideas: {
          _count: "desc"
        }
      }
    });
    const contributors = topContributors.map((user) => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      approvedIdeas: user.ideas.length,
      upvotesReceived: user.ideas.reduce((sum, idea) => sum + (idea.voteScore > 0 ? idea.voteScore : 0), 0),
      totalComments: user.comments.length
    }));
    const recentUsersList = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        accountStatus: true,
        createdAt: true
      }
    });
    const reportedCommentsCount = await prisma.commentReport.count({
      where: { status: "PENDING" }
    });
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = /* @__PURE__ */ new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];
      return dateString ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0] ?? "unknown";
    }).reverse();
    const ideasOverTime = await Promise.all(
      last30Days.map(async (dateStr) => {
        if (!dateStr) {
          return { date: dateStr || "unknown", count: 0 };
        }
        const start = new Date(dateStr);
        if (isNaN(start.getTime())) {
          return { date: dateStr, count: 0 };
        }
        const end = new Date(dateStr);
        end.setDate(end.getDate() + 1);
        const count = await prisma.idea.count({
          where: {
            createdAt: { gte: start, lt: end }
          }
        });
        return { date: dateStr, count: toNumber(count) };
      })
    );
    const usersOverTime = await Promise.all(
      last30Days.slice(-7).map(async (dateStr) => {
        if (!dateStr) {
          return { date: dateStr || "unknown", count: 0 };
        }
        const start = new Date(dateStr);
        if (isNaN(start.getTime())) {
          return { date: dateStr, count: 0 };
        }
        const end = new Date(dateStr);
        end.setDate(end.getDate() + 1);
        const count = await prisma.user.count({
          where: {
            createdAt: { gte: start, lt: end }
          }
        });
        return { date: dateStr, count: toNumber(count) };
      })
    );
    const ideasByCategory = await prisma.$queryRaw`
            SELECT c.id as "categoryId", c.name as "categoryName", COUNT(ic."ideaId") as count
            FROM categories c
            LEFT JOIN idea_categories ic ON c.id = ic."categoryId"
            GROUP BY c.id, c.name
            ORDER BY count DESC
        `;
    const ideasByStatus = await prisma.idea.groupBy({
      by: ["status"],
      _count: { status: true }
    });
    return {
      success: true,
      data: {
        stats: {
          totalUsers: toNumber(totalUsers),
          activeUsers: toNumber(activeUsers),
          suspendedUsers: toNumber(suspendedUsers),
          totalIdeas: toNumber(totalIdeas),
          pendingIdeas: toNumber(pendingIdeas),
          approvedIdeas: toNumber(approvedIdeas),
          rejectedIdeas: toNumber(rejectedIdeas),
          totalVotes: toNumber(totalVotes),
          totalComments: toNumber(totalComments),
          totalBookmarks: toNumber(totalBookmarks)
        },
        pendingIdeas: pendingIdeasList.map((idea) => ({
          id: idea.id,
          title: idea.title,
          problemStatement: idea.problemStatement,
          author: idea.author,
          category: idea.categories[0]?.category || { id: "", name: "Uncategorized" },
          createdAt: idea.createdAt,
          voteScore: toNumber(idea.voteScore)
        })),
        recentActivity: activities,
        topContributors: contributors,
        recentUsers: recentUsersList,
        reportedCommentsCount: toNumber(reportedCommentsCount),
        chartData: {
          ideasOverTime,
          usersOverTime,
          ideasByCategory: convertBigIntInObject(ideasByCategory),
          ideasByStatus: ideasByStatus.map((item) => ({
            status: item.status,
            count: toNumber(item._count.status)
          }))
        }
      }
    };
  } catch (error) {
    console.error("Get dashboard data error:", error);
    return { success: false, message: "Failed to fetch dashboard data" };
  }
};
var getStats3 = async () => {
  try {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalIdeas,
      pendingIdeas,
      approvedIdeas,
      rejectedIdeas,
      totalVotes,
      totalComments,
      totalBookmarks
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { accountStatus: "ACTIVE" } }),
      prisma.user.count({ where: { accountStatus: "SUSPENDED" } }),
      prisma.idea.count(),
      prisma.idea.count({ where: { status: "PENDING" } }),
      prisma.idea.count({ where: { status: "APPROVED" } }),
      prisma.idea.count({ where: { status: "REJECTED" } }),
      prisma.vote.count(),
      prisma.comment.count({ where: { isDeleted: false } }),
      prisma.bookmark.count()
    ]);
    return {
      success: true,
      data: {
        totalUsers: toNumber(totalUsers),
        activeUsers: toNumber(activeUsers),
        suspendedUsers: toNumber(suspendedUsers),
        totalIdeas: toNumber(totalIdeas),
        pendingIdeas: toNumber(pendingIdeas),
        approvedIdeas: toNumber(approvedIdeas),
        rejectedIdeas: toNumber(rejectedIdeas),
        totalVotes: toNumber(totalVotes),
        totalComments: toNumber(totalComments),
        totalBookmarks: toNumber(totalBookmarks)
      }
    };
  } catch (error) {
    console.error("Get stats error:", error);
    return { success: false, message: "Failed to fetch stats" };
  }
};
var getRecentActivity = async (limit) => {
  try {
    const recentIdeas = await prisma.idea.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { author: { select: { name: true } } }
    });
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: limit
    });
    const recentComments = await prisma.comment.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { name: true } }, idea: { select: { title: true } } }
    });
    const activities = [
      ...recentIdeas.map((idea) => ({
        id: `idea-${idea.id}`,
        type: idea.status === "PENDING" ? "SUBMIT_IDEA" : idea.status === "APPROVED" ? "APPROVE_IDEA" : "REJECT_IDEA",
        message: idea.status === "PENDING" ? `New idea submitted: "${idea.title}" by ${idea.author.name}` : idea.status === "APPROVED" ? `Idea "${idea.title}" was approved` : `Idea "${idea.title}" was rejected`,
        userId: idea.authorId,
        userName: idea.author.name,
        ideaId: idea.id,
        ideaTitle: idea.title,
        createdAt: idea.createdAt
      })),
      ...recentUsers.map((user) => ({
        id: `user-${user.id}`,
        type: "USER_REGISTER",
        message: `New user registered: ${user.name} (${user.email})`,
        userId: user.id,
        userName: user.name,
        createdAt: user.createdAt
      })),
      ...recentComments.map((comment) => ({
        id: `comment-${comment.id}`,
        type: "NEW_COMMENT",
        message: `New comment on "${comment.idea.title}" by ${comment.user.name}`,
        userId: comment.userId,
        userName: comment.user.name,
        ideaId: comment.ideaId,
        ideaTitle: comment.idea.title,
        createdAt: comment.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
    return { success: true, data: activities };
  } catch (error) {
    console.error("Get recent activity error:", error);
    return { success: false, message: "Failed to fetch recent activity" };
  }
};
var adminService = {
  getDashboardData: getDashboardData2,
  getStats: getStats3,
  getRecentActivity
};

// src/modules/dashboard/admin/admin.controller.ts
var getDashboard2 = async (req, res, next) => {
  try {
    const result = await adminService.getDashboardData();
    if (!result.success) {
      return res.status(400).json(result);
    }
    const response = {
      success: true,
      data: result.data
    };
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
var getStats4 = async (req, res, next) => {
  try {
    const result = await adminService.getStats();
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getRecentActivity2 = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await adminService.getRecentActivity(limit);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var adminController = {
  getDashboard: getDashboard2,
  getStats: getStats4,
  getRecentActivity: getRecentActivity2
};

// src/modules/dashboard/admin/admin.route.ts
var router3 = express3.Router();
router3.use(auth_default(Role.ADMIN));
router3.get("/dashboard", adminController.getDashboard);
router3.get("/stats", adminController.getStats);
router3.get("/activity/recent", adminController.getRecentActivity);
var adminRouter = router3;

// src/modules/category/category.route.ts
import express4 from "express";

// src/modules/category/category.service.ts
var getCategories = async (params) => {
  try {
    const { page, limit, search, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }
    let orderBy = {};
    if (sortBy === "name") {
      orderBy = { name: sortOrder };
    } else if (sortBy === "createdAt") {
      orderBy = { createdAt: sortOrder };
    } else {
      orderBy = { name: "asc" };
    }
    const categories = await prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        ideas: {
          select: { ideaId: true }
        }
      }
    });
    const totalItems = await prisma.category.count({ where });
    let categoriesWithCount = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      ideasCount: cat.ideas.length,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt
    }));
    if (sortBy === "ideasCount") {
      categoriesWithCount.sort((a, b) => {
        if (sortOrder === "asc") {
          return a.ideasCount - b.ideasCount;
        } else {
          return b.ideasCount - a.ideasCount;
        }
      });
    }
    return {
      success: true,
      data: {
        categories: categoriesWithCount,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          itemsPerPage: limit
        }
      }
    };
  } catch (error) {
    console.error("Get categories error:", error);
    return { success: false, message: "Failed to fetch categories" };
  }
};
var getAllCategories = async () => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        ideas: {
          select: { ideaId: true }
        }
      }
    });
    const categoriesWithCount = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      ideasCount: cat.ideas.length,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt
    }));
    return {
      success: true,
      data: categoriesWithCount
    };
  } catch (error) {
    console.error("Get all categories error:", error);
    return { success: false, message: "Failed to fetch categories" };
  }
};
var getCategoryById = async (id) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        ideas: {
          select: { ideaId: true }
        }
      }
    });
    if (!category) {
      return { success: false, message: "Category not found" };
    }
    return {
      success: true,
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        ideasCount: category.ideas.length,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    };
  } catch (error) {
    console.error("Get category by ID error:", error);
    return { success: false, message: "Failed to fetch category" };
  }
};
var getCategoryBySlug = async (slug) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        ideas: {
          select: { ideaId: true }
        }
      }
    });
    if (!category) {
      return { success: false, message: "Category not found" };
    }
    return {
      success: true,
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        ideasCount: category.ideas.length,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    };
  } catch (error) {
    console.error("Get category by slug error:", error);
    return { success: false, message: "Failed to fetch category" };
  }
};
var getCategoryCounts = async () => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        slug: true,
        ideas: {
          select: { ideaId: true }
        }
      }
    });
    const counts = categories.map((cat) => ({
      slug: cat.slug,
      count: cat.ideas.length
    }));
    return {
      success: true,
      data: counts
    };
  } catch (error) {
    console.error("Get category counts error:", error);
    return { success: false, message: "Failed to fetch category counts" };
  }
};
var createCategory = async (data) => {
  try {
    const existingByName = await prisma.category.findUnique({
      where: { name: data.name }
    });
    if (existingByName) {
      return { success: false, message: "Category with this name already exists" };
    }
    const existingBySlug = await prisma.category.findUnique({
      where: { slug: data.slug }
    });
    if (existingBySlug) {
      return { success: false, message: "Category with this slug already exists" };
    }
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        imageUrl: data.imageUrl ?? null
      }
    });
    return {
      success: true,
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        ideasCount: 0,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    };
  } catch (error) {
    console.error("Create category error:", error);
    return { success: false, message: "Failed to create category" };
  }
};
var updateCategory = async (id, data) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id }
    });
    if (!category) {
      return { success: false, message: "Category not found" };
    }
    if (data.name && data.name !== category.name) {
      const existingByName = await prisma.category.findUnique({
        where: { name: data.name }
      });
      if (existingByName) {
        return { success: false, message: "Category with this name already exists" };
      }
    }
    if (data.slug && data.slug !== category.slug) {
      const existingBySlug = await prisma.category.findUnique({
        where: { slug: data.slug }
      });
      if (existingBySlug) {
        return { success: false, message: "Category with this slug already exists" };
      }
    }
    const updateData = {};
    if (data.name !== void 0) {
      updateData.name = data.name;
    }
    if (data.slug !== void 0) {
      updateData.slug = data.slug;
    }
    if (data.description !== void 0) {
      updateData.description = data.description ?? null;
    }
    if (data.imageUrl !== void 0) {
      updateData.imageUrl = data.imageUrl ?? null;
    }
    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        ideas: {
          select: { ideaId: true }
        }
      }
    });
    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        imageUrl: updated.imageUrl,
        ideasCount: updated.ideas.length,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      }
    };
  } catch (error) {
    console.error("Update category error:", error);
    return { success: false, message: "Failed to update category" };
  }
};
var deleteCategory = async (id) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        ideas: {
          select: { ideaId: true }
        }
      }
    });
    if (!category) {
      return { success: false, message: "Category not found" };
    }
    const ideasCount = category.ideas.length;
    await prisma.category.delete({
      where: { id }
    });
    return {
      success: true,
      message: "Category deleted successfully",
      hasIdeas: ideasCount > 0,
      ideasCount
    };
  } catch (error) {
    console.error("Delete category error:", error);
    return { success: false, message: "Failed to delete category" };
  }
};
var checkSlug = async (slug, excludeId) => {
  try {
    const where = { slug };
    const existing = await prisma.category.findUnique({
      where
    });
    if (!existing) {
      return { available: true };
    }
    if (excludeId && existing.id === excludeId) {
      return { available: true };
    }
    const suggestions = [
      `${slug}-1`,
      `${slug}-2`,
      `${slug}-new`,
      `${slug}-alt`
    ];
    return {
      available: false,
      suggestions
    };
  } catch (error) {
    console.error("Check slug error:", error);
    return { available: false };
  }
};
var categoryService = {
  getCategories,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  getCategoryCounts,
  createCategory,
  updateCategory,
  deleteCategory,
  checkSlug
};

// src/modules/category/category.controller.ts
var getCategories2 = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const sortBy = req.query.sortBy || "name";
    const sortOrder = req.query.sortOrder || "asc";
    const result = await categoryService.getCategories({
      page,
      limit,
      search,
      sortBy,
      sortOrder
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getAllCategories2 = async (req, res, next) => {
  try {
    const result = await categoryService.getAllCategories();
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getCategoryById2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await categoryService.getCategoryById(id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getCategoryBySlug2 = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const result = await categoryService.getCategoryBySlug(slug);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getCategoryCounts2 = async (req, res, next) => {
  try {
    const result = await categoryService.getCategoryCounts();
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var createCategory2 = async (req, res, next) => {
  try {
    const { name, slug, description, imageUrl } = req.body;
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Name and slug are required"
      });
    }
    const result = await categoryService.createCategory({
      name,
      slug,
      description,
      imageUrl
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(201).json({
      success: true,
      data: result.data,
      message: "Category created successfully"
    });
  } catch (error) {
    next(error);
  }
};
var updateCategory2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }
    const { name, slug, description, imageUrl } = req.body;
    const result = await categoryService.updateCategory(id, {
      name,
      slug,
      description,
      imageUrl
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data,
      message: "Category updated successfully"
    });
  } catch (error) {
    next(error);
  }
};
var deleteCategory2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }
    const result = await categoryService.deleteCategory(id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var checkSlug2 = async (req, res, next) => {
  try {
    const { slug, excludeId } = req.query;
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required"
      });
    }
    const result = await categoryService.checkSlug(slug, excludeId);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var categoryController = {
  getCategories: getCategories2,
  getAllCategories: getAllCategories2,
  getCategoryById: getCategoryById2,
  getCategoryBySlug: getCategoryBySlug2,
  getCategoryCounts: getCategoryCounts2,
  createCategory: createCategory2,
  updateCategory: updateCategory2,
  deleteCategory: deleteCategory2,
  checkSlug: checkSlug2
};

// src/modules/category/category.route.ts
var router4 = express4.Router();
router4.post(
  "/",
  auth_default(Role.ADMIN),
  categoryController.createCategory
);
router4.get(
  "/check-slug",
  auth_default(Role.ADMIN),
  categoryController.checkSlug
);
router4.patch(
  "/:id",
  auth_default(Role.ADMIN),
  categoryController.updateCategory
);
router4.delete(
  "/:id",
  auth_default(Role.ADMIN),
  categoryController.deleteCategory
);
router4.get("/", categoryController.getCategories);
router4.get("/all", categoryController.getAllCategories);
router4.get("/counts", categoryController.getCategoryCounts);
router4.get("/:id", categoryController.getCategoryById);
router4.get("/slug/:slug", categoryController.getCategoryBySlug);
var categoryRouter = router4;

// src/modules/ideas/ideas.route.ts
import express5 from "express";

// src/modules/ideas/services/public-ideas.service.ts
var getIdeas = async (params) => {
  try {
    const { page, limit, search, category, status, sortBy } = params;
    const skip = (page - 1) * limit;
    const where = {};
    if (!status) {
      where.status = "APPROVED";
    } else if (status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { problemStatement: { contains: search, mode: "insensitive" } }
      ];
    }
    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category
          }
        }
      };
    }
    let orderBy = {};
    switch (sortBy) {
      case "topVoted":
        orderBy = { voteScore: "desc" };
        break;
      case "mostViewed":
        orderBy = { viewCount: "desc" };
        break;
      case "recent":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }
    const ideas = await prisma.idea.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    const totalItems = await prisma.idea.count({ where });
    const transformedIdeas = ideas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      problemStatement: idea.problemStatement,
      solution: idea.solution,
      description: idea.description,
      imageUrl: idea.imageUrl,
      status: idea.status,
      isPaid: idea.isPaid,
      price: idea.price,
      voteScore: idea.voteScore,
      viewCount: idea.viewCount,
      commentCount: idea.commentCount,
      author: idea.author,
      categories: idea.categories.map((c) => ({
        id: c.category.id,
        name: c.category.name,
        slug: c.category.slug
      })),
      createdAt: idea.createdAt,
      updatedAt: idea.updatedAt
    }));
    return {
      success: true,
      data: {
        ideas: transformedIdeas,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          itemsPerPage: limit
        }
      }
    };
  } catch (error) {
    console.error("Get ideas error:", error);
    return { success: false, message: "Failed to fetch ideas" };
  }
};
var getFeaturedIdeas = async (limit) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { status: "APPROVED" },
      orderBy: { voteScore: "desc" },
      take: limit,
      include: {
        author: {
          select: { id: true, name: true, image: true }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    const transformedIdeas = ideas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      imageUrl: idea.imageUrl,
      voteScore: idea.voteScore,
      viewCount: idea.viewCount,
      isPaid: idea.isPaid,
      author: idea.author,
      categories: idea.categories.map((c) => ({
        id: c.category.id,
        name: c.category.name,
        slug: c.category.slug
      })) || [],
      createdAt: idea.createdAt
    }));
    return { success: true, data: transformedIdeas };
  } catch (error) {
    console.error("Get featured ideas error:", error);
    return { success: false, message: "Failed to fetch featured ideas" };
  }
};
var getTopVotedIdeas = async (limit) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { status: "APPROVED" },
      orderBy: { voteScore: "desc" },
      take: limit,
      include: {
        author: {
          select: { id: true, name: true, image: true }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    const transformedIdeas = ideas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      imageUrl: idea.imageUrl,
      voteScore: idea.voteScore,
      author: idea.author,
      category: idea.categories[0]?.category,
      createdAt: idea.createdAt
    }));
    return { success: true, data: transformedIdeas };
  } catch (error) {
    console.error("Get top voted ideas error:", error);
    return { success: false, message: "Failed to fetch top voted ideas" };
  }
};
var getRecentIdeas = async (limit) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        author: {
          select: { id: true, name: true, image: true }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    const transformedIdeas = ideas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      imageUrl: idea.imageUrl,
      voteScore: idea.voteScore,
      author: idea.author,
      category: idea.categories[0]?.category,
      createdAt: idea.createdAt
    }));
    return { success: true, data: transformedIdeas };
  } catch (error) {
    console.error("Get recent ideas error:", error);
    return { success: false, message: "Failed to fetch recent ideas" };
  }
};
var getIdeaById = async (id, userId) => {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true
          }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    if (!idea) {
      return { success: false, message: "Idea not found" };
    }
    let hasFullAccess = false;
    if (idea.isPaid && idea.status === "APPROVED") {
      if (userId) {
        const payment = await prisma.payment.findFirst({
          where: {
            userId,
            ideaId: id,
            status: PaymentStatus.COMPLETED
          }
        });
        hasFullAccess = !!payment;
      }
    } else {
      hasFullAccess = true;
    }
    await prisma.idea.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });
    const baseData = {
      id: idea.id,
      title: idea.title,
      imageUrl: idea.imageUrl,
      status: idea.status,
      isPaid: idea.isPaid,
      price: idea.price,
      voteScore: idea.voteScore,
      viewCount: idea.viewCount + 1,
      commentCount: idea.commentCount,
      author: idea.author,
      categories: idea.categories.map((c) => ({
        id: c.category.id,
        name: c.category.name,
        slug: c.category.slug
      })),
      createdAt: idea.createdAt,
      updatedAt: idea.updatedAt
    };
    if (hasFullAccess) {
      return {
        success: true,
        data: {
          ...baseData,
          problemStatement: idea.problemStatement,
          solution: idea.solution,
          description: idea.description,
          feedback: idea.feedback,
          hasFullAccess: true
        }
      };
    } else {
      return {
        success: true,
        data: {
          ...baseData,
          problemStatement: idea.problemStatement,
          // Show this as preview
          solution: "Purchase this idea to see the complete solution.",
          description: "Purchase this idea to see the complete description.",
          feedback: idea.feedback,
          hasFullAccess: false,
          requiresPayment: true
        }
      };
    }
  } catch (error) {
    console.error("Get idea by ID error:", error);
    return { success: false, message: "Failed to fetch idea" };
  }
};
var getIdeaBySlug = async (slug) => {
  try {
    const idea = await prisma.idea.findFirst({
      where: {
        title: {
          mode: "insensitive",
          equals: slug.replace(/-/g, " ")
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    if (!idea) {
      return { success: false, message: "Idea not found" };
    }
    return {
      success: true,
      data: {
        id: idea.id,
        title: idea.title,
        problemStatement: idea.problemStatement,
        solution: idea.solution,
        description: idea.description,
        imageUrl: idea.imageUrl,
        status: idea.status,
        isPaid: idea.isPaid,
        price: idea.price,
        voteScore: idea.voteScore,
        viewCount: idea.viewCount,
        author: idea.author,
        categories: idea.categories.map((c) => ({
          id: c.category.id,
          name: c.category.name,
          slug: c.category.slug
        })),
        createdAt: idea.createdAt,
        updatedAt: idea.updatedAt
      }
    };
  } catch (error) {
    console.error("Get idea by slug error:", error);
    return { success: false, message: "Failed to fetch idea" };
  }
};
var publicIdeasService = {
  getIdeas,
  getFeaturedIdeas,
  getTopVotedIdeas,
  getRecentIdeas,
  getIdeaById,
  getIdeaBySlug
};

// src/modules/ideas/controllers/public-ideas.controller.ts
var getIdeas2 = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search;
    const category = req.query.category;
    const status = req.query.status;
    const sortBy = req.query.sortBy || "recent";
    const result = await publicIdeasService.getIdeas({
      page,
      limit,
      search,
      category,
      status,
      sortBy
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getFeaturedIdeas2 = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const result = await publicIdeasService.getFeaturedIdeas(limit);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getTopVotedIdeas2 = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const result = await publicIdeasService.getTopVotedIdeas(limit);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getRecentIdeas2 = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const result = await publicIdeasService.getRecentIdeas(limit);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getIdeaById2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid idea ID"
      });
    }
    const result = await publicIdeasService.getIdeaById(id, userId);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getIdeaBySlug2 = async (req, res, next) => {
  try {
    const { slug } = req.params;
    if (!slug || typeof slug !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid idea slug"
      });
    }
    const result = await publicIdeasService.getIdeaBySlug(slug);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var publicIdeasController = {
  getIdeas: getIdeas2,
  getFeaturedIdeas: getFeaturedIdeas2,
  getTopVotedIdeas: getTopVotedIdeas2,
  getRecentIdeas: getRecentIdeas2,
  getIdeaById: getIdeaById2,
  getIdeaBySlug: getIdeaBySlug2
};

// src/modules/ideas/services/member-ideas.service.ts
var getMemberIdeas = async (userId, params) => {
  try {
    const { page, limit, search, status, sortBy } = params;
    const skip = (page - 1) * limit;
    const where = {
      authorId: userId
    };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }
    if (status && status !== "all") {
      where.status = status;
    }
    let orderBy = {};
    switch (sortBy) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "title_asc":
        orderBy = { title: "asc" };
        break;
      case "title_desc":
        orderBy = { title: "desc" };
        break;
      case "votes":
        orderBy = { voteScore: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }
    const ideas = await prisma.idea.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    const totalItems = await prisma.idea.count({ where });
    const stats = await prisma.$transaction([
      prisma.idea.count({ where: { authorId: userId } }),
      prisma.idea.count({ where: { authorId: userId, status: "DRAFT" } }),
      prisma.idea.count({ where: { authorId: userId, status: "PENDING" } }),
      prisma.idea.count({ where: { authorId: userId, status: "APPROVED" } }),
      prisma.idea.count({ where: { authorId: userId, status: "REJECTED" } })
    ]);
    const ideasWithComments = await Promise.all(
      ideas.map(async (idea) => {
        const commentCount = await prisma.comment.count({
          where: { ideaId: idea.id, isDeleted: false }
        });
        return {
          id: idea.id,
          title: idea.title,
          problemStatement: idea.problemStatement,
          solution: idea.solution,
          description: idea.description,
          imageUrl: idea.imageUrl,
          status: idea.status,
          isPaid: idea.isPaid,
          price: idea.price,
          feedback: idea.feedback,
          voteScore: idea.voteScore,
          viewCount: idea.viewCount,
          commentCount,
          category: idea.categories[0]?.category || { id: "", name: "Uncategorized" },
          createdAt: idea.createdAt,
          updatedAt: idea.updatedAt
        };
      })
    );
    return {
      success: true,
      data: {
        ideas: ideasWithComments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          itemsPerPage: limit
        },
        stats: {
          total: stats[0],
          draft: stats[1],
          pending: stats[2],
          approved: stats[3],
          rejected: stats[4]
        }
      }
    };
  } catch (error) {
    console.error("Get member ideas error:", error);
    return { success: false, message: "Failed to fetch ideas" };
  }
};
var getRecentIdeas3 = async (userId, limit) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        status: true,
        voteScore: true,
        viewCount: true,
        commentCount: true,
        createdAt: true
      }
    });
    return { success: true, data: ideas };
  } catch (error) {
    console.error("Get recent ideas error:", error);
    return { success: false, message: "Failed to fetch recent ideas" };
  }
};
var createIdea = async (userId, data) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId }
    });
    if (!category) {
      return { success: false, message: "Category not found" };
    }
    const idea = await prisma.idea.create({
      data: {
        title: data.title,
        problemStatement: data.problemStatement,
        solution: data.solution,
        description: data.description,
        imageUrl: data.imageUrl || null,
        status: data.status || "DRAFT",
        isPaid: data.isPaid,
        price: data.price,
        authorId: userId,
        categories: {
          create: {
            categoryId: data.categoryId
          }
        }
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    return {
      success: true,
      data: {
        id: idea.id,
        title: idea.title,
        problemStatement: idea.problemStatement,
        solution: idea.solution,
        description: idea.description,
        imageUrl: idea.imageUrl,
        status: idea.status,
        isPaid: idea.isPaid,
        price: idea.price,
        voteScore: idea.voteScore,
        viewCount: idea.viewCount,
        commentCount: idea.commentCount,
        author: idea.author,
        category: {
          id: idea.categories[0]?.category.id,
          name: idea.categories[0]?.category.name
        },
        createdAt: idea.createdAt,
        updatedAt: idea.updatedAt
      }
    };
  } catch (error) {
    console.error("Create idea error:", error);
    return { success: false, message: "Failed to create idea" };
  }
};
var updateIdea = async (id, userId, data) => {
  try {
    const idea = await prisma.idea.findFirst({
      where: { id, authorId: userId },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    if (!idea) {
      return { success: false, message: "Idea not found or unauthorized" };
    }
    if (idea.status !== "DRAFT" && idea.status !== "REJECTED") {
      return { success: false, message: "Only draft or rejected ideas can be edited" };
    }
    if (data.categoryId) {
      const currentCategoryId = idea.categories[0]?.categoryId;
      if (data.categoryId !== currentCategoryId) {
        await prisma.ideaCategory.deleteMany({
          where: { ideaId: id }
        });
        await prisma.ideaCategory.create({
          data: {
            ideaId: id,
            categoryId: data.categoryId
          }
        });
      }
      delete data.categoryId;
    }
    const updateData = {};
    if (data.title !== void 0) updateData.title = data.title;
    if (data.problemStatement !== void 0) updateData.problemStatement = data.problemStatement;
    if (data.solution !== void 0) updateData.solution = data.solution;
    if (data.description !== void 0) updateData.description = data.description;
    if (data.imageUrl !== void 0) updateData.imageUrl = data.imageUrl;
    if (data.isPaid !== void 0) updateData.isPaid = data.isPaid;
    if (data.price !== void 0) updateData.price = data.price;
    if (Object.keys(updateData).length > 0) {
      await prisma.idea.update({
        where: { id },
        data: updateData
      });
    }
    const updatedIdea = await prisma.idea.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    return {
      success: true,
      data: {
        id: updatedIdea.id,
        title: updatedIdea.title,
        problemStatement: updatedIdea.problemStatement,
        solution: updatedIdea.solution,
        description: updatedIdea.description,
        imageUrl: updatedIdea.imageUrl,
        status: updatedIdea.status,
        isPaid: updatedIdea.isPaid,
        price: updatedIdea.price,
        voteScore: updatedIdea.voteScore,
        viewCount: updatedIdea.viewCount,
        commentCount: updatedIdea.commentCount,
        author: updatedIdea.author,
        category: updatedIdea.categories[0]?.category,
        createdAt: updatedIdea.createdAt,
        updatedAt: updatedIdea.updatedAt
      }
    };
  } catch (error) {
    console.error("Update idea error:", error);
    return { success: false, message: "Failed to update idea" };
  }
};
var deleteIdea = async (id, userId) => {
  try {
    const idea = await prisma.idea.findFirst({
      where: { id, authorId: userId }
    });
    if (!idea) {
      return { success: false, message: "Idea not found or unauthorized" };
    }
    if (idea.status !== "DRAFT" && idea.status !== "REJECTED") {
      return { success: false, message: "Only draft or rejected ideas can be deleted" };
    }
    await prisma.idea.delete({ where: { id } });
    return { success: true, message: "Idea deleted successfully" };
  } catch (error) {
    console.error("Delete idea error:", error);
    return { success: false, message: "Failed to delete idea" };
  }
};
var submitIdea = async (id, userId) => {
  try {
    const idea = await prisma.idea.findFirst({
      where: { id, authorId: userId }
    });
    if (!idea) {
      return { success: false, message: "Idea not found or unauthorized" };
    }
    if (idea.status !== "DRAFT") {
      return { success: false, message: "Only draft ideas can be submitted for review" };
    }
    await prisma.idea.update({
      where: { id },
      data: { status: "PENDING" }
    });
    return { success: true, message: "Idea submitted for review successfully" };
  } catch (error) {
    console.error("Submit idea error:", error);
    return { success: false, message: "Failed to submit idea" };
  }
};
var memberIdeasService = {
  getMemberIdeas,
  getRecentIdeas: getRecentIdeas3,
  createIdea,
  updateIdea,
  deleteIdea,
  submitIdea
};

// src/modules/ideas/services/admin-ideas.service.ts
var getAdminIdeas = async (params) => {
  try {
    const { page, limit, search, category, status, sortBy } = params;
    const skip = (page - 1) * limit;
    const where = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { problemStatement: { contains: search, mode: "insensitive" } },
        { author: { name: { contains: search, mode: "insensitive" } } }
      ];
    }
    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category
          }
        }
      };
    }
    if (status && status !== "all") {
      where.status = status;
    }
    let orderBy = {};
    switch (sortBy) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "votes":
        orderBy = { voteScore: "desc" };
        break;
      case "views":
        orderBy = { viewCount: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }
    const ideas = await prisma.idea.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    const totalItems = await prisma.idea.count({ where });
    const stats = await prisma.$transaction([
      prisma.idea.count(),
      prisma.idea.count({ where: { status: "DRAFT" } }),
      prisma.idea.count({ where: { status: "PENDING" } }),
      prisma.idea.count({ where: { status: "APPROVED" } }),
      prisma.idea.count({ where: { status: "REJECTED" } })
    ]);
    const transformedIdeas = ideas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      problemStatement: idea.problemStatement,
      solution: idea.solution,
      description: idea.description,
      imageUrl: idea.imageUrl,
      status: idea.status,
      isPaid: idea.isPaid,
      price: idea.price,
      voteScore: idea.voteScore,
      viewCount: idea.viewCount,
      commentCount: idea.commentCount,
      author: idea.author,
      categories: idea.categories.map((c) => ({
        id: c.category.id,
        name: c.category.name,
        slug: c.category.slug
      })),
      createdAt: idea.createdAt,
      updatedAt: idea.updatedAt
    }));
    return {
      success: true,
      data: {
        ideas: transformedIdeas,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          itemsPerPage: limit
        },
        stats: {
          total: stats[0],
          draft: stats[1],
          pending: stats[2],
          approved: stats[3],
          rejected: stats[4]
        }
      }
    };
  } catch (error) {
    console.error("Get admin ideas error:", error);
    return { success: false, message: "Failed to fetch ideas" };
  }
};
var getPendingIdeas = async (limit) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true }
        },
        categories: {
          include: {
            category: { select: { id: true, name: true } }
          }
        }
      }
    });
    return {
      success: true,
      data: ideas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        problemStatement: idea.problemStatement,
        author: idea.author,
        category: idea.categories[0]?.category || { id: "", name: "Uncategorized" },
        createdAt: idea.createdAt,
        voteScore: idea.voteScore
      }))
    };
  } catch (error) {
    console.error("Get pending ideas error:", error);
    return { success: false, message: "Failed to fetch pending ideas" };
  }
};
var adminDeleteIdea = async (ideaId, adminId) => {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    if (!idea) {
      return { success: false, message: "Idea not found" };
    }
    await prisma.idea.delete({
      where: { id: ideaId }
    });
    return {
      success: true,
      message: `Idea "${idea.title}" has been deleted successfully`,
      data: {
        ideaId: idea.id,
        ideaTitle: idea.title,
        authorName: idea.author.name
      }
    };
  } catch (error) {
    console.error("Admin delete idea error:", error);
    return { success: false, message: "Failed to delete idea" };
  }
};
var approveIdea = async (id) => {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id }
    });
    if (!idea) {
      return { success: false, message: "Idea not found" };
    }
    if (idea.status !== "PENDING") {
      return { success: false, message: "Only pending ideas can be approved" };
    }
    await prisma.idea.update({
      where: { id },
      data: {
        status: "APPROVED",
        publishedAt: /* @__PURE__ */ new Date(),
        feedback: null
      }
    });
    return { success: true, message: "Idea approved successfully" };
  } catch (error) {
    console.error("Approve idea error:", error);
    return { success: false, message: "Failed to approve idea" };
  }
};
var rejectIdea = async (id, feedback) => {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id }
    });
    if (!idea) {
      return { success: false, message: "Idea not found" };
    }
    if (idea.status !== "PENDING") {
      return { success: false, message: "Only pending ideas can be rejected" };
    }
    await prisma.idea.update({
      where: { id },
      data: {
        status: "REJECTED",
        feedback,
        rejectedAt: /* @__PURE__ */ new Date()
      }
    });
    return { success: true, message: "Idea rejected successfully" };
  } catch (error) {
    console.error("Reject idea error:", error);
    return { success: false, message: "Failed to reject idea" };
  }
};
var featureIdea = async (id) => {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id }
    });
    if (!idea) {
      return { success: false, message: "Idea not found" };
    }
    return { success: true, message: "Idea featured status toggled" };
  } catch (error) {
    console.error("Feature idea error:", error);
    return { success: false, message: "Failed to feature idea" };
  }
};
var adminIdeasService = {
  getAdminIdeas,
  getPendingIdeas,
  adminDeleteIdea,
  approveIdea,
  rejectIdea,
  featureIdea
};

// src/modules/ideas/controllers/member-ideas.controller.ts
var getMemberIdeas2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const status = req.query.status;
    const sortBy = req.query.sortBy;
    const result = await memberIdeasService.getMemberIdeas(userId, {
      page,
      limit,
      search,
      status,
      sortBy
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getRecentIdeas4 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;
    const result = await memberIdeasService.getRecentIdeas(userId, limit);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var createIdea2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, problemStatement, solution, description, imageUrl, isPaid, price, categoryId, status } = req.body;
    if (!title || title.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Title must be at least 5 characters"
      });
    }
    if (!problemStatement || problemStatement.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Problem statement must be at least 20 characters"
      });
    }
    if (!solution || solution.length < 50) {
      return res.status(400).json({
        success: false,
        message: "Proposed solution must be at least 50 characters"
      });
    }
    if (!description || description.length < 100) {
      return res.status(400).json({
        success: false,
        message: "Description must be at least 100 characters"
      });
    }
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required"
      });
    }
    if (isPaid && (!price || price <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Valid price is required for paid ideas"
      });
    }
    const result = await memberIdeasService.createIdea(userId, {
      title,
      problemStatement,
      solution,
      description,
      imageUrl,
      isPaid: isPaid || false,
      price: isPaid ? price : null,
      categoryId,
      status
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(201).json({
      success: true,
      data: result.data,
      message: "Idea created successfully"
    });
  } catch (error) {
    next(error);
  }
};
var updateIdea2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, problemStatement, solution, description, imageUrl, isPaid, price, categoryId } = req.body;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid idea ID"
      });
    }
    const result = await memberIdeasService.updateIdea(id, userId, {
      title,
      problemStatement,
      solution,
      description,
      imageUrl,
      isPaid,
      price,
      categoryId
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data,
      message: "Idea updated successfully"
    });
  } catch (error) {
    next(error);
  }
};
var deleteIdea2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid idea ID"
      });
    }
    const result = await memberIdeasService.deleteIdea(id, userId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var submitIdea2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid idea ID"
      });
    }
    const result = await memberIdeasService.submitIdea(id, userId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var memberIdeasController = {
  getMemberIdeas: getMemberIdeas2,
  getRecentIdeas: getRecentIdeas4,
  createIdea: createIdea2,
  updateIdea: updateIdea2,
  deleteIdea: deleteIdea2,
  submitIdea: submitIdea2
};

// src/modules/ideas/controllers/admin-ideas.controller.ts
var getAdminIdeas2 = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const category = req.query.category;
    const status = req.query.status;
    const sortBy = req.query.sortBy || "newest";
    const result = await adminIdeasService.getAdminIdeas({
      page,
      limit,
      search,
      category,
      status,
      sortBy
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getPendingIdeas2 = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await adminIdeasService.getPendingIdeas(limit);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var adminDeleteIdea2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid idea ID"
      });
    }
    const result = await adminIdeasService.adminDeleteIdea(id, adminId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var approveIdea2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid idea ID"
      });
    }
    const result = await adminIdeasService.approveIdea(id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var rejectIdea2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid idea ID"
      });
    }
    if (!feedback) {
      return res.status(400).json({
        success: false,
        message: "Feedback is required for rejection"
      });
    }
    const result = await adminIdeasService.rejectIdea(id, feedback);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var featureIdea2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid idea ID"
      });
    }
    const result = await adminIdeasService.featureIdea(id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var adminIdeasController = {
  getAdminIdeas: getAdminIdeas2,
  getPendingIdeas: getPendingIdeas2,
  adminDeleteIdea: adminDeleteIdea2,
  approveIdea: approveIdea2,
  rejectIdea: rejectIdea2,
  featureIdea: featureIdea2
};

// src/modules/ideas/ideas.route.ts
var router5 = express5.Router();
router5.get("/admin/ideas", auth_default(Role.ADMIN), adminIdeasController.getAdminIdeas);
router5.get("/ideas/pending", auth_default(Role.ADMIN), adminIdeasController.getPendingIdeas);
router5.delete("/admin/:id", auth_default(Role.ADMIN), adminIdeasController.adminDeleteIdea);
router5.patch("/:id/approve", auth_default(Role.ADMIN), adminIdeasController.approveIdea);
router5.patch("/:id/reject", auth_default(Role.ADMIN), adminIdeasController.rejectIdea);
router5.patch("/:id/feature", auth_default(Role.ADMIN), adminIdeasController.featureIdea);
router5.get("/member/ideas", auth_default(Role.MEMBER), memberIdeasController.getMemberIdeas);
router5.get("/ideas/recent", auth_default(Role.MEMBER), memberIdeasController.getRecentIdeas);
router5.post("/", auth_default(Role.MEMBER), memberIdeasController.createIdea);
router5.patch("/member/:id", auth_default(Role.MEMBER), memberIdeasController.updateIdea);
router5.delete("/:id", auth_default(Role.MEMBER), memberIdeasController.deleteIdea);
router5.patch("/:id/submit", auth_default(Role.MEMBER), memberIdeasController.submitIdea);
router5.get("/", publicIdeasController.getIdeas);
router5.get("/featured", publicIdeasController.getFeaturedIdeas);
router5.get("/top-voted", publicIdeasController.getTopVotedIdeas);
router5.get("/recent", publicIdeasController.getRecentIdeas);
router5.get("/:id", publicIdeasController.getIdeaById);
router5.get("/slug/:slug", publicIdeasController.getIdeaBySlug);
var ideasRouter = router5;

// src/modules/stats/stats.route.ts
import express6 from "express";

// src/modules/stats/stats.service.ts
var getPlatformStats = async () => {
  try {
    const [totalIdeas, activeMembers, approvedIdeas, totalCategories] = await Promise.all([
      prisma.idea.count(),
      prisma.user.count({ where: { accountStatus: "ACTIVE" } }),
      prisma.idea.count({ where: { status: "APPROVED" } }),
      prisma.category.count()
    ]);
    return {
      success: true,
      data: {
        totalIdeas,
        activeMembers,
        approvedIdeas,
        totalCategories
      }
    };
  } catch (error) {
    console.error("Get platform stats error:", error);
    return { success: false, message: "Failed to fetch platform stats" };
  }
};
var statsService = {
  getPlatformStats
};

// src/modules/stats/stats.controller.ts
var getPlatformStats2 = async (req, res, next) => {
  try {
    const result = await statsService.getPlatformStats();
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var statsController = {
  getPlatformStats: getPlatformStats2
};

// src/modules/stats/stats.route.ts
var router6 = express6.Router();
router6.get("/platform", statsController.getPlatformStats);
var statsRouter = router6;

// src/modules/newsletter/newsletter.route.ts
import express7 from "express";

// src/modules/newsletter/newsletter.service.ts
var subscribe = async (email) => {
  try {
    const existing = await prisma.newsletter.findUnique({
      where: { email }
    });
    if (existing) {
      if (!existing.isSubscribed) {
        await prisma.newsletter.update({
          where: { email },
          data: {
            isSubscribed: true,
            unsubscribedAt: null
          }
        });
        return {
          success: true,
          message: "Successfully resubscribed to newsletter!"
        };
      }
      return {
        success: false,
        message: "This email is already subscribed to our newsletter."
      };
    }
    await prisma.newsletter.create({
      data: {
        email,
        isSubscribed: true,
        subscribedAt: /* @__PURE__ */ new Date()
      }
    });
    return {
      success: true,
      message: "Successfully subscribed to newsletter!"
    };
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return {
      success: false,
      message: "Failed to subscribe. Please try again later."
    };
  }
};
var unsubscribe = async (email) => {
  try {
    const existing = await prisma.newsletter.findUnique({
      where: { email }
    });
    if (!existing) {
      return {
        success: false,
        message: "Email not found in our newsletter list."
      };
    }
    await prisma.newsletter.update({
      where: { email },
      data: {
        isSubscribed: false,
        unsubscribedAt: /* @__PURE__ */ new Date()
      }
    });
    return {
      success: true,
      message: "Successfully unsubscribed from newsletter."
    };
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return {
      success: false,
      message: "Failed to unsubscribe. Please try again later."
    };
  }
};
var getAllSubscribers = async (params) => {
  try {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;
    const where = { isSubscribed: true };
    if (search) {
      where.email = { contains: search, mode: "insensitive" };
    }
    const subscribers = await prisma.newsletter.findMany({
      where,
      skip,
      take: limit,
      orderBy: { subscribedAt: "desc" }
    });
    const totalItems = await prisma.newsletter.count({ where });
    return {
      success: true,
      data: {
        subscribers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          itemsPerPage: limit
        }
      }
    };
  } catch (error) {
    console.error("Get subscribers error:", error);
    return {
      success: false,
      message: "Failed to fetch subscribers"
    };
  }
};
var exportSubscribersCSV = async () => {
  try {
    const subscribers = await prisma.newsletter.findMany({
      where: { isSubscribed: true },
      orderBy: { subscribedAt: "desc" }
    });
    const csvRows = [
      ["Email", "Subscribed At"],
      ...subscribers.map((sub) => [sub.email, sub.subscribedAt.toISOString()])
    ];
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    return {
      success: true,
      data: csvContent
    };
  } catch (error) {
    console.error("Export subscribers error:", error);
    return {
      success: false,
      message: "Failed to export subscribers"
    };
  }
};
var newsletterService = {
  subscribe,
  unsubscribe,
  getAllSubscribers,
  exportSubscribersCSV
};

// src/modules/newsletter/newsletter.controller.ts
var subscribe2 = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }
    const result = await newsletterService.subscribe(email);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var newsletterController = {
  subscribe: subscribe2
};

// src/modules/newsletter/newsletter.route.ts
var router7 = express7.Router();
router7.post("/subscribe", newsletterController.subscribe);
var newsletterRouter = router7;

// src/modules/bookmarks/bookmark.route.ts
import express8 from "express";

// src/modules/bookmarks/bookmark.service.ts
var addBookmark = async (userId, ideaId) => {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId }
    });
    if (!idea) {
      return { success: false, message: "Idea not found" };
    }
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_ideaId: {
          userId,
          ideaId
        }
      }
    });
    if (existing) {
      return { success: false, message: "Idea already bookmarked" };
    }
    await prisma.bookmark.create({
      data: {
        userId,
        ideaId
      }
    });
    return { success: true, message: "Bookmark added successfully" };
  } catch (error) {
    console.error("Add bookmark error:", error);
    return { success: false, message: "Failed to add bookmark" };
  }
};
var removeBookmark = async (userId, ideaId) => {
  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_ideaId: {
          userId,
          ideaId
        }
      }
    });
    if (!bookmark) {
      return { success: false, message: "Bookmark not found" };
    }
    await prisma.bookmark.delete({
      where: {
        userId_ideaId: {
          userId,
          ideaId
        }
      }
    });
    return { success: true, message: "Bookmark removed successfully" };
  } catch (error) {
    console.error("Remove bookmark error:", error);
    return { success: false, message: "Failed to remove bookmark" };
  }
};
var getUserBookmarks = async (userId, page, limit, search, category, sortBy) => {
  try {
    const skip = (page - 1) * limit;
    const where = { userId };
    if (search) {
      where.idea = {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } }
        ]
      };
    }
    if (category && category !== "all") {
      where.idea = {
        ...where.idea,
        categories: {
          some: {
            category: { slug: category }
          }
        }
      };
    }
    let orderBy = { createdAt: "desc" };
    if (sortBy === "oldest") orderBy = { createdAt: "asc" };
    if (sortBy === "title") orderBy = { idea: { title: "asc" } };
    if (sortBy === "votes") orderBy = { idea: { voteScore: "desc" } };
    if (sortBy === "views") orderBy = { idea: { viewCount: "desc" } };
    const bookmarks = await prisma.bookmark.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        idea: {
          include: {
            author: {
              select: { id: true, name: true, image: true }
            },
            categories: {
              include: { category: true }
            }
          }
        }
      }
    });
    const totalItems = await prisma.bookmark.count({ where: { userId } });
    const transformedBookmarks = bookmarks.map((bookmark) => ({
      id: bookmark.id,
      ideaId: bookmark.idea.id,
      ideaTitle: bookmark.idea.title,
      ideaDescription: bookmark.idea.description,
      ideaImage: bookmark.idea.imageUrl,
      ideaStatus: bookmark.idea.status,
      ideaVoteScore: bookmark.idea.voteScore,
      ideaViewCount: bookmark.idea.viewCount,
      ideaCommentCount: bookmark.idea.commentCount,
      authorName: bookmark.idea.author.name,
      authorImage: bookmark.idea.author.image,
      categoryName: bookmark.idea.categories[0]?.category.name || "Uncategorized",
      categorySlug: bookmark.idea.categories[0]?.category.slug || "uncategorized",
      bookmarkedAt: bookmark.createdAt
    }));
    return {
      success: true,
      data: {
        bookmarks: transformedBookmarks,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          itemsPerPage: limit
        }
      }
    };
  } catch (error) {
    console.error("Get user bookmarks error:", error);
    return { success: false, message: "Failed to fetch bookmarks" };
  }
};
var checkBookmark = async (userId, ideaId) => {
  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_ideaId: {
          userId,
          ideaId
        }
      }
    });
    return {
      success: true,
      data: { isBookmarked: !!bookmark }
    };
  } catch (error) {
    console.error("Check bookmark error:", error);
    return { success: false, message: "Failed to check bookmark" };
  }
};
var bookmarkService = {
  addBookmark,
  removeBookmark,
  getUserBookmarks,
  checkBookmark
};

// src/modules/bookmarks/bookmark.controller.ts
var addBookmark2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { ideaId } = req.params;
    if (!ideaId) {
      return res.status(400).json({
        success: false,
        message: "Idea ID is required"
      });
    }
    const result = await bookmarkService.addBookmark(userId, ideaId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var removeBookmark2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { ideaId } = req.params;
    if (!ideaId) {
      return res.status(400).json({
        success: false,
        message: "Idea ID is required"
      });
    }
    const result = await bookmarkService.removeBookmark(userId, ideaId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var getUserBookmarks2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await bookmarkService.getUserBookmarks(userId, page, limit);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var checkBookmark2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { ideaId } = req.params;
    const result = await bookmarkService.checkBookmark(userId, ideaId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var bookmarkController = {
  addBookmark: addBookmark2,
  removeBookmark: removeBookmark2,
  getUserBookmarks: getUserBookmarks2,
  checkBookmark: checkBookmark2
};

// src/modules/bookmarks/bookmark.route.ts
var router8 = express8.Router();
router8.use(auth_default(Role.MEMBER, Role.ADMIN));
router8.post("/:ideaId", bookmarkController.addBookmark);
router8.delete("/:ideaId", bookmarkController.removeBookmark);
router8.get("/", bookmarkController.getUserBookmarks);
router8.get("/check/:ideaId", bookmarkController.checkBookmark);
var bookmarkRouter = router8;

// src/modules/votes/vote.route.ts
import express9 from "express";

// src/modules/votes/vote.service.ts
var castVote = async (userId, ideaId, voteType) => {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId }
    });
    if (!idea) {
      return { success: false, message: "Idea not found" };
    }
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_ideaId: {
          userId,
          ideaId
        }
      }
    });
    let voteChange = 0;
    if (!existingVote) {
      voteChange = voteType === "UP" ? 1 : -1;
      await prisma.vote.create({
        data: {
          userId,
          ideaId,
          voteType
        }
      });
    } else if (existingVote.voteType !== voteType) {
      voteChange = voteType === "UP" ? 2 : -2;
      await prisma.vote.update({
        where: { id: existingVote.id },
        data: { voteType }
      });
    } else {
      voteChange = voteType === "UP" ? -1 : 1;
      await prisma.vote.delete({
        where: { id: existingVote.id }
      });
    }
    if (voteChange !== 0) {
      await prisma.idea.update({
        where: { id: ideaId },
        data: { voteScore: { increment: voteChange } }
      });
    }
    const updatedIdea = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { voteScore: true }
    });
    const message = !existingVote ? `${voteType === "UP" ? "Upvoted" : "Downvoted"} successfully` : existingVote.voteType !== voteType ? `Vote changed to ${voteType === "UP" ? "upvote" : "downvote"}` : "Vote removed";
    return {
      success: true,
      message,
      data: {
        voteScore: updatedIdea?.voteScore || 0,
        userVote: existingVote?.voteType !== voteType ? voteType : null
      }
    };
  } catch (error) {
    console.error("Cast vote error:", error);
    return { success: false, message: "Failed to cast vote" };
  }
};
var removeVote = async (userId, ideaId) => {
  try {
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_ideaId: {
          userId,
          ideaId
        }
      }
    });
    if (!existingVote) {
      return { success: false, message: "No vote found to remove" };
    }
    const voteChange = existingVote.voteType === "UP" ? -1 : 1;
    await prisma.idea.update({
      where: { id: ideaId },
      data: { voteScore: { increment: voteChange } }
    });
    await prisma.vote.delete({
      where: { id: existingVote.id }
    });
    const updatedIdea = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { voteScore: true }
    });
    return {
      success: true,
      message: "Vote removed successfully",
      data: {
        voteScore: updatedIdea?.voteScore || 0,
        userVote: null
      }
    };
  } catch (error) {
    console.error("Remove vote error:", error);
    return { success: false, message: "Failed to remove vote" };
  }
};
var getUserVote = async (userId, ideaId) => {
  try {
    const vote = await prisma.vote.findUnique({
      where: {
        userId_ideaId: {
          userId,
          ideaId
        }
      },
      select: { voteType: true }
    });
    return {
      success: true,
      data: {
        userVote: vote?.voteType || null
      }
    };
  } catch (error) {
    console.error("Get user vote error:", error);
    return { success: false, message: "Failed to get user vote" };
  }
};
var getUserVotes = async (userId, params) => {
  try {
    const { voteType, sortBy, search, category, page, limit } = params;
    const skip = (page - 1) * limit;
    const where = {
      userId
    };
    if (voteType && voteType !== "all") {
      where.voteType = voteType;
    }
    const ideaWhere = {};
    if (search) {
      ideaWhere.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }
    if (category) {
      ideaWhere.categories = {
        some: {
          category: {
            slug: category
          }
        }
      };
    }
    const votes = await prisma.vote.findMany({
      where: {
        ...where,
        idea: ideaWhere
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: sortBy === "oldest" ? "asc" : "desc"
      },
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            voteScore: true,
            status: true,
            categories: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true
                  }
                }
              }
            },
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      }
    });
    const totalItems = await prisma.vote.count({
      where: {
        ...where,
        idea: ideaWhere
      }
    });
    const stats = await prisma.$transaction([
      prisma.vote.count({ where: { userId } }),
      prisma.vote.count({ where: { userId, voteType: "UP" } }),
      prisma.vote.count({ where: { userId, voteType: "DOWN" } })
    ]);
    const formattedVotes = votes.map((vote) => ({
      id: vote.id,
      voteType: vote.voteType,
      createdAt: vote.createdAt,
      idea: {
        id: vote.idea.id,
        title: vote.idea.title,
        description: vote.idea.description,
        imageUrl: vote.idea.imageUrl,
        voteScore: vote.idea.voteScore,
        status: vote.idea.status,
        categories: vote.idea.categories.map((c) => ({
          id: c.category.id,
          name: c.category.name,
          slug: c.category.slug
        })),
        author: vote.idea.author
      }
    }));
    return {
      success: true,
      data: {
        votes: formattedVotes,
        stats: {
          totalVotes: stats[0],
          upvotes: stats[1],
          downvotes: stats[2]
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          itemsPerPage: limit
        }
      }
    };
  } catch (error) {
    console.error("Get user votes error:", error);
    return { success: false, message: "Failed to fetch votes" };
  }
};
var voteService = {
  castVote,
  removeVote,
  getUserVote,
  getUserVotes
};

// src/modules/votes/vote.controller.ts
var castVote2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { ideaId } = req.params;
    const { voteType } = req.body;
    if (!ideaId) {
      return res.status(400).json({
        success: false,
        message: "Idea ID is required"
      });
    }
    if (!voteType || voteType !== "UP" && voteType !== "DOWN") {
      return res.status(400).json({
        success: false,
        message: "Valid vote type (UP or DOWN) is required"
      });
    }
    const result = await voteService.castVote(userId, ideaId, voteType);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var removeVote2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { ideaId } = req.params;
    if (!ideaId) {
      return res.status(400).json({
        success: false,
        message: "Idea ID is required"
      });
    }
    const result = await voteService.removeVote(userId, ideaId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var getUserVote2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { ideaId } = req.params;
    if (!ideaId) {
      return res.status(400).json({
        success: false,
        message: "Idea ID is required"
      });
    }
    const result = await voteService.getUserVote(userId, ideaId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getUserVotes2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const voteType = req.query.voteType;
    const sortBy = req.query.sortBy;
    const search = req.query.search;
    const category = req.query.category;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await voteService.getUserVotes(userId, {
      voteType,
      sortBy,
      search,
      category,
      page,
      limit
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var voteController = {
  castVote: castVote2,
  removeVote: removeVote2,
  getUserVote: getUserVote2,
  getUserVotes: getUserVotes2
};

// src/modules/votes/vote.route.ts
var router9 = express9.Router();
router9.use(auth_default(Role.MEMBER, Role.ADMIN));
router9.get("/user/votes", voteController.getUserVotes);
router9.post("/:ideaId", voteController.castVote);
router9.delete("/:ideaId", voteController.removeVote);
router9.get("/:ideaId", voteController.getUserVote);
var voteRouter = router9;

// src/modules/profile/member/member-profile.route.ts
import express10 from "express";

// src/modules/profile/member/member-profile.service.ts
import bcrypt from "bcryptjs";
var getProfile = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        phone: true,
        address: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });
    if (!user) {
      return { success: false, message: "User not found" };
    }
    return { success: true, data: user };
  } catch (error) {
    console.error("Get profile error:", error);
    return { success: false, message: "Failed to fetch profile" };
  }
};
var updateProfile = async (userId, data) => {
  try {
    const updateData = {};
    if (data.name !== void 0) updateData.name = data.name;
    if (data.phone !== void 0) updateData.phone = data.phone;
    if (data.address !== void 0) updateData.address = data.address;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        phone: true,
        address: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, message: "Failed to update profile" };
  }
};
var getStats5 = async (userId) => {
  try {
    const userIdeas = await prisma.idea.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        status: true,
        voteScore: true,
        isPaid: true
      }
    });
    const totalIdeas = userIdeas.length;
    const draftIdeas = userIdeas.filter((idea) => idea.status === "DRAFT").length;
    const pendingIdeas = userIdeas.filter((idea) => idea.status === "PENDING").length;
    const approvedIdeas = userIdeas.filter((idea) => idea.status === "APPROVED").length;
    const rejectedIdeas = userIdeas.filter((idea) => idea.status === "REJECTED").length;
    const totalUpvotesReceived = userIdeas.reduce((sum, idea) => {
      return sum + (idea.voteScore > 0 ? idea.voteScore : 0);
    }, 0);
    const totalComments = await prisma.comment.count({
      where: {
        userId,
        isDeleted: false
      }
    });
    const totalBookmarks = await prisma.bookmark.count({
      where: { userId }
    });
    const approvalRate = approvedIdeas > 0 ? Math.round(approvedIdeas / (approvedIdeas + rejectedIdeas) * 100) : 0;
    const stats = {
      totalIdeas,
      draftIdeas,
      pendingIdeas,
      approvedIdeas,
      rejectedIdeas,
      totalUpvotesReceived,
      totalComments,
      totalBookmarks,
      approvalRate
    };
    return { success: true, data: stats };
  } catch (error) {
    console.error("Get stats error:", error);
    return { success: false, message: "Failed to fetch stats" };
  }
};
var getActivity = async (userId, limit) => {
  try {
    const recentIdeas = await prisma.idea.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      }
    });
    const recentComments = await prisma.comment.findMany({
      where: {
        userId,
        isDeleted: false
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        ideaId: true,
        idea: {
          select: { title: true }
        },
        createdAt: true
      }
    });
    const recentVotes = await prisma.vote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        voteType: true,
        ideaId: true,
        idea: {
          select: { title: true }
        },
        createdAt: true
      }
    });
    const activities = [
      ...recentIdeas.map((idea) => ({
        id: `idea-${idea.id}`,
        type: idea.status === "PENDING" ? "SUBMIT_IDEA" : idea.status === "APPROVED" ? "APPROVE_IDEA" : idea.status === "REJECTED" ? "REJECT_IDEA" : "SUBMIT_IDEA",
        message: idea.status === "PENDING" ? `You submitted "${idea.title}" for review` : idea.status === "APPROVED" ? `Your idea "${idea.title}" was approved!` : idea.status === "REJECTED" ? `Your idea "${idea.title}" was rejected` : `You created "${idea.title}"`,
        ideaId: idea.id,
        ideaTitle: idea.title,
        createdAt: idea.createdAt
      })),
      ...recentComments.map((comment) => ({
        id: `comment-${comment.id}`,
        type: "NEW_COMMENT",
        message: `You commented on "${comment.idea.title}"`,
        ideaId: comment.ideaId,
        ideaTitle: comment.idea.title,
        createdAt: comment.createdAt
      })),
      ...recentVotes.map((vote) => ({
        id: `vote-${vote.id}`,
        type: "VOTE",
        message: `You ${vote.voteType === "UP" ? "upvoted" : "downvoted"} "${vote.idea.title}"`,
        ideaId: vote.ideaId,
        ideaTitle: vote.idea.title,
        createdAt: vote.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
    return { success: true, data: activities };
  } catch (error) {
    console.error("Get activity error:", error);
    return { success: false, message: "Failed to fetch activity" };
  }
};
var changePassword = async (userId, data) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          where: { providerId: "email" },
          take: 1
        }
      }
    });
    if (!user) {
      return { success: false, message: "User not found" };
    }
    const account = user.accounts[0];
    if (!account || !account.password) {
      return { success: false, message: "No password set for this account" };
    }
    const isValidPassword = await bcrypt.compare(data.currentPassword, account.password);
    if (!isValidPassword) {
      return { success: false, message: "Current password is incorrect" };
    }
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashedPassword }
    });
    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, message: "Failed to change password" };
  }
};
var updateNewsletter = async (userId, isSubscribed) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });
    if (!user) {
      return { success: false, message: "User not found" };
    }
    if (isSubscribed) {
      await prisma.newsletter.upsert({
        where: { email: user.email },
        update: {
          isSubscribed: true,
          unsubscribedAt: null
        },
        create: {
          email: user.email,
          isSubscribed: true,
          userId
        }
      });
    } else {
      await prisma.newsletter.update({
        where: { email: user.email },
        data: {
          isSubscribed: false,
          unsubscribedAt: /* @__PURE__ */ new Date()
        }
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Update newsletter error:", error);
    return { success: false, message: "Failed to update newsletter subscription" };
  }
};
var deleteAccount = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return { success: false, message: "User not found" };
    }
    await prisma.user.delete({
      where: { id: userId }
    });
    return { success: true };
  } catch (error) {
    console.error("Delete account error:", error);
    return { success: false, message: "Failed to delete account" };
  }
};
var memberProfileService = {
  getProfile,
  updateProfile,
  getStats: getStats5,
  getActivity,
  changePassword,
  updateNewsletter,
  deleteAccount
};

// src/modules/profile/member/member-profile.controller.ts
var getProfile2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await memberProfileService.getProfile(userId);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var updateProfile2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phone, address } = req.body;
    const result = await memberProfileService.updateProfile(userId, {
      name,
      phone,
      address
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data,
      message: "Profile updated successfully"
    });
  } catch (error) {
    next(error);
  }
};
var getStats6 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await memberProfileService.getStats(userId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getActivity2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const result = await memberProfileService.getActivity(userId, limit);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var changePassword2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required"
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match"
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }
    const result = await memberProfileService.changePassword(userId, {
      currentPassword,
      newPassword
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    next(error);
  }
};
var updateNewsletter2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { isSubscribed } = req.body;
    if (typeof isSubscribed !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isSubscribed must be a boolean value"
      });
    }
    const result = await memberProfileService.updateNewsletter(userId, isSubscribed);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: isSubscribed ? "Subscribed to newsletter" : "Unsubscribed from newsletter"
    });
  } catch (error) {
    next(error);
  }
};
var deleteAccount2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await memberProfileService.deleteAccount(userId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.clearCookie("better-auth");
    return res.status(200).json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
var memberProfileController = {
  getProfile: getProfile2,
  updateProfile: updateProfile2,
  getStats: getStats6,
  getActivity: getActivity2,
  changePassword: changePassword2,
  updateNewsletter: updateNewsletter2,
  deleteAccount: deleteAccount2
};

// src/modules/profile/member/member-profile.route.ts
var router10 = express10.Router();
router10.use(auth_default(Role.MEMBER));
router10.get("/profile", memberProfileController.getProfile);
router10.patch("/profile", memberProfileController.updateProfile);
router10.get("/stats", memberProfileController.getStats);
router10.get("/activity", memberProfileController.getActivity);
router10.post("/change-password", memberProfileController.changePassword);
router10.patch("/newsletter", memberProfileController.updateNewsletter);
router10.delete("/account", memberProfileController.deleteAccount);
var memberProfileRouter = router10;

// src/modules/settings/admin/admin-settings.route.ts
import express11 from "express";

// src/modules/settings/admin/admin-settings.service.ts
import bcrypt2 from "bcryptjs";
var getProfile3 = async (adminId) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });
    if (!admin) {
      return { success: false, message: "Admin not found" };
    }
    return { success: true, data: admin };
  } catch (error) {
    console.error("Get admin profile error:", error);
    return { success: false, message: "Failed to fetch profile" };
  }
};
var updateProfile3 = async (adminId, data) => {
  try {
    const updateData = {};
    if (data.name !== void 0) updateData.name = data.name;
    if (data.image !== void 0) updateData.image = data.image;
    const updatedAdmin = await prisma.user.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return { success: true, data: updatedAdmin };
  } catch (error) {
    console.error("Update admin profile error:", error);
    return { success: false, message: "Failed to update profile" };
  }
};
var changePassword3 = async (adminId, data) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      include: {
        accounts: {
          where: { providerId: "email" },
          take: 1
        }
      }
    });
    if (!admin) {
      return { success: false, message: "Admin not found" };
    }
    const account = admin.accounts[0];
    if (!account || !account.password) {
      return { success: false, message: "No password set for this account" };
    }
    const isValidPassword = await bcrypt2.compare(data.currentPassword, account.password);
    if (!isValidPassword) {
      return { success: false, message: "Current password is incorrect" };
    }
    const hashedPassword = await bcrypt2.hash(data.newPassword, 10);
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashedPassword }
    });
    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, message: "Failed to change password" };
  }
};
var getNotificationPreferences = async (adminId) => {
  try {
    const defaultPreferences = {
      newIdeaSubmissions: true,
      pendingReviewReminders: true,
      reportedContent: true,
      weeklySummary: false,
      systemAnnouncements: true
    };
    return { success: true, data: defaultPreferences };
  } catch (error) {
    console.error("Get notification preferences error:", error);
    return { success: false, message: "Failed to fetch preferences" };
  }
};
var updateNotificationPreferences = async (adminId, preferences) => {
  try {
    return { success: true };
  } catch (error) {
    console.error("Update notification preferences error:", error);
    return { success: false, message: "Failed to update preferences" };
  }
};
var getSessions = async (adminId, currentToken) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: adminId },
      orderBy: { createdAt: "desc" }
    });
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent || "Unknown Device",
      ipAddress: session.ipAddress || "Unknown IP",
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.token === currentToken
    }));
    return { success: true, data: formattedSessions };
  } catch (error) {
    console.error("Get sessions error:", error);
    return { success: false, message: "Failed to fetch sessions" };
  }
};
var revokeSession = async (adminId, sessionId) => {
  try {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId: adminId }
    });
    if (!session) {
      return { success: false, message: "Session not found" };
    }
    await prisma.session.delete({
      where: { id: sessionId }
    });
    return { success: true };
  } catch (error) {
    console.error("Revoke session error:", error);
    return { success: false, message: "Failed to revoke session" };
  }
};
var revokeAllSessions = async (adminId, currentToken) => {
  try {
    await prisma.session.deleteMany({
      where: {
        userId: adminId,
        token: { not: currentToken }
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Revoke all sessions error:", error);
    return { success: false, message: "Failed to revoke sessions" };
  }
};
var getActivityLog = async (adminId, limit, page) => {
  try {
    const skip = (page - 1) * limit;
    const activities = await prisma.activityLog.findMany({
      where: { userId: adminId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    });
    const total = await prisma.activityLog.count({
      where: { userId: adminId }
    });
    const formattedActivities = activities.map((activity) => ({
      id: activity.id,
      action: activity.action,
      details: activity.details,
      ipAddress: activity.ipAddress,
      createdAt: activity.createdAt
    }));
    return {
      success: true,
      data: {
        activities: formattedActivities,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    };
  } catch (error) {
    console.error("Get activity log error:", error);
    return { success: false, message: "Failed to fetch activity log" };
  }
};
var clearCache = async () => {
  try {
    return { success: true };
  } catch (error) {
    console.error("Clear cache error:", error);
    return { success: false, message: "Failed to clear cache" };
  }
};
var adminSettingsService = {
  getProfile: getProfile3,
  updateProfile: updateProfile3,
  changePassword: changePassword3,
  getNotificationPreferences,
  updateNotificationPreferences,
  getSessions,
  revokeSession,
  revokeAllSessions,
  getActivityLog,
  clearCache
};

// src/modules/settings/admin/admin-settings.controller.ts
var getProfile4 = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const result = await adminSettingsService.getProfile(adminId);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var updateProfile4 = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { name, image } = req.body;
    const result = await adminSettingsService.updateProfile(adminId, { name, image });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data,
      message: "Profile updated successfully"
    });
  } catch (error) {
    next(error);
  }
};
var changePassword4 = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required"
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match"
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }
    const result = await adminSettingsService.changePassword(adminId, {
      currentPassword,
      newPassword
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    next(error);
  }
};
var getNotificationPreferences2 = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const result = await adminSettingsService.getNotificationPreferences(adminId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var updateNotificationPreferences2 = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { newIdeaSubmissions, pendingReviewReminders, reportedContent, weeklySummary, systemAnnouncements } = req.body;
    const result = await adminSettingsService.updateNotificationPreferences(adminId, {
      newIdeaSubmissions,
      pendingReviewReminders,
      reportedContent,
      weeklySummary,
      systemAnnouncements
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully"
    });
  } catch (error) {
    next(error);
  }
};
var getSessions2 = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const token = req.headers.authorization?.replace("Bearer ", "") || "";
    const result = await adminSettingsService.getSessions(adminId, token);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var revokeSession2 = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { sessionId } = req.params;
    const result = await adminSettingsService.revokeSession(adminId, sessionId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: "Session revoked successfully"
    });
  } catch (error) {
    next(error);
  }
};
var revokeAllSessions2 = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const currentToken = req.headers.authorization?.replace("Bearer ", "") || "";
    const result = await adminSettingsService.revokeAllSessions(adminId, currentToken);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: "All other sessions revoked successfully"
    });
  } catch (error) {
    next(error);
  }
};
var getActivityLog2 = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const result = await adminSettingsService.getActivityLog(adminId, limit, page);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var clearCache2 = async (req, res, next) => {
  try {
    const result = await adminSettingsService.clearCache();
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: "Cache cleared successfully"
    });
  } catch (error) {
    next(error);
  }
};
var adminSettingsController = {
  getProfile: getProfile4,
  updateProfile: updateProfile4,
  changePassword: changePassword4,
  getNotificationPreferences: getNotificationPreferences2,
  updateNotificationPreferences: updateNotificationPreferences2,
  getSessions: getSessions2,
  revokeSession: revokeSession2,
  revokeAllSessions: revokeAllSessions2,
  getActivityLog: getActivityLog2,
  clearCache: clearCache2
};

// src/modules/settings/admin/admin-settings.route.ts
var router11 = express11.Router();
router11.use(auth_default(Role.ADMIN));
router11.get("/profile", adminSettingsController.getProfile);
router11.patch("/profile", adminSettingsController.updateProfile);
router11.post("/change-password", adminSettingsController.changePassword);
router11.get("/notifications", adminSettingsController.getNotificationPreferences);
router11.patch("/notifications", adminSettingsController.updateNotificationPreferences);
router11.get("/sessions", adminSettingsController.getSessions);
router11.delete("/sessions", adminSettingsController.revokeAllSessions);
router11.delete("/sessions/:sessionId", adminSettingsController.revokeSession);
router11.get("/activity", adminSettingsController.getActivityLog);
router11.post("/clear-cache", adminSettingsController.clearCache);
var adminSettingsRouter = router11;

// src/modules/users/user-management.route.ts
import express12 from "express";

// src/modules/users/user-management.service.ts
var getAllUsers = async (params) => {
  try {
    const { page, limit, search, role, status, verified, sort } = params;
    const skip = (page - 1) * limit;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }
    if (role && role !== "all") {
      where.role = role;
    }
    if (status && status !== "all") {
      where.accountStatus = status;
    }
    if (verified === "verified") {
      where.emailVerified = true;
    } else if (verified === "unverified") {
      where.emailVerified = false;
    }
    let orderBy = {};
    switch (sort) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "name_asc":
        orderBy = { name: "asc" };
        break;
      case "name_desc":
        orderBy = { name: "desc" };
        break;
      case "most_ideas":
        orderBy = { ideas: { _count: "desc" } };
        break;
      case "most_comments":
        orderBy = { comments: { _count: "desc" } };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        accountStatus: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ideas: true,
            comments: true,
            votes: true
          }
        }
      }
    });
    const totalItems = await prisma.user.count({ where });
    const stats = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { accountStatus: "ACTIVE" } }),
      prisma.user.count({ where: { accountStatus: "SUSPENDED" } }),
      prisma.user.count({ where: { accountStatus: "BANNED" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "MEMBER" } }),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.user.count({ where: { emailVerified: false } })
    ]);
    const startOfMonth = /* @__PURE__ */ new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: { gte: startOfMonth }
      }
    });
    const startOfLastMonth = /* @__PURE__ */ new Date();
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    startOfLastMonth.setDate(1);
    startOfLastMonth.setHours(0, 0, 0, 0);
    const endOfLastMonth = /* @__PURE__ */ new Date();
    endOfLastMonth.setDate(0);
    endOfLastMonth.setHours(23, 59, 59, 999);
    const lastMonthNewUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    });
    const newUsersTrend = lastMonthNewUsers === 0 ? 100 : Math.round((newUsersThisMonth - lastMonthNewUsers) / lastMonthNewUsers * 100);
    return {
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          itemsPerPage: limit
        },
        stats: {
          totalUsers: stats[0],
          activeUsers: stats[1],
          suspendedUsers: stats[2],
          bannedUsers: stats[3],
          adminUsers: stats[4],
          memberUsers: stats[5],
          verifiedEmails: stats[6],
          unverifiedEmails: stats[7],
          newUsersThisMonth,
          newUsersTrend
        }
      }
    };
  } catch (error) {
    console.error("Get all users error:", error);
    return { success: false, message: "Failed to fetch users" };
  }
};
var getUserDetails = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        accountStatus: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ideas: true,
            comments: true,
            votes: true,
            bookmarks: true
          }
        },
        // Get last active session
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true }
        }
      }
    });
    if (!user) {
      return { success: false, message: "User not found" };
    }
    const recentActivities = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10
    });
    return {
      success: true,
      data: {
        ...user,
        lastActive: user.sessions[0]?.createdAt || user.createdAt,
        recentActivities
      }
    };
  } catch (error) {
    console.error("Get user details error:", error);
    return { success: false, message: "Failed to fetch user details" };
  }
};
var banUser = async (userId, adminId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return { success: false, message: "User not found" };
    }
    if (user.role === "ADMIN") {
      return { success: false, message: "Cannot ban another admin" };
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { accountStatus: "BANNED" }
    });
    await prisma.activityLog.create({
      data: {
        action: "ADMIN_ACTION",
        userId: adminId,
        details: {
          action: "BAN_USER",
          targetUserId: userId,
          targetUserEmail: user.email
        },
        ipAddress: "",
        userAgent: ""
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Ban user error:", error);
    return { success: false, message: "Failed to ban user" };
  }
};
var unbanUser = async (userId, adminId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return { success: false, message: "User not found" };
    }
    await prisma.user.update({
      where: { id: userId },
      data: { accountStatus: "ACTIVE" }
    });
    await prisma.activityLog.create({
      data: {
        action: "ADMIN_ACTION",
        userId: adminId,
        details: {
          action: "UNBAN_USER",
          targetUserId: userId,
          targetUserEmail: user.email
        },
        ipAddress: "",
        userAgent: ""
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Unban user error:", error);
    return { success: false, message: "Failed to unban user" };
  }
};
var suspendUser = async (userId, adminId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return { success: false, message: "User not found" };
    }
    if (user.role === "ADMIN") {
      return { success: false, message: "Cannot suspend another admin" };
    }
    await prisma.user.update({
      where: { id: userId },
      data: { accountStatus: "SUSPENDED" }
    });
    await prisma.activityLog.create({
      data: {
        action: "ADMIN_ACTION",
        userId: adminId,
        details: {
          action: "SUSPEND_USER",
          targetUserId: userId,
          targetUserEmail: user.email
        },
        ipAddress: "",
        userAgent: ""
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Suspend user error:", error);
    return { success: false, message: "Failed to suspend user" };
  }
};
var activateUser = async (userId, adminId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return { success: false, message: "User not found" };
    }
    await prisma.user.update({
      where: { id: userId },
      data: { accountStatus: "ACTIVE" }
    });
    await prisma.activityLog.create({
      data: {
        action: "ADMIN_ACTION",
        userId: adminId,
        details: {
          action: "ACTIVATE_USER",
          targetUserId: userId,
          targetUserEmail: user.email
        },
        ipAddress: "",
        userAgent: ""
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Activate user error:", error);
    return { success: false, message: "Failed to activate user" };
  }
};
var changeUserRole = async (userId, newRole, adminId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return { success: false, message: "User not found" };
    }
    if (userId === adminId) {
      return { success: false, message: "You cannot change your own role" };
    }
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });
    await prisma.activityLog.create({
      data: {
        action: "ADMIN_ACTION",
        userId: adminId,
        details: {
          action: "CHANGE_ROLE",
          targetUserId: userId,
          targetUserEmail: user.email,
          newRole,
          oldRole: user.role
        },
        ipAddress: "",
        userAgent: ""
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Change user role error:", error);
    return { success: false, message: "Failed to change user role" };
  }
};
var deleteUser = async (userId, adminId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return { success: false, message: "User not found" };
    }
    await prisma.user.delete({
      where: { id: userId }
    });
    await prisma.activityLog.create({
      data: {
        action: "ADMIN_ACTION",
        userId: adminId,
        details: {
          action: "DELETE_USER",
          targetUserId: userId,
          targetUserEmail: user.email
        },
        ipAddress: "",
        userAgent: ""
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Delete user error:", error);
    return { success: false, message: "Failed to delete user" };
  }
};
var bulkAction = async (action, userIds, adminId) => {
  try {
    const results = await Promise.all(
      userIds.map(async (userId) => {
        switch (action) {
          case "ban":
            return await banUser(userId, adminId);
          case "unban":
            return await unbanUser(userId, adminId);
          case "suspend":
            return await suspendUser(userId, adminId);
          case "activate":
            return await activateUser(userId, adminId);
          case "delete":
            return await deleteUser(userId, adminId);
          default:
            return { success: false };
        }
      })
    );
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    return {
      success: true,
      message: `${successful} user(s) ${action}ed successfully${failed > 0 ? `, ${failed} failed` : ""}`
    };
  } catch (error) {
    console.error("Bulk action error:", error);
    return { success: false, message: "Failed to perform bulk action" };
  }
};
var exportUsers = async (params) => {
  try {
    const { search, role, status, verified } = params;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }
    if (role && role !== "all") {
      where.role = role;
    }
    if (status && status !== "all") {
      where.accountStatus = status;
    }
    if (verified === "verified") {
      where.emailVerified = true;
    } else if (verified === "unverified") {
      where.emailVerified = false;
    }
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        emailVerified: true,
        createdAt: true
      }
    });
    const headers = ["Name", "Email", "Role", "Status", "Email Verified", "Joined Date"];
    const csvRows = [headers];
    for (const user of users) {
      csvRows.push([
        user.name,
        user.email,
        user.role,
        user.accountStatus,
        user.emailVerified ? "Yes" : "No",
        new Date(user.createdAt).toLocaleDateString()
      ]);
    }
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    return { success: true, data: csvContent };
  } catch (error) {
    console.error("Export users error:", error);
    return { success: false, message: "Failed to export users" };
  }
};
var userManagementService = {
  getAllUsers,
  getUserDetails,
  banUser,
  unbanUser,
  suspendUser,
  activateUser,
  changeUserRole,
  deleteUser,
  bulkAction,
  exportUsers
};

// src/modules/users/user-management.controller.ts
var getAllUsers2 = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search;
    const role = req.query.role;
    const status = req.query.status;
    const verified = req.query.verified;
    const sort = req.query.sort;
    const result = await userManagementService.getAllUsers({
      page,
      limit,
      search,
      role,
      status,
      verified,
      sort
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getUserDetails2 = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    const result = await userManagementService.getUserDetails(userId);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var banUser2 = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    const result = await userManagementService.banUser(userId, adminId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: "User banned successfully"
    });
  } catch (error) {
    next(error);
  }
};
var unbanUser2 = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    const result = await userManagementService.unbanUser(userId, adminId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: "User unbanned successfully"
    });
  } catch (error) {
    next(error);
  }
};
var suspendUser2 = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    const result = await userManagementService.suspendUser(userId, adminId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: "User suspended successfully"
    });
  } catch (error) {
    next(error);
  }
};
var activateUser2 = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    const result = await userManagementService.activateUser(userId, adminId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: "User activated successfully"
    });
  } catch (error) {
    next(error);
  }
};
var changeUserRole2 = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const adminId = req.user.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    if (!role || !["MEMBER", "ADMIN"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Valid role (MEMBER or ADMIN) is required"
      });
    }
    const result = await userManagementService.changeUserRole(userId, role, adminId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: `User role changed to ${role} successfully`
    });
  } catch (error) {
    next(error);
  }
};
var deleteUser2 = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account"
      });
    }
    const result = await userManagementService.deleteUser(userId, adminId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
var bulkAction2 = async (req, res, next) => {
  try {
    const { action, userIds } = req.body;
    const adminId = req.user.id;
    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Action and userIds array are required"
      });
    }
    const validActions = ["ban", "unban", "suspend", "activate", "delete"];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action. Valid actions: ${validActions.join(", ")}`
      });
    }
    if (action === "delete" && userIds.includes(adminId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account"
      });
    }
    const result = await userManagementService.bulkAction(action, userIds, adminId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
var exportUsers2 = async (req, res, next) => {
  try {
    const format = req.query.format || "csv";
    const search = req.query.search;
    const role = req.query.role;
    const status = req.query.status;
    const verified = req.query.verified;
    const result = await userManagementService.exportUsers({
      format,
      search,
      role,
      status,
      verified
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=users_export_${Date.now()}.csv`);
    return res.send(result.data);
  } catch (error) {
    next(error);
  }
};
var userManagementController = {
  getAllUsers: getAllUsers2,
  getUserDetails: getUserDetails2,
  banUser: banUser2,
  unbanUser: unbanUser2,
  suspendUser: suspendUser2,
  activateUser: activateUser2,
  changeUserRole: changeUserRole2,
  deleteUser: deleteUser2,
  bulkAction: bulkAction2,
  exportUsers: exportUsers2
};

// src/modules/users/user-management.route.ts
var router12 = express12.Router();
router12.use(auth_default(Role.ADMIN));
router12.get("/", userManagementController.getAllUsers);
router12.get("/export", userManagementController.exportUsers);
router12.post("/bulk", userManagementController.bulkAction);
router12.get("/:userId", userManagementController.getUserDetails);
router12.patch("/:userId/role", userManagementController.changeUserRole);
router12.post("/:userId/ban", userManagementController.banUser);
router12.post("/:userId/unban", userManagementController.unbanUser);
router12.post("/:userId/suspend", userManagementController.suspendUser);
router12.post("/:userId/activate", userManagementController.activateUser);
router12.delete("/:userId", userManagementController.deleteUser);
var userManagementRouter = router12;

// src/modules/payment/payment.route.ts
import express13 from "express";

// src/modules/payment/payment.service.ts
import Stripe from "stripe";
var stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
var createPaymentIntent = async (data) => {
  try {
    const { amount, userId, ideaId, ideaTitle, userEmail, userName } = data;
    const payment = await prisma.payment.create({
      data: {
        amount,
        status: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.STRIPE,
        userId,
        ideaId,
        metadata: {
          ideaTitle,
          userName,
          userEmail
        }
      }
    });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      // Convert to cents
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        paymentId: payment.id,
        ideaId,
        userId,
        ideaTitle
      },
      receipt_email: userEmail,
      description: `Payment for idea: ${ideaTitle}`
    });
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        transactionId: paymentIntent.id
      }
    });
    return {
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id
      }
    };
  } catch (error) {
    return { success: false, message: "Failed to create payment intent" };
  }
};
var handleStripeWebhookEvent = async (event) => {
  const existingPayment = await prisma.payment.findFirst({
    where: {
      stripeEventId: event.id
    }
  });
  if (existingPayment) {
    return { message: `Event ${event.id} already processed. Skipping` };
  }
  switch (event.type) {
    case "payment_intent.succeeded": {
      try {
        const paymentIntent = event.data.object;
        const paymentId = paymentIntent.metadata?.paymentId;
        const ideaId = paymentIntent.metadata?.ideaId;
        if (!paymentId || !ideaId) {
          return { message: "Missing paymentId or ideaId in metadata" };
        }
        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
          include: { idea: true }
        });
        if (!payment) {
          return { message: `Payment with id ${paymentId} not found` };
        }
        let receiptUrl = null;
        if (paymentIntent.latest_charge) {
          const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
          receiptUrl = charge.receipt_url;
        }
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: PaymentStatus.COMPLETED,
              stripeEventId: event.id,
              paidAt: /* @__PURE__ */ new Date(),
              transactionId: paymentIntent.id,
              ...receiptUrl && { receiptUrl }
            }
          });
        });
      } catch (error) {
        throw error;
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const paymentId = paymentIntent.metadata?.paymentId;
      if (!paymentId) {
        return { message: "Missing paymentId in metadata" };
      }
      const existingPayment2 = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { metadata: true }
      });
      const existingMetadata = existingPayment2?.metadata || {};
      const updatedMetadata = {
        ...existingMetadata,
        failureMessage: paymentIntent.last_payment_error?.message,
        failedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          stripeEventId: event.id,
          metadata: updatedMetadata
        }
      });
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const paymentIntentId = charge.payment_intent;
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId }
      });
      if (!payment) {
        return { message: `Payment not found` };
      }
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED,
          stripeEventId: event.id
        }
      });
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  return { message: `Webhook Event ${event.id} processed successfully` };
};
var checkPaymentStatus = async (paymentId) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });
    if (!payment) {
      return { success: false, message: "Payment not found" };
    }
    return {
      success: true,
      data: {
        status: payment.status,
        paidAt: payment.paidAt,
        receiptUrl: payment.receiptUrl
      }
    };
  } catch (error) {
    return { success: false, message: "Failed to check payment status" };
  }
};
var hasUserPaidForIdea = async (userId, ideaId) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        userId,
        ideaId,
        status: PaymentStatus.COMPLETED
      }
    });
    return {
      success: true,
      data: !!payment
    };
  } catch (error) {
    return { success: false, message: "Failed to check payment status" };
  }
};
var getPaymentsByUser = async (userId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        }
      }
    });
    const total = await prisma.payment.count({ where: { userId } });
    return {
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    };
  } catch (error) {
    return { success: false, message: "Failed to fetch payments" };
  }
};
var refundPayment = async (paymentId, adminId) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });
    if (!payment) {
      return { success: false, message: "Payment not found" };
    }
    if (payment.status !== PaymentStatus.COMPLETED) {
      return { success: false, message: "Only completed payments can be refunded" };
    }
    if (!payment.stripePaymentIntentId) {
      return { success: false, message: "No Stripe payment intent found" };
    }
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId
    });
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        metadata: {
          ...payment.metadata,
          refundId: refund.id,
          refundedBy: adminId,
          refundedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      }
    });
    return { success: true, message: "Payment refunded successfully" };
  } catch (error) {
    return { success: false, message: "Failed to process refund" };
  }
};
var PaymentService = {
  createPaymentIntent,
  handleStripeWebhookEvent,
  checkPaymentStatus,
  hasUserPaidForIdea,
  getPaymentsByUser,
  refundPayment
};

// src/config/stripe.config.ts
import Stripe2 from "stripe";
var stripe2 = new Stripe2(process.env.STRIPE_SECRET_KEY);

// src/modules/payment/payment.controller.ts
var createPaymentIntent2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.name;
    const { ideaId, amount, ideaTitle } = req.body;
    if (!ideaId || !amount || !ideaTitle) {
      return res.status(400).json({
        success: false,
        message: "Idea ID, amount, and idea title are required"
      });
    }
    const result = await PaymentService.createPaymentIntent({
      amount,
      userId,
      ideaId,
      ideaTitle,
      userEmail,
      userName
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var handleWebhook = async (req, res, next) => {
  try {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
      event = stripe2.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
    try {
      const result = await PaymentService.handleStripeWebhookEvent(event);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(200).json({ success: false, message: "Processing error but acknowledged" });
    }
  } catch (error) {
    next(error);
  }
};
var checkPaymentStatus2 = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const result = await PaymentService.checkPaymentStatus(paymentId);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var checkUserPaidForIdea = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { ideaId } = req.params;
    const result = await PaymentService.hasUserPaidForIdea(userId, ideaId);
    return res.status(200).json({
      success: true,
      data: { hasPaid: result.data }
    });
  } catch (error) {
    next(error);
  }
};
var getUserPayments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await PaymentService.getPaymentsByUser(userId, page, limit);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var refundPayment2 = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { paymentId } = req.params;
    const result = await PaymentService.refundPayment(paymentId, adminId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var PaymentController = {
  createPaymentIntent: createPaymentIntent2,
  handleWebhook,
  checkPaymentStatus: checkPaymentStatus2,
  checkUserPaidForIdea,
  getUserPayments,
  refundPayment: refundPayment2
};

// src/modules/payment/payment.route.ts
var router13 = express13.Router();
router13.post("/webhook", express13.raw({ type: "application/json" }), PaymentController.handleWebhook);
router13.post("/create-payment-intent", auth_default(Role.MEMBER), PaymentController.createPaymentIntent);
router13.get("/status/:paymentId", auth_default(Role.MEMBER), PaymentController.checkPaymentStatus);
router13.get("/check-paid/:ideaId", auth_default(Role.MEMBER), PaymentController.checkUserPaidForIdea);
router13.get("/my-payments", auth_default(Role.MEMBER), PaymentController.getUserPayments);
router13.post("/refund/:paymentId", auth_default(Role.ADMIN), PaymentController.refundPayment);
var paymentRouter = router13;

// src/middlewares/optionalAuth.ts
var betterAuth2;
var loadAuth2 = async () => {
  if (!betterAuth2) {
    const authModule = await import("./auth-NZDB23BW.js");
    betterAuth2 = await authModule.auth;
  }
  return betterAuth2;
};
var optionalAuth = async (req, res, next) => {
  try {
    const authInstance = await loadAuth2();
    const session = await authInstance.api.getSession({
      headers: req.headers
    });
    if (session) {
      const userFromDb = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { accountStatus: true }
      });
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        emailVerified: session.user.emailVerified,
        accountStatus: userFromDb?.accountStatus || "ACTIVE"
      };
    }
    next();
  } catch (error) {
    next();
  }
};

// src/modules/comments/comment.route.ts
import express14 from "express";

// src/modules/comments/comment.service.ts
var getUserComments = async (userId, params) => {
  try {
    const { search, sortBy, dateRange, page, limit } = params;
    const skip = (page - 1) * limit;
    const where = {
      userId,
      isDeleted: false
    };
    if (search) {
      where.OR = [
        { content: { contains: search, mode: "insensitive" } },
        {
          idea: {
            title: { contains: search, mode: "insensitive" }
          }
        }
      ];
    }
    if (dateRange) {
      const now = /* @__PURE__ */ new Date();
      let startDate;
      switch (dateRange) {
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        default:
          startDate = /* @__PURE__ */ new Date(0);
      }
      if (dateRange !== "all") {
        where.createdAt = { gte: startDate };
      }
    }
    let orderBy = {};
    switch (sortBy) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "mostVoted":
        orderBy = { createdAt: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }
    const comments = await prisma.comment.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            voteScore: true
          }
        },
        _count: {
          select: {
            replies: {
              where: { isDeleted: false }
            }
          }
        }
      }
    });
    const totalItems = await prisma.comment.count({ where });
    const totalComments = await prisma.comment.count({
      where: { userId, isDeleted: false }
    });
    const mostActiveIdeaResult = await prisma.comment.groupBy({
      by: ["ideaId"],
      where: { userId, isDeleted: false },
      _count: { ideaId: true },
      orderBy: { _count: { ideaId: "desc" } },
      take: 1
    });
    let mostActiveIdea = null;
    if (mostActiveIdeaResult && mostActiveIdeaResult.length > 0 && mostActiveIdeaResult[0]) {
      const idea = await prisma.idea.findUnique({
        where: { id: mostActiveIdeaResult[0].ideaId },
        select: { title: true }
      });
      mostActiveIdea = idea?.title || null;
    }
    const lastComment = await prisma.comment.findFirst({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true }
    });
    const lastCommentDate = lastComment?.createdAt || null;
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      isDeleted: comment.isDeleted,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      idea: {
        id: comment.idea.id,
        title: comment.idea.title,
        imageUrl: comment.idea.imageUrl,
        voteScore: comment.idea.voteScore
      },
      replyCount: comment._count.replies
    }));
    return {
      success: true,
      data: {
        comments: formattedComments,
        stats: {
          totalComments,
          mostActiveIdea,
          lastCommentDate: lastCommentDate?.toISOString() || null
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          itemsPerPage: limit
        }
      }
    };
  } catch (error) {
    console.error("Get user comments error:", error);
    return { success: false, message: "Failed to fetch comments" };
  }
};
var getComments = async (ideaId, page, limit) => {
  try {
    const skip = (page - 1) * limit;
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId }
    });
    if (!idea) {
      return { success: false, message: "Idea not found" };
    }
    const comments = await prisma.comment.findMany({
      where: {
        ideaId,
        parentId: null,
        isDeleted: false
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        replies: {
          where: { isDeleted: false },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            },
            replies: {
              where: { isDeleted: false },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                  }
                },
                replies: {
                  where: { isDeleted: false },
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                      }
                    }
                  },
                  orderBy: { createdAt: "asc" }
                }
              },
              orderBy: { createdAt: "asc" }
            }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });
    const totalItems = await prisma.comment.count({
      where: {
        ideaId,
        parentId: null,
        isDeleted: false
      }
    });
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      isDeleted: comment.isDeleted,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: comment.user,
      parentId: comment.parentId,
      replyCount: comment.replies.length,
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        isDeleted: reply.isDeleted,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        user: reply.user,
        parentId: reply.parentId,
        replyCount: reply.replies.length,
        replies: reply.replies.map((nestedReply) => ({
          id: nestedReply.id,
          content: nestedReply.content,
          isDeleted: nestedReply.isDeleted,
          createdAt: nestedReply.createdAt,
          updatedAt: nestedReply.updatedAt,
          user: nestedReply.user,
          parentId: nestedReply.parentId,
          replyCount: 0,
          replies: []
        }))
      }))
    }));
    return {
      success: true,
      data: {
        comments: formattedComments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          itemsPerPage: limit
        }
      }
    };
  } catch (error) {
    console.error("Get comments error:", error);
    return { success: false, message: "Failed to fetch comments" };
  }
};
var createComment = async (userId, ideaId, data) => {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId }
    });
    if (!idea) {
      return { success: false, message: "Idea not found" };
    }
    if (data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parentId }
      });
      if (!parentComment) {
        return { success: false, message: "Parent comment not found" };
      }
      if (parentComment.ideaId !== ideaId) {
        return { success: false, message: "Reply must be on a comment from the same idea" };
      }
    }
    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        userId,
        ideaId,
        parentId: data.parentId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });
    await prisma.idea.update({
      where: { id: ideaId },
      data: { commentCount: { increment: 1 } }
    });
    await prisma.activityLog.create({
      data: {
        action: "ADD_COMMENT",
        userId,
        details: {
          ideaId,
          commentId: comment.id,
          parentId: data.parentId
        },
        ipAddress: "",
        userAgent: ""
      }
    });
    return {
      success: true,
      data: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user,
        parentId: comment.parentId,
        replies: [],
        replyCount: 0
      }
    };
  } catch (error) {
    console.error("Create comment error:", error);
    return { success: false, message: "Failed to create comment" };
  }
};
var updateComment = async (commentId, userId, isAdmin, data) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });
    if (!comment) {
      return { success: false, message: "Comment not found" };
    }
    if (comment.userId !== userId && !isAdmin) {
      return { success: false, message: "You don't have permission to edit this comment" };
    }
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: data.content
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });
    return {
      success: true,
      data: {
        id: updatedComment.id,
        content: updatedComment.content,
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt,
        user: updatedComment.user,
        parentId: updatedComment.parentId
      }
    };
  } catch (error) {
    console.error("Update comment error:", error);
    return { success: false, message: "Failed to update comment" };
  }
};
var deleteComment = async (commentId, userId, isAdmin) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });
    if (!comment) {
      return { success: false, message: "Comment not found" };
    }
    if (comment.userId !== userId && !isAdmin) {
      return { success: false, message: "You don't have permission to delete this comment" };
    }
    await prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true }
    });
    await prisma.idea.update({
      where: { id: comment.ideaId },
      data: { commentCount: { decrement: 1 } }
    });
    await prisma.activityLog.create({
      data: {
        action: "DELETE_COMMENT",
        userId,
        details: {
          commentId,
          ideaId: comment.ideaId
        },
        ipAddress: "",
        userAgent: ""
      }
    });
    return {
      success: true,
      data: { ideaId: comment.ideaId }
    };
  } catch (error) {
    console.error("Delete comment error:", error);
    return { success: false, message: "Failed to delete comment" };
  }
};
var reportComment = async (commentId, reporterId, reason) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });
    if (!comment) {
      return { success: false, message: "Comment not found" };
    }
    const existingReport = await prisma.commentReport.findFirst({
      where: {
        commentId,
        reporterId,
        status: "PENDING"
      }
    });
    if (existingReport) {
      return { success: false, message: "You have already reported this comment" };
    }
    await prisma.commentReport.create({
      data: {
        commentId,
        reporterId,
        reason,
        status: "PENDING"
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Report comment error:", error);
    return { success: false, message: "Failed to report comment" };
  }
};
var commentService = {
  getUserComments,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  reportComment
};

// src/modules/comments/comment.controller.ts
var getUserComments2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const search = req.query.search;
    const sortBy = req.query.sortBy;
    const dateRange = req.query.dateRange;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await commentService.getUserComments(userId, {
      search,
      sortBy,
      dateRange,
      page,
      limit
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var getComments2 = async (req, res, next) => {
  try {
    const { ideaId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if (!ideaId) {
      return res.status(400).json({
        success: false,
        message: "Idea ID is required"
      });
    }
    const result = await commentService.getComments(ideaId, page, limit);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var createComment2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { ideaId } = req.params;
    const { content, parentId } = req.body;
    if (!ideaId) {
      return res.status(400).json({
        success: false,
        message: "Idea ID is required"
      });
    }
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required"
      });
    }
    if (content.length > 5e3) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 5000 characters"
      });
    }
    const result = await commentService.createComment(userId, ideaId, {
      content: content.trim(),
      parentId: parentId || null
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(201).json({
      success: true,
      data: result.data,
      message: "Comment posted successfully"
    });
  } catch (error) {
    next(error);
  }
};
var updateComment2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    const { content } = req.body;
    const isAdmin = req.user.role === "ADMIN";
    if (!commentId) {
      return res.status(400).json({
        success: false,
        message: "Comment ID is required"
      });
    }
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required"
      });
    }
    if (content.length > 5e3) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 5000 characters"
      });
    }
    const result = await commentService.updateComment(commentId, userId, isAdmin, {
      content: content.trim()
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      data: result.data,
      message: "Comment updated successfully"
    });
  } catch (error) {
    next(error);
  }
};
var deleteComment2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    const isAdmin = req.user.role === "ADMIN";
    if (!commentId) {
      return res.status(400).json({
        success: false,
        message: "Comment ID is required"
      });
    }
    const result = await commentService.deleteComment(commentId, userId, isAdmin);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
var reportComment2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    const { reason } = req.body;
    if (!commentId) {
      return res.status(400).json({
        success: false,
        message: "Comment ID is required"
      });
    }
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Report reason is required"
      });
    }
    if (reason.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Reason cannot exceed 500 characters"
      });
    }
    const result = await commentService.reportComment(commentId, userId, reason.trim());
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json({
      success: true,
      message: "Comment reported successfully. Our moderators will review it."
    });
  } catch (error) {
    next(error);
  }
};
var commentController = {
  getUserComments: getUserComments2,
  getComments: getComments2,
  createComment: createComment2,
  updateComment: updateComment2,
  deleteComment: deleteComment2,
  reportComment: reportComment2
};

// src/modules/comments/comment.route.ts
var router14 = express14.Router();
router14.get("/idea/:ideaId", commentController.getComments);
router14.use(auth_default(Role.MEMBER, Role.ADMIN));
router14.get("/user/comments", commentController.getUserComments);
router14.post("/idea/:ideaId", commentController.createComment);
router14.patch("/:commentId", commentController.updateComment);
router14.delete("/:commentId", commentController.deleteComment);
router14.post("/:commentId/report", commentController.reportComment);
var commentRouter = router14;

// src/app.ts
var app = express15();
var allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "https://greenspark1.vercel.app",
  "https://greenspark-server.vercel.app",
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
app.post("/api/v1/payments/webhook", express15.raw({ type: "application/json" }), PaymentController.handleWebhook);
app.use(express15.json());
app.use(optionalAuth);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/ideas", ideasRouter);
app.use("/api/v1/votes", voteRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/member", memberRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/members", memberProfileRouter);
app.use("/api/v1/admin/settings", adminSettingsRouter);
app.use("/api/v1/admin/users", userManagementRouter);
app.use("/api/v1/bookmarks", bookmarkRouter);
app.use("/api/v1/stats", statsRouter);
app.use("/api/v1/newsletter", newsletterRouter);
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
