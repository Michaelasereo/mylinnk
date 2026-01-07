'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Clock, DollarSign, Loader2 } from 'lucide-react';

interface Service {
  id: string;
  category: string | null;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number | null;
  orderIndex: number;
  categoryOrderIndex: number;
  isActive: boolean;
  createdAt: string;
  _count: {
    bookings: number;
  };
}

interface ServicesManagerProps {
  services: Service[];
}

export function ServicesManager({ services }: ServicesManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    description: '',
    price: '',
    durationMinutes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    }

    if (!formData.price || parseInt(formData.price) < 1000) {
      newErrors.price = 'Price must be at least ₦1,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.category.trim() || null,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseInt(formData.price),
          durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null
        })
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        setFormData({ category: '', name: '', description: '', price: '', durationMinutes: '' });
        window.location.reload(); // Refresh to show new service
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Failed to create service' });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingService || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/services/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.category.trim() || null,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseInt(formData.price),
          durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
          isActive: editingService.isActive
        })
      });

      if (response.ok) {
        setEditingService(null);
        setFormData({ category: '', name: '', description: '', price: '', durationMinutes: '' });
        window.location.reload();
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Failed to update service' });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete service');
      }
    } catch (error) {
      alert('An unexpected error occurred');
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: service.category,
          name: service.name,
          description: service.description,
          price: service.price,
          durationMinutes: service.durationMinutes,
          isActive: !service.isActive
        })
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update service');
      }
    } catch (error) {
      alert('An unexpected error occurred');
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      category: service.category || '',
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      durationMinutes: service.durationMinutes?.toString() || ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Services Management</h2>
          <p className="text-muted-foreground">
            Create and manage services that customers can book
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
              <DialogDescription>
                Add a new service that customers can book with you.
              </DialogDescription>
            </DialogHeader>
            <ServiceForm
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
              isSubmitting={isSubmitting}
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Service'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services by Category */}
      {Object.keys(groupedServices).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No services created yet. Create your first service to start accepting bookings!
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedServices).map(([category, categoryServices]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {category}
                <Badge variant="outline">
                  {categoryServices.length} service{categoryServices.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{service.name}</h4>
                        <Badge variant={service.isActive ? 'default' : 'secondary'}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ₦{(service.price / 100).toLocaleString()}
                        </span>
                        {service.durationMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.durationMinutes} min
                          </span>
                        )}
                        <span>{service._count.bookings} bookings</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.isActive}
                        onCheckedChange={() => handleToggleActive(service)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(service)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(service)}
                        disabled={service._count.bookings > 0}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Edit Dialog */}
      {editingService && (
        <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>
                Update your service details and settings.
              </DialogDescription>
            </DialogHeader>
            <ServiceForm
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
              isSubmitting={isSubmitting}
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingService(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Service'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface ServiceFormProps {
  formData: {
    category: string;
    name: string;
    description: string;
    price: string;
    durationMinutes: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  isSubmitting: boolean;
}

function ServiceForm({ formData, errors, onChange, isSubmitting }: ServiceFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="category">Category (Optional)</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => onChange('category', e.target.value)}
          placeholder="e.g., Makeup, Hair, Photography"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label htmlFor="name">Service Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g., Bridal Makeup"
          className={errors.name ? 'border-red-500' : ''}
          disabled={isSubmitting}
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Describe what this service includes..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price *</Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
              ₦
            </span>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => onChange('price', e.target.value)}
              placeholder="50000"
              className={`rounded-l-none ${errors.price ? 'border-red-500' : ''}`}
              min="1000"
              disabled={isSubmitting}
            />
          </div>
          {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
        </div>

        <div>
          <Label htmlFor="durationMinutes">Duration (minutes)</Label>
          <Input
            id="durationMinutes"
            type="number"
            value={formData.durationMinutes}
            onChange={(e) => onChange('durationMinutes', e.target.value)}
            placeholder="120"
            min="15"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {errors.submit && (
        <Alert variant="destructive">
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
