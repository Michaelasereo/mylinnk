'use client';

import { useState, useRef, useEffect } from 'react';

interface MuxVideoPlayerProps {
  playbackId: string;
  assetId?: string;
  title?: string;
  thumbnailUrl?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export function MuxVideoPlayer({
  playbackId,
  assetId,
  title,
  thumbnailUrl,
  className = '',
  autoplay = false,
  muted = false,
  controls = true,
  onPlay,
  onPause,
  onEnded,
}: MuxVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load Mux player script dynamically
  useEffect(() => {
    // Check if Mux player script is already loaded
    if (window.mux && window.mux.player) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mux/mux-player@2.7.0/dist/index.js';
    script.async = true;
    script.onload = () => {
      console.log('Mux player loaded successfully');
    };
    script.onerror = () => {
      console.warn('Failed to load Mux player, falling back to HTML5 video');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleError = (e: any) => {
    setIsLoading(false);
    setError('Failed to load video');
    console.error('Video player error:', e);
  };

  const handlePlay = () => {
    onPlay?.();
  };

  const handlePause = () => {
    onPause?.();
  };

  const handleEnded = () => {
    onEnded?.();
  };

  // Mux playback URL
  const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8`;

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-lg mb-2">⚠️</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Try to use Mux player if available, fallback to HTML5 video */}
      {typeof window !== 'undefined' && window.mux && window.mux.player ? (
        <mux-player
          playback-id={playbackId}
          metadata-video-id={assetId}
          metadata-video-title={title}
          poster={thumbnailUrl}
          controls={controls ? 'true' : 'false'}
          autoplay={autoplay ? 'true' : 'false'}
          muted={muted ? 'true' : 'false'}
          style={{
            width: '100%',
            height: 'auto',
            aspectRatio: '16/9',
            borderRadius: '0.5rem',
          }}
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          onError={handleError}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
        />
      ) : (
        <video
          ref={videoRef}
          src={playbackUrl}
          poster={thumbnailUrl}
          className="w-full h-full rounded-lg"
          controls={controls}
          autoPlay={autoplay}
          muted={muted}
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          onError={handleError}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          style={{
            aspectRatio: '16/9',
            width: '100%',
            height: 'auto',
          }}
          preload="metadata"
        >
          <p className="text-gray-500 text-sm">
            Your browser doesn't support HTML5 video.
            <a href={playbackUrl} className="text-blue-600 underline ml-1">
              Download the video
            </a>
          </p>
        </video>
      )}
    </div>
  );
}

// Add TypeScript declarations for Mux player
declare global {
  interface Window {
    mux?: {
      player?: any;
    };
  }
}

export default MuxVideoPlayer;
