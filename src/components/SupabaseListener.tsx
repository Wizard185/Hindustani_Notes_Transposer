// src/components/SupabaseListener.tsx
import { useEffect } from 'react';
import { supabase } from '@/supabase/supabaseClient';

/**
 * Invisible component that refreshes session and data
 * when app/tab becomes active again.
 */
const SupabaseListener: React.FC = () => {
  useEffect(() => {
    const handleAppStateChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('App is active again. Refreshing session...');
        await supabase.auth.getSession();
      }
    };

    document.addEventListener('visibilitychange', handleAppStateChange);

    return () => {
      document.removeEventListener('visibilitychange', handleAppStateChange);
    };
  }, []);

  return null;
};

export default SupabaseListener;
