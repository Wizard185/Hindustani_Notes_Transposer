import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';

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

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  addToHistory: (entry: HistoryEntry) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  addToHistory: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
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
    <AuthContext.Provider value={{ user, setUser, addToHistory }}>
      {children}
    </AuthContext.Provider>
  );
};
