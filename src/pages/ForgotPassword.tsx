// src/pages/ForgotPassword.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/supabaseClient';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    // Check if email is registered using invalid login trick
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: 'this-is-definitely-wrong-password',
    });

    if (loginError && loginError.message.toLowerCase().includes('invalid login credentials')) {
      setError('This email is not registered. Please enter a registered email ID.');
      toast({
        title: 'Reset Failed',
        description: 'This email is not registered. Please enter a registered email ID.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://notes-transposer.vercel.app/update-password',
    });

    if (resetError) {
      setError(resetError.message);
      toast({
        title: 'Reset Failed',
        description: resetError.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Reset Link Sent!',
        description: 'Check your email to reset your password. If not received, check your spam folder.',
      });
      setEmail('');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Card className="glass-card border-white/20 w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-display text-white">Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              />
            </div>

            {error && <p className="text-sm text-red-400 p-2 bg-red-900/50 rounded-md">{error}</p>}

            <Button 
              type="submit"
              className="w-full musical-gradient hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? 'Sending...' : (
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send Reset Link
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
