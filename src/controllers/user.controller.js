import { getUsers, updateTutorAccountStatus } from "../services/user.service.js";

export const handleGetUsers = async (req, res) => {
	const { role, account_status } = req.query ?? {};
	try {
		const users = await getUsers({ role, account_status });
		return res.status(200).json(users);
	} catch (error) {
		if (error.message === "INVALID_USER_ROLE") return res.status(400).json({ message: "Invalid user role" });
		if (error.message === "INVALID_ACCOUNT_STATUS") return res.status(400).json({ message: "Invalid account status" });

		console.error("Get users error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const handleUpdateTutorAccountStatus = async (req, res) => {
	const { user_id } = req.params ?? {};
	const { account_status } = req.body ?? {};

	if (typeof account_status !== "string") {
		return res.status(400).json({
			message: "account_status is required and must be a string",
		});
	}

	try {
		const user = await updateTutorAccountStatus(user_id, account_status);
		const message =
			account_status === "active"
				? "Tutor account approved successfully"
				: "Tutor account blocked successfully";

		return res.status(200).json({
			message,
			user,
		});
	} catch (error) {
		if (error.message === "INVALID_USER_ID") {
			return res.status(400).json({ message: "Invalid user ID format" });
		}

		if (error.message === "INVALID_ACCOUNT_STATUS") {
			return res.status(400).json({
				message: "account_status must be active or blocked",
			});
		}

		if (error.message === "USER_NOT_FOUND") {
			return res.status(404).json({ message: "User not found" });
		}

		if (error.message === "TARGET_USER_NOT_TUTOR") {
			return res.status(409).json({
				message: "This endpoint can only update tutor accounts",
			});
		}

		console.error("Update tutor account status error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};
