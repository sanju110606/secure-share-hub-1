import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Optimize and sanitize image (remove EXIF data)
 */
export const optimizeImage = async (
  inputPath: string,
  outputPath: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<void> => {
  const { maxWidth = 2048, maxHeight = 2048, quality = 80 } = options;
  
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Calculate new dimensions while maintaining aspect ratio
    let width = metadata.width || maxWidth;
    let height = metadata.height || maxHeight;
    
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      
      if (width > height) {
        width = maxWidth;
        height = Math.round(width / aspectRatio);
      } else {
        height = maxHeight;
        width = Math.round(height * aspectRatio);
      }
    }
    
    // Process image: resize, strip metadata (EXIF), optimize
    await image
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .rotate() // Auto-rotate based on EXIF orientation
      .withMetadata({ // Strip all metadata except orientation
        orientation: metadata.orientation,
      })
      .toFormat(metadata.format || 'jpeg', {
        quality,
        progressive: true,
      })
      .toFile(outputPath);
    
    console.log(`Image optimized: ${inputPath} -> ${outputPath}`);
  } catch (error) {
    console.error('Image optimization error:', error);
    throw new Error('Failed to optimize image');
  }
};

/**
 * Remove EXIF data from image
 */
export const removeExifData = async (
  inputPath: string,
  outputPath: string
): Promise<void> => {
  try {
    const image = sharp(inputPath);
    
    // Remove all metadata
    await image
      .withMetadata({}) // Empty metadata
      .toFile(outputPath);
    
    console.log(`EXIF data removed: ${inputPath} -> ${outputPath}`);
  } catch (error) {
    console.error('EXIF removal error:', error);
    throw new Error('Failed to remove EXIF data');
  }
};

/**
 * Process uploaded image (optimize and remove EXIF)
 */
export const processUploadedImage = async (
  filePath: string
): Promise<void> => {
  try {
    const tempPath = `${filePath}.temp`;
    
    // Optimize and remove EXIF
    await optimizeImage(filePath, tempPath);
    
    // Replace original file with processed file
    fs.unlinkSync(filePath);
    fs.renameSync(tempPath, filePath);
    
    console.log(`Image processed successfully: ${filePath}`);
  } catch (error) {
    console.error('Image processing error:', error);
    // If processing fails, keep the original file
    const tempPath = `${filePath}.temp`;
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    throw error;
  }
};

/**
 * Get image dimensions
 */
export const getImageDimensions = async (
  filePath: string
): Promise<{ width: number; height: number }> => {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    console.error('Get image dimensions error:', error);
    throw new Error('Failed to get image dimensions');
  }
};
