/**
 * Toast Notification Component
 * 
 * Using Sonner for elegant, minimal toast notifications.
 * Re-exported for consistent API.
 */

'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#171717',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          padding: '16px 20px',
          fontSize: '14px',
          fontWeight: 500,
        },
        className: 'premium-toast',
      }}
      closeButton
      richColors
      expand
    />
  );
}

// Export toast methods for use throughout the app
export { toast };

export default Toaster;
