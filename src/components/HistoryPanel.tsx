// components/HistoryPanel.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, ClipboardCopy, Eye, X, FileText, FileSignature } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

// --- Types ---
type HistoryEntry = {
  id: number;
  type: 'semitone' | 'scale';
  originalNotes: string[];
  transposedNotes: string[];
  semitones: number;
  fromScale?: string;
  toScale?: string;
  timestamp: string;
};

const formatDate = (timestamp: string) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));

const HistoryPanel: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (!user?.email) return;

    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('transposition_history')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: 'Error loading history', description: error.message, variant: 'destructive' });
      } else {
        const parsed = (data || []).map((entry): HistoryEntry => ({
          id: entry.id,
          type: entry.type,
          originalNotes: typeof entry.original_formatted === 'string' ? entry.original_formatted.split('\n') : [],
          transposedNotes: typeof entry.transposed_formatted === 'string' ? entry.transposed_formatted.split('\n') : [],
          semitones: entry.semitones,
          fromScale: entry.from_scale,
          toScale: entry.to_scale,
          timestamp: entry.created_at,
        }));
        setHistory(parsed);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [user?.email]);

  const confirmDelete = async (id: number) => {
    setDeletingId(id);
    const { error } = await supabase.from('transposition_history').delete().eq('id', id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Entry deleted' });
      setHistory(history.filter((h) => h.id !== id));
    }
    setDeletingId(null);
  };

  const confirmDeleteAll = async () => {
    const { error } = await supabase.from('transposition_history').delete().eq('user_email', user?.email);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'All history deleted' });
      setHistory([]);
    }
    setClearDialogOpen(false);
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard' });
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast({ title: 'Copied to clipboard' });
      } catch {
        toast({ title: 'Copy failed', description: 'Unable to copy text.', variant: 'destructive' });
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Transposition History</h2>
        {history.length > 0 && (
          <Button variant="destructive" size="sm" onClick={() => setClearDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" /> Clear All
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-white">Loading...</p>
      ) : history.length === 0 ? (
        <p className="text-slate-400">No history found.</p>
      ) : (
        history.map((entry) => {
          const previewText = `${entry.type === 'scale' ? `Scale: ${entry.fromScale} → ${entry.toScale} | Semitones: ${entry.semitones}\n\n` : `Semitones: ${entry.semitones}\n\n`}Original Notes:\n${entry.originalNotes.join('\n')}\n\nTransposed Notes:\n${entry.transposedNotes.join('\n')}`;
          const transposedOnlyText = entry.transposedNotes.join('\n');

          return (
            <Card key={entry.id} className="mb-6 relative">
              <CardContent className="p-4">
                <div className="mb-4 text-sm text-slate-300">{formatDate(entry.timestamp)}</div>
                <div className="mb-2 font-semibold text-white">
                  {entry.type === 'scale'
                    ? `Scale: ${entry.fromScale} → ${entry.toScale} | Semitones: ${entry.semitones}`
                    : `Semitones: ${entry.semitones}`}
                </div>
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <h4 className="text-white mb-1">Original Notes</h4>
                    <pre className="bg-gray-900 text-white p-2 rounded text-sm whitespace-pre-wrap font-mono">
                      {entry.originalNotes.join('\n')}
                    </pre>
                  </div>
                  <div className="w-1/2">
                    <h4 className="text-white mb-1">Transposed Notes</h4>
                    <pre className="bg-gray-900 text-white p-2 rounded text-sm whitespace-pre-wrap font-mono">
                      {entry.transposedNotes.join('\n')}
                    </pre>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPreviewId(previewId === entry.id ? null : entry.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" /> Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(previewText)}
                  >
                    <ClipboardCopy className="h-4 w-4 mr-1" /> Copy Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(transposedOnlyText)}
                  >
                    <ClipboardCopy className="h-4 w-4 mr-1" /> Copy Transposed Notes
                  </Button>
                  {!isMobile && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => {}}>
                        <FileSignature className="h-4 w-4 mr-1" /> Export as PDF
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {}}>
                        <FileText className="h-4 w-4 mr-1" /> Export as Word
                      </Button>
                    </>
                  )}
                </div>
                {previewId === entry.id && (
                  <div className="mt-4 relative border border-white/20 rounded-lg">
                    <button
                      className="absolute top-2 right-2 text-white hover:text-red-400"
                      onClick={() => setPreviewId(null)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="bg-gray-800 text-white p-4 rounded font-mono text-sm whitespace-pre-wrap">
                      {previewText}
                    </div>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  disabled={deletingId === entry.id}
                  onClick={() => confirmDelete(entry.id)}
                >
                  {deletingId === entry.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })
      )}

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All History</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete all transposition history? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteAll}>Delete All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryPanel;
