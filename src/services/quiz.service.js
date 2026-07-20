import mongoose from "mongoose";
import Quiz from "../models/Quiz.model.js";
import QuizAttempt from "../models/QuizAttempt.model.js";
import Course from "../models/Course.model.js";
import Enrollment from "../models/Enrollment.model.js";

const checkActiveAttemptsExist = async (quizId) => {
	const hasActiveAttempt = await QuizAttempt.exists({ quiz_id: quizId, status: "in_progress", expires_at: { $gt: new Date() } });
	if (hasActiveAttempt) throw new Error("QUIZ_HAS_ACTIVE_ATTEMPTS");
};


export const createQuiz = async (courseId, { title, description, time_limit }, userId, userRole) => {
	if (!mongoose.isValidObjectId(courseId)) throw new Error("INVALID_COURSE_ID");

	const course = await Course.findOne({ _id: courseId, is_deleted: false });
	if (!course) throw new Error("COURSE_NOT_FOUND");

	const isOwner = course.created_by.toString() === userId.toString();
	if (userRole !== "admin" && !isOwner) throw new Error("FORBIDDEN_QUIZ_ACTION");

	if (typeof title !== "string" || !title.trim()) throw new Error("INVALID_QUIZ_TITLE");
	if (description !== undefined && typeof description !== "string") throw new Error("INVALID_DESCRIPTION");
	if (typeof time_limit !== "number" || !Number.isInteger(time_limit) || time_limit < 1) {
		throw new Error("INVALID_TIME_LIMIT");
	}

	const newQuiz = await Quiz.create({
		course_id: courseId,
		title: title.trim(),
		description: description ? description.trim() : "",
		time_limit,
		questions: [],
	});
	return newQuiz;
};


export const getCourseQuizzes = async (courseId, userId, userRole) => {
	if (!mongoose.isValidObjectId(courseId)) throw new Error("INVALID_COURSE_ID");

	const course = await Course.findOne({ _id: courseId, is_deleted: false });
	if (!course) throw new Error("COURSE_NOT_FOUND");

	if (userRole === "student") {
		const enrollment = await Enrollment.findOne({ user_id: userId, course_id: courseId, status: "active" });
		if (!enrollment) throw new Error("ACTIVE_ENROLLMENT_REQUIRED");
	} else if (userRole === "tutor") {
		const isOwner = course.created_by.toString() === userId.toString();
		if (!isOwner) throw new Error("FORBIDDEN_QUIZ_ACTION");
	}

	return await Quiz.find({ course_id: courseId }).select("-questions").sort({ createdAt: -1 });
};


export const updateQuiz = async (quizId, { title, description, time_limit }, userId, userRole) => {
	if (!mongoose.isValidObjectId(quizId)) throw new Error("INVALID_QUIZ_ID");

	const quiz = await Quiz.findById(quizId);
	if (!quiz) throw new Error("QUIZ_NOT_FOUND");

	const course = await Course.findOne({ _id: quiz.course_id, is_deleted: false });
	if (!course) throw new Error("COURSE_NOT_FOUND");

	const isOwner = course.created_by.toString() === userId.toString();
	if (userRole !== "admin" && !isOwner) throw new Error("FORBIDDEN_QUIZ_ACTION");

	await checkActiveAttemptsExist(quiz._id);

	if (title === undefined && description === undefined && time_limit === undefined) {
		throw new Error("NO_FIELDS_TO_UPDATE");
	}

	if (title !== undefined && (typeof title !== "string" || !title.trim())) throw new Error("INVALID_QUIZ_TITLE");
	if (description !== undefined && typeof description !== "string") throw new Error("INVALID_DESCRIPTION");
	if (time_limit !== undefined && (typeof time_limit !== "number" || !Number.isInteger(time_limit) || time_limit < 1)) {
		throw new Error("INVALID_TIME_LIMIT");
	}

	if (title) quiz.title = title.trim();
	if (description !== undefined) quiz.description = description.trim();
	if (time_limit) quiz.time_limit = time_limit;
	return await quiz.save();
};


