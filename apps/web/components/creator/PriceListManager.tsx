'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import {
  createPriceListItem,
  updatePriceListItem,
  deletePriceListItem,
  togglePriceListItemActive,
  getMyPriceList,
} from '@/lib/actions/priceList';

const priceItemSchema = z.object({
  category: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(100, 'Minimum price is ₦1'),
  durationMinutes: z.number().optional(),
});

type PriceItemInput = z.infer<typeof priceItemSchema>;

interface PriceListItem {
  id: string;
  category: string | null;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number | null;
  orderIndex: number;
  categoryOrderIndex: number;
  isActive: boolean;
}

interface PriceListManagerProps {
  creatorId?: string;
  initialPriceList?: PriceListItem[];
}

export function PriceListManager({ creatorId, initialPriceList }: PriceListManagerProps) {
  const [items, setItems] = useState<PriceListItem[]>(initialPriceList || []);
  const [isLoading, setIsLoading] = useState(!initialPriceList);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceListItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<PriceItemInput>({
    resolver: zodResolver(priceItemSchema),
    defaultValues: {
      category: '',
      name: '',
      description: '',
      price: 0,
      durationMinutes: undefined,
    },
  });

  useEffect(() => {
    if (!initialPriceList) {
      loadItems();
    }
  }, [initialPriceList]);

  async function loadItems() {
    setIsLoading(true);
    const result = await getMyPriceList();
    if (result.success && result.data) {
      setItems(result.data);
    }
    setIsLoading(false);
  }

  async function onSubmit(data: PriceItemInput) {
    setIsSaving(true);
    try {
      if (editingItem) {
        await updatePriceListItem(editingItem.id, {
          ...data,
          price: data.price,
        });
      } else {
        await createPriceListItem({
          ...data,
          price: data.price,
        });
      }
      await loadItems();
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    } catch (error) {
      console.error('Error saving price item:', error);
    }
    setIsSaving(false);
  }

  async function handleDelete(itemId: string) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    await deletePriceListItem(itemId);
    await loadItems();
  }

  async function handleToggleActive(itemId: string) {
    await togglePriceListItemActive(itemId);
    await loadItems();
  }

  function openEditDialog(item: PriceListItem) {
    setEditingItem(item);
    form.reset({
      category: item.category || '',
      name: item.name,
      description: item.description || '',
      price: item.price,
      durationMinutes: item.durationMinutes || undefined,
    });
    setIsDialogOpen(true);
  }

  function openNewDialog() {
    setEditingItem(null);
    form.reset({
      category: '',
      name: '',
      description: '',
      price: 0,
      durationMinutes: undefined,
    });
    setIsDialogOpen(true);
  }

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, PriceListItem[]>);

  const formatPrice = (priceInKobo: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(priceInKobo / 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Price List</CardTitle>
            <CardDescription>
              Manage your service offerings and prices for bookings
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Service' : 'Add New Service'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'Update the service details below.'
                    : 'Add a new service to your price list.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., HOME SERVICE, PHOTOSHOOT"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Group similar services together
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., MAINLAND 1" {...field} />
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
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description or notes"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₦)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter price in Naira"
                            {...field}
                            value={field.value ? field.value / 100 : ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) * 100 : 0
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="durationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes, optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 60"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Saving...' : editingItem ? 'Update' : 'Add Service'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No services added yet.</p>
            <p className="text-sm">Add your first service to start accepting bookings.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  {category}
                </h4>
                <div className="space-y-2">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        item.isActive ? 'bg-background' : 'bg-muted/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.name}</span>
                            {!item.isActive && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                          {item.durationMinutes && (
                            <p className="text-xs text-muted-foreground">
                              {item.durationMinutes} mins
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-lg">
                          {formatPrice(item.price)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.isActive}
                            onCheckedChange={() => handleToggleActive(item.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

