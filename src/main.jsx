import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/auth/AuthProvider';
import { CatalogProvider } from './catalog';
import Root from './Root';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* reducedMotion="user": respects the OS "reduce motion" setting */}
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={250}>
        <AuthProvider>
          <CatalogProvider>
            <Root />
          </CatalogProvider>
        </AuthProvider>
        <Toaster theme="dark" position="bottom-right" mobileOffset={{ bottom: 80 }} />
      </TooltipProvider>
    </MotionConfig>
  </StrictMode>,
);
