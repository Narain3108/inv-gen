/**
 * Cloudinary Service
 * Handles image uploads to Cloudinary using unsigned uploads
 * Includes duplicate detection to save storage
 */

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dvwu6jtfm';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'logosign';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_RAW_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;

// Storage keys for uploaded image cache
const IMAGE_CACHE_KEY = 'cloudinary_uploaded_images';

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
}

interface CachedImage {
  hash: string;
  url: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Calculate SHA-256 hash of file for duplicate detection
 */
async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Get cached uploaded images from localStorage
 */
function getCachedImages(): CachedImage[] {
  try {
    const cached = localStorage.getItem(IMAGE_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.warn('Failed to read image cache:', error);
    return [];
  }
}

/**
 * Save uploaded image to cache
 */
function cacheUploadedImage(image: CachedImage): void {
  try {
    const cached = getCachedImages();
    // Remove old entry if exists
    const filtered = cached.filter(img => img.hash !== image.hash);
    // Add new entry
    filtered.push(image);
    // Keep only last 100 images
    const limited = filtered.slice(-100);
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(limited));
  } catch (error) {
    console.warn('Failed to cache image:', error);
  }
}

/**
 * Find existing upload by file hash
 */
async function findExistingUpload(file: File): Promise<string | null> {
  try {
    const hash = await calculateFileHash(file);
    const cached = getCachedImages();
    const existing = cached.find(img => 
      img.hash === hash && 
      img.fileName === file.name &&
      img.fileSize === file.size
    );
    
    if (existing) {
      console.log('🎯 Found existing upload for:', file.name);
      console.log('📦 Reusing URL:', existing.url);
      console.log('💾 Saved upload by reusing existing image');
      return existing.url;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to check for existing upload:', error);
    return null;
  }
}

/**
 * Upload image to Cloudinary with unsigned upload
 * Checks for duplicates first to save storage
 * @param file - Image file to upload
 * @param folder - Optional folder path in Cloudinary
 * @param onProgress - Optional progress callback
 * @returns Cloudinary upload response with secure URL
 */
export async function uploadToCloudinary(
  file: File,
  folder?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<CloudinaryUploadResponse> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Validate file size (3MB limit)
    const maxSize = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 3MB');
    }

    // Check for existing upload (duplicate detection)
    const existingUrl = await findExistingUpload(file);
    if (existingUrl) {
      // Return cached response structure
      return {
        secure_url: existingUrl,
        public_id: '',
        url: existingUrl,
        width: 0,
        height: 0,
        format: file.type.split('/')[1] || 'jpg',
        resource_type: 'image',
        created_at: new Date().toISOString(),
      };
    }

    console.log('📤 Uploading new image:', file.name);

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    // Use the 'logos' folder from your preset configuration
    if (folder) {
      formData.append('folder', folder);
    } else {
      formData.append('folder', 'logos');
    }

    // Upload to Cloudinary with progress tracking
    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            });
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          const response: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
          
          // Cache the uploaded image for future duplicate detection
          try {
            const hash = await calculateFileHash(file);
            cacheUploadedImage({
              hash,
              url: response.secure_url,
              publicId: response.public_id,
              fileName: file.name,
              fileSize: file.size,
              uploadedAt: Date.now(),
            });
            console.log('✅ Image uploaded and cached:', file.name);
          } catch (error) {
            console.warn('Failed to cache uploaded image:', error);
          }
          
          resolve(response);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was cancelled'));
      });

      // Send request
      xhr.open('POST', CLOUDINARY_UPLOAD_URL);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

/**
 * Upload document (image or PDF) to Cloudinary with unsigned upload
 * @param file - Document file to upload (image or PDF)
 * @param folder - Optional folder path in Cloudinary
 * @param onProgress - Optional progress callback
 * @returns Cloudinary upload response with secure URL
 */
export async function uploadDocumentToCloudinary(
  file: File,
  folder?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<CloudinaryUploadResponse> {
  try {
    // Validate file type
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    
    if (!isPdf && !isImage) {
      throw new Error('Only image or PDF files are allowed');
    }

    // Validate file size (3MB limit for purchase bills)
    const maxSize = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 3MB');
    }

    console.log('📤 Uploading document:', file.name, 'Type:', file.type);

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    if (folder) {
      formData.append('folder', folder);
    } else {
      formData.append('folder', 'purchase-bills');
    }

    // Use appropriate upload URL based on file type
    const uploadUrl = isPdf ? CLOUDINARY_RAW_UPLOAD_URL : CLOUDINARY_UPLOAD_URL;

    // Upload to Cloudinary with progress tracking
    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            });
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
          console.log('✅ Document uploaded successfully:', file.name);
          resolve(response);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was cancelled'));
      });

      // Send request
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Error uploading document to Cloudinary:', error);
    throw error;
  }
}

