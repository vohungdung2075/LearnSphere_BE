import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			default: "",
		},
		thumbnail_url: {
			type: String,
			default: "",
		},
		enrollment_type: {
			type: String,
			enum: ["open", "approval_required"],
			required: true,
		},
		created_by: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
	},
	{ timestamps: true },
);

const Course = mongoose.model("Course", CourseSchema);
export default Course;
