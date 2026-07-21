import "dotenv/config";
import { S3Client } from "@aws-sdk/client-s3";

if (!process.env.AWS_REGION || !process.env.AWS_S3_BUCKET) {
	throw new Error("AWS_REGION and AWS_S3_BUCKET must be configured in environment variables");
}

const s3Client = new S3Client({
	region: process.env.AWS_REGION,
});

export default s3Client;