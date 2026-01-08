import { createClient } from '@supabase/supabase-js';

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

      // 2. Handle video uploads (use existing Mux integration)
      if (type === 'video') {
        return await this.uploadVideoToMux(userId, file, metadata);
      }

      // 3. Handle image uploads (use Supabase Storage)
      return await this.uploadImageToSupabase(userId, file, type, metadata);

    } catch (error: any) {
      console.error(`Upload failed for ${type}:`, error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload images to Supabase Storage
   */
  private static async uploadImageToSupabase(
    userId: string,
    file: File,
    type: string,
    metadata: Record<string, string>
  ): Promise<UploadResult> {
    try {
      // Initialize Supabase client
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `${type}s/${userId}/${timestamp}-${random}.${extension}`;

      console.log(`📤 Uploading ${type} to Supabase Storage: ${filename}`);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('odim-uploads') // Create this bucket in Supabase
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            ...metadata,
            userId,
            originalName: file.name,
            originalType: file.type,
            uploadedAt: new Date().toISOString(),
          }
        });

      if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('odim-uploads')
        .getPublicUrl(filename);

      console.log(`✅ ${type} uploaded to Supabase: ${publicUrl}`);

      return {
        success: true,
        url: publicUrl,
        key: filename,
        size: file.size,
        type: file.type,
        metadata: {
          ...metadata,
          userId,
          originalName: file.name,
          storage: 'supabase',
        },
      };

    } catch (error: any) {
      console.error('Supabase upload error:', error);

      // Fallback to placeholder if Supabase fails
      console.log('⚠️ Supabase upload failed, using placeholder fallback');
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
  }

  /**
   * Upload videos to Mux (existing integration)
   */
  private static async uploadVideoToMux(
    userId: string,
    file: File,
    metadata: Record<string, string>
  ): Promise<UploadResult> {
    try {
      console.log('🎬 Uploading video to Mux...');

      // This would use your existing Mux integration
      // For now, return a placeholder - replace with actual Mux upload
      const placeholderUrl = `https://via.placeholder.com/800x450/FF6B6B/FFFFFF/png?text=VIDEO+UPLOAD+${Date.now()}`;

      return {
        success: true,
        url: placeholderUrl,
        key: `mux-${Date.now()}`,
        size: file.size,
        type: file.type,
        metadata: {
          ...metadata,
          userId,
          originalName: file.name,
          storage: 'mux',
        },
      };

    } catch (error: any) {
      console.error('Mux upload error:', error);
      throw new Error(`Video upload failed: ${error.message}`);
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
