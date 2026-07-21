import mongoose from "mongoose";

const LessonSchema = new mongoose.Schema(
	{
		course_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Course",
			required: true,
			index: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
		},
		content: {
			type: String,
			default: "",
		},
		video_key: {
			type: String,
			default: "",
			trim: true,
		},
		document_key: {
			type: String,
			default: "",
			trim: true,
		},
		order_index: {
			type: Number,
			required: true,
			min: 1,
			validate: Number.isInteger,
		},
	},
	{ timestamps: true },
);

LessonSchema.index({ course_id: 1, order_index: 1 }, { unique: true });

const Lesson = mongoose.model("Lesson", LessonSchema);
export default Lesson;
