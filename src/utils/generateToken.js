import jwt from "jsonwebtoken";

export const generateToken = (userId, tokenVersion = 0) => {
	return jwt.sign(
		{ id: userId, token_version: tokenVersion },
		process.env.JWT_SECRET,
		{
			expiresIn: process.env.JWT_EXPIRES_IN,
		},
	);
};
