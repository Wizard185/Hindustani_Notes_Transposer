import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Music, UserPlus, LogIn, Mail, ArrowLeft } from 'lucide-react';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, signup, sendPasswordResetEmail } = useAuth();
  const { toast } = useToast();

  // --- Refactored Logic: Dedicated handler for Login/Signup ---
  const handleLoginOrSignup = async () => {
    if (!email.trim() || !password.trim()) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    try {
      let success = false;
      if (isLogin) {
        success = await login(email, password);
        if (!success) {
          toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
        }
      } else {
        success = await signup(email, password);
        if (!success) {
          toast({ title: "Signup Failed", description: "Could not create account. The email may already be in use.", variant: "destructive" });
        } else {
          toast({ title: "Welcome!", description: "Account created. Please check your email to verify your account." });
          setIsLogin(true); // Switch to login view after successful signup
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    }
  };

  // --- Refactored Logic: Dedicated handler for Password Reset ---
  const handlePasswordReset = async () => {
    // Improved email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    await sendPasswordResetEmail(email);
    // We don't check for success to prevent user enumeration attacks. Always show a generic message.
    toast({
      title: "Check your email",
      description: "If an account with that email exists, we've sent a password reset link.",
    });
    setIsForgotPassword(false);
  };

  // --- Main submit handler now acts as a router ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isForgotPassword) {
      await handlePasswordReset();
    } else {
      await handleLoginOrSignup();
    }

    setLoading(false);
  };
  
  const getTitle = () => {
    if (isForgotPassword) return 'Reset Password';
    return isLogin ? 'Welcome Back' : 'Create Account';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="musical-gradient p-4 rounded-full shadow-lg">
              <Music className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold gradient-text mb-2">Notes Transposer</h1>
          <p className="text-slate-400">Professional Hindustani music transposition tool</p>
        </div>

        <Card className="glass-card border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display text-white">{getTitle()}</CardTitle>
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
                  placeholder="Enter your email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>
              
              {!isForgotPassword && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    />
                  </div>
                  {isLogin && (
                    <div className="flex justify-end -mt-2">
                       <Button 
                        type="button" 
                        variant="link" 
                        className="p-0 h-auto text-sm text-slate-400 hover:text-white"
                        onClick={() => setIsForgotPassword(true)}
                      >
                        Forgot Password?
                      </Button>
                    </div>
                  )}
                </>
              )}

              {!isLogin && !isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                </div>
              )}

              <Button type="submit" className="w-full musical-gradient hover:opacity-90 transition-opacity" disabled={loading}>
                {loading ? 'Processing...' : (
                  <div className="flex items-center justify-center gap-2">
                    {isForgotPassword ? <Mail className="h-4 w-4" /> : isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
                  </div>
                )}
              </Button>
            </form>
            
            <div className="text-center mt-6">
              {isForgotPassword ? (
                <Button variant="ghost" onClick={() => setIsForgotPassword(false)} className="text-slate-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sign In
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setIsLogin(!isLogin)} className="text-slate-400 hover:text-white">
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthForm;