// components/HistoryPanel.tsx
import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Music, Calendar, ArrowRight, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph } from 'docx';
import { saveAs } from 'file-saver';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { toast } = useToast();
  const { user } = useAuth();

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transposition_history')
      .select('*')
      .eq('user_email', user?.email)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error loading history',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      const formatted = (data || []).map((entry) => {
        const parseNotes = (field: any): string[] => {
          if (Array.isArray(field)) return field;
          if (typeof field === 'string') {
            try {
              const parsed = JSON.parse(field);
              if (Array.isArray(parsed)) return parsed;
            } catch {
              return field.trim().split(/[\s,]+/);
            }
          }
          return [];
        };

        return {
          ...entry,
          originalNotes: parseNotes(entry.original_notes),
          transposedNotes: parseNotes(entry.transposed_notes),
          timestamp: entry.created_at || new Date().toISOString(),
        };
      });

      setHistory(formatted as HistoryEntry[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleClearHistory = async () => {
    setDialogOpen(true);
  };

  const confirmDeleteAll = async () => {
    const { error } = await supabase
      .from('transposition_history')
      .delete()
      .match({ user_email: user?.email });

    if (error) {
      toast({ title: 'Failed to clear history', description: error.message });
    } else {
      toast({ title: 'History Cleared' });
      setSelectedIds(new Set());
      fetchHistory();
    }

    setDialogOpen(false);
  };

  const handleIndividualDelete = async (id: number) => {
    const { error } = await supabase
      .from('transposition_history')
      .delete()
      .eq('id', id);

    if (!error) {
      toast({ title: 'Deleted!' });
      setHistory((prev) => prev.filter((item) => item.id !== id));
    }
  };

 const exportToPDF = (entry: HistoryEntry) => {
  const doc = new jsPDF();
  doc.setFontSize(12);
  doc.text('Transposed Notes', 10, 10);
  doc.text(`Original: ${entry.originalNotes.join(' ')}`, 10, 20);
  doc.text(`Transposed: ${entry.transposedNotes.join(' ')}`, 10, 30);
  doc.text(`Semitones: ${entry.semitones}`, 10, 40);
  if (entry.type === 'scale' && entry.fromScale && entry.toScale) {
    doc.text(`Scale: ${entry.fromScale} → ${entry.toScale}`, 10, 50);
  }
  doc.save('transposed_notes.pdf');
};

const exportToDocx = async (entry: HistoryEntry) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph("Transposed Notes"),
        new Paragraph(`Original: ${entry.originalNotes.join(' ')}`),
        new Paragraph(`Transposed: ${entry.transposedNotes.join(' ')}`),
        new Paragraph(`Semitones: ${entry.semitones}`),
        ...(entry.type === 'scale' && entry.fromScale && entry.toScale
          ? [new Paragraph(`Scale: ${entry.fromScale} → ${entry.toScale}`)]
          : []),
      ],
    }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, "transposed_notes.docx");
};

  if (loading) {
    return <p className="text-white text-center">Loading history...</p>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display text-white">Transposition History</h2>
            <p className="text-slate-400">
              {history.length} transposition{history.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={handleClearHistory}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </div>

        <div className="space-y-4">
          {history.map((entry, index) => (
            <Card key={entry.id} className="glass-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.has(entry.id)}
                      onCheckedChange={(checked) => {
                        const updated = new Set(selectedIds);
                        if (checked) {
                          updated.add(entry.id);
                        } else {
                          updated.delete(entry.id);
                        }
                        setSelectedIds(updated);
                      }}
                    />
                    <div className={`p-2 rounded-full ${entry.type === 'semitone' ? 'bg-musical-purple/20 text-musical-purple' : 'bg-musical-cyan/20 text-musical-cyan'}`}>
                      <Music className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        {entry.type === 'semitone' ? 'Semitone Transposition' : 'Scale Transposition'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
  <Button
    variant="ghost"
    className="text-red-400 hover:text-red-300 text-sm"
    onClick={() => handleIndividualDelete(entry.id)}
  >
    <Trash2 className="h-4 w-4 mr-2" />
    Delete
  </Button>
</div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-white">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => exportToDocx(entry)}>
                        Export to Word (.docx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportToPDF(entry)}>
                        Export as PDF
                      </DropdownMenuItem>
                      
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-slate-400 mb-2">Original:</h4>
                      <div className="flex flex-wrap gap-2">
                        {entry.originalNotes.map((note, noteIndex) => (
                          <span key={noteIndex} className="px-2 py-1 bg-white/10 rounded text-white text-sm">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <ArrowRight className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-slate-400 mb-2">Transposed:</h4>
                      <div className="flex flex-wrap gap-2">
                        {entry.transposedNotes.map((note, noteIndex) => (
                          <span key={noteIndex} className="px-2 py-1 bg-musical-purple/20 rounded text-white text-sm">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/20 flex flex-wrap gap-4 text-sm text-slate-400">
                    <span>Interval: {entry.semitones} semitones</span>
                    {entry.fromScale && entry.toScale && (
                      <span>
                        Scale: {entry.fromScale} → {entry.toScale}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete History</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Are you sure you want to delete all history entries? This action cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAll}>
              Confirm Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HistoryPanel;
