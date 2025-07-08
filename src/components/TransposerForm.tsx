import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { transposer } from '@/utils/transposer';
import { Music2, RotateCcw, ClipboardCopy } from 'lucide-react';

const TransposerForm: React.FC = () => {
  const [notesInput, setNotesInput] = useState('');
  const [semitones, setSemitones] = useState('');
  const [fromScale, setFromScale] = useState('');
  const [toScale, setToScale] = useState('');
  const [result, setResult] = useState<{
    original: string[];
    transposed: string[];
    transposedFormatted: string;
    semitones: number;
    fromScale?: string;
    toScale?: string;
  } | null>(null);

  const { addToHistory } = useAuth();
  const { toast } = useToast();

  const preserveFormatting = (input: string, transposedNotes: string[]) => {
    const lines = input.split('\n');
    const transposedLines = [];
    let noteIndex = 0;

    for (const line of lines) {
      const words = line.split(/(\s+)/); // Preserve whitespace
      const transposedLine = words.map(word => {
        if (word.trim() && !/^\s+$/.test(word)) {
          if (noteIndex < transposedNotes.length) {
            return transposedNotes[noteIndex++];
          }
          return word;
        }
        return word;
      }).join('');
      transposedLines.push(transposedLine);
    }

    return transposedLines.join('\n');
  };

  const handleSemitoneTranspose = async () => {
    if (!notesInput.trim() || !semitones.trim()) {
      return toast({
        title: 'Error',
        description: 'Please enter notes and semitones',
        variant: 'destructive',
      });
    }

    const semitonesNum = parseInt(semitones);
    if (isNaN(semitonesNum)) {
      return toast({
        title: 'Error',
        description: 'Semitones must be a valid number',
        variant: 'destructive',
      });
    }

    const originalNotes = notesInput.trim().split(/\s+/);
    const transposedNotes = transposer.transposeSequence(originalNotes, semitonesNum);
    const transposedFormatted = preserveFormatting(notesInput, transposedNotes);

    const newResult = {
      original: originalNotes,
      transposed: transposedNotes,
      transposedFormatted,
      semitones: semitonesNum,
    };

    setResult(newResult);

    const dbEntry = {
      type: 'semitone' as const,
      originalNotes,
      transposedNotes,
      originalFormatted: notesInput,
      transposedFormatted,
      semitones: semitonesNum,
    };

    await addToHistory(dbEntry);

    toast({ title: 'Success', description: 'Transposition complete!' });
  };

  const handleScaleTranspose = async () => {
    if (!notesInput.trim() || !fromScale || !toScale) {
      return toast({
        title: 'Error',
        description: 'Please enter all fields',
        variant: 'destructive',
      });
    }

    const semitonesNum = transposer.calculateSemitoneDifferenceWestern(fromScale, toScale);
    if (semitonesNum === null || isNaN(semitonesNum)) {
      return toast({
        title: 'Error',
        description: 'Invalid scale conversion',
        variant: 'destructive',
      });
    }

    const originalNotes = notesInput.trim().split(/\s+/);
    const transposedNotes = transposer.transposeSequence(originalNotes, semitonesNum);
    const transposedFormatted = preserveFormatting(notesInput, transposedNotes);

    const newResult = {
      original: originalNotes,
      transposed: transposedNotes,
      transposedFormatted,
      semitones: semitonesNum,
      fromScale,
      toScale,
    };

    setResult(newResult);

    const dbEntry = {
      type: 'scale' as const,
      originalNotes,
      transposedNotes,
      originalFormatted: notesInput,
      transposedFormatted,
      semitones: semitonesNum,
      fromScale,
      toScale,
    };

    await addToHistory(dbEntry);

    toast({ title: 'Success', description: 'Scale transposed successfully!' });
  };

  const copyToClipboard = async () => {
    if (!result?.transposedFormatted) return;

    const text = result.transposedFormatted;

    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Transposed notes copied to clipboard.',
      });
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) {
          toast({
            title: 'Copied!',
            description: 'Copied using fallback method.',
          });
        } else {
          throw new Error();
        }
      } catch (e) {
        document.body.removeChild(textarea);
        toast({
          title: 'Failed to copy',
          description: 'Clipboard access was denied.',
          variant: 'destructive',
        });
      }
    }
  };

  const clearForm = () => {
    setNotesInput('');
    setSemitones('');
    setFromScale('');
    setToScale('');
    setResult(null);
  };

  const availableWesternNotes = transposer.getAvailableWesternNotes();

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex gap-2 items-center">
            <Music2 className="w-6 h-6" /> Transpose Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="semitone">
            <TabsList className="grid grid-cols-2 bg-white/10">
              <TabsTrigger value="semitone">By Semitones</TabsTrigger>
              <TabsTrigger value="scale">By Scale</TabsTrigger>
            </TabsList>

            <TabsContent value="semitone" className="space-y-4 mt-4">
              <Label className="text-white">Hindustani Notes</Label>
              <textarea
                rows={5}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="e.g. S R G M P D N"
                className="w-full resize-y bg-white/10 border border-white/20 text-white p-2 rounded"
              />
              <Label className="text-white">Semitones (+/-)</Label>
              <input
                type="number"
                value={semitones}
                onChange={(e) => setSemitones(e.target.value)}
                placeholder="+2, -1"
                className="w-full bg-white/10 border border-white/20 text-white p-2 rounded"
              />
              <Button className="w-full musical-gradient" onClick={handleSemitoneTranspose}>
                Transpose by Semitones
              </Button>
            </TabsContent>

            <TabsContent value="scale" className="space-y-4 mt-4">
              <Label className="text-white">Hindustani Notes</Label>
              <textarea
                rows={5}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="e.g. S R G M P D N"
                className="w-full resize-y bg-white/10 border border-white/20 text-white p-2 rounded"
              />
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">From Scale</Label>
                  <Select value={fromScale} onValueChange={setFromScale}>
                    <SelectTrigger>
                      <SelectValue placeholder="Current Sa" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWesternNotes.map(note => (
                        <SelectItem key={note} value={note}>{note}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">To Scale</Label>
                  <Select value={toScale} onValueChange={setToScale}>
                    <SelectTrigger>
                      <SelectValue placeholder="Target Sa" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWesternNotes.map(note => (
                        <SelectItem key={note} value={note}>{note}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full musical-gradient" onClick={handleScaleTranspose}>
                Transpose by Scale
              </Button>
            </TabsContent>
          </Tabs>

          <div className="flex justify-center mt-4">
            <Button variant="ghost" onClick={clearForm} className="text-slate-400 hover:text-white">
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Form
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="glass-card animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl text-white">Transposition Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">Transposed Notes</Label>
              <textarea
                rows={5}
                value={result.transposedFormatted}
                readOnly
                className="w-full resize-y bg-white/10 border border-white/20 text-white p-2 rounded font-mono"
              />
            </div>
            <div className="text-slate-400 text-sm pt-2 border-t border-white/20 flex gap-4">
              <span>Interval: {result.semitones} semitones</span>
              {result.fromScale && result.toScale && (
                <span>Scale: {result.fromScale} → {result.toScale}</span>
              )}
            </div>

            <Button variant="ghost" className="text-white mt-2" onClick={copyToClipboard}>
              <ClipboardCopy className="h-4 w-4 mr-2" />
              Copy Transposed Notes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TransposerForm;
