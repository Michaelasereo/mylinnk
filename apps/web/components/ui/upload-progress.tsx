'use client';

import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadProgress } from '@/lib/uploads/file-uploader';
import { Upload, Pause, Play, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadProgressProps {
  progress: UploadProgress;
  fileName: string;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function UploadProgressIndicator({
  progress,
  fileName,
  onPause,
  onResume,
  onCancel,
  className,
}: UploadProgressProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-600';
      case 'paused':
        return 'text-yellow-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'retrying':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 animate-pulse" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'retrying':
        return <Upload className="h-4 w-4 animate-spin" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon(progress.status)}
            <span className="text-sm font-medium truncate max-w-[200px]" title={fileName}>
              {fileName}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {onPause && progress.status === 'uploading' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onPause}
                className="h-8 w-8 p-0"
              >
                <Pause className="h-3 w-3" />
              </Button>
            )}

            {onResume && progress.status === 'paused' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onResume}
                className="h-8 w-8 p-0"
              >
                <Play className="h-3 w-3" />
              </Button>
            )}

            {onCancel && progress.status !== 'completed' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <Progress value={progress.percentage} className="mb-2" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>{progress.percentage.toFixed(1)}%</span>
            <span>{formatBytes(progress.loaded)} / {formatBytes(progress.total)}</span>
            {progress.speed > 0 && progress.status === 'uploading' && (
              <span>{formatSpeed(progress.speed)}</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {progress.eta > 0 && progress.status === 'uploading' && (
              <span>ETA: {formatTime(progress.eta)}</span>
            )}
            <span className={cn('capitalize', getStatusColor(progress.status))}>
              {progress.status}
            </span>
          </div>
        </div>

        {progress.status === 'retrying' && (
          <div className="mt-2 text-xs text-orange-600">
            Retrying upload due to previous failure...
          </div>
        )}

        {progress.status === 'failed' && (
          <div className="mt-2 text-xs text-red-600">
            Upload failed. Check your connection and try again.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
