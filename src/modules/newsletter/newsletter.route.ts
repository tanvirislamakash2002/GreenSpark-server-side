import express, { Router } from "express";
import { newsletterController } from "./newsletter.controller";

const router = express.Router();

// Public route - no authentication required
router.post("/subscribe", newsletterController.subscribe);

export const newsletterRouter: Router = router;