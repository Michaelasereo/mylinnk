export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  eta: number; // estimated time remaining in seconds
  status: 'idle' | 'uploading' | 'paused' | 'completed' | 'failed' | 'retrying';
}

export interface UploadOptions {
  chunkSize?: number; // Default 1MB chunks
  maxRetries?: number; // Default 3 retries
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
  resumeOnFailure?: boolean; // Default true
}

export interface UploadSession {
  id: string;
  file: File;
  fileName: string;
  totalSize: number;
  uploadedSize: number;
  chunks: ChunkInfo[];
  status: 'active' | 'paused' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
}

export interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  size: number;
  uploaded: boolean;
  hash?: string; // For integrity checking
}

/**
 * Advanced file uploader with chunking, resume, and progress tracking
 */
export class FileUploader {
  private options: Required<UploadOptions>;
  private uploadSession: UploadSession | null = null;
  private abortController: AbortController | null = null;
  private startTime: number = 0;

  constructor(options: UploadOptions = {}) {
    this.options = {
      chunkSize: 1024 * 1024, // 1MB chunks
      maxRetries: 3,
      onProgress: () => {},
      onComplete: () => {},
      onError: () => {},
      resumeOnFailure: true,
      ...options,
    };
  }

  /**
   * Start or resume file upload
   */
  async upload(file: File, endpoint: string): Promise<void> {
    this.startTime = Date.now();

    // Check if we have a resumable session for this file
    const existingSession = this.loadUploadSession(file);

    if (existingSession && existingSession.status === 'paused') {
      this.uploadSession = existingSession;
      console.log(`Resuming upload for ${file.name}`);
    } else {
      // Create new upload session
      this.uploadSession = this.createUploadSession(file);
    }

    this.abortController = new AbortController();

    try {
      const result = await this.uploadChunks(endpoint);
      this.options.onComplete(result);
      this.cleanupSession();
    } catch (error) {
      if (this.options.resumeOnFailure && !this.abortController.signal.aborted) {
        this.saveUploadSession();
      }
      this.options.onError(error as Error);
    }
  }

