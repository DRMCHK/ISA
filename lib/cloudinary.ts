import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
  width?: number;
  height?: number;
  format: string;
}

/**
 * Upload a base64-encoded file or a URL to Cloudinary.
 */
export async function uploadToCloudinary(
  data: string, // base64 data URI or URL
  folder = 'isa-link'
): Promise<CloudinaryUploadResult> {
  const result = await cloudinary.uploader.upload(data, {
    folder,
    resource_type: 'auto',
    quality: 'auto:good',
    fetch_format: 'auto',
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type as 'image' | 'video' | 'raw',
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

/**
 * Delete a file from Cloudinary by public ID.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
