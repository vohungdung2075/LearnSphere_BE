import { createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse, getDeletedCourses, restoreCourse } from "../services/course.service.js";

export const handleCreateCourse = async (req, res) => {
	const { title, description, thumbnail_url, enrollment_type } = req.body ?? {};

    if (typeof title !== "string" || !title.trim()) {
		return res.status(400).json({ message: "Course title is required and must be a string" });
	}
	try {
		const course = await createCourse(
			{ title, description, thumbnail_url, enrollment_type },
			req.user._id,
		);
		return res.status(201).json({ message: "Course created successfully", course });
	} catch (error) {
        if (error.message === "INVALID_ENROLLMENT_TYPE") return res.status(400).json({ message: "Invalid course enrollment-type" }); 
		if (error.message === "INVALID_DESCRIPTION") return res.status(400).json({ message: "Description must be a string" });
		if (error.message === "INVALID_THUMBNAIL_URL") return res.status(400).json({ message: "Thumbnail URL must be a string" });

		console.error("Create course error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};


export const handleGetAllCourses = async (req, res) => {
	try {
		const courses = await getAllCourses();
		return res.status(200).json(courses);
	} catch (error) {
		console.error("Get all courses error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};


export const handleGetCourseById = async (req, res) => {
	const { course_id } = req.params ?? {};
	try {
		const course = await getCourseById(course_id);
		return res.status(200).json(course);
	} catch (error) {
		if (error.message === "INVALID_COURSE_ID") return res.status(400).json({ message: "Invalid course ID format" });
		if (error.message === "COURSE_NOT_FOUND") return res.status(404).json({ message: "Course not found" });

		console.error("Get course by ID error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};


export const handleUpdateCourse = async (req, res) => {
	const { course_id } = req.params ?? {};
	const { title, description, thumbnail_url, enrollment_type } = req.body ?? {};
	try {
		const updated = await updateCourse(
			course_id,
			{ title, description, thumbnail_url, enrollment_type },
			req.user._id, 
			req.user.role
		);
		return res.status(200).json({ message: "Course updated successfully", course: updated });
	} catch (error) {
		if (error.message === "INVALID_COURSE_ID") return res.status(400).json({ message: "Invalid course ID format" }); 
		if (error.message === "COURSE_NOT_FOUND") return res.status(404).json({ message: "Course not found" }); 
		if (error.message === "NO_FIELDS_TO_UPDATE") return res.status(400).json({ message: "At least one field is required to update" });
		if (error.message === "INVALID_COURSE_TITLE") return res.status(400).json({ message: "Invalid course title format" }); 
		if (error.message === "INVALID_ENROLLMENT_TYPE") return res.status(400).json({ message: "Invalid course enrollment-type" }); 
		if (error.message === "INVALID_DESCRIPTION") return res.status(400).json({ message: "Description must be a string" });
		if (error.message === "INVALID_THUMBNAIL_URL") return res.status(400).json({ message: "Thumbnail URL must be a string" });
		if (error.message === "FORBIDDEN_COURSE_ACTION") return res.status(403).json({ message: "Forbidden - You do not have permission to modify this course" });

		console.error("Update course error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};


export const handleDeleteCourse = async (req, res) => {
	const { course_id } = req.params ?? {};
	try {
		const result = await deleteCourse(course_id, req.user._id, req.user.role);
		return res.status(200).json(result); 
	} catch (error) {
		if (error.message === "INVALID_COURSE_ID") return res.status(400).json({ message: "Invalid course ID format" });
		if (error.message === "COURSE_NOT_FOUND") return res.status(404).json({ message: "Course not found" });
		if (error.message === "FORBIDDEN_COURSE_ACTION") return res.status(403).json({ message: "Forbidden - You do not have permission to delete this course" });

		console.error("Delete course error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};


export const handleGetDeletedCourses = async (req, res) => {
	try {
		const courses = await getDeletedCourses(req.user._id, req.user.role);
		return res.status(200).json(courses);
	} catch (error) {
		console.error("Get deleted courses error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};


export const handleRestoreCourse = async (req, res) => {
	const { course_id } = req.params ?? {};
	try {
		const restored = await restoreCourse(course_id, req.user._id, req.user.role);
		return res.status(200).json({ message: "Course restored successfully", course: restored });
	} catch (error) {
		if (error.message === "INVALID_COURSE_ID") return res.status(400).json({ message: "Invalid course ID format" });
		if (error.message === "COURSE_NOT_FOUND") return res.status(404).json({ message: "Course not found" });
		if (error.message === "FORBIDDEN_COURSE_ACTION") return res.status(403).json({ message: "Forbidden - You do not have permission to restore this course" });

		console.error("Restore course error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};