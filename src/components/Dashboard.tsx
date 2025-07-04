
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Music, History, Calculator, RotateCcw } from 'lucide-react';
import TransposerForm from './TransposerForm';
import HistoryPanel from './HistoryPanel';
import { useState } from 'react';


const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'transpose' | 'history'>('transpose');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="musical-gradient p-3 rounded-full shadow-lg">
              <Music className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold gradient-text">
                Notes Transposer
              </h1>
              <p className="text-slate-400">Welcome back </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={logout}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 animate-slide-up">
          <Button
            variant={activeTab === 'transpose' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('transpose')}
            className={`flex items-center gap-2 ${
              activeTab === 'transpose' 
                ? 'musical-gradient text-white' 
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Calculator className="h-4 w-4" />
            Transpose
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 ${
              activeTab === 'history' 
                ? 'musical-gradient text-white' 
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <History className="h-4 w-4" />
            History
          </Button>
        </div>

        {/* Content */}
        <div className="animate-slide-up">
          {activeTab === 'transpose' ? (
            <TransposerForm />
          ) : (
            <HistoryPanel />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
