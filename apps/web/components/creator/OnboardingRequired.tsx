'use client';

import { OnboardingPrompt } from '@/components/ui/onboarding-prompt';

interface OnboardingRequiredProps {
  userEmail: string;
  pageName?: string;
}

export function OnboardingRequired({ userEmail, pageName }: OnboardingRequiredProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Page-specific notice */}
        {pageName && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  {pageName} requires a creator account
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  Complete your creator setup to access {pageName.toLowerCase()} features.
                </div>
              </div>
            </div>
          </div>
        )}

        <OnboardingPrompt
          userEmail={userEmail}
          completedSteps={0}
          totalSteps={4}
        />
      </div>
    </div>
  );
}
