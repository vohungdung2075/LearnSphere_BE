import express from "express";
import {
	handleCreatePresignedUpload,
	handleCreatePresignedDownload,
	handleGetCourseThumbnail,
} from "../controllers/file.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/presigned-upload", protect, authorize("tutor", "admin"), handleCreatePresignedUpload);
router.get("/presigned-download", protect, handleCreatePresignedDownload);
router.get("/course-thumbnail/:course_id", handleGetCourseThumbnail);

export default router;
