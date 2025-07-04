
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const { user } = useAuth();

  return user ? <Dashboard /> : <AuthForm />;
};

export default Index;
