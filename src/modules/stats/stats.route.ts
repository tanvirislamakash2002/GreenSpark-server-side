import express, { Router } from "express";
import { statsController } from "./stats.controller";

const router = express.Router();

router.get("/platform", statsController.getPlatformStats);

export const statsRouter: Router = router;