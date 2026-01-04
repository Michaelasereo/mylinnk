'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

interface CollectionsTabProps {
  collections: any[];
}

export function CollectionsTab({ collections }: CollectionsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Collections</h2>
          <p className="text-muted-foreground">
            Organize your content into courses and playlists with sections
          </p>
        </div>
        <Link href="/collections/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        </Link>
      </div>

      {collections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No collections yet. Create your first collection to organize your content!
            </p>
            <Link href="/collections/new">
              <Button>Create Collection</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection: typeof collections[0]) => {
            const totalContent = collection.sections.reduce(
              (acc: number, section: typeof collection.sections[0]) => acc + section.sectionContents.length,
              0
            );

            return (
              <Link key={collection.id} href={`/collections/${collection.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  {collection.thumbnailUrl && (
                    <div className="aspect-video bg-muted relative">
                      <img
                        src={collection.thumbnailUrl}
                        alt={collection.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{collection.title}</CardTitle>
                    {collection.description && (
                      <CardDescription className="line-clamp-2">
                        {collection.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <Badge variant="outline">
                        {collection.sections.length} section{collection.sections.length !== 1 ? 's' : ''}
                      </Badge>
                      <Badge variant={collection.isPublished ? 'default' : 'secondary'}>
                        {collection.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{totalContent} items</span>
                      <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

