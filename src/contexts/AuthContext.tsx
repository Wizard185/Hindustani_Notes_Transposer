import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';

interface User {
  id: string;
  email: string;
}

interface TranspositionHistory {
  id: string;
  timestamp: Date;
  originalNotes: string[];
  transposedNotes: string[];
  semitones: number;
  fromScale?: string;
  toScale?: string;
  type: 'semitone' | 'scale';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error: string | null }>;
  updateUserPassword: (password: string) => Promise<{ success: boolean; error: string | null }>;
  history: TranspositionHistory[];
  addToHistory: (entry: Omit<TranspositionHistory, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<TranspositionHistory[]>([]);

  // 🔁 Load session and history on mount
  useEffect(() => {
  const getInitialSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const newUser = { id: session.user.id, email: session.user.email! };
      setUser(newUser);
      await loadUserHistory(newUser.id);
    }
  };

  getInitialSession(); // ✅ Initial session check

  // 🔄 Handle login/logout/session updates
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const newUser = { id: session.user.id, email: session.user.email! };
      setUser(newUser);
      await loadUserHistory(newUser.id);
    } else {
      setUser(null);
      setHistory([]);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
// ✅ Keep session alive (especially after idle or app resume)
useEffect(() => {
  const refreshInterval = setInterval(() => {
    supabase.auth.refreshSession().catch((err) => {
      console.error('Session refresh failed:', err.message);
    });
  }, 10 * 60 * 1000); // every 10 minutes

  return () => clearInterval(refreshInterval);
}, []);
useEffect(() => {
  let listener: PluginListenerHandle;

  const setupListener = async () => {
    listener = await CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const newUser = { id: session.user.id, email: session.user.email! };
            setUser(newUser);
            await loadUserHistory(newUser.id);
          }
        } catch (error) {
          console.error('Failed to refresh on app resume:', error.message);
        }
      }
    });
  };

  setupListener();

  return () => {
    listener?.remove(); // ✅ Correct, now 'listener' is defined
  };
}, []);


  const loadUserHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from('transposition_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch history:', error.message);
      return;
    }

    const formatted = data.map((entry: any) => ({
      id: entry.id,
      originalNotes: entry.original_notes,
      transposedNotes: entry.transposed_notes,
      semitones: entry.semitones,
      fromScale: entry.from_scale,
      toScale: entry.to_scale,
      type: entry.type,
      timestamp: new Date(entry.created_at),
    }));
    setHistory(formatted);
  };

  const signup = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) {
      console.error("Signup error:", error?.message);
      return false;
    }
    const newUser = { id: data.user.id, email: data.user.email! };
    setUser(newUser);
    await loadUserHistory(newUser.id);
    return true;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      console.error("Login error:", error?.message);
      return false;
    }
    const newUser = { id: data.user.id, email: data.user.email! };
    setUser(newUser);
    await loadUserHistory(newUser.id);
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHistory([]);
  };

  const addToHistory = async (
    entry: Omit<TranspositionHistory, 'id' | 'timestamp'>
  ) => {
    if (!user) return;

    const newEntry = {
      user_id: user.id,
      user_email: user.email,
      original_notes: entry.originalNotes,
      transposed_notes: entry.transposedNotes,
      semitones: entry.semitones,
      from_scale: entry.fromScale ?? null,
      to_scale: entry.toScale ?? null,
      type: entry.type,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('transposition_history').insert([newEntry]);

    if (error) {
      console.error('❌ Supabase insert error:', error.message);
    } else {
      // Note: We need to refetch to get the real ID from the database
      // For simplicity, we'll just reload the whole history
      await loadUserHistory(user.id);
    }
  };

  const clearHistory = async () => {
    if (!user) return;

    const { error } = await supabase.from('transposition_history').delete().eq('user_id', user.id);
    if (error) {
      console.error('Failed to clear history:', error.message);
      return;
    }
    setHistory([]);
  };

  // ✨ NEW FUNCTION: Send password reset email
  const sendPasswordResetEmail = async (email: string) => {
    // ⚠️ IMPORTANT: Replace 'http://localhost:3000/update-password' with your app's deployed URL.
    // This URL must be added to your Supabase project's "Redirect URLs" list.
    // Go to Supabase Dashboard -> Authentication -> URL Configuration.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/update-password', 
    });

    if (error) {
      console.error('Password reset error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  };

  // ✨ NEW FUNCTION: Update the user's password
  const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error('Password update error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        sendPasswordResetEmail,
        updateUserPassword,
        history,
        addToHistory,
        clearHistory,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};