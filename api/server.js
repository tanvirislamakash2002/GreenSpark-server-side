import {
  Role,
  auth,
  prisma,
  prismaNamespace_exports
} from "./chunk-KDVDRSJO.js";

// src/app.ts
import { toNodeHandler } from "better-auth/node";
import express8 from "express";
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
    const authModule = await import("./auth-L6VU3WWT.js");
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
var getRecentIdeas = async (userId, limit) => {
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
var memberService = {
  getDashboardData,
  getStats,
  getRecentIdeas
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
var getRecentIdeas2 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;
    const result = await memberService.getRecentIdeas(userId, limit);
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
  getStats: getStats2,
  getRecentIdeas: getRecentIdeas2
};

// src/modules/dashboard/member/member.route.ts
var router2 = express2.Router();
router2.use(auth_default(Role.MEMBER));
router2.get("/dashboard", memberController.getDashboard);
router2.get("/stats", memberController.getStats);
router2.get("/ideas/recent", memberController.getRecentIdeas);
router2.get("/ideas", memberController.getMemberIdeas);
router2.delete("/ideas/:ideaId", memberController.deleteIdea);
router2.patch("/ideas/:ideaId/submit", memberController.submitIdea);
var memberRouter = router2;

// src/modules/dashboard/admin/admin.route.ts
import express3 from "express";

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
        return { date: dateStr, count };
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
        return { date: dateStr, count };
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
        },
        pendingIdeas: pendingIdeasList.map((idea) => ({
          id: idea.id,
          title: idea.title,
          problemStatement: idea.problemStatement,
          author: idea.author,
          category: idea.categories[0]?.category || { id: "", name: "Uncategorized" },
          createdAt: idea.createdAt,
          voteScore: idea.voteScore
        })),
        recentActivity: activities,
        topContributors: contributors,
        recentUsers: recentUsersList,
        reportedCommentsCount,
        chartData: {
          ideasOverTime,
          usersOverTime,
          ideasByCategory,
          ideasByStatus: ideasByStatus.map((item) => ({
            status: item.status,
            count: item._count.status
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
      }
    };
  } catch (error) {
    console.error("Get stats error:", error);
    return { success: false, message: "Failed to fetch stats" };
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
  getPendingIdeas,
  getRecentActivity
};

// src/modules/dashboard/admin/admin.controller.ts
var getDashboard2 = async (req, res, next) => {
  try {
    const result = await adminService.getDashboardData();
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
var getPendingIdeas2 = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await adminService.getPendingIdeas(limit);
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
  getPendingIdeas: getPendingIdeas2,
  getRecentActivity: getRecentActivity2
};

// src/modules/dashboard/admin/admin.route.ts
var router3 = express3.Router();
router3.use(auth_default(Role.ADMIN));
router3.get("/dashboard", adminController.getDashboard);
router3.get("/stats", adminController.getStats);
router3.get("/ideas/pending", adminController.getPendingIdeas);
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
var getRecentIdeas3 = async (limit) => {
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
var getIdeaById = async (id) => {
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
    await prisma.idea.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
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
        feedback: idea.feedback,
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
      }
    };
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
  getRecentIdeas: getRecentIdeas3,
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
  } catch (error) {
    next(error);
  }
};
var getTopVotedIdeas2 = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const result = await publicIdeasService.getTopVotedIdeas(limit);
  } catch (error) {
    next(error);
  }
};
var getRecentIdeas4 = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const result = await publicIdeasService.getRecentIdeas(limit);
  } catch (error) {
    next(error);
  }
};
var getIdeaById2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid idea ID"
      });
    }
    const result = await publicIdeasService.getIdeaById(id);
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
  getRecentIdeas: getRecentIdeas4,
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
var adminDeleteIdea = async (ideaId, adminId, reason) => {
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
var adminDeleteIdea2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { reason } = req.body;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid idea ID"
      });
    }
    const result = await adminIdeasService.adminDeleteIdea(id, adminId, reason);
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
  adminDeleteIdea: adminDeleteIdea2,
  approveIdea: approveIdea2,
  rejectIdea: rejectIdea2,
  featureIdea: featureIdea2
};

// src/modules/ideas/ideas.route.ts
var router5 = express5.Router();
router5.get("/", publicIdeasController.getIdeas);
router5.get("/featured", publicIdeasController.getFeaturedIdeas);
router5.get("/top-voted", publicIdeasController.getTopVotedIdeas);
router5.get("/recent", publicIdeasController.getRecentIdeas);
router5.get("/:id", publicIdeasController.getIdeaById);
router5.get("/slug/:slug", publicIdeasController.getIdeaBySlug);
router5.post("/", auth_default(Role.MEMBER), memberIdeasController.createIdea);
router5.patch("/member/:id", auth_default(Role.MEMBER), memberIdeasController.updateIdea);
router5.delete("/:id", auth_default(Role.MEMBER), memberIdeasController.deleteIdea);
router5.patch("/:id/submit", auth_default(Role.MEMBER), memberIdeasController.submitIdea);
router5.get("/admin/ideas", auth_default(Role.ADMIN), adminIdeasController.getAdminIdeas);
router5.delete("/admin/ideas/:id", auth_default(Role.ADMIN), adminIdeasController.adminDeleteIdea);
router5.patch("/:id/approve", auth_default(Role.ADMIN), adminIdeasController.approveIdea);
router5.patch("/:id/reject", auth_default(Role.ADMIN), adminIdeasController.rejectIdea);
router5.patch("/:id/feature", auth_default(Role.ADMIN), adminIdeasController.featureIdea);
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

// src/app.ts
var app = express8();
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
app.use(express8.json());
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/ideas", ideasRouter);
app.use("/api/v1/member", memberRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/stats", statsRouter);
app.use("/api/v1/newsletter", newsletterRouter);
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
