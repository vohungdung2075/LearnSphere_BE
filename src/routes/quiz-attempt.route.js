import express from "express";
import { handleSubmitQuiz, handleGetAttemptById } from "../controllers/quiz.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/:attempt_id/submit", protect, authorize("student"), handleSubmitQuiz); 
router.get("/:attempt_id", protect, handleGetAttemptById);

export default router;