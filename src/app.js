import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import courseRoutes from "./routes/course.route.js";
import userRoutes from "./routes/user.route.js";
import lessonRoutes from "./routes/lesson.route.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.json({ message: "LearnSphere Platform API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/lessons", lessonRoutes);

export default app;
