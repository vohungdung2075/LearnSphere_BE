import mongoose from "mongoose";
import Course from "../models/Course.model.js";

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
	const courses = await Course.find()
		.populate("created_by", "full_name role") 
		.sort({ createdAt: -1 }); 

	return courses;
};


export const getCourseById = async (courseId) => {
	if (!mongoose.isValidObjectId(courseId)) throw new Error("INVALID_COURSE_ID");

	const course = await Course.findById(courseId)
		.populate("created_by", "full_name role");

	if (!course) throw new Error("COURSE_NOT_FOUND");

	return course;
};


export const updateCourse = async (courseId, { title, description, thumbnail_url, enrollment_type }, userId, userRole) => {
	if (!mongoose.isValidObjectId(courseId)) throw new Error("INVALID_COURSE_ID");
    
	const course = await Course.findById(courseId);
	if (!course) throw new Error("COURSE_NOT_FOUND");
    
	const isOwner = course.created_by.toString() === userId.toString();
	if (userRole !== "admin" && !isOwner) throw new Error("FORBIDDEN_COURSE_ACTION");
    
	if (title !== undefined && (typeof title !== "string" || !title.trim())) throw new Error("INVALID_COURSE_TITLE");
    if (description !== undefined && typeof description !== "string") throw new Error("INVALID_DESCRIPTION");
	if (thumbnail_url !== undefined && typeof thumbnail_url !== "string") throw new Error("INVALID_THUMBNAIL_URL");
    
	const allowedEnrollmentTypes = ["open", "approval_required"]; 
	if (enrollment_type !== undefined && !allowedEnrollmentTypes.includes(enrollment_type)) {
        throw new Error("INVALID_ENROLLMENT_TYPE");
    }
	
	if (title) course.title = title.trim();
	if (description !== undefined) course.description = typeof description === "string" ? description.trim() : "";
	if (thumbnail_url !== undefined) course.thumbnail_url = typeof thumbnail_url === "string" ? thumbnail_url.trim() : "";
	if (enrollment_type) course.enrollment_type = enrollment_type;

	const updatedCourse = await course.save();
	return updatedCourse;
};


export const deleteCourse = async (courseId, userId, userRole) => {
	if (!mongoose.isValidObjectId(courseId)) throw new Error("INVALID_COURSE_ID"); 

	const course = await Course.findById(courseId); 
	if (!course) throw new Error("COURSE_NOT_FOUND"); 

	const isOwner = course.created_by.toString() === userId.toString();
	if (userRole !== "admin" && !isOwner) throw new Error("FORBIDDEN_COURSE_ACTION"); 

	await course.deleteOne(); 
	return { message: "Course deleted successfully" };
};