const STREAM_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const STREAM_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!STREAM_ACCOUNT_ID || !STREAM_API_TOKEN) {
  throw new Error('Missing Cloudflare Stream environment variables');
}

const STREAM_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${STREAM_ACCOUNT_ID}/stream`;

interface UploadVideoParams {
  file: File | Buffer;
  fileName: string;
  allowedOrigins?: string[];
  requireSignedURLs?: boolean;
}

interface VideoUploadResponse {
  result: {
    uid: string;
    status: {
      state: string;
    };
    playback: {
      hls: string;
      dash: string;
    };
    thumbnail: string;
  };
}

/**
 * Upload a video to Cloudflare Stream
 */
export async function uploadToStream(
  params: UploadVideoParams
): Promise<VideoUploadResponse['result']> {
  const formData = new FormData();
  
  if (params.file instanceof File) {
    formData.append('file', params.file);
  } else {
    formData.append('file', new Blob([params.file as BlobPart], { type: 'video/mp4' }));
  }

  if (params.allowedOrigins) {
    formData.append('allowedOrigins', JSON.stringify(params.allowedOrigins));
  }

  if (params.requireSignedURLs !== undefined) {
    formData.append('requireSignedURLs', String(params.requireSignedURLs));
  }

  const response = await fetch(`${STREAM_BASE_URL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STREAM_API_TOKEN}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload video');
  }

  const data: VideoUploadResponse = await response.json();
  return data.result;
}

/**
 * Get video details
 */
export async function getVideoDetails(videoId: string) {
  const response = await fetch(`${STREAM_BASE_URL}/${videoId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${STREAM_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get video details');
  }

  return response.json();
}

/**
 * Delete a video from Stream
 */
export async function deleteFromStream(videoId: string): Promise<void> {
  const response = await fetch(`${STREAM_BASE_URL}/${videoId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${STREAM_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete video');
  }
}

/**
 * Get video embed URL
 */
export function getStreamEmbedUrl(videoId: string): string {
  return `https://customer-${STREAM_ACCOUNT_ID}.cloudflarestream.com/${videoId}/iframe`;
}