/**
 * Delete image from Cloudinary
 * Note: This requires a backend API route since deletion needs authentication
 * @param publicId - Public ID of the image to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    // This would need to be implemented via an API route
    // Since unsigned uploads can't delete images
    console.warn('Delete operation requires backend implementation');
    
    // Example API route call:
    // await fetch('/api/cloudinary/delete', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ publicId }),
    // });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
}

/**
 * Get optimized image URL from Cloudinary
 * @param url - Original Cloudinary URL
 * @param transformations - Image transformations (width, height, quality, etc.)
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  url: string,
  transformations?: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
  }
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const { width, height, quality = 'auto', format = 'auto', crop = 'fill' } = transformations || {};

  // Build transformation string
  const transforms: string[] = [];
  
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (quality) transforms.push(`q_${quality}`);
  if (format) transforms.push(`f_${format}`);
  if (crop) transforms.push(`c_${crop}`);

  if (transforms.length === 0) {
    return url;
  }

  // Insert transformations into URL
  const parts = url.split('/upload/');
  if (parts.length !== 2) {
    return url;
  }

  return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
}



/**
 * Convert Cloudinary URL to use transformation parameters
 * This forces JPEG format conversion on Cloudinary's servers (client-side, no backend needed)
 * @param url - Original Cloudinary URL
 * @returns Transformed URL that will return JPEG format
 */
function getCloudinaryJPEGUrl(url: string): string {
  if (!url.includes('cloudinary.com')) {
    return url; // Not a Cloudinary URL, return as-is
  }

  // Check if URL already has transformations
  if (url.includes('/upload/')) {
    // Insert transformation parameters after /upload/
    // f_jpg = force JPEG format
    // q_90 = quality 90% (good balance)
    // fl_lossy = allow lossy compression for smaller size
    return url.replace('/upload/', '/upload/f_jpg,q_90,fl_lossy/');
  }

  return url;
}

/**
 * Validate base64 image data
 * @param base64 - Base64 data URL
 * @returns true if valid, throws error if invalid
 */
function validateBase64Image(base64: string): boolean {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('Base64 data is empty or not a string');
  }

  if (!base64.startsWith('data:image/')) {
    throw new Error(`Invalid base64 format. Expected 'data:image/', got: ${base64.substring(0, 30)}`);
  }

  // Check if it has the base64 marker
  if (!base64.includes('base64,')) {
    throw new Error('Base64 data missing base64 marker');
  }

  // Get the actual base64 data (after the comma)
  const base64Data = base64.split(',')[1];
  if (!base64Data || base64Data.length < 100) {
    throw new Error(`Base64 data too short: ${base64Data?.length || 0} characters`);
  }

  // Validate base64 characters
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  if (!base64Regex.test(base64Data.substring(0, 100))) {
    throw new Error('Invalid base64 characters detected');
  }

  return true;
}

/**
 * Method 1: Fetch and convert using FileReader (fastest)
 */
async function fetchAndConvertToBase64(url: string): Promise<string> {
  console.log('📥 Method 1: Fetching image...');
  
  const response = await fetch(url, {
    mode: 'cors',
    credentials: 'omit',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const blob = await response.blob();
  console.log(`📦 Blob: ${blob.size} bytes, type: ${blob.type}`);

  if (!blob.type.startsWith('image/')) {
    throw new Error(`Invalid content type: ${blob.type}`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const result = reader.result as string;
        validateBase64Image(result);
        console.log(`✅ Method 1 success: ${result.length} chars`);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Method 2: Canvas conversion with JPEG encoding (most compatible)
 */
async function canvasConvertToJPEG(url: string): Promise<string> {
  console.log('🎨 Method 2: Canvas conversion...');
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      reject(new Error('Image load timeout (10s)'));
    }, 10000);
    
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        if (canvas.width === 0 || canvas.height === 0) {
          throw new Error(`Invalid dimensions: ${canvas.width}x${canvas.height}`);
        }
        
        console.log(`🖼️ Image dimensions: ${canvas.width}x${canvas.height}`);
        
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          throw new Error('Canvas context unavailable');
        }
        
        // Fill white background (handles transparency)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw image
        ctx.drawImage(img, 0, 0);
        
        // Convert to JPEG with high quality
        const base64 = canvas.toDataURL('image/jpeg', 0.92);
        
        validateBase64Image(base64);
        console.log(`✅ Method 2 success: ${base64.length} chars`);
        resolve(base64);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Image failed to load'));
    };
    
    img.src = url;
  });
}

