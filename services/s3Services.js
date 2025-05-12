import dotenv from 'dotenv';
dotenv.config();

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadFile = async (file) => {
  if (!file || !file.buffer) {
    console.error("File or buffer is missing!");
    throw new Error("File buffer is missing");
  }

  const key = `uploads/${Date.now().toString()}_${file.originalname}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
  };

  try {
    const data = await s3Client.send(new PutObjectCommand(params));
    // console.log("Upload successful:", data);

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
    return { Location: fileUrl }; 
  } catch (err) {
    console.error("Error uploading file:", err);
    throw err;
  }
};