  /**
   * Pause the current upload
   */
  pause(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.uploadSession) {
      this.uploadSession.status = 'paused';
      this.saveUploadSession();
    }
  }

  /**
   * Resume a paused upload
   */
  async resume(endpoint: string): Promise<void> {
    if (!this.uploadSession || this.uploadSession.status !== 'paused') {
      throw new Error('No paused upload session found');
    }

    this.uploadSession.status = 'active';
    await this.upload(this.uploadSession.file, endpoint);
  }

  /**
   * Cancel the upload completely
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.cleanupSession();
  }

  /**
   * Get current upload progress
   */
  getProgress(): UploadProgress | null {
    if (!this.uploadSession) return null;

    const { uploadedSize, totalSize } = this.uploadSession;
    const elapsed = (Date.now() - this.startTime) / 1000;
    const speed = elapsed > 0 ? uploadedSize / elapsed : 0;
    const eta = speed > 0 ? (totalSize - uploadedSize) / speed : 0;

    return {
      loaded: uploadedSize,
      total: totalSize,
      percentage: (uploadedSize / totalSize) * 100,
      speed,
      eta,
      status: this.uploadSession.status as any,
    };
  }

  /**
   * Create upload session for chunked upload
   */
  private createUploadSession(file: File): UploadSession {
    const chunks: ChunkInfo[] = [];
    const totalChunks = Math.ceil(file.size / this.options.chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.options.chunkSize;
      const end = Math.min(start + this.options.chunkSize, file.size);

      chunks.push({
        index: i,
        start,
        end,
        size: end - start,
        uploaded: false,
      });
    }

    return {
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      fileName: file.name,
      totalSize: file.size,
      uploadedSize: 0,
      chunks,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Upload file in chunks with resume capability
   */
  private async uploadChunks(endpoint: string): Promise<any> {
    if (!this.uploadSession) throw new Error('No upload session');

    const { chunks, file } = this.uploadSession;

    // Upload chunks that haven't been uploaded yet
    for (const chunk of chunks) {
      if (chunk.uploaded) continue;

      let retries = 0;
      while (retries <= this.options.maxRetries) {
        try {
          const result = await this.uploadChunk(chunk, file, endpoint);
          chunk.uploaded = true;
          this.uploadSession.uploadedSize += chunk.size;
          this.uploadSession.updatedAt = Date.now();
          this.updateProgress();
          break; // Success, exit retry loop
        } catch (error) {
          retries++;
          console.warn(`Chunk ${chunk.index} failed (attempt ${retries}/${this.options.maxRetries + 1}):`, error);

          if (retries > this.options.maxRetries) {
            throw new Error(`Failed to upload chunk ${chunk.index} after ${retries} attempts`);
          }

          // Wait before retry (exponential backoff)
          await this.delay(Math.pow(2, retries) * 1000);
        }
      }
    }

    // All chunks uploaded, finalize the upload
    return await this.finalizeUpload(endpoint);
  }

  /**
   * Upload a single chunk
   */
  private async uploadChunk(chunk: ChunkInfo, file: File, endpoint: string): Promise<any> {
    const chunkData = file.slice(chunk.start, chunk.end);
    const formData = new FormData();

    formData.append('chunk', chunkData);
    formData.append('chunkIndex', chunk.index.toString());
    formData.append('totalChunks', this.uploadSession!.chunks.length.toString());
    formData.append('fileName', file.name);
    formData.append('totalSize', file.size.toString());
    formData.append('uploadId', this.uploadSession!.id);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Finalize the upload after all chunks are uploaded
   */
  private async finalizeUpload(endpoint: string): Promise<any> {
    if (!this.uploadSession) throw new Error('No upload session');

    const response = await fetch(`${endpoint}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId: this.uploadSession.id,
        fileName: this.uploadSession.fileName,
        totalSize: this.uploadSession.totalSize,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to finalize upload');
    }

    return response.json();
  }

  /**
   * Update progress and notify listeners
   */
  private updateProgress(): void {
    const progress = this.getProgress();
    if (progress) {
      this.options.onProgress(progress);
    }
  }

  /**
   * Save upload session to localStorage for resume capability
   */
  private saveUploadSession(): void {
    if (!this.uploadSession) return;

    try {
      // Create a serializable version (without the File object)
      const serializableSession = {
        ...this.uploadSession,
        file: undefined, // File objects can't be serialized
      };

      localStorage.setItem(
        `upload_session_${this.uploadSession.id}`,
        JSON.stringify(serializableSession)
      );
    } catch (error) {
      console.warn('Failed to save upload session:', error);
    }
  }

  /**
   * Load existing upload session from localStorage
   */
  private loadUploadSession(file: File): UploadSession | null {
    try {
      // Look for existing sessions for this file
      const keys = Object.keys(localStorage);
      const sessionKeys = keys.filter(key => key.startsWith('upload_session_'));

      for (const key of sessionKeys) {
        const sessionData = JSON.parse(localStorage.getItem(key) || '{}');

        // Match by file name and size
        if (sessionData.fileName === file.name &&
            sessionData.totalSize === file.size &&
            sessionData.status === 'paused') {
          // Restore the File object
          return {
            ...sessionData,
            file,
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load upload session:', error);
    }

    return null;
  }

  /**
   * Clean up upload session
   */
  private cleanupSession(): void {
    if (this.uploadSession) {
      localStorage.removeItem(`upload_session_${this.uploadSession.id}`);
      this.uploadSession = null;
    }
    this.abortController = null;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * React hook for file uploading
 */
export function useFileUploader(options: UploadOptions = {}) {
  const uploader = new FileUploader(options);

  const uploadFile = (file: File, endpoint: string) => {
    return uploader.upload(file, endpoint);
  };

  const pauseUpload = () => {
    uploader.pause();
  };

  const resumeUpload = (endpoint: string) => {
    return uploader.resume(endpoint);
  };

  const cancelUpload = () => {
    uploader.cancel();
  };

  const getUploadProgress = () => {
    return uploader.getProgress();
  };

  return {
    uploadFile,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    getUploadProgress,
  };
}

/**
 * Clean up old upload sessions (maintenance function)
 */
export function cleanupOldUploadSessions(maxAgeHours: number = 24): void {
  try {
    const keys = Object.keys(localStorage);
    const sessionKeys = keys.filter(key => key.startsWith('upload_session_'));
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    const now = Date.now();

    sessionKeys.forEach(key => {
      try {
        const session = JSON.parse(localStorage.getItem(key) || '{}');
        if (now - session.updatedAt > maxAge) {
          localStorage.removeItem(key);
        }
      } catch {
        // Remove corrupted sessions
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to cleanup upload sessions:', error);
  }
}
