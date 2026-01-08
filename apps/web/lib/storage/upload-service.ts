import { getR2Client } from './r2-client';

export interface UploadOptions {
  userId: string;
  file: File;
  type: 'avatar' | 'banner' | 'video' | 'image';
  metadata?: Record<string, string>;
  optimizeImages?: boolean;
  maxSizeMB?: number;
}

export interface UploadResult {
  success: boolean;
  url: string;
  key: string;
  size: number;
  type: string;
  metadata: Record<string, any>;
}

export class UploadService {
  /**
   * Main upload method - handles all file types
   */
  static async upload(options: UploadOptions): Promise<UploadResult> {
    const {
      userId,
      file,
      type,
      metadata = {},
      optimizeImages = true,
      maxSizeMB = type === 'video' ? 500 : 50, // 500MB for videos, 50MB for images
    } = options;

    try {
      // 1. Validate file
      await this.validateFile(file, {
        maxSizeMB,
        allowedTypes: this.getAllowedTypes(type),
      });

      // 2. Read file as buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let processedBuffer = buffer;
      let contentType = file.type;

      // 3. For now, skip image optimization (can add later with Sharp)
      // TODO: Add image optimization when Sharp is installed

      // 4. Check if R2 is configured, otherwise use fallback
      const isR2Configured = process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY;

      if (!isR2Configured) {
        console.log('⚠️ R2 not configured, using placeholder upload');

        // Fallback: Use placeholder URL for development
        const dimensions = type === 'avatar' ? '400x400' : '1200x400';
        const placeholderUrl = `https://via.placeholder.com/${dimensions}/4ECDC4/FFFFFF/png?text=${type.toUpperCase()}+${Date.now()}`;

        return {
          success: true,
          url: placeholderUrl,
          key: `placeholder-${Date.now()}`,
          size: buffer.byteLength,
          type: contentType,
          metadata: {
            ...metadata,
            userId,
            originalName: file.name,
            placeholder: true,
          },
        };
      }

      // 5. Generate unique key and upload to R2
      const r2Client = getR2Client();
      const key = r2Client.generateKey(userId, type, file.name);

      // 6. Upload to R2
      const uploadResult = await r2Client.uploadFile(key, processedBuffer, {
        contentType,
        metadata: {
          ...metadata,
          userId,
          originalName: file.name,
          originalType: file.type,
          originalSize: file.size.toString(),
          uploadedAt: Date.now().toString(),
        },
        isPublic: type !== 'video', // Videos use signed URLs for security
      });

      // 7. Return result
      return {
        success: true,
        url: uploadResult.url,
        key: uploadResult.key,
        size: uploadResult.size,
        type: contentType,
        metadata: {
          ...metadata,
          userId,
          originalName: file.name,
        },
      };

    } catch (error: any) {
      console.error(`Upload failed for ${type}:`, error);

      // If R2 upload fails, try fallback
      if (error.message.includes('R2 credentials')) {
        console.log('⚠️ R2 upload failed, using placeholder fallback');
        const dimensions = type === 'avatar' ? '400x400' : '1200x400';
        const placeholderUrl = `https://via.placeholder.com/${dimensions}/4ECDC4/FFFFFF/png?text=${type.toUpperCase()}+${Date.now()}`;

        return {
          success: true,
          url: placeholderUrl,
          key: `fallback-${Date.now()}`,
          size: file.size,
          type: file.type,
          metadata: {
            ...metadata,
            userId,
            originalName: file.name,
            fallback: true,
          },
        };
      }

      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Get signed URL for private content (like videos)
   */
  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const r2Client = getR2Client();
    return await r2Client.getSignedUrl(key, expiresIn);
  }

  /**
   * Delete uploaded file
   */
  static async deleteFile(key: string): Promise<void> {
    const r2Client = getR2Client();
    await r2Client.deleteFile(key);
  }

  /**
   * Validate file before upload
   */
  private static async validateFile(file: File, options: { maxSizeMB: number; allowedTypes: string[] }): Promise<void> {
    const { maxSizeMB, allowedTypes } = options;

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Additional validation can be added here
    if (file.size === 0) {
      throw new Error('File is empty');
    }
  }

  private static getAllowedTypes(type: string): string[] {
    const types: Record<string, string[]> = {
      avatar: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      banner: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
      video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'],
    };

    return types[type] || [];
  }
}
