import mongoose from "mongoose";

const EnrollmentSchema = new mongoose.Schema(
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
		status: {
			type: String,
			enum: ["pending", "active"],
			required: true,
		},
		requested_at: {
			type: Date,
			default: Date.now,
		},
		approved_at: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true },
);

EnrollmentSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

const Enrollment = mongoose.model("Enrollment", EnrollmentSchema);
export default Enrollment;
