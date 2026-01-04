export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  if (typeof window !== 'undefined') {
    // Send to Plausible
    if (window.plausible) {
      window.plausible(event, { props: properties });
    }

    // Send to custom analytics
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties }),
    }).catch((error) => {
      console.error('Analytics tracking error:', error);
    });
  }
}

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, unknown> }
    ) => void;
  }
}

