import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "../config/r2Client.js";
import path from "node:path";

function sanitizeFilename(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // sin acentos
    .replace(/[^a-zA-Z0-9.\-_]/g, "-");
}

export async function uploadImageToR2(fileBuffer, originalName, folder = "meli") {
  const ext = path.extname(originalName) || ".jpg";
  const base = path.basename(originalName, ext);
  const safeName = sanitizeFilename(base);
  const key = `${folder}/${Date.now()}-${safeName}${ext}`;

  const putCmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    // ContentType opcional; si querés ser prolijo:
    // ContentType: "image/jpeg" | "image/png" según el archivo
  });

  await r2Client.send(putCmd);

  const publicUrl = `${process.env.R2_PUBLIC_BASE_URL}/${key}`;

  return { key, url: publicUrl };
}
