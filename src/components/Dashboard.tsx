import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TransposerForm, { TransposerResult } from '@/components/TransposerForm';
import HistoryPanel from '@/components/HistoryPanel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  Music,
  History,
  Calculator,
  Music2,
  Settings,
  LogOut,
  HelpCircle,
  Mail,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const DashboardPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'transpose' | 'history'>('transpose');
  const [notesInput, setNotesInput] = useState('');
  const [semitones, setSemitones] = useState('');
  const [fromScale, setFromScale] = useState('');
  const [toScale, setToScale] = useState('');
  const [result, setResult] = useState<TransposerResult | null>(null);

  const { logout, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    const confirmDelete = confirm("Are you sure you want to delete your account? This action is irreversible.");
    if (!confirmDelete || !user) return;

    try {
      const response = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        toast({
          title: "Account Deleted",
          description: "Your account has been successfully deleted."
        });
        logout();
      } else {
        const errorData = await response.json();
        toast({
          title: "Deletion Failed",
          description: errorData.error || 'Something went wrong.',
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Deletion Failed",
        description: 'Network error or unexpected failure.',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="musical-gradient p-3 rounded-full shadow-lg">
              <Music2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold gradient-text">Notes Transposer</h1>
              <p className="text-slate-400">Welcome back</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/instructions')}>
                <HelpCircle className="h-4 w-4 mr-2" /> Instructions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/contact')}>
                <Mail className="h-4 w-4 mr-2" /> Contact Us
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDeleteAccount} className="text-red-500">
                <Trash2 className="h-4 w-4 mr-2" /> Delete Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-2 mb-6 animate-slide-up">
          <Button
            variant={activeView === 'transpose' ? 'default' : 'ghost'}
            onClick={() => setActiveView('transpose')}
            className={`flex items-center gap-2 rounded-md transition-all duration-300 ${
              activeView === 'transpose'
                ? 'musical-gradient text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Calculator className="h-4 w-4" />
            Transpose
          </Button>
          <Button
            variant={activeView === 'history' ? 'default' : 'ghost'}
            onClick={() => setActiveView('history')}
            className={`flex items-center gap-2 rounded-md transition-all duration-300 ${
              activeView === 'history'
                ? 'musical-gradient text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <History className="h-4 w-4" />
            History
          </Button>
        </div>

        <div className="animate-slide-up">
          {activeView === 'transpose' ? (
            <TransposerForm
              notesInput={notesInput}
              setNotesInput={setNotesInput}
              semitones={semitones}
              setSemitones={setSemitones}
              fromScale={fromScale}
              setFromScale={setFromScale}
              toScale={toScale}
              setToScale={setToScale}
              result={result}
              setResult={setResult}
            />
          ) : (
            <HistoryPanel />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
