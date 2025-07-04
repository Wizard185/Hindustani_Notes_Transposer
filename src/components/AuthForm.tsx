
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Music, UserPlus, LogIn } from 'lucide-react';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, signup } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      let success = false;
      
      if (isLogin) {
        success = await login(username, password);
        if (!success) {
          toast({
            title: "Login Failed",
            description: "Invalid username or password",
            variant: "destructive"
          });
        }
      } else {
        success = await signup(username, password);
        if (!success) {
          toast({
            title: "Signup Failed",
            description: "Username already exists",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome!",
            description: "Account created successfully",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }

    setLoading(false);
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
          <h1 className="text-4xl font-display font-bold gradient-text mb-2">
            Notes Transposer
          </h1>
          <p className="text-slate-400">
            Professional Hindustani music transposition tool
          </p>
        </div>

        <Card className="glass-card border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display text-white">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>
              
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

              {!isLogin && (
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

              <Button 
                type="submit" 
                className="w-full musical-gradient hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center mt-6">
              <Button
                variant="ghost"
                onClick={() => setIsLogin(!isLogin)}
                className="text-slate-400 hover:text-white"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthForm;
