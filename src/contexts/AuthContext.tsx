import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';

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
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const newUser = { id: data.user.id, email: data.user.email! };
        setUser(newUser);
        await loadUserHistory(newUser.id);
      }
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
      listener?.subscription.unsubscribe();
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
      console.error("Signup error:", error.message);
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
      console.error("Login error:", error.message);
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
    const formatted: TranspositionHistory = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date(newEntry.created_at),
    };
    setHistory(prev => [formatted, ...prev].slice(0, 50));
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

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        history,
        addToHistory,
        clearHistory,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
