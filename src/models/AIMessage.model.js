import mongoose from "mongoose";

const AIMessageSchema = new mongoose.Schema(
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
			default: null,
			index: true,
		},
		lesson_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Lesson",
			default: null,
			index: true,
		},
		user_message: {
			type: String,
			required: true,
		},
		ai_response: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true },
);

const AIMessage = mongoose.model("AIMessage", AIMessageSchema);
export default AIMessage;
