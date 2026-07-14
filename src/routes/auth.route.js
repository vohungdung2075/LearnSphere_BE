import express from "express";
import { handleSignup, handleLogin, handleGetMe, handleForgotPassword, handleResetPassword } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", handleSignup);
router.post("/login", handleLogin);
router.get("/me", protect, handleGetMe);
router.post("/forgot-password", handleForgotPassword);
router.patch("/reset-password/:token", handleResetPassword);

export default router;
