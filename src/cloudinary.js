/*
 * Cloudinary — the project's only image host. Unsigned uploads via a
 * fixed preset; every admin image field routes through this helper and
 * stores the returned secure_url in Firestore.
 */

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadImageToCloudinary(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(CLOUDINARY_URL, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(`Cloudinary upload failed (${res.status})`);
  }
  const data = await res.json();
  if (!data.secure_url) throw new Error("Cloudinary returned no URL");
  return data.secure_url;
}