export const deleteQuiz = async (quizId, userId, userRole) => {
	if (!mongoose.isValidObjectId(quizId)) throw new Error("INVALID_QUIZ_ID");

	const quiz = await Quiz.findById(quizId);
	if (!quiz) throw new Error("QUIZ_NOT_FOUND");

	const course = await Course.findOne({ _id: quiz.course_id, is_deleted: false });
	if (!course) throw new Error("COURSE_NOT_FOUND");

	const isOwner = course.created_by.toString() === userId.toString();
	if (userRole !== "admin" && !isOwner) throw new Error("FORBIDDEN_QUIZ_ACTION");

	await checkActiveAttemptsExist(quiz._id);
	await QuizAttempt.deleteMany({ quiz_id: quiz._id });
	await quiz.deleteOne();
	return { message: "Quiz and its attempts deleted successfully" };
};


export const addQuestion = async (quizId, questionData, userId, userRole) => {
	if (!mongoose.isValidObjectId(quizId)) throw new Error("INVALID_QUIZ_ID");

	const quiz = await Quiz.findById(quizId);
	if (!quiz) throw new Error("QUIZ_NOT_FOUND");

	const course = await Course.findOne({ _id: quiz.course_id, is_deleted: false });
	if (!course) throw new Error("COURSE_NOT_FOUND");

	const isOwner = course.created_by.toString() === userId.toString();
	if (userRole !== "admin" && !isOwner) throw new Error("FORBIDDEN_QUIZ_ACTION");

	await checkActiveAttemptsExist(quiz._id);
	const { content, question_type, point, answers } = questionData ?? {};

	if (typeof content !== "string" || !content.trim()) throw new Error("INVALID_QUESTION_CONTENT");
	if (!["single_choice", "multiple_choice"].includes(question_type)) throw new Error("INVALID_QUESTION_TYPE");
	if (typeof point !== "number" || !Number.isFinite(point) || point <= 0) throw new Error("INVALID_POINT");
	if (!Array.isArray(answers) || answers.length < 2) throw new Error("INVALID_ANSWERS");

	const normalizedContents = [];
	for (const ans of answers) {
		if (!ans || typeof ans !== "object" || typeof ans.content !== "string" || !ans.content.trim() || typeof ans.is_correct !== "boolean") throw new Error("INVALID_ANSWERS");
		if (typeof ans.is_correct !== "boolean") throw new Error("INVALID_ANSWERS");
		
		const cleanContent = ans.content.trim().toLowerCase();
		if (normalizedContents.includes(cleanContent)) throw new Error("DUPLICATE_ANSWER_CONTENT");
		normalizedContents.push(cleanContent);
	}

	const correctAnswers = answers.filter((ans) => ans.is_correct === true);
	if (question_type === "single_choice" && correctAnswers.length !== 1) throw new Error("SINGLE_CHOICE_REQUIRES_ONE_CORRECT_ANSWER");
	if (question_type === "multiple_choice" && correctAnswers.length < 1) throw new Error("MULTIPLE_CHOICE_REQUIRES_CORRECT_ANSWER");

	quiz.questions.push({
		content: content.trim(),
		question_type,
		point,
		answers: answers.map(ans => ({ content: ans.content.trim(), is_correct: ans.is_correct }))
	});
	await quiz.save();
	return quiz.questions[quiz.questions.length - 1]; 
};


export const getQuizQuestions = async (quizId, userId, userRole) => {
	if (!mongoose.isValidObjectId(quizId)) throw new Error("INVALID_QUIZ_ID");

	const quiz = await Quiz.findById(quizId);
	if (!quiz) throw new Error("QUIZ_NOT_FOUND");

	const course = await Course.findOne({ _id: quiz.course_id, is_deleted: false });
	if (!course) throw new Error("COURSE_NOT_FOUND");

	const isOwner = course.created_by.toString() === userId.toString();
	if (userRole !== "admin" && !isOwner) throw new Error("FORBIDDEN_QUIZ_ACTION");
	return quiz.questions; 
};


