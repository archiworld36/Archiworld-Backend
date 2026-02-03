// utils/uploadToS3.js
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("./s3");
const { randomUUID } = require("crypto");

module.exports.uploadStreamToS3 = async (file, folder) => {
  if (!file) throw new Error("File is undefined");

  const Key = `${folder}/${randomUUID()}-${file.originalname}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key,
      Body: file.buffer,          // ✅ BUFFER (multer default)
      ContentType: file.mimetype,
    })
  );

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`;
};
