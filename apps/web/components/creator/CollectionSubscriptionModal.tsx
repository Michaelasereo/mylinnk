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
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, CreditCard, Loader2, BookOpen, ArrowLeft, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Collection {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  price: number | null;
  subscriptionPrice: number | null;
  subscriptionType: string | null;
  enrolledCount: number;
}

interface CollectionSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: Collection;
  creatorName: string;
  onSuccess?: () => void;
}

type Step = 'select_type' | 'enter_details' | 'processing' | 'verify_email' | 'success';

export function CollectionSubscriptionModal({
  open,
  onOpenChange,
  collection,
  creatorName,
  onSuccess,
}: CollectionSubscriptionModalProps) {
  const [step, setStep] = useState<Step>('select_type');
  const [subscriptionType, setSubscriptionType] = useState<'one_time' | 'recurring'>('one_time');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const formatPrice = (priceInKobo: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(priceInKobo / 100);
  };

  const getPrice = () => {
    if (subscriptionType === 'recurring' && collection.subscriptionPrice) {
      return collection.subscriptionPrice;
    }
    return collection.price || collection.subscriptionPrice || 0;
  };

  const hasRecurringOption = !!collection.subscriptionPrice;
  const hasOneTimeOption = !!collection.price;

  const handleProceed = () => {
    setStep('enter_details');
  };

  const handleBack = () => {
    if (step === 'enter_details') {
      setStep('select_type');
    } else if (step === 'verify_email') {
      setStep('enter_details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!email || !phone) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
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
      const response = await fetch('/api/collections/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: collection.id,
          email,
          phone,
          subscriptionType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Subscription failed');
      }

      // If dev mode (no Paystack), go to verification
      if (data.requiresVerification) {
        setStep('verify_email');
        toast({
          title: 'Verification Required',
          description: 'Check your email for a verification code',
        });
      } else if (data.authorizationUrl) {
        // Redirect to Paystack
        window.location.href = data.authorizationUrl;
      } else {
        throw new Error('Unexpected response');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to subscribe',
        variant: 'destructive',
      });
      setStep('enter_details');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/premium/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: collection.id,
          email,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setStep('success');
      toast({
        title: 'Success!',
        description: 'You now have access to this collection',
      });

      // Callback
      onSuccess?.();

      // Close after delay
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Verification failed',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendCode = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch('/api/premium/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: collection.id,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      toast({
        title: 'Code Sent',
        description: 'A new verification code has been sent to your email',
      });
    } catch (error) {
      console.error('Resend error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resend code',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setStep('select_type');
      setSubscriptionType('one_time');
      setEmail('');
      setPhone('');
      setVerificationCode('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {step === 'success' ? 'Welcome!' : 'Subscribe to Collection'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select_type' && `Get access to "${collection.title}" by ${creatorName}`}
            {step === 'enter_details' && 'Enter your details to complete the subscription'}
            {step === 'processing' && 'Processing your subscription...'}
            {step === 'verify_email' && 'Enter the verification code sent to your email'}
            {step === 'success' && 'You now have access to this collection!'}
          </DialogDescription>
        </DialogHeader>

        {/* Collection Preview */}
        {step !== 'success' && (
          <div className="rounded-lg border bg-muted/50 p-4 flex gap-4">
            {collection.thumbnailUrl && (
              <img
                src={collection.thumbnailUrl}
                alt={collection.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{collection.title}</h3>
              {collection.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {collection.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {collection.enrolledCount} enrolled
              </p>
            </div>
          </div>
        )}

        {/* Step: Select Subscription Type */}
        {step === 'select_type' && (
          <div className="space-y-4 py-4">
            <RadioGroup
              value={subscriptionType}
              onValueChange={(value) => setSubscriptionType(value as 'one_time' | 'recurring')}
              className="space-y-3"
            >
              {hasOneTimeOption && (
                <Label
                  htmlFor="one_time"
                  className={`flex items-start justify-between rounded-lg border p-4 cursor-pointer transition-all ${
                    subscriptionType === 'one_time' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="one_time" id="one_time" className="mt-1" />
                    <div>
                      <p className="font-medium">Lifetime Access</p>
                      <p className="text-sm text-muted-foreground">
                        One-time payment for permanent access
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatPrice(collection.price!)}</p>
                    <p className="text-xs text-muted-foreground">once</p>
                  </div>
                </Label>
              )}

              {hasRecurringOption && (
                <Label
                  htmlFor="recurring"
                  className={`flex items-start justify-between rounded-lg border p-4 cursor-pointer transition-all ${
                    subscriptionType === 'recurring' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="recurring" id="recurring" className="mt-1" />
                    <div>
                      <p className="font-medium">Monthly Subscription</p>
                      <p className="text-sm text-muted-foreground">
                        Cancel anytime, billed monthly
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatPrice(collection.subscriptionPrice!)}</p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                </Label>
              )}
            </RadioGroup>

            <DialogFooter>
              <Button onClick={handleProceed} className="w-full">
                Continue
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Enter Details */}
        {step === 'enter_details' && (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Price Summary */}
            <div className="rounded-lg bg-primary/5 p-4 flex items-center justify-between">
              <div>
                <Badge variant="secondary">
                  {subscriptionType === 'recurring' ? 'Monthly' : 'Lifetime'}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {subscriptionType === 'recurring' ? 'Billed monthly' : 'One-time payment'}
                </p>
              </div>
              <p className="text-2xl font-bold">{formatPrice(getPrice())}</p>
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
                We&apos;ll send verification codes to this email
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
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button type="submit" disabled={isProcessing} className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" />
                Pay {formatPrice(getPrice())}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Processing your subscription...</p>
          </div>
        )}

        {/* Step: Verify Email */}
        {step === 'verify_email' && (
          <form onSubmit={handleVerifyCode} className="space-y-4 py-4">
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-sm">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
            </div>

            <DialogFooter className="flex-col gap-2">
              <Button type="submit" disabled={isProcessing || verificationCode.length !== 6} className="w-full">
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Verify & Access
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendCode}
                disabled={isProcessing}
                className="w-full"
              >
                Resend Code
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">You&apos;re In!</h3>
            <p className="mt-2 text-muted-foreground">
              You now have access to all content in this collection.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

