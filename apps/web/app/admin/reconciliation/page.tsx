'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Play } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface FailedWebhook {
  id: string;
  event: string;
  data: any;
  attempt: number;
  maxAttempts: number;
  failedAt: string;
  error: string;
  reference?: string;
  amount?: number;
}

interface ReconciliationStats {
  totalFailed: number;
  totalProcessed: number;
  totalRevenue: number;
  recentFailures: FailedWebhook[];
}

export default function ReconciliationDashboard() {
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/reconciliation/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reconciliation stats',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const retryWebhook = async (webhookId: string) => {
    setProcessing(webhookId);
    try {
      const response = await fetch('/api/admin/reconciliation/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookId }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Webhook retry queued successfully',
        });
        await loadStats(); // Refresh stats
      } else {
        throw new Error('Retry failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to retry webhook',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading reconciliation data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-center space-x-2">
        <h1 className="text-3xl font-bold">Payment Reconciliation Dashboard</h1>
        <Button variant="outline" size="sm" onClick={loadStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Webhooks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.totalFailed || 0}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.totalProcessed || 0}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue at Risk</CardTitle>
            <XCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ₦{((stats?.totalRevenue || 0) / 100).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From failed webhooks</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Failures */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Failed Webhooks</CardTitle>
          <CardDescription>
            Webhooks that failed processing and may need manual intervention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentFailures && stats.recentFailures.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Failed At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentFailures.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <Badge variant="outline">{webhook.event}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {webhook.reference || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {webhook.amount ? `₦${(webhook.amount / 100).toLocaleString()}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={webhook.attempt >= webhook.maxAttempts ? 'destructive' : 'secondary'}>
                        {webhook.attempt}/{webhook.maxAttempts}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={webhook.error}>
                      {webhook.error}
                    </TableCell>
                    <TableCell>
                      {new Date(webhook.failedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryWebhook(webhook.id)}
                        disabled={processing === webhook.id}
                      >
                        {processing === webhook.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No failed webhooks found. All payments are processing correctly.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use This Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Automatic Processing:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Failed webhooks are automatically retried up to 3 times with exponential backoff</li>
              <li>After 3 failures, webhooks are moved to dead letter queue for manual review</li>
              <li>Most payment issues resolve automatically within minutes</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Manual Intervention:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Use "Retry" button to manually requeue failed webhooks</li>
              <li>Check error messages for specific failure reasons</li>
              <li>Contact support if manual retries consistently fail</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Common Issues:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li><strong>Transaction not found:</strong> Webhook arrived before payment completion</li>
              <li><strong>Creator not found:</strong> Creator account was deleted</li>
              <li><strong>Database lock:</strong> Concurrent processing caused deadlock</li>
              <li><strong>Paystack API error:</strong> Temporary service disruption</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
