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
import { Check, CreditCard, Loader2, Video, ArrowLeft, Mail, Play } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Tutorial {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  tutorialPrice: number | null;
  durationSeconds: number | null;
}

interface TutorialPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutorial: Tutorial;
  creatorName: string;
  onSuccess?: () => void;
}

type Step = 'details' | 'enter_email' | 'processing' | 'verify_email' | 'success';

export function TutorialPurchaseModal({
  open,
  onOpenChange,
  tutorial,
  creatorName,
  onSuccess,
}: TutorialPurchaseModalProps) {
  const [step, setStep] = useState<Step>('details');
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

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const handleProceed = () => {
    setStep('enter_email');
  };

  const handleBack = () => {
    if (step === 'enter_email') {
      setStep('details');
    } else if (step === 'verify_email') {
      setStep('enter_email');
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
      const response = await fetch('/api/tutorials/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: tutorial.id,
          email,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Purchase failed');
      }

      // Already purchased or dev mode
      if (data.requiresVerification || data.alreadyPurchased) {
        setStep('verify_email');
        toast({
          title: data.alreadyPurchased ? 'Already Purchased' : 'Verification Required',
          description: 'Check your email for a verification code',
        });
      } else if (data.authorizationUrl) {
        // Redirect to Paystack
        window.location.href = data.authorizationUrl;
      } else {
        throw new Error('Unexpected response');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to purchase',
        variant: 'destructive',
      });
      setStep('enter_email');
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
          contentId: tutorial.id,
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
        description: 'You now have access to this tutorial',
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
          contentId: tutorial.id,
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
      setStep('details');
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
            <Video className="h-5 w-5" />
            {step === 'success' ? 'Enjoy Your Tutorial!' : 'Purchase Tutorial'}
          </DialogTitle>
          <DialogDescription>
            {step === 'details' && `Get lifetime access to "${tutorial.title}"`}
            {step === 'enter_email' && 'Enter your details to complete the purchase'}
            {step === 'processing' && 'Processing your purchase...'}
            {step === 'verify_email' && 'Enter the verification code sent to your email'}
            {step === 'success' && 'You can now watch this tutorial!'}
          </DialogDescription>
        </DialogHeader>

        {/* Tutorial Preview */}
        {step !== 'success' && (
          <div className="rounded-lg border bg-muted/50 overflow-hidden">
            {tutorial.thumbnailUrl && (
              <div className="relative aspect-video">
                <img
                  src={tutorial.thumbnailUrl}
                  alt={tutorial.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-12 w-12 text-white" />
                </div>
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold">{tutorial.title}</h3>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span>By {creatorName}</span>
                {tutorial.durationSeconds && (
                  <>
                    <span>•</span>
                    <span>{formatDuration(tutorial.durationSeconds)}</span>
                  </>
                )}
              </div>
              {tutorial.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {tutorial.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-primary/5 p-4 flex items-center justify-between">
              <div>
                <Badge variant="secondary">Lifetime Access</Badge>
                <p className="text-sm text-muted-foreground mt-1">One-time purchase</p>
              </div>
              <p className="text-2xl font-bold">{formatPrice(tutorial.tutorialPrice || 0)}</p>
            </div>

            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Watch anytime, anywhere
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Lifetime access
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                HD quality streaming
              </li>
            </ul>

            <DialogFooter>
              <Button onClick={handleProceed} className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Purchase for {formatPrice(tutorial.tutorialPrice || 0)}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Enter Email */}
        {step === 'enter_email' && (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
                We&apos;ll send the verification code to this email
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
                Pay {formatPrice(tutorial.tutorialPrice || 0)}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Processing your purchase...</p>
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
                Verify & Watch
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
            <h3 className="mt-4 text-lg font-semibold">Purchase Complete!</h3>
            <p className="mt-2 text-muted-foreground">
              You now have lifetime access to this tutorial.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

