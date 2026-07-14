import mongoose from "mongoose";

const LessonProgressSchema = new mongoose.Schema(
	{
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		course_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Course",
			required: true,
			index: true,
		},
		lesson_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Lesson",
			required: true,
			index: true,
		},
		is_completed: {
			type: Boolean,
			default: false,
		},
		completed_at: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true },
);

LessonProgressSchema.index({ user_id: 1, lesson_id: 1 }, { unique: true });
LessonProgressSchema.index({ user_id: 1, course_id: 1 });

const LessonProgress = mongoose.model("LessonProgress", LessonProgressSchema);
export default LessonProgress;
