'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CreatorPlan {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

interface Creator {
  id: string;
  displayName: string;
}

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creator: Creator;
  plans: CreatorPlan[];
}

type Step = 'select_plan' | 'enter_details' | 'processing';

export function SubscriptionModal({
  open,
  onOpenChange,
  creator,
  plans,
}: SubscriptionModalProps) {
  const [step, setStep] = useState<Step>('select_plan');
  const [selectedPlan, setSelectedPlan] = useState<CreatorPlan | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const formatPrice = (priceInKobo: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(priceInKobo / 100);
  };

  const handleSelectPlan = (plan: CreatorPlan) => {
    setSelectedPlan(plan);
    setStep('enter_details');
  };

  const handleBack = () => {
    if (step === 'enter_details') {
      setStep('select_plan');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) return;

    // Validate
    if (!email || !phone) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (phone.length < 10) {
      toast({
        title: 'Error',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone,
          amount: selectedPlan.price / 100, // Convert kobo to naira for the API
          creatorId: creator.id,
          planId: selectedPlan.id,
          type: 'subscription',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment initialization failed');
      }

      const data = await response.json();
      
      // Redirect to Paystack payment page
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to initialize payment',
        variant: 'destructive',
      });
      setStep('enter_details');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setStep('select_plan');
      setSelectedPlan(null);
      setEmail('');
      setPhone('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'select_plan' && 'Choose a Subscription Plan'}
            {step === 'enter_details' && 'Complete Your Subscription'}
            {step === 'processing' && 'Processing Payment'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select_plan' && `Subscribe to ${creator.displayName} for exclusive content access`}
            {step === 'enter_details' && 'Enter your details to complete the subscription'}
            {step === 'processing' && 'Please wait while we redirect you to payment...'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select_plan' && (
          <div className="space-y-3 py-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  selectedPlan?.id === plan.id ? 'border-primary ring-2 ring-primary' : ''
                }`}
                onClick={() => handleSelectPlan(plan)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatPrice(plan.price)}</p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Full access to premium content</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 'enter_details' && selectedPlan && (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Selected Plan Summary */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="secondary">{selectedPlan.name}</Badge>
                  <p className="text-sm text-muted-foreground mt-1">Monthly subscription</p>
                </div>
                <p className="text-xl font-bold">{formatPrice(selectedPlan.price)}</p>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll use this to identify your subscription
              </p>
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="08012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                minLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Nigerian phone number for verification
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button type="submit" disabled={isProcessing} className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" />
                Pay {formatPrice(selectedPlan.price)}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Redirecting to payment...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

