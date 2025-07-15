// src/pages/ForgotPassword.tsx
import React, { useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Reset Link Sent',
        description: 'Check your email for the reset password link.',
      });
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
          <form onSubmit={handleReset} className="space-y-4">
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

            <Button type="submit" className="w-full musical-gradient hover:opacity-90 transition-opacity" disabled={loading}>
              {loading ? 'Sending...' : (
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send Reset Link
                </div>
              )}
            </Button>

            <div className="text-center mt-4">
              <Link to="/" className="text-slate-400 hover:text-white text-sm">Back to Sign In</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;