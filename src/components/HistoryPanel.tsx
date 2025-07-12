import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Music, ArrowRight, Share2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph } from 'docx';
import { saveAs } from 'file-saver';

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

const HistoryPanel: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [sharingEntryId, setSharingEntryId] = useState<number | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  const formatDate = (timestamp: string) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));

  const generateFilename = (entry: HistoryEntry, ext: string) =>
    `transposed-notes-${entry.id}.${ext}`;

  const fetchHistory = async () => {
    if (!user?.email) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('transposition_history')
      .select('*')
      .eq('user_email', user.email)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error loading history',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      const parsed = (data || []).map((entry): HistoryEntry => ({
        id: entry.id,
        type: entry.type,
        originalNotes: typeof entry.original_notes === 'string' ? entry.original_notes.split(/\s+/) : [],
        transposedNotes: typeof entry.transposed_notes === 'string' ? entry.transposed_notes.split(/\s+/) : [],
        semitones: entry.semitones,
        fromScale: entry.from_scale,
        toScale: entry.to_scale,
        timestamp: entry.created_at,
      }));
      setHistory(parsed);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!user?.email) return;
    fetchHistory();

    const subscription = supabase
      .channel('history-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transposition_history',
          filter: `user_email=eq.${user.email}`,
        },
        fetchHistory
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.email]);

  const handleClearHistory = () => setClearDialogOpen(true);
  const confirmDeleteAll = async () => {
    await supabase.from('transposition_history').delete().match({ user_email: user?.email });
    toast({ title: 'History Cleared' });
    fetchHistory();
    setClearDialogOpen(false);
  };

  const handleIndividualDelete = async (id: number) => {
    await supabase.from('transposition_history').delete().eq('id', id);
    toast({ title: 'Deleted!' });
    fetchHistory();
  };

  const handleShare = async (blob: Blob, filename: string, title: string) => {
    const file = new File([blob], filename, { type: blob.type });

    try {
      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] }) &&
        typeof navigator.share === 'function'
      ) {
        await navigator.share({
          files: [file],
          title,
          text: 'Your transposed music file',
        });
      } else {
        saveAs(blob, filename); // fallback to download
      }
    } catch (err) {
      console.error('Share error:', err);
      toast({
        title: 'Export Failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const exportToPDF = async (entry: HistoryEntry) => {
    toast({ title: 'Generating PDF...' });

    const doc = new jsPDF();
    let y = 10;

    doc.setFont('Courier', 'normal');
    doc.text(`Exported: ${formatDate(entry.timestamp)}`, 10, y);
    y += 10;

    if (entry.type === 'scale') {
      doc.text(`Scale: ${entry.fromScale} → ${entry.toScale}`, 10, y);
      y += 10;
    } else {
      doc.text(`Interval: ${entry.semitones} semitones`, 10, y);
      y += 10;
    }

    doc.text('Original:', 10, y);
    y += 8;
    doc.text(entry.originalNotes.join(' '), 10, y);
    y += 10;

    doc.text('Transposed:', 10, y);
    y += 8;
    doc.text(entry.transposedNotes.join(' '), 10, y);

    const blob = doc.output('blob');
    await handleShare(blob, generateFilename(entry, 'pdf'), 'Transposition PDF');
  };

  const exportToDocx = async (entry: HistoryEntry) => {
    toast({ title: 'Generating Word file...' });

    const paragraphs = [
      new Paragraph(`Exported: ${formatDate(entry.timestamp)}`),
      new Paragraph(
        entry.type === 'scale'
          ? `Scale: ${entry.fromScale} → ${entry.toScale}`
          : `Interval: ${entry.semitones} semitones`
      ),
      new Paragraph(''),
      new Paragraph('Original Notes:'),
      new Paragraph(entry.originalNotes.join(' ')),
      new Paragraph(''),
      new Paragraph('Transposed Notes:'),
      new Paragraph(entry.transposedNotes.join(' ')),
    ];

    const doc = new Document({ sections: [{ children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    await handleShare(blob, generateFilename(entry, 'docx'), 'Transposition DOCX');
  };

  if (loading) return <p className="text-white text-center">Loading history...</p>;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display text-white">Transposition History</h2>
          <Button variant="ghost" onClick={handleClearHistory} className="text-red-400">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </div>

        {history.length === 0 ? (
          <p className="text-slate-400 text-center">No history found.</p>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <Card key={entry.id} className="glass-card overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Music className="h-5 w-5 text-musical-cyan" />
                      <div>
                        <h3 className="font-medium text-white">
                          {entry.type === 'scale' ? 'Scale Transposition' : 'Semitone Transposition'}
                        </h3>
                        <p className="text-sm text-slate-400">{formatDate(entry.timestamp)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-400"
                        onClick={() => handleIndividualDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white"
                        onClick={() =>
                          setSharingEntryId((prevId) => (prevId === entry.id ? null : entry.id))
                        }
                      >
                        {sharingEntryId === entry.id ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Share2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {sharingEntryId === entry.id ? (
                    <div className="animate-fade-in space-y-3 pt-4 border-t border-white/10">
                      <h4 className="text-center text-sm font-medium text-white">
                        Choose Export Format
                      </h4>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={async () => {
                          await exportToPDF(entry);
                          setSharingEntryId(null);
                        }}
                      >
                        Export as PDF
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={async () => {
                          await exportToDocx(entry);
                          setSharingEntryId(null);
                        }}
                      >
                        Export as Word (.docx)
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="text-sm text-slate-400 mb-2">Original:</h4>
                          <div className="flex flex-wrap gap-2">
                            {entry.originalNotes.map((note, i) => (
                              <span key={i} className="px-2 py-1 bg-white/10 rounded text-white">
                                {note}
                              </span>
                            ))}
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400" />
                        <div className="flex-1">
                          <h4 className="text-sm text-slate-400 mb-2">Transposed:</h4>
                          <div className="flex flex-wrap gap-2">
                            {entry.transposedNotes.map((note, i) => (
                              <span key={i} className="px-2 py-1 bg-musical-purple/20 rounded text-white">
                                {note}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-white/20 text-sm text-slate-400">
                        {entry.type === 'scale'
                          ? `Scale: ${entry.fromScale} → ${entry.toScale}`
                          : `Interval: ${entry.semitones} semitones`}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All History</DialogTitle>
          </DialogHeader>
          <p>Are you sure? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAll}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HistoryPanel;