/**
 * Method 3: XMLHttpRequest with ArrayBuffer (alternative fetch)
 */
async function xhrConvertToBase64(url: string): Promise<string> {
  console.log('📡 Method 3: XMLHttpRequest...');
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 10000;
    
    xhr.onload = () => {
      try {
        if (xhr.status !== 200) {
          throw new Error(`HTTP ${xhr.status}`);
        }
        
        const blob = new Blob([xhr.response], { type: xhr.getResponseHeader('Content-Type') || 'image/jpeg' });
        const reader = new FileReader();
        
        reader.onloadend = () => {
          try {
            const result = reader.result as string;
            validateBase64Image(result);
            console.log(`✅ Method 3 success: ${result.length} chars`);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsDataURL(blob);
      } catch (error) {
        reject(error);
      }
    };
    
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.ontimeout = () => reject(new Error('Request timeout'));
    
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.send();
  });
}

/**
 * Convert Cloudinary URL to base64 for PDF embedding
 * Uses Cloudinary transformation + multiple fallback methods
 * @param url - Cloudinary image URL
 * @returns Base64 data URL in JPEG format
 */
export async function cloudinaryUrlToBase64(url: string): Promise<string> {
  console.log('🔄 Converting to base64:', url);
  
  // Step 1: Transform URL to force JPEG format (Cloudinary does this server-side, no backend needed)
  const jpegUrl = getCloudinaryJPEGUrl(url);
  console.log('🔧 Transformed URL:', jpegUrl);
  
  // Try multiple methods in sequence with detailed error tracking
  const methods = [
    { name: 'Fetch + FileReader', fn: () => fetchAndConvertToBase64(jpegUrl) },
    { name: 'Canvas + JPEG', fn: () => canvasConvertToJPEG(jpegUrl) },
    { name: 'XMLHttpRequest', fn: () => xhrConvertToBase64(jpegUrl) },
  ];
  
  const errors: string[] = [];
  
  for (const method of methods) {
    try {
      console.log(`\n🔄 Trying: ${method.name}`);
      const result = await method.fn();
      console.log(`✅ SUCCESS with ${method.name}\n`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`❌ ${method.name} failed: ${errorMsg}`);
      errors.push(`${method.name}: ${errorMsg}`);
    }
  }
  
  // All methods failed
  console.error('❌ ALL METHODS FAILED');
  errors.forEach((err, i) => console.error(`  ${i + 1}. ${err}`));
  
  throw new Error(`Failed to convert image to base64. Tried ${methods.length} methods:\n${errors.join('\n')}`);
}

/**
 * Validate Cloudinary configuration
 * @returns true if Cloudinary is properly configured
 */
export function isCloudinaryConfigured(): boolean {
  return (
    CLOUDINARY_CLOUD_NAME !== 'your-cloud-name' &&
    CLOUDINARY_UPLOAD_PRESET !== 'unsigned_preset'
  );
}

/**
 * Clear the image upload cache
 * Useful for troubleshooting or freeing up localStorage
 */
export function clearImageCache(): void {
  try {
    localStorage.removeItem(IMAGE_CACHE_KEY);
    console.log('✅ Image cache cleared');
  } catch (error) {
    console.warn('Failed to clear image cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getImageCacheStats(): { count: number; oldestUpload: Date | null; newestUpload: Date | null } {
  const cached = getCachedImages();
  if (cached.length === 0) {
    return { count: 0, oldestUpload: null, newestUpload: null };
  }
  
  const timestamps = cached.map(img => img.uploadedAt);
  return {
    count: cached.length,
    oldestUpload: new Date(Math.min(...timestamps)),
    newestUpload: new Date(Math.max(...timestamps)),
  };
}
