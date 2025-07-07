// components/HistoryPanel.tsx - Updated with auto-refresh
import React, { useEffect, useState, useRef } from 'react';
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
import { Document, Packer, Paragraph,TextRun } from 'docx';
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
  originalFormatted?: string;
  transposedFormatted?: string;
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const recreateFormattedOutput = (originalNotes: string[], transposedNotes: string[]) => {
    if (originalNotes.length !== transposedNotes.length) {
      return transposedNotes.join(' ');
    }
    return transposedNotes.join(' ');
  };

  const fetchHistory = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('transposition_history')
      .select('*')
      .eq('user_email', user.email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching history:', error);
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

        const originalNotes = parseNotes(entry.original_notes);
        const transposedNotes = parseNotes(entry.transposed_notes);

        return {
          id: entry.id,
          type: entry.type,
          originalNotes,
          transposedNotes,
          originalFormatted: entry.original_formatted || originalNotes.join(' '),
          transposedFormatted: entry.transposed_formatted || recreateFormattedOutput(originalNotes, transposedNotes),
          semitones: entry.semitones,
          fromScale: entry.from_scale,
          toScale: entry.to_scale,
          timestamp: entry.created_at || new Date().toISOString(),
        };
      });

      setHistory(formatted as HistoryEntry[]);
    }

    setLoading(false);
  };

  // Set up real-time subscription for changes
  useEffect(() => {
    if (!user?.email) return;

    // Initial fetch
    fetchHistory();

    // Set up real-time subscription
    const subscription = supabase
      .channel('transposition_history_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transposition_history',
          filter: `user_email=eq.${user.email}`,
        },
        (payload) => {
          console.log('Real-time change detected:', payload);
          fetchHistory(); // Refresh data when changes occur
        }
      )
      .subscribe();

    // Also set up a polling mechanism as backup
    intervalRef.current = setInterval(() => {
      fetchHistory();
    }, 30000); // Poll every 30 seconds

    return () => {
      subscription.unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user?.email]);

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
      await fetchHistory(); // Refresh after deletion
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
      // Optimistically update the UI
      setHistory((prev) => prev.filter((item) => item.id !== id));
      // Also trigger a fresh fetch to ensure consistency
      await fetchHistory();
    } else {
      toast({ title: 'Error deleting entry', description: error.message });
    }
  };

  const exportToPDF = (entry: HistoryEntry) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Music Transposition Export', 10, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let yPosition = 35;
    
    // Date and basic info
    doc.text(`Date: ${formatDate(entry.timestamp)}`, 10, yPosition);
    yPosition += 8;
    
    doc.text(`Transposition Type: ${entry.type === 'semitone' ? 'Semitone Transposition' : 'Scale Transposition'}`, 10, yPosition);
    yPosition += 8;
    
    doc.text(`Interval: ${entry.semitones > 0 ? '+' : ''}${entry.semitones} semitones`, 10, yPosition);
    yPosition += 8;
    
    // Scale change information (if applicable)
    if (entry.type === 'scale' && entry.fromScale && entry.toScale) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Scale Change: ${entry.fromScale} → ${entry.toScale}`, 10, yPosition);
      doc.setFont('helvetica', 'normal');
      yPosition += 12;
    } else {
      yPosition += 8;
    }
    
    // Add separator line
    doc.setLineWidth(0.5);
    doc.line(10, yPosition, 200, yPosition);
    yPosition += 15;
    
    // Original Notes section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Original Notes:', 10, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont('courier', 'normal');
    
    // Use formatted version if available, otherwise reconstruct formatting
    const originalFormatted = entry.originalFormatted || entry.originalNotes.join(' ');
    const originalLines = originalFormatted.split('\n');
    
    originalLines.forEach(line => {
      if (line.trim()) { // Only add non-empty lines
        doc.text(line, 15, yPosition);
        yPosition += 7;
      } else {
        yPosition += 4; // Smaller space for empty lines
      }
    });
    
    yPosition += 10;
    
    // Transposed Notes section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Transposed Notes:', 10, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont('courier', 'normal');
    
    // Use formatted version if available, otherwise reconstruct formatting
    const transposedFormatted = entry.transposedFormatted || entry.transposedNotes.join(' ');
    const transposedLines = transposedFormatted.split('\n');
    
    transposedLines.forEach(line => {
      if (line.trim()) { // Only add non-empty lines
        doc.text(line, 15, yPosition);
        yPosition += 7;
      } else {
        yPosition += 4; // Smaller space for empty lines
      }
    });
    
    // Add footer
    yPosition += 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Generated by Music Transposer', 10, yPosition);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `transposed_notes_${entry.type}_${timestamp}.pdf`;
    doc.save(filename);
  };

  const exportToDocx = async (entry: HistoryEntry) => {
    const children = [
      new Paragraph({
        text: "Music Transposition Export",
        heading: "Title",
        spacing: { after: 400 }
      }),
      
      // Document info section
      new Paragraph({
        text: `Date: ${formatDate(entry.timestamp)}`,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: `Transposition Type: ${entry.type === 'semitone' ? 'Semitone Transposition' : 'Scale Transposition'}`,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: `Interval: ${entry.semitones > 0 ? '+' : ''}${entry.semitones} semitones`,
        spacing: { after: 200 }
      }),
    ];

    // Add scale change information if it's a scale transposition
    if (entry.type === 'scale' && entry.fromScale && entry.toScale) {
      children.push(
        new Paragraph({
          text: `Scale Change: ${entry.fromScale} → ${entry.toScale}`,
          spacing: { after: 400 },
          
        })
      );
    } else {
      children.push(new Paragraph({ text: "", spacing: { after: 400 } }));
    }

    // Original Notes section
    children.push(
      new Paragraph({
        text: "Original Notes:",
        heading: "Heading2",
        spacing: { after: 200 }
      })
    );
    
    // Add original notes with preserved formatting
    const originalFormatted = entry.originalFormatted || entry.originalNotes.join(' ');
    const originalLines = originalFormatted.split('\n');
    
    originalLines.forEach(line => {
      if (line.trim()) { // Only add non-empty lines
        children.push(new Paragraph({
          text: line,
           // Monospace font for better alignment
          spacing: { after: 100 }
        }));
      } else {
        children.push(new Paragraph({ text: "", spacing: { after: 50 } }));
      }
    });

    // Add space between sections
    children.push(new Paragraph({ text: "", spacing: { after: 300 } }));

    // Transposed Notes section
    children.push(
      new Paragraph({
        text: "Transposed Notes:",
        heading: "Heading2",
        spacing: { after: 200 }
      })
    );
    
    // Add transposed notes with preserved formatting
    const transposedFormatted = entry.transposedFormatted || entry.transposedNotes.join(' ');
    const transposedLines = transposedFormatted.split('\n');
    
    transposedLines.forEach(line => {
      if (line.trim()) { // Only add non-empty lines
        children.push(new Paragraph({
          text: line,
          // Monospace font for better alignment
          spacing: { after: 100 }
        }));
      } else {
        children.push(new Paragraph({ text: "", spacing: { after: 50 } }));
      }
    });

    // Add footer
    children.push(
      new Paragraph({ text: "", spacing: { after: 400 } }),
      new Paragraph({
        text: "Generated by Music Transposer",
        
    
        spacing: { after: 200 }
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `transposed_notes_${entry.type}_${timestamp}.docx`;
    
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
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
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 text-sm"
                      onClick={() => handleIndividualDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>

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