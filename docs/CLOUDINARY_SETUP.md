# Cloudinary Integration Setup Guide

## Overview
The Invoice Generator now supports uploading company logos and authorized signatures via Cloudinary. Images are uploaded directly from the browser using unsigned uploads (no backend required).

## Features
✅ Upload company logo (displays in PDF header)  
✅ Upload authorized signature (displays in PDF footer)  
✅ Direct browser upload (client-side only)  
✅ Drag & drop or click to upload  
✅ Image preview and validation  
✅ Progress indicator during upload  
✅ 5MB file size limit  
✅ PNG/JPG format support  

## Setup Instructions

### 1. Create Cloudinary Account
1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email

### 2. Configure Upload Preset
1. Log in to Cloudinary Console
2. Navigate to **Settings** > **Upload** > **Upload presets**
3. Click **Add upload preset** button
4. Configure the preset:
   - **Preset name**: Choose any name (e.g., `invoice_generator_unsigned`)
   - **Signing Mode**: Select **Unsigned**
   - **Folder** (optional): `company-assets` (organizes uploads)
   - **Allowed formats**: `jpg, png`
   - **Max file size**: `5MB`
   - **Access mode**: Public
5. Click **Save**
6. Copy the **Upload preset name** for next step

### 3. Get Cloud Name
1. Go to **Dashboard** in Cloudinary Console
2. Find your **Cloud name** at the top
3. Copy it for the next step

### 4. Configure Environment Variables
1. Open or create `.env.local` file in your project root
2. Add these variables:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```
3. Replace `your_cloud_name` with the Cloud Name from step 3
4. Replace `your_unsigned_upload_preset` with the preset name from step 2

Example:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxyz123abc
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=invoice_generator_unsigned
```

### 5. Restart Development Server
After adding environment variables:
```bash
# Stop the current server (Ctrl+C)
pnpm dev
```

## Usage

### Upload Company Logo
1. Go to **Settings** > **Company** in your dashboard
2. Find the **Company Logo** section
3. Click or drag & drop an image
4. Wait for upload to complete
5. Save the company form

### Upload Authorized Signature
1. Go to **Settings** > **Company** in your dashboard
2. Find the **Authorized Signature** section
3. Click or drag & drop an image
4. Wait for upload to complete
5. Save the company form

### View in Generated PDFs
- **Logo**: Appears in the header of invoices and quotations
- **Signature**: Appears in the footer above "Authorized Signatory" label

## Image Recommendations

### Company Logo
- **Recommended size**: 200x200 pixels
- **Format**: PNG (transparent background recommended)
- **Aspect ratio**: Square (1:1) or slightly wider
- **File size**: Under 500KB

### Authorized Signature
- **Recommended size**: 150x50 pixels
- **Format**: PNG (transparent background recommended)
- **Aspect ratio**: Wide (3:1 or 2:1)
- **File size**: Under 200KB

## File Structure

### New Files Created
```
src/
├── lib/
│   └── services/
│       └── cloudinary-service.ts      # Cloudinary upload logic
└── components/
    └── shared/
        └── ImageUpload.tsx             # Reusable upload component
```

### Updated Files
```
src/
├── components/
│   ├── company/
│   │   └── CompanyForm.tsx             # Added upload UI
│   └── shared/
│       └── index.ts                    # Export ImageUpload
└── lib/
    └── utils/
        └── pdf/
            └── footer-builder.ts       # Added signature image display
```

## Technical Details

### Cloudinary Service (`cloudinary-service.ts`)
Functions:
- `uploadToCloudinary()` - Upload image with progress tracking
- `getOptimizedImageUrl()` - Apply transformations to URLs
- `cloudinaryUrlToBase64()` - Convert for PDF embedding
- `isCloudinaryConfigured()` - Validate configuration

### ImageUpload Component (`ImageUpload.tsx`)
Features:
- Drag & drop interface
- Click to browse files
- Image preview
- Upload progress bar
- File validation (type, size)
- Error handling
- Remove/replace image

### PDF Integration
- **Header**: Logo displays if `company.logoUrl` exists
- **Footer**: Signature displays if `company.signatureUrl` exists
- **Fallback**: Shows company initials/text if no image

## Troubleshooting

### "Upload failed" error
- Check if environment variables are set correctly
- Verify upload preset is set to "Unsigned"
- Ensure file size is under 5MB
- Check file format (only PNG/JPG allowed)

### "Only image files allowed" error
- Make sure you're uploading PNG or JPG files
- Avoid uploading PDFs, documents, or other formats

### Images not showing in PDF
- Verify the image uploaded successfully (check preview)
- Save the company form after uploading
- Generate a new PDF to see changes
- Check browser console for errors

### Environment variables not working
- Ensure `.env.local` file is in project root
- Variable names must start with `NEXT_PUBLIC_`
- Restart dev server after adding variables
- Check for typos in variable names

## Security Notes

### Unsigned Uploads
- ✅ Simple setup - no backend required
- ✅ Direct browser-to-Cloudinary uploads
- ⚠️ Anyone with your preset name can upload
- 💡 Recommendation: Enable strict upload restrictions in Cloudinary

### Recommendations
1. Set folder restrictions in upload preset
2. Enable allowed formats (jpg, png only)
3. Set max file size limit (5MB)
4. Use Cloudinary's moderation features
5. Regularly review uploaded assets

## Cost Considerations

### Free Tier Limits (Cloudinary)
- ✅ 25 GB storage
- ✅ 25 GB bandwidth/month
- ✅ Unlimited uploads
- ✅ Basic transformations

For a small-to-medium business invoice generator, the free tier is sufficient.

## Next Steps

### Optional Enhancements
1. **Image cropping**: Add crop tool before upload
2. **Multiple logos**: Support different logos per invoice
3. **Signature templates**: Pre-made signature designs
4. **Image optimization**: Auto-compress before upload
5. **Backend validation**: Add API route for secure deletion

## Support

If you encounter issues:
1. Check Cloudinary Console for upload logs
2. Review browser console for errors
3. Verify environment variables are set
4. Ensure upload preset is configured correctly
5. Check network tab for failed requests

## References

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Unsigned Upload Guide](https://cloudinary.com/documentation/upload_images#unsigned_upload)
- [Upload Presets](https://cloudinary.com/documentation/upload_presets)
