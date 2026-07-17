import express from "express";
import { handleGetMyCourses } from "../controllers/enrollment.controller.js";
import { handleGetUsers, handleUpdateTutorAccountStatus } from "../controllers/user.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me/courses", protect, authorize("student"), handleGetMyCourses);
router.get("/", protect, authorize("admin"), handleGetUsers);
router.patch("/:user_id/status", protect, authorize("admin"), handleUpdateTutorAccountStatus);

export default router;
