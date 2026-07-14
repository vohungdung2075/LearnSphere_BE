import nodemailer from 'nodemailer'

export const sendEmail = async ({ email, subject, message, html }) => {
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.EMAIL,
			pass: process.env.EMAIL_PASSWORD,
		},
	});

	await transporter.sendMail({
		from: `LEARNSPHERE <${process.env.EMAIL}>`,
		to: email,
		subject,
		text: message,
		html,
	});
};