import mongoose from "mongoose";

const AttemptAnswerSchema = new mongoose.Schema(
	{
		question_id: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		answer_id: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		is_correct: {
			type: Boolean,
			required: true,
		},
	},
	{ _id: false },
);

const QuizAttemptSchema = new mongoose.Schema(
	{
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		quiz_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Quiz",
			required: true,
			index: true,
		},
		score: {
			type: Number,
			required: true,
			default: 0,
		},
		total_score: {
			type: Number,
			required: true,
			default: 0,
		},
		submitted_at: {
			type: Date,
			default: Date.now,
		},
		answers: {
			type: [AttemptAnswerSchema],
			default: [],
		},
	},
	{ timestamps: true },
);

QuizAttemptSchema.index({ user_id: 1, quiz_id: 1 });

const QuizAttempt = mongoose.model("QuizAttempt", QuizAttemptSchema);
export default QuizAttempt;
