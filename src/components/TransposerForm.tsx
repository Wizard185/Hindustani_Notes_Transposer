// components/TransposerForm.tsx
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
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { transposer } from '@/utils/transposer';
import { Music2, RotateCcw, ClipboardCopy, ArrowRightLeft } from 'lucide-react';

export type TransposerResult = {
  original: string[];
  transposed: string[];
  transposedFormatted: string;
  semitones: number;
  fromScale?: string;
  toScale?: string;
};

interface TransposerFormProps {
  notesInput: string;
  setNotesInput: (value: string) => void;
  semitones: string;
  setSemitones: (value: string) => void;
  fromScale: string;
  setFromScale: (value: string) => void;
  toScale: string;
  setToScale: (value: string) => void;
  result: TransposerResult | null;
  setResult: (result: TransposerResult | null) => void;
}

const TransposerForm: React.FC<TransposerFormProps> = ({
  notesInput, setNotesInput,
  semitones, setSemitones,
  fromScale, setFromScale,
  toScale, setToScale,
  result, setResult
}) => {
  const { addToHistory } = useAuth();
  const { toast } = useToast();
  const [useWestern, setUseWestern] = useState(false);

  const handleSwapScales = () => {
    setFromScale(toScale);
    setToScale(fromScale);
  };

  const preserveFormatting = (input: string, transposedNotes: string[]) => {
    if (!Array.isArray(transposedNotes)) return "Error: Transposition failed.";
    const lines = input.split('\n');
    let noteIndex = 0;
    return lines.map(line =>
      line.split(/(\s+)/).map(word => {
        if (word.trim() && !/^\s+$/.test(word) && noteIndex < transposedNotes.length) {
          return transposedNotes[noteIndex++];
        }
        return word;
      }).join('')
    ).join('\n');
  };

  const performTranspose = async (type: 'semitone' | 'scale') => {
    try {
      if (!notesInput.trim()) return toast({ title: 'Input Missing', description: 'Please enter notes to transpose.', variant: 'destructive' });
      let semitonesNum: number | null;
      if (type === 'semitone') {
        if (!semitones.trim()) return toast({ title: 'Input Missing', description: 'Please enter semitones.', variant: 'destructive' });
        semitonesNum = parseInt(semitones);
        if (isNaN(semitonesNum)) return toast({ title: 'Invalid Input', description: 'Semitones must be a valid number.', variant: 'destructive' });
      } else {
        if (!fromScale || !toScale) return toast({ title: 'Input Missing', description: 'Please select both scales.', variant: 'destructive' });
        semitonesNum = transposer.calculateSemitoneDifferenceWestern(fromScale, toScale);
        if (semitonesNum === null) return toast({ title: 'Error', description: 'Invalid scale conversion.', variant: 'destructive' });
      }

      const originalNotes = notesInput.trim().split(/\s+/);
      const transposedNotes = transposer.transposeSequence(originalNotes, semitonesNum, useWestern);
      if (!transposedNotes || !Array.isArray(transposedNotes)) throw new Error("Transposition function failed.");

      const transposedFormatted = preserveFormatting(notesInput, transposedNotes);
      const newResult: TransposerResult = {
        original: originalNotes, transposed: transposedNotes, transposedFormatted, semitones: semitonesNum,
        ...(type === 'scale' && { fromScale, toScale }),
      };
      setResult(newResult);

      const dbEntry = {
        type: type, originalNotes: originalNotes, transposedNotes: transposedNotes,
        originalFormatted: notesInput, transposedFormatted: transposedFormatted, semitones: semitonesNum,
        ...(type === 'scale' && { fromScale, toScale }),
      };
      await addToHistory(dbEntry);
      toast({ title: 'Success!', description: 'Transposition complete.' });
    } catch (error) {
      console.error("Transposition Failed:", error);
      toast({ title: 'An Error Occurred', description: error instanceof Error ? error.message : 'Unknown error.', variant: 'destructive' });
    }
  };

  const copyToClipboard = async () => {
    if (!result?.transposedFormatted) return;
    const text = result.transposedFormatted;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied!', description: 'Transposed notes copied to clipboard.' });
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
        if (!successful) throw new Error();
        toast({ title: 'Copied!', description: 'Copied using fallback method.' });
      } catch (e) {
        toast({ title: 'Failed to copy', variant: 'destructive' });
      }
      document.body.removeChild(textarea);
    }
  };

  const clearForm = () => {
    setNotesInput(''); setSemitones(''); setFromScale(''); setToScale(''); setResult(null);
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
          <div className="flex items-center justify-between mb-2">
            <Label className="text-white">{useWestern ? 'Western Notes' : 'Hindustani Notes'}</Label>
            <div className="flex items-center gap-2">
              <Label className="text-white text-sm">Hindustani</Label>
              <Switch checked={useWestern} onCheckedChange={setUseWestern} />
              <Label className="text-white text-sm">Western</Label>
            </div>
          </div>

          <Tabs defaultValue="semitone">
            <TabsList className="grid grid-cols-2 bg-white/10">
              <TabsTrigger value="semitone">By Semitones</TabsTrigger>
              <TabsTrigger value="scale">By Scale</TabsTrigger>
            </TabsList>

            <TabsContent value="semitone" className="space-y-4 mt-4">
              <textarea
                rows={5}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder={useWestern ? "e.g. C D E F G A B" : "e.g. S R G M P D N"}
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
              <Button className="w-full musical-gradient" onClick={() => performTranspose('semitone')}>
                Transpose by Semitones
              </Button>
            </TabsContent>

            <TabsContent value="scale" className="space-y-4 mt-4">
              <textarea
                rows={5}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder={useWestern ? "e.g. C D E F G A B" : "e.g. S R G M P D N"}
                className="w-full resize-y bg-white/10 border border-white/20 text-white p-2 rounded"
              />
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-white">From Scale</Label>
                  <Select value={fromScale} onValueChange={setFromScale}>
                    <SelectTrigger>
                      <SelectValue placeholder="Current Sa" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWesternNotes.map(note => (
                        <SelectItem key={`from-${note}`} value={note}>{note}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="icon" onClick={handleSwapScales} className="shrink-0 text-white hover:bg-white/20" aria-label="Swap scales">
                  <ArrowRightLeft className="w-4 h-4"/>
                </Button>
                <div className="flex-1 space-y-1">
                  <Label className="text-white">To Scale</Label>
                  <Select value={toScale} onValueChange={setToScale}>
                    <SelectTrigger>
                      <SelectValue placeholder="Target Sa" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWesternNotes.map(note => (
                        <SelectItem key={`to-${note}`} value={note}>{note}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full musical-gradient" onClick={() => performTranspose('scale')}>
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
