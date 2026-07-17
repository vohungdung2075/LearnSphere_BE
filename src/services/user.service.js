import mongoose from "mongoose";
import User from "../models/User.model.js";

const allowedRoles = ["student", "tutor", "admin"];
const allowedAccountStatuses = ["pending", "active", "blocked"];

export const getUsers = async ({ role, account_status }) => {
	if (role !== undefined && !allowedRoles.includes(role)) throw new Error("INVALID_USER_ROLE");

	if (account_status !== undefined && !allowedAccountStatuses.includes(account_status)) {
		throw new Error("INVALID_ACCOUNT_STATUS");
	}

	const filter = {};
	if (role !== undefined) filter.role = role;
	if (account_status !== undefined) filter.account_status = account_status;

	return User.find(filter)
		.select("full_name email role account_status createdAt updatedAt")
		.sort({ createdAt: -1 });
};

export const updateTutorAccountStatus = async (userId, accountStatus) => {
	if (!mongoose.isValidObjectId(userId)) throw new Error("INVALID_USER_ID");

	if (!["active", "blocked"].includes(accountStatus)) throw new Error("INVALID_ACCOUNT_STATUS");

	const user = await User.findById(userId);
	if (!user) throw new Error("USER_NOT_FOUND");

	if (user.role !== "tutor") throw new Error("TARGET_USER_NOT_TUTOR");

	user.account_status = accountStatus;
	await user.save();
	return {
		id: user._id,
		full_name: user.full_name,
		email: user.email,
		role: user.role,
		account_status: user.account_status,
		created_at: user.createdAt,
		updated_at: user.updatedAt,
	};
};
