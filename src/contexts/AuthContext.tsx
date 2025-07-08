import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';

// User and history types
type User = {
  id: string;
  email: string;
};

type HistoryEntry = {
  type: 'semitone' | 'scale';
  originalNotes: string[];
  transposedNotes: string[];
  originalFormatted?: string;
  transposedFormatted?: string;
  semitones: number;
  fromScale?: string;
  toScale?: string;
};

// Context type
type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  addToHistory: (entry: HistoryEntry) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  login: async () => false,
  signup: async () => false,
  logout: async () => {},
  sendPasswordResetEmail: async () => {},
  addToHistory: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Initialize session and listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        const { id, email } = data.session.user;
        setUser({ id, email });
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const { id, email } = session.user;
        setUser({ id, email });
      } else {
        setUser(null);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  };

  const signup = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signUp({ email, password });
    return !error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const sendPasswordResetEmail = async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/change-password`,
    });
  };

  const addToHistory = async (entry: HistoryEntry) => {
    if (!user) return;

    const {
      type,
      originalNotes,
      transposedNotes,
      originalFormatted,
      transposedFormatted,
      semitones,
      fromScale,
      toScale,
    } = entry;

    const { error } = await supabase.from('transposition_history').insert([
      {
        user_id: user.id,
        user_email: user.email,
        original_notes: originalNotes.join(' '),
        transposed_notes: transposedNotes.join(' '),
        original_formatted: originalFormatted ?? originalNotes.join(' '),
        transposed_formatted: transposedFormatted ?? transposedNotes.join(' '),
        type,
        semitones,
        from_scale: fromScale ?? null,
        to_scale: toScale ?? null,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Failed to insert into Supabase:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, login, signup, logout, sendPasswordResetEmail, addToHistory }}
    >
      {children}
    </AuthContext.Provider>
  );
};
