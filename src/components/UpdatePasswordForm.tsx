import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound } from 'lucide-react';

// This component should be rendered on a specific route, e.g., '/update-password'
// In a real app, you would use a router (like react-router-dom or Next.js router) to handle this.

const UpdatePasswordForm: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { updateUserPassword, logout, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase automatically creates a session from the magic link.
    // The listener in AuthProvider sets the user. If it's still null after a delay,
    // the link is likely invalid or expired.
    const timer = setTimeout(() => {
        // The `user` object is populated by the `onAuthStateChange` listener in `AuthProvider`
        // when the user lands on this page from the reset link.
      if (!user) {
        setError("Invalid or expired password reset link. Please request a new one from the login page.");
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [user]);

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
    const result = await updateUserPassword(password);
    
    if (result.success) {
      toast({
        title: "Success!",
        description: "Your password has been updated. You will be logged out now.",
      });
      setSuccess(true);
      // Log out for security and to force re-login with the new password.
      setTimeout(async () => {
        await logout();
        // Here you would redirect to the login page, e.g., window.location.href = '/login';
      }, 3000);
    } else {
      setError(result.error || "An unknown error occurred.");
      toast({
        title: "Update Failed",
        description: result.error || "Could not update password.",
        variant: "destructive"
      });
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
              disabled={loading || !user}
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

export default UpdatePasswordForm;