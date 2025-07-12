import React, { useState } from 'react';
import TransposerForm, { TransposerResult } from '@/components/TransposerForm';
import HistoryPanel from '@/components/HistoryPanel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Music, History, LogOut, Calculator, Music2 } from 'lucide-react';

const DashboardPage: React.FC = () => {
  // The logic for managing state and the active view is correct and remains unchanged.
  const [activeView, setActiveView] = useState<'transpose' | 'history'>('transpose');
  const [notesInput, setNotesInput] = useState('');
  const [semitones, setSemitones] = useState('');
  const [fromScale, setFromScale] = useState('');
  const [toScale, setToScale] = useState('');
  const [result, setResult] = useState<TransposerResult | null>(null);

  // Note: Your context provides `signOut`. The reference code uses `logout`.
  // We will use `signOut` as it is correct from the previous step.
  const { user, logout } = useAuth();

  return (
    // --- STYLED CONTAINER FROM YOUR REFERENCE ---
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* --- HEADER SECTION FROM YOUR REFERENCE --- */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="musical-gradient p-3 rounded-full shadow-lg">
              <Music2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold gradient-text">
                Notes Transposer
              </h1>
              <p className="text-slate-400">Welcome back</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={logout} // Using the correct signOut function from your context
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* --- NAVIGATION TABS FROM YOUR REFERENCE --- */}
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

        {/* --- CONTENT SECTION (LOGIC IS UNCHANGED) --- */}
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