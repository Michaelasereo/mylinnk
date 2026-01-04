'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateCollection } from '@/lib/actions/collection';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, DollarSign } from 'lucide-react';

const pricingSchema = z.object({
  accessType: z.enum(['free', 'subscription', 'one_time']),
  price: z.string().optional(),
  subscriptionPrice: z.string().optional(),
  subscriptionType: z.enum(['one_time', 'recurring']),
  isPublished: z.boolean(),
});

type PricingFormValues = z.infer<typeof pricingSchema>;

interface CollectionPricingFormProps {
  collectionId: string;
  initialData: {
    accessType: string;
    price: number | null;
    subscriptionPrice: number | null;
    subscriptionType: string;
    isPublished: boolean;
  };
}

export function CollectionPricingForm({
  collectionId,
  initialData,
}: CollectionPricingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      accessType: initialData.accessType as 'free' | 'subscription' | 'one_time',
      price: initialData.price?.toString() || '',
      subscriptionPrice: initialData.subscriptionPrice?.toString() || '',
      subscriptionType: (initialData.subscriptionType as 'one_time' | 'recurring') || 'one_time',
      isPublished: initialData.isPublished,
    },
  });

  const accessType = form.watch('accessType');
  const subscriptionType = form.watch('subscriptionType');

  async function onSubmit(data: PricingFormValues) {
    setIsLoading(true);
    try {
      const price = data.price ? parseFloat(data.price) : undefined;
      const subscriptionPrice = data.subscriptionPrice ? parseFloat(data.subscriptionPrice) : undefined;

      const result = await updateCollection(collectionId, {
        accessType: data.accessType,
        price,
        subscriptionPrice,
        subscriptionType: data.subscriptionType,
        isPublished: data.isPublished,
      });

      if (!result.success) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update pricing',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Pricing updated successfully!',
      });

      router.refresh();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Pricing & Access
        </CardTitle>
        <CardDescription>
          Configure how users can access this collection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="accessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select access type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="free">Free - Anyone can access</SelectItem>
                      <SelectItem value="one_time">One-time Purchase</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {accessType !== 'free' && (
              <FormField
                control={form.control}
                name="subscriptionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="one_time">One-time (Lifetime Access)</SelectItem>
                        <SelectItem value="recurring">Monthly Subscription</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {subscriptionType === 'one_time'
                        ? 'Users pay once for permanent access'
                        : 'Users pay monthly to maintain access'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {accessType !== 'free' && subscriptionType === 'one_time' && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>One-time Price (₦)</FormLabel>
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
                      Price for lifetime access to this collection
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {accessType !== 'free' && subscriptionType === 'recurring' && (
              <FormField
                control={form.control}
                name="subscriptionPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Price (₦)</FormLabel>
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
                      Monthly subscription price for this collection
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Published</FormLabel>
                    <FormDescription>
                      Make this collection visible to users
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Pricing
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

