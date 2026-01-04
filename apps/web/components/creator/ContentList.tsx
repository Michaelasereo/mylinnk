'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@odim/utils';

interface ContentListProps {
  content: any[];
  creator: any;
}

export function ContentList({ content, creator }: ContentListProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Content</h1>
          <p className="text-muted-foreground">
            Manage your content and track performance
          </p>
        </div>
        <Button onClick={() => router.push('/content/new')}>
          Create New Content
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {content.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            {item.thumbnailUrl && (
              <div className="aspect-video bg-muted" />
            )}
            <CardHeader>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm mb-2">
                <Badge variant="outline">{item.type}</Badge>
                <Badge variant={item.isPublished ? 'default' : 'secondary'}>
                  {item.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{item.viewCount} views</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {content.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No content yet. Create your first piece of content!
            </p>
            <Button onClick={() => router.push('/content/new')}>
              Create Content
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

