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
		video_url: {
			type: String,
			default: "",
		},
		document_url: {
			type: String,
			default: "",
		},
		order_index: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true },
);

LessonSchema.index({ course_id: 1, order_index: 1 });

const Lesson = mongoose.model("Lesson", LessonSchema);
export default Lesson;
