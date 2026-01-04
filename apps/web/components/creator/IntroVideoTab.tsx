'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Video, Check } from 'lucide-react';
import { setIntroVideo } from '@/lib/actions/creator';
import { useRouter } from 'next/navigation';

interface IntroVideoTabProps {
  creatorId: string;
  currentIntroVideo: {
    id: string;
    title: string;
    videoId: string | null;
    thumbnailUrl: string | null;
  } | null;
  videoOptions: Array<{
    id: string;
    title: string;
    videoId: string | null;
    thumbnailUrl: string | null;
  }>;
}

export function IntroVideoTab({
  creatorId,
  currentIntroVideo,
  videoOptions,
}: IntroVideoTabProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(
    currentIntroVideo?.id || null
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await setIntroVideo(selectedVideoId);
      if (result.success) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error setting intro video:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Intro Video</h2>
        <p className="text-muted-foreground">
          Select a video to display as your introduction on your public profile
        </p>
      </div>

      {videoOptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No video content available. Create a video content first.
            </p>
            <Button onClick={() => router.push('/content/new')}>
              Create Video Content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {videoOptions.map((video) => {
              const isSelected = selectedVideoId === video.id;
              return (
                <Card
                  key={video.id}
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedVideoId(video.id)}
                >
                  <div className="aspect-video bg-muted relative">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-sm">{video.title}</CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedVideoId(null)}
              disabled={selectedVideoId === null}
            >
              Clear Selection
            </Button>
            <Button onClick={handleSave} disabled={isSaving || selectedVideoId === currentIntroVideo?.id}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