export const updateQuestion = async (quizId, questionId, questionData, userId, userRole) => {
	if (!mongoose.isValidObjectId(quizId)) throw new Error("INVALID_QUIZ_ID");
	if (!mongoose.isValidObjectId(questionId)) throw new Error("INVALID_QUESTION_ID");

	const quiz = await Quiz.findById(quizId);
	if (!quiz) throw new Error("QUIZ_NOT_FOUND");

	const course = await Course.findOne({ _id: quiz.course_id, is_deleted: false });
	if (!course) throw new Error("COURSE_NOT_FOUND");

	const isOwner = course.created_by.toString() === userId.toString();
	if (userRole !== "admin" && !isOwner) throw new Error("FORBIDDEN_QUIZ_ACTION");

	await checkActiveAttemptsExist(quiz._id);
	const question = quiz.questions.id(questionId);
	if (!question) throw new Error("QUESTION_NOT_FOUND");

	const { content, question_type, point, answers } = questionData ?? {};
    if (content === undefined && question_type === undefined && point === undefined && answers === undefined) {
		throw new Error("NO_FIELDS_TO_UPDATE");
	}
	if (content !== undefined && (typeof content !== "string" || !content.trim())) throw new Error("INVALID_QUESTION_CONTENT");
	if (question_type !== undefined && !["single_choice", "multiple_choice"].includes(question_type)) throw new Error("INVALID_QUESTION_TYPE");
	if (point !== undefined && (typeof point !== "number" || !Number.isFinite(point) || point <= 0)) throw new Error("INVALID_POINT");
	if (answers !== undefined && (!Array.isArray(answers) || answers.length < 2)) throw new Error("INVALID_ANSWERS");

	if (answers !== undefined) {
		const normalizedContents = [];
		for (const ans of answers) {
			if (!ans || typeof ans !== "object" || typeof ans.content !== "string" || !ans.content.trim() || typeof ans.is_correct !== "boolean") throw new Error("INVALID_ANSWERS");
			if (typeof ans.is_correct !== "boolean") throw new Error("INVALID_ANSWERS");
			
			const cleanContent = ans.content.trim().toLowerCase();
			if (normalizedContents.includes(cleanContent)) throw new Error("DUPLICATE_ANSWER_CONTENT");
			normalizedContents.push(cleanContent);
		}
	}
    const targetType = question_type ?? question.question_type;
	const targetAnswers = answers ?? question.answers;

	const correctAnswers = targetAnswers.filter((ans) => ans.is_correct === true);
	if (targetType === "single_choice" && correctAnswers.length !== 1) {
		throw new Error("SINGLE_CHOICE_REQUIRES_ONE_CORRECT_ANSWER");
	}
	if (targetType === "multiple_choice" && correctAnswers.length < 1) {
		throw new Error("MULTIPLE_CHOICE_REQUIRES_CORRECT_ANSWER");
	}

	if (content) question.content = content.trim();
	if (question_type) question.question_type = question_type;
	if (point !== undefined) question.point = point;
	if (answers) {
		question.answers = answers.map(ans => ({ content: ans.content.trim(), is_correct: ans.is_correct }));
	}
	await quiz.save();
	return question;
};


export const deleteQuestion = async (quizId, questionId, userId, userRole) => {
	if (!mongoose.isValidObjectId(quizId)) throw new Error("INVALID_QUIZ_ID");
	if (!mongoose.isValidObjectId(questionId)) throw new Error("INVALID_QUESTION_ID");

	const quiz = await Quiz.findById(quizId);
	if (!quiz) throw new Error("QUIZ_NOT_FOUND");

	const course = await Course.findOne({ _id: quiz.course_id, is_deleted: false });
	if (!course) throw new Error("COURSE_NOT_FOUND");

	const isOwner = course.created_by.toString() === userId.toString();
	if (userRole !== "admin" && !isOwner) throw new Error("FORBIDDEN_QUIZ_ACTION");

	await checkActiveAttemptsExist(quiz._id);
	const question = quiz.questions.id(questionId);
	if (!question) throw new Error("QUESTION_NOT_FOUND");

	question.deleteOne(); 
	await quiz.save();
	return { message: "Question deleted successfully from quiz" };
};


