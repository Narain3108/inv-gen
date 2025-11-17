/**
 * Alternative Image Conversion using Image Element
 * Use this if fetch() is blocked by CORS
 */

/**
 * Convert image URL to base64 using Image element (works around CORS)
 * @param url - Image URL
 * @returns Base64 data URL
 */
export async function imageUrlToBase64ViaCanvas(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Request CORS headers
    
    img.onload = () => {
      try {
        // Create canvas with image dimensions
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image on canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        // Convert canvas to base64
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        console.log('✅ Image converted via canvas, length:', base64.length);
        resolve(base64);
      } catch (error) {
        console.error('❌ Canvas conversion error:', error);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      console.error('❌ Image load error:', error);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}
