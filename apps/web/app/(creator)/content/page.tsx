import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@odim/database';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ContentList } from '@/components/creator/ContentList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CollectionsTab } from '@/components/creator/CollectionsTab';
import { IntroVideoTab } from '@/components/creator/IntroVideoTab';

export default async function ContentPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    include: {
      introVideo: {
        select: {
          id: true,
          title: true,
          muxAssetId: true,
          muxPlaybackId: true,
          thumbnailUrl: true,
        },
      },
    },
  });

  if (!creator) {
    redirect('/onboard');
  }

  const content = await prisma.content.findMany({
    where: { creatorId: creator.id },
    orderBy: { createdAt: 'desc' },
  });

  const collections = await prisma.collection.findMany({
    where: { creatorId: creator.id },
    include: {
      sections: {
        include: {
          sectionContents: {
            include: {
              content: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get all video content for intro video selection
  const videoContent = await prisma.content.findMany({
    where: {
      creatorId: creator.id,
      type: 'video',
      muxPlaybackId: { not: null },
    },
    select: {
      id: true,
      title: true,
      muxAssetId: true,
      muxPlaybackId: true,
      thumbnailUrl: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Content</h1>
          <p className="text-muted-foreground">
            Manage your content, collections, and intro video
          </p>
        </div>
        <Link href="/dashboard/booking">
          <Button variant="outline">
            Manage Bookings
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="intro-video">Intro Video</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="mt-6">
          <ContentList content={content} creator={creator} />
        </TabsContent>
        <TabsContent value="collections" className="mt-6">
          <CollectionsTab collections={collections} />
        </TabsContent>
        <TabsContent value="intro-video" className="mt-6">
          <IntroVideoTab
            creatorId={creator.id}
            currentIntroVideo={creator.introVideo}
            videoOptions={videoContent}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