export const startQuiz = async (quizId, studentId) => {
	if (!mongoose.isValidObjectId(quizId)) throw new Error("INVALID_QUIZ_ID");

	const quiz = await Quiz.findById(quizId);
	if (!quiz) throw new Error("QUIZ_NOT_FOUND");
	if (!quiz.questions || quiz.questions.length === 0) throw new Error("QUIZ_HAS_NO_QUESTIONS");

	const course = await Course.findOne({ _id: quiz.course_id, is_deleted: false });
	if (!course) throw new Error("COURSE_NOT_FOUND");

	const enrollment = await Enrollment.findOne({ user_id: studentId, course_id: course._id, status: "active" });
	if (!enrollment) throw new Error("ACTIVE_ENROLLMENT_REQUIRED");

	const existingAttempt = await QuizAttempt.findOne({ user_id: studentId, quiz_id: quiz._id, status: "in_progress" });

	if (existingAttempt) {
		// Nếu đã hết hạn thì đánh dấu expired
		if (new Date() > existingAttempt.expires_at) {
			existingAttempt.status = "expired";
			await existingAttempt.save();
		} else {
			// Nếu vẫn còn thời gian, trả về đúng attempt đang dở dang
			return {
				attempt_id: existingAttempt._id,
				started_at: existingAttempt.started_at,
				expires_at: existingAttempt.expires_at,
				time_limit: quiz.time_limit,
				questions: quiz.questions.map((q) => ({
					_id: q._id,
					content: q.content,
					question_type: q.question_type,
					point: q.point,
					answers: q.answers.map((a) => ({ _id: a._id, content: a.content })),
				})),
			};
		}
	}

	const now = new Date();
	const expiresAt = new Date(now.getTime() + quiz.time_limit * 60 * 1000);

	const newAttempt = await QuizAttempt.create({
		user_id: studentId,
		quiz_id: quiz._id,
		course_id: quiz.course_id,
		status: "in_progress",
		started_at: now, 
		expires_at: expiresAt, 
		score: 0,
		total_score: 0,
		correct_answers: 0,
		total_questions: quiz.questions.length,
	});

	const questionsForStudent = quiz.questions.map((q) => ({
		_id: q._id,
		content: q.content,
		question_type: q.question_type,
		point: q.point,
		answers: q.answers.map((a) => ({ _id: a._id, content: a.content })),
	}));

	return {
		attempt_id: newAttempt._id, 
		started_at: newAttempt.started_at, 
		expires_at: newAttempt.expires_at, 
		time_limit: quiz.time_limit, 
		questions: questionsForStudent, 
	};
};

export const submitQuiz = async (attemptId, submittedAnswers, studentId) => {
	if (!mongoose.isValidObjectId(attemptId)) throw new Error("INVALID_ATTEMPT_ID");

	const submittedAt = new Date();

	const attempt = await QuizAttempt.findById(attemptId);
	if (!attempt) throw new Error("ATTEMPT_NOT_FOUND");

	if (attempt.user_id.toString() !== studentId.toString()) throw new Error("ATTEMPT_ACCESS_DENIED");

    if (attempt.status === "submitted") throw new Error("ATTEMPT_ALREADY_SUBMITTED");
	if (attempt.status === "expired") throw new Error("QUIZ_TIME_EXPIRED");

	if (submittedAt > attempt.expires_at) {
		attempt.status = "expired";
		await attempt.save();
		throw new Error("QUIZ_TIME_EXPIRED");
	}

	const course = await Course.findOne({ _id: attempt.course_id, is_deleted: false });
	if (!course) throw new Error("COURSE_NOT_FOUND");

	const quiz = await Quiz.findById(attempt.quiz_id);
	if (!quiz) throw new Error("QUIZ_NOT_FOUND");

	const enrollment = await Enrollment.findOne({ user_id: studentId, course_id: attempt.course_id, status: "active" });
	if (!enrollment) throw new Error("ACTIVE_ENROLLMENT_REQUIRED");

	if (!Array.isArray(submittedAnswers)) throw new Error("INVALID_SUBMISSION");

	const quizQuestionIds = new Set(quiz.questions.map((q) => q._id.toString()));
	const submittedQuestionIds = new Set();

	for (const submittedAnswer of submittedAnswers) {
		if (!submittedAnswer || typeof submittedAnswer !== "object" || !mongoose.isValidObjectId(submittedAnswer.question_id) || !Array.isArray(submittedAnswer.selected_answer_ids)) {
			throw new Error("INVALID_SUBMISSION");
		}

		const questionId = submittedAnswer.question_id.toString();
		if (!quizQuestionIds.has(questionId)) throw new Error("INVALID_SUBMISSION");
		if (submittedQuestionIds.has(questionId)) throw new Error("INVALID_SUBMISSION");

		submittedQuestionIds.add(questionId);
		const selectedIds = new Set();

		for (const answerId of submittedAnswer.selected_answer_ids) {
			if (!mongoose.isValidObjectId(answerId)) throw new Error("INVALID_SUBMISSION");

			const normalizedAnswerId = answerId.toString();
			if (selectedIds.has(normalizedAnswerId)) throw new Error("INVALID_SUBMISSION");
			selectedIds.add(normalizedAnswerId);
		}
	}

	let score = 0;
	let totalScore = 0;
	let correctAnswersCount = 0;
	const attemptAnswers = [];

	for (const question of quiz.questions) {
		totalScore += question.point;

		const userAns = submittedAnswers.find((ans) => ans.question_id.toString() === question._id.toString());
		const selectedAnswerIds = userAns ? userAns.selected_answer_ids : [];
		const selectedIdStrings = selectedAnswerIds.map(String);

		if (question.question_type === "single_choice" && selectedIdStrings.length > 1) {
			throw new Error("INVALID_SUBMISSION");
		}

		for (const idStr of selectedIdStrings) {
			const validAnswer = question.answers.find((a) => a._id.toString() === idStr);
			if (!validAnswer) throw new Error("INVALID_SUBMISSION");
		}

		const correctIds = question.answers
			.filter((answer) => answer.is_correct)
			.map((answer) => answer._id.toString());

		const isCorrect =
			selectedIdStrings.length === correctIds.length &&
			correctIds.every((id) => selectedIdStrings.includes(id));

		const earnedPoint = isCorrect ? question.point : 0;
		if (isCorrect) correctAnswersCount++;
		score += earnedPoint;

		const selectedAnswersSnapshot = [];
		for (const idStr of selectedIdStrings) {
			const targetAns = question.answers.find((a) => a._id.toString() === idStr);
			selectedAnswersSnapshot.push({
				answer_id: targetAns._id,
				content: targetAns.content,
			});
		}

		attemptAnswers.push({
			question_id: question._id,
			question_content: question.content,
			selected_answers: selectedAnswersSnapshot,
			is_correct: isCorrect,
			earned_point: earnedPoint,
			max_point: question.point,
		});
	}

	const durationSeconds = Math.max(0, Math.floor((submittedAt.getTime() - attempt.started_at.getTime()) / 1000));
	attempt.status = "submitted"; 
	attempt.score = score;
	attempt.total_score = totalScore;
	attempt.correct_answers = correctAnswersCount;
	attempt.submitted_at = submittedAt;
	attempt.duration_seconds = durationSeconds;
	attempt.answers = attemptAnswers;

	await attempt.save();

	return {
		attempt_id: attempt._id,
		status: attempt.status,
		score: attempt.score,
		total_score: attempt.total_score,
		correct_answers: attempt.correct_answers,
		total_questions: attempt.total_questions,
		duration_seconds: attempt.duration_seconds, 
		submitted_at: attempt.submitted_at,
	};
};


