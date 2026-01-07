'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createContent } from '@/lib/actions/content';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Upload, X, BookOpen } from 'lucide-react';

const contentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['video', 'image', 'pdf', 'text']),
  accessType: z.enum(['free', 'subscription', 'one_time']).default('subscription'),
  isPublished: z.boolean().default(false),
  contentCategory: z.enum(['content', 'tutorial']).default('content'),
  collectionId: z.string().optional(),
  tutorialPrice: z.string().optional(),
});

type ContentFormValues = z.infer<typeof contentSchema>;

interface Collection {
  id: string;
  title: string;
}

export default function NewContentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [uploadedFile, setUploadedFile] = useState<{
    url?: string;
    muxAssetId?: string;
    muxPlaybackId?: string;
    uploadUrl?: string;
    thumbnail?: string;
    fileName?: string;
  } | null>(null);

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'video',
      accessType: 'subscription',
      isPublished: false,
      contentCategory: 'content',
      collectionId: '',
      tutorialPrice: '',
    },
  });

  const contentType = form.watch('type');
  const contentCategory = form.watch('contentCategory');
  const accessType = form.watch('accessType');
  const collectionId = form.watch('collectionId');

  // Fetch collections when component mounts
  useEffect(() => {
    async function fetchCollections() {
      try {
        const response = await fetch('/api/creator/me');
        if (response.ok) {
          const data = await response.json();
          if (data.collections) {
            setCollections(data.collections);
          }
        }
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      }
    }
    fetchCollections();
  }, []);

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload video to Stream, other files to R2
      const endpoint = contentType === 'video' ? '/api/upload/stream' : '/api/upload/r2';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      const data = await response.json();
      
      if (contentType === 'video') {
        setUploadedFile({
          muxAssetId: data.muxAssetId,
          muxPlaybackId: data.muxPlaybackId,
          uploadUrl: data.uploadUrl,
        });
      } else {
        setUploadedFile({
          url: data.url,
          fileName: data.fileName,
        });
      }

      toast({
        title: 'Success',
        description: 'File uploaded successfully!',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: ContentFormValues) {
    if (!uploadedFile && contentType !== 'text') {
      toast({
        title: 'File required',
        description: 'Please upload a file before creating content',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Parse tutorial price (convert from Naira to kobo)
      const tutorialPriceKobo = data.tutorialPrice 
        ? Math.round(parseFloat(data.tutorialPrice) * 100) 
        : undefined;

      const result = await createContent({
        ...data,
        tags: [],
        requiredPlanId: undefined,
        muxAssetId: uploadedFile?.muxAssetId,
        muxPlaybackId: uploadedFile?.muxPlaybackId,
        contentCategory: data.contentCategory,
        collectionId: data.collectionId || undefined,
        tutorialPrice: tutorialPriceKobo,
      });

      if (!result.success) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create content',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Content created successfully!',
      });

      router.push('/content');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const showCollectionField = contentCategory === 'tutorial';
  const showPriceField = contentCategory === 'tutorial' && accessType !== 'free' && !collectionId;

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Content</CardTitle>
          <CardDescription>
            Add a new piece of content to your creator profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter content title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter content description (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contentCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="content">Regular Content</SelectItem>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select access type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="one_time">One-time Payment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Collection Selection for Tutorials */}
              {showCollectionField && (
                <FormField
                  control={form.control}
                  name="collectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Add to Collection (Optional)
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a collection" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None (Standalone Tutorial)</SelectItem>
                          {collections.map((collection) => (
                            <SelectItem key={collection.id} value={collection.id}>
                              {collection.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {collectionId 
                          ? 'Tutorial will be part of this collection. Users subscribe to the collection for access.'
                          : 'Leave empty to sell as a standalone tutorial.'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Individual Tutorial Price */}
              {showPriceField && (
                <FormField
                  control={form.control}
                  name="tutorialPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tutorial Price (₦)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            ₦
                          </span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-8"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Set a price for individual purchase of this tutorial
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* File Upload Section */}
              {contentType !== 'text' && (
                <FormItem>
                  <FormLabel>
                    {contentType === 'video' ? 'Video File' : contentType === 'image' ? 'Image File' : 'PDF File'}
                  </FormLabel>
                  <div className="space-y-4">
                    {!uploadedFile ? (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <Upload className="h-10 w-10 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {contentType === 'video' && 'MP4, MOV, AVI (max 500MB)'}
                              {contentType === 'image' && 'JPG, PNG, GIF (max 10MB)'}
                              {contentType === 'pdf' && 'PDF (max 50MB)'}
                            </p>
                          </div>
                          <Input
                            type="file"
                            accept={
                              contentType === 'video'
                                ? 'video/*'
                                : contentType === 'image'
                                ? 'image/*'
                                : 'application/pdf'
                            }
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file);
                              }
                            }}
                            disabled={uploading}
                            className="hidden"
                            id="file-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            disabled={uploading}
                          >
                            {uploading ? 'Uploading...' : 'Select File'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {uploadedFile.fileName || 'File uploaded'}
                            </p>
                            {uploadedFile.muxPlaybackId && (
                              <p className="text-xs text-muted-foreground">
                                Playback ID: {uploadedFile.muxPlaybackId}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadedFile(null)}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </FormItem>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Content'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
