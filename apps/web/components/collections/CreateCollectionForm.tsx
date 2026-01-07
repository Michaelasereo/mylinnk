'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

interface CreatorPlan {
  id: string;
  name: string;
  price: number;
}

interface CreateCollectionFormProps {
  creatorPlans: CreatorPlan[];
}

export function CreateCollectionForm({ creatorPlans }: CreateCollectionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    accessType: 'subscription',
    requiredPlanId: '',
    price: '',
    subscriptionPrice: '',
    subscriptionType: 'one_time',
    tags: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
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

    if (formData.accessType === 'one_time' && !formData.price) {
      newErrors.price = 'Price is required for one-time purchases';
    }

    if (formData.accessType === 'subscription' && formData.subscriptionType === 'recurring' && !formData.subscriptionPrice) {
      newErrors.subscriptionPrice = 'Subscription price is required for recurring access';
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
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        accessType: formData.accessType,
        requiredPlanId: formData.requiredPlanId || null,
        price: formData.accessType === 'one_time' ? parseInt(formData.price) : null,
        subscriptionPrice: formData.subscriptionType === 'recurring' ? parseInt(formData.subscriptionPrice) : null,
        subscriptionType: formData.subscriptionType,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      };

      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (response.ok) {
        router.push('/dashboard/content');
        router.refresh();
      } else {
        setErrors({ submit: result.error || 'Failed to create collection' });
      }
    } catch (error) {
      console.error('Create error:', error);
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
          <CardDescription>
            Create a structured course that organizes your tutorials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Collection Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Complete Makeup Masterclass"
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
              placeholder="Describe what students will learn in this collection..."
              rows={4}
            />
          </div>

          {/* Access Control */}
          <div>
            <Label>Access Type</Label>
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
                <SelectItem value="one_time">One-time Purchase</SelectItem>
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

          {/* Pricing */}
          {formData.accessType === 'one_time' && (
            <div>
              <Label htmlFor="price">Collection Price *</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                  ₦
                </span>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="50000"
                  className={`rounded-l-none ${errors.price ? 'border-red-500' : ''}`}
                  min="1000"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                One-time purchase price (minimum ₦1,000)
              </p>
              {errors.price && (
                <p className="text-sm text-red-500 mt-1">{errors.price}</p>
              )}
            </div>
          )}

          {/* Subscription Pricing */}
          {formData.accessType === 'subscription' && (
            <div className="space-y-4">
              <div>
                <Label>Subscription Type</Label>
                <Select
                  value={formData.subscriptionType}
                  onValueChange={(value) => handleInputChange('subscriptionType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subscription type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-time Access</SelectItem>
                    <SelectItem value="recurring">Recurring Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.subscriptionType === 'recurring' && (
                <div>
                  <Label htmlFor="subscriptionPrice">Monthly Subscription Price *</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                      ₦
                    </span>
                    <Input
                      id="subscriptionPrice"
                      type="number"
                      value={formData.subscriptionPrice}
                      onChange={(e) => handleInputChange('subscriptionPrice', e.target.value)}
                      placeholder="20000"
                      className={`rounded-l-none ${errors.subscriptionPrice ? 'border-red-500' : ''}`}
                      min="1000"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Monthly recurring price for collection access
                  </p>
                  {errors.subscriptionPrice && (
                    <p className="text-sm text-red-500 mt-1">{errors.subscriptionPrice}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="makeup, beauty, tutorial (comma-separated)"
            />
            <p className="text-sm text-gray-500 mt-1">
              Help fans discover your collection
            </p>
          </div>

          {/* Info */}
          <Alert>
            <AlertDescription>
              <strong>Next Steps:</strong> After creating your collection, you can add sections and organize your existing tutorials into structured courses.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Submit Error */}
      {errors.submit && (
        <Alert variant="destructive">
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel
        </Button>

        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Creating Collection...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Create Collection
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