export const getQuizAttempts = async (quizId, userId, userRole) => {
	if (!mongoose.isValidObjectId(quizId)) throw new Error("INVALID_QUIZ_ID");

	const quiz = await Quiz.findById(quizId);
	if (!quiz) throw new Error("QUIZ_NOT_FOUND");

	const course = await Course.findOne({ _id: quiz.course_id, is_deleted: false });
	if (!course) throw new Error("COURSE_NOT_FOUND");

	const filter = { quiz_id: quizId };

	if (userRole === "student") {
		const enrollment = await Enrollment.findOne({ user_id: userId, course_id: course._id, status: "active" });
		if (!enrollment) throw new Error("ACTIVE_ENROLLMENT_REQUIRED");
		filter.user_id = userId;
	} else if (userRole === "tutor") {
		const isOwner = course.created_by.toString() === userId.toString();
		if (!isOwner) throw new Error("FORBIDDEN_QUIZ_ACTION");
	}

	return await QuizAttempt.find(filter)
		.populate("user_id", "full_name email")
		.sort({ submitted_at: -1 });
};


export const getAttemptById = async (attemptId, userId, userRole) => {
	if (!mongoose.isValidObjectId(attemptId)) throw new Error("INVALID_ATTEMPT_ID");

	const attempt = await QuizAttempt.findById(attemptId).populate("user_id", "full_name email");
	if (!attempt) throw new Error("ATTEMPT_NOT_FOUND");

	if (userRole === "admin") return attempt;

	if (userRole === "student") {
		if (!attempt.user_id || attempt.user_id._id.toString() !== userId.toString()) {
			throw new Error("ATTEMPT_ACCESS_DENIED");
		}
		const enrollment = await Enrollment.findOne({ user_id: userId, course_id: attempt.course_id, status: "active" });
		if (!enrollment) throw new Error("ACTIVE_ENROLLMENT_REQUIRED");
	}

	if (userRole === "tutor") {
		const course = await Course.findOne({ _id: attempt.course_id, is_deleted: false });
		if (!course || course.created_by.toString() !== userId.toString()) {
			throw new Error("ATTEMPT_ACCESS_DENIED");
		}
	}
	return attempt;
};