import express, { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../generated/prisma/enums";
import { categoryController } from "./category.controller";

const router = express.Router();

// ============ Public Routes (No Authentication Required) ============
router.get("/", categoryController.getCategories);
router.get("/all", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);
router.get("/slug/:slug", categoryController.getCategoryBySlug);

// ============ Admin Only Routes ============
router.post("/", auth(Role.ADMIN), categoryController.createCategory);
router.patch("/:id", auth(Role.ADMIN), categoryController.updateCategory);
router.delete("/:id", auth(Role.ADMIN), categoryController.deleteCategory);
router.get("/check-slug", auth(Role.ADMIN), categoryController.checkSlug);

export const categoryRouter: Router = router;