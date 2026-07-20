import mongoose from "mongoose";
import Course from "../models/Course.model.js";
import QuizAttempt from "../models/QuizAttempt.model.js";

export const createCourse = async ( { title, description, thumbnail_url, enrollment_type }, creatorId ) => {
	const allowedEnrollmentTypes = ["open", "approval_required"];
	if (!allowedEnrollmentTypes.includes(enrollment_type)) throw new Error("INVALID_ENROLLMENT_TYPE");
    if (description !== undefined && typeof description !== "string") throw new Error("INVALID_DESCRIPTION");
	if (thumbnail_url !== undefined && typeof thumbnail_url !== "string") throw new Error("INVALID_THUMBNAIL_URL");

	const new_course = await Course.create({
		title: title.trim(),
		description: description ? description.trim() : "",
		thumbnail_url: thumbnail_url ? thumbnail_url.trim() : "",
        enrollment_type: enrollment_type,
		created_by: creatorId,
	});

	return new_course;
};


export const getAllCourses = async () => {
	const courses = await Course.find({ is_deleted: false })
		.populate("created_by", "full_name role") 
		.sort({ createdAt: -1 }); 

	return courses;
};


export const getCourseById = async (courseId) => {
	if (!mongoose.isValidObjectId(courseId)) throw new Error("INVALID_COURSE_ID");

	const course = await Course.findOne({ _id: courseId, is_deleted: false })
		.populate("created_by", "full_name role");

	if (!course) throw new Error("COURSE_NOT_FOUND");

	return course;
};


export const updateCourse = async (courseId, { title, description, thumbnail_url, enrollment_type }, userId, userRole) => {
	if (!mongoose.isValidObjectId(courseId)) throw new Error("INVALID_COURSE_ID");
    
	const course = await Course.findOne({ _id: courseId, is_deleted: false });
	if (!course) throw new Error("COURSE_NOT_FOUND");
    
	const isOwner = course.created_by.toString() === userId.toString();
	if (userRole !== "admin" && !isOwner) throw new Error("FORBIDDEN_COURSE_ACTION");
    
	if (title === undefined && description === undefined && thumbnail_url === undefined && enrollment_type === undefined) {
		throw new Error("NO_FIELDS_TO_UPDATE");
	}

	if (title !== undefined && (typeof title !== "string" || !title.trim())) throw new Error("INVALID_COURSE_TITLE");
    if (description !== undefined && typeof description !== "string") throw new Error("INVALID_DESCRIPTION");
	if (thumbnail_url !== undefined && typeof thumbnail_url !== "string") throw new Error("INVALID_THUMBNAIL_URL");
    
	const allowedEnrollmentTypes = ["open", "approval_required"]; 
	if (enrollment_type !== undefined && !allowedEnrollmentTypes.includes(enrollment_type)) {
        throw new Error("INVALID_ENROLLMENT_TYPE");
    }
	
	if (title) course.title = title.trim();
	if (description !== undefined) course.description = description.trim();
	if (thumbnail_url !== undefined) course.thumbnail_url = thumbnail_url.trim();
	if (enrollment_type) course.enrollment_type = enrollment_type;

	const updatedCourse = await course.save();
	return updatedCourse;
};


export const deleteCourse = async (courseId, userId, userRole) => {
	if (!mongoose.isValidObjectId(courseId)) throw new Error("INVALID_COURSE_ID"); 

	const course = await Course.findOne({ _id: courseId, is_deleted: false }); 
	if (!course) throw new Error("COURSE_NOT_FOUND"); 

	const isOwner = course.created_by.toString() === userId.toString();
	if (userRole !== "admin" && !isOwner) throw new Error("FORBIDDEN_COURSE_ACTION"); 

	const activeAttempt = await QuizAttempt.exists({
		course_id: course._id,
		status: "in_progress",
		expires_at: { $gt: new Date() },
	});
	if (activeAttempt) throw new Error("COURSE_HAS_ACTIVE_QUIZ_ATTEMPTS");

	course.is_deleted = true;
	course.deleted_at = new Date();
	course.deleted_by = userId;

    await course.save();
	return { message: "Course moved to trash successfully" };
};


export const getDeletedCourses = async (userId, userRole) => {
	const filter = { is_deleted: true };
	
	if (userRole !== "admin") filter.created_by = userId;

	const courses = await Course.find(filter)
		.populate("created_by", "full_name role")
		.sort({ deleted_at: -1 });

	return courses;
};


export const restoreCourse = async (courseId, userId, userRole) => {
	if (!mongoose.isValidObjectId(courseId)) throw new Error("INVALID_COURSE_ID");

	const course = await Course.findOne({ _id: courseId, is_deleted: true });
	if (!course) throw new Error("COURSE_NOT_FOUND");

	const isOwner = course.created_by.toString() === userId.toString();
	if (userRole !== "admin" && !isOwner) {
		throw new Error("FORBIDDEN_COURSE_ACTION");
	}

	course.is_deleted = false;
	course.deleted_at = null;
	course.deleted_by = null;

	const restoredCourse = await course.save();
	return restoredCourse;
};
