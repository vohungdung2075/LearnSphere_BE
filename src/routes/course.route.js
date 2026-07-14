import express from "express";
import { handleCreateCourse, handleGetAllCourses, handleGetCourseById, handleUpdateCourse, handleDeleteCourse } from "../controllers/course.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", handleGetAllCourses);
router.get("/:course_id", handleGetCourseById);

router.post("/", protect, authorize("tutor", "admin"), handleCreateCourse);
router.put("/:course_id", protect, authorize("tutor", "admin"), handleUpdateCourse);
router.delete("/:course_id", protect, authorize("tutor", "admin"), handleDeleteCourse);

export default router;
