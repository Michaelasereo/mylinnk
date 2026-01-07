'use client';

import MuxPlayer from '@mux/mux-player-react';
import { useState } from 'react';

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
    console.error('Mux player error:', e);
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

      <MuxPlayer
        playbackId={playbackId}
        metadata={{
          video_id: assetId,
          video_title: title,
        }}
        poster={thumbnailUrl}
        className="w-full h-full rounded-lg"
        autoplay={autoplay}
        muted={muted}
        controls={controls}
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
      />
    </div>
  );
}

export default MuxVideoPlayer;
