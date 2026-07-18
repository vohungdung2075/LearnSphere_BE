import express from "express";
import { handleCreateCourse, handleGetAllCourses, handleGetCourseById, handleUpdateCourse, handleDeleteCourse, handleGetDeletedCourses, handleRestoreCourse } from "../controllers/course.controller.js";
import { handleEnrollCourse, handleUnenrollCourse, handleGetCourseEnrollments, handleApproveEnrollment, handleRejectEnrollment } from "../controllers/enrollment.controller.js";
import { handleCreateLesson, handleGetCourseLessons, handleGetCourseProgress } from "../controllers/lesson.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", handleGetAllCourses);
router.get("/mine/deleted", protect, authorize("tutor", "admin"), handleGetDeletedCourses);
router.get("/:course_id", handleGetCourseById);

router.post("/", protect, authorize("tutor", "admin"), handleCreateCourse);
router.put("/:course_id", protect, authorize("tutor", "admin"), handleUpdateCourse);
router.delete("/:course_id", protect, authorize("tutor", "admin"), handleDeleteCourse);
router.patch("/:course_id/restore", protect, authorize("tutor", "admin"), handleRestoreCourse);

router.post("/:course_id/enroll", protect, authorize("student"), handleEnrollCourse);
router.delete("/:course_id/enroll", protect, authorize("student"), handleUnenrollCourse);

router.get("/:course_id/enrollments", protect, authorize("tutor", "admin"), handleGetCourseEnrollments);
router.patch("/:course_id/enrollments/:enrollment_id/approve", protect, authorize("tutor", "admin"), handleApproveEnrollment);
router.delete("/:course_id/enrollments/:enrollment_id", protect, authorize("tutor", "admin"), handleRejectEnrollment);

router.get("/:course_id/lessons", protect, handleGetCourseLessons);
router.post("/:course_id/lessons", protect, authorize("tutor", "admin"), handleCreateLesson);
router.get("/:course_id/progress", protect, authorize("student"), handleGetCourseProgress);
export default router;
