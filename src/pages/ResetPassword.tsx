// src/pages/ResetPassword.tsx
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { KeyRound } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      supabase.auth.getUser().then(({ data }) => {
        if (!data?.user) {
          setError('Invalid or expired password reset link.');
        }
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    } else {
      setSuccess(true);
      toast({ title: 'Success!', description: 'Password updated. Redirecting to login...' });
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-900 to-teal-900">
        <Card className="glass-card border-white/20 w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-display text-white">Password Updated!</CardTitle>
            <CardDescription className="text-slate-300">
              You can now sign in with your new password. Redirecting...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Card className="glass-card border-white/20 w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-display text-white">Set a New Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              />
            </div>

            {error && <p className="text-sm text-red-400 p-2 bg-red-900/50 rounded-md">{error}</p>}

            <Button
              type="submit"
              className="w-full musical-gradient hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Updating..." : (
                <div className="flex items-center justify-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Update Password
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;