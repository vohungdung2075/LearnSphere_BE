import mongoose from "mongoose";

const connectDB = async () => {
	const mongoUri = process.env.MONGODB_URI;

	if (!mongoUri) {
		console.error("MongoDB connection failed: MONGODB_URI is not defined");
        process.exit(1);
	}

	try {
		const connection = await mongoose.connect(mongoUri);

		console.log(`MongoDB connected: ${connection.connection.host}`);
		return connection;
	} catch (error) {
		console.error(`MongoDB connection failed: ${error.message}`);
		process.exit(1);
	}
};

mongoose.connection.on("disconnected", () => {
    console.warn("Disconnected to MongoDB! The system is attempting to reconnect...");
});

mongoose.connection.on("error", (err) => {
    console.error(`MongoDB database error occurred: ${err.message}`);
});

export default connectDB;
