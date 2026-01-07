'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Trash2, AlertTriangle } from 'lucide-react';

interface Content {
  id: string;
  title: string;
  description: string | null;
  type: string;
  accessType: string;
  requiredPlanId: string | null;
  contentCategory: string;
  tutorialPrice: number | null;
  collectionId: string | null;
  isPublished: boolean;
  tags: string[];
}

interface CreatorPlan {
  id: string;
  name: string;
  price: number;
}

interface Collection {
  id: string;
  title: string;
}

interface EditContentFormProps {
  content: Content;
  creatorPlans: CreatorPlan[];
  collections: Collection[];
}

export function EditContentForm({ content, creatorPlans, collections }: EditContentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: content.title,
    description: content.description || '',
    accessType: content.accessType,
    requiredPlanId: content.requiredPlanId || '',
    contentCategory: content.contentCategory,
    tutorialPrice: content.tutorialPrice?.toString() || '',
    collectionId: content.collectionId || '',
    isPublished: content.isPublished,
    tags: content.tags.join(', ')
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.contentCategory === 'tutorial' && formData.tutorialPrice) {
      const price = parseInt(formData.tutorialPrice);
      if (isNaN(price) || price < 1000) {
        newErrors.tutorialPrice = 'Tutorial price must be at least ₦1,000';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        accessType: formData.accessType,
        requiredPlanId: formData.requiredPlanId || null,
        contentCategory: formData.contentCategory,
        tutorialPrice: formData.contentCategory === 'tutorial' && formData.tutorialPrice
          ? parseInt(formData.tutorialPrice)
          : null,
        collectionId: formData.collectionId || null,
        isPublished: formData.isPublished,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      };

      const response = await fetch(`/api/content/${content.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (response.ok) {
        router.push('/dashboard/content');
        router.refresh();
      } else {
        setErrors({ submit: result.error || 'Failed to update content' });
      }
    } catch (error) {
      console.error('Update error:', error);
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/content/${content.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/dashboard/content');
        router.refresh();
      } else {
        const result = await response.json();
        setErrors({ submit: result.error || 'Failed to delete content' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Details</CardTitle>
          <CardDescription>
            Update your content information and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter content title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your content..."
              rows={4}
            />
          </div>

          {/* Content Category */}
          <div>
            <Label htmlFor="contentCategory">Content Type</Label>
            <Select
              value={formData.contentCategory}
              onValueChange={(value) => handleInputChange('contentCategory', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="content">Regular Content</SelectItem>
                <SelectItem value="tutorial">Tutorial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tutorial-specific fields */}
          {formData.contentCategory === 'tutorial' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Tutorial Settings</h4>

              {/* Tutorial Price */}
              <div>
                <Label htmlFor="tutorialPrice">Individual Purchase Price</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                    ₦
                  </span>
                  <Input
                    id="tutorialPrice"
                    type="number"
                    value={formData.tutorialPrice}
                    onChange={(e) => handleInputChange('tutorialPrice', e.target.value)}
                    placeholder="5000"
                    className={`rounded-l-none ${errors.tutorialPrice ? 'border-red-500' : ''}`}
                    min="1000"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Allow fans to purchase this tutorial individually (optional)
                </p>
                {errors.tutorialPrice && (
                  <p className="text-sm text-red-500 mt-1">{errors.tutorialPrice}</p>
                )}
              </div>

              {/* Collection */}
              {collections.length > 0 && (
                <div>
                  <Label htmlFor="collectionId">Add to Collection (Optional)</Label>
                  <Select
                    value={formData.collectionId}
                    onValueChange={(value) => handleInputChange('collectionId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No collection</SelectItem>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Access Control */}
          <div>
            <Label>Access Control</Label>
            <Select
              value={formData.accessType}
              onValueChange={(value) => handleInputChange('accessType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select access type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free - Available to all</SelectItem>
                <SelectItem value="subscription">Subscription Required</SelectItem>
                {formData.contentCategory === 'tutorial' && (
                  <SelectItem value="one_time">One-time Purchase</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Required Plan (for subscription access) */}
          {formData.accessType === 'subscription' && creatorPlans.length > 0 && (
            <div>
              <Label htmlFor="requiredPlanId">Required Subscription Plan</Label>
              <Select
                value={formData.requiredPlanId}
                onValueChange={(value) => handleInputChange('requiredPlanId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select required plan" />
                </SelectTrigger>
                <SelectContent>
                  {creatorPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ₦{(plan.price / 100).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="beauty, makeup, tutorial (comma-separated)"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate tags with commas
            </p>
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isPublished" className="text-base">
                Publish Content
              </Label>
              <p className="text-sm text-gray-500">
                Make this content visible to your fans
              </p>
            </div>
            <Switch
              id="isPublished"
              checked={formData.isPublished}
              onCheckedChange={(checked) => handleInputChange('isPublished', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Error */}
      {errors.submit && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          {deleting ? 'Deleting...' : 'Delete Content'}
        </Button>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
