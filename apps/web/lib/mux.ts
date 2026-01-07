import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export interface MuxUploadResult {
  assetId: string;
  playbackId: string;
  uploadUrl: string;
  uploadId: string;
}

export interface MuxAssetInfo {
  assetId: string;
  playbackId: string;
  status: string;
  duration?: number;
  aspectRatio?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export class MuxService {
  /**
   * Create a direct upload URL for a video file
   */
  static async createDirectUpload(): Promise<MuxUploadResult> {
    try {
      const upload = await mux.video.uploads.create({
        cors_origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        new_asset_settings: {
          playback_policy: ['public'],
          mp4_support: 'standard',
        },
      });

      return {
        assetId: upload.asset_id || '',
        playbackId: upload.playback_id || '',
        uploadUrl: upload.url || '',
        uploadId: upload.id || '',
      };
    } catch (error) {
      console.error('Error creating Mux direct upload:', error);
      throw new Error('Failed to create video upload URL');
    }
  }

  /**
   * Get asset information by asset ID
   */
  static async getAsset(assetId: string): Promise<MuxAssetInfo | null> {
    try {
      const asset = await mux.video.assets.retrieve(assetId);

      return {
        assetId: asset.id,
        playbackId: asset.playback_ids?.[0]?.id || '',
        status: asset.status || 'unknown',
        duration: asset.duration,
        aspectRatio: asset.aspect_ratio,
        thumbnailUrl: asset.playback_ids?.[0]?.policy === 'public'
          ? `https://image.mux.com/${asset.playback_ids[0].id}/thumbnail.jpg`
          : undefined,
        createdAt: asset.created_at || '',
      };
    } catch (error) {
      console.error('Error retrieving Mux asset:', error);
      return null;
    }
  }

  /**
   * Delete an asset from Mux
   */
  static async deleteAsset(assetId: string): Promise<boolean> {
    try {
      await mux.video.assets.delete(assetId);
      return true;
    } catch (error) {
      console.error('Error deleting Mux asset:', error);
      return false;
    }
  }

  /**
   * Get upload status
   */
  static async getUploadStatus(uploadId: string) {
    try {
      const upload = await mux.video.uploads.retrieve(uploadId);
      return {
        id: upload.id,
        status: upload.status || 'unknown',
        assetId: upload.asset_id,
        error: upload.error,
      };
    } catch (error) {
      console.error('Error retrieving upload status:', error);
      return null;
    }
  }
}

export default MuxService;
