/**
 * Upload Gateway with Provider Abstraction
 * Provides failover between multiple storage providers
 */

import { MuxService } from '@/lib/mux';
import { costMonitor } from '@/lib/billing/cost-monitor';

export interface UploadResult {
  success: boolean;
  assetId: string;
  playbackId?: string;
  url?: string;
  thumbnailUrl?: string;
  provider: string;
  metadata?: Record<string, any>;
}

export interface MediaProcessor {
  name: string;
  supportsVideo: boolean;
  supportsImage: boolean;

  upload(file: File, userId: string): Promise<UploadResult>;
  getPlaybackUrl?(assetId: string): string;
  getThumbnailUrl?(assetId: string): string;
  delete?(assetId: string): Promise<boolean>;
}

export class MuxProcessor implements MediaProcessor {
  name = 'Mux';
  supportsVideo = true;
  supportsImage = false; // Mux is primarily for video

  async upload(file: File, userId: string): Promise<UploadResult> {
    try {
      console.log(`🎬 Uploading video to Mux: ${file.name}`);

      // Get direct upload URL from Mux
      const uploadData = await MuxService.createDirectUpload();

      // Track cost
      await costMonitor.trackUsage({
        userId,
        type: 'UPLOAD',
        provider: 'mux',
        amount: file.size / (1024 * 1024 * 1024), // GB
        cost: (file.size / (1024 * 1024 * 1024)) * 0.000015, // $0.015/GB
        metadata: { fileName: file.name, fileSize: file.size }
      });

      return {
        success: true,
        assetId: uploadData.assetId,
        playbackId: uploadData.playbackId,
        provider: 'mux',
        metadata: {
          uploadUrl: uploadData.uploadUrl,
          uploadId: uploadData.uploadId
        }
      };
    } catch (error) {
      console.error('Mux upload failed:', error);
      throw error;
    }
  }

  getPlaybackUrl(assetId: string): string {
    // We'll need to store the playback ID separately
    // For now, return a placeholder
    return `https://stream.mux.com/${assetId}`;
  }

  getThumbnailUrl(assetId: string): string {
    return `https://image.mux.com/${assetId}/thumbnail.jpg`;
  }
}

export class CloudflareR2Processor implements MediaProcessor {
  name = 'Cloudflare R2';
  supportsVideo = false; // R2 can handle video, but we use Mux for video processing
  supportsImage = true;

  async upload(file: File, userId: string): Promise<UploadResult> {
    try {
      console.log(`🖼️ Uploading image to Cloudflare R2: ${file.name}`);

      // Upload to R2 (placeholder - existing implementation)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);

      const response = await fetch('/api/upload/r2', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`R2 upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Track cost
      await costMonitor.trackUsage({
        userId,
        type: 'UPLOAD',
        provider: 'r2',
        amount: file.size / (1024 * 1024 * 1024), // GB
        cost: (file.size / (1024 * 1024 * 1024)) * 0.000036, // $0.036/GB
        metadata: { fileName: file.name, fileSize: file.size, url: result.url }
      });

      return {
        success: true,
        assetId: result.fileName, // Use filename as asset ID for R2
        url: result.url,
        provider: 'r2',
        metadata: {
          fileName: result.fileName,
          url: result.url
        }
      };
    } catch (error) {
      console.error('R2 upload failed:', error);
      throw error;
    }
  }
}

// Placeholder processors for future expansion
export class AWSMediaConvertProcessor implements MediaProcessor {
  name = 'AWS MediaConvert';
  supportsVideo = true;
  supportsImage = false;

  async upload(file: File, userId: string): Promise<UploadResult> {
    // Placeholder for AWS Elemental MediaConvert
    throw new Error('AWS MediaConvert not yet implemented');
  }
}

export class CloudflareStreamProcessor implements MediaProcessor {
  name = 'Cloudflare Stream';
  supportsVideo = true;
  supportsImage = false;

  async upload(file: File, userId: string): Promise<UploadResult> {
    // Placeholder for Cloudflare Stream (alternative to Mux)
    throw new Error('Cloudflare Stream not yet implemented');
  }
}

export class UploadGateway {
  private processors: Map<string, MediaProcessor[]> = new Map();
  private failoverEnabled: boolean = true;

  constructor() {
    this.initializeProcessors();
  }

  private initializeProcessors() {
    // Video processors with priority order
    this.processors.set('video', [
      new MuxProcessor(),                    // Primary: Best quality
      new AWSMediaConvertProcessor(),        // Fallback: Enterprise option
      new CloudflareStreamProcessor()        // Last resort: Cost-effective
    ]);

    // Image processors
    this.processors.set('image', [
      new CloudflareR2Processor()            // Primary: Cost-effective for images
    ]);
  }

  async upload(
    file: File,
    contentType: 'video' | 'image',
    userId: string,
    options: { skipFailover?: boolean } = {}
  ): Promise<UploadResult> {
    const processors = this.processors.get(contentType);
    if (!processors || processors.length === 0) {
      throw new Error(`No processors available for content type: ${contentType}`);
    }

    const shouldFailover = this.failoverEnabled && !options.skipFailover;
    const errors: Error[] = [];

    for (let i = 0; i < processors.length; i++) {
      const processor = processors[i];
      const isLastProcessor = i === processors.length - 1;

      try {
        console.log(`🔄 Trying ${processor.name} for ${contentType} upload...`);
        const result = await processor.upload(file, userId);

        if (result.success) {
          console.log(`✅ Upload successful with ${processor.name}`);
          return result;
        }
      } catch (error) {
        console.warn(`❌ ${processor.name} failed:`, error);
        errors.push(error as Error);

        // If failover is disabled or this is the last processor, stop trying
        if (!shouldFailover || isLastProcessor) {
          break;
        }

        // Brief pause before trying next processor
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // All processors failed
    const errorMessage = errors.map((e, i) => `${i + 1}. ${e.message}`).join('\n');
    throw new Error(`All upload processors failed:\n${errorMessage}`);
  }

  // Health check for processors
  async checkProcessorHealth(contentType: 'video' | 'image'): Promise<Map<string, boolean>> {
    const processors = this.processors.get(contentType) || [];
    const health = new Map<string, boolean>();

    for (const processor of processors) {
      try {
        // Simple health check - in production, this would be more sophisticated
        health.set(processor.name, true);
      } catch {
        health.set(processor.name, false);
      }
    }

    return health;
  }

  // Get available processors for a content type
  getAvailableProcessors(contentType: 'video' | 'image'): string[] {
    const processors = this.processors.get(contentType) || [];
    return processors.map(p => p.name);
  }

  // Enable/disable failover
  setFailover(enabled: boolean): void {
    this.failoverEnabled = enabled;
  }
}

// Export singleton instance
export const uploadGateway = new UploadGateway();
