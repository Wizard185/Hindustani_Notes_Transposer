// utils/transposer.ts

export class HindustaniTransposer {
  private chromatic_scale = [
    'S', 'r', 'R', 'g', 'G', 'm', 'M',
    'P', 'd', 'D', 'n', 'N'
  ];

  private western_notes = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#',
    'G', 'G#', 'A', 'A#', 'B'
  ];

  private western_aliases: { [key: string]: string } = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#',
    'Ab': 'G#', 'Bb': 'A#'
  };

  normalizeNote(note: string): string {
    return note.trim();
  }

  normalizeWesternNote(note: string): string {
    const normalized = note.trim();
    if (this.western_notes.includes(normalized)) {
      return normalized;
    }
    if (normalized in this.western_aliases) {
      return this.western_aliases[normalized];
    }
    throw new Error(`Invalid Western note: ${note}`);
  }

  getSemitoneIndex(note: string): number {
    const normalized = this.normalizeNote(note);
    const index = this.chromatic_scale.indexOf(normalized);
    if (index === -1) {
      throw new Error(`Invalid Hindustani note: ${note}`);
    }
    return index;
  }

  getWesternIndex(note: string): number {
    const normalized = this.normalizeWesternNote(note);
    return this.western_notes.indexOf(normalized);
  }

  calculateSemitoneDifferenceWestern(fromNote: string, toNote: string): number {
    const fromIndex = this.getWesternIndex(fromNote);
    const toIndex = this.getWesternIndex(toNote);
    return toIndex - fromIndex;
  }

  transposeNote(note: string, semitones: number): string {
    const currentIndex = this.getSemitoneIndex(note);
    const newIndex = (currentIndex + semitones + 12) % 12;
    return this.chromatic_scale[newIndex];
  }

  transposeWesternNote(note: string, semitones: number): string {
    const currentIndex = this.getWesternIndex(note);
    const newIndex = (currentIndex + semitones + 12) % 12;
    return this.western_notes[newIndex];
  }

  transposeSequence(notes: string[] | string, semitones: number, useWestern = false): string[] {
    let noteArray: string[];

    if (typeof notes === 'string') {
      noteArray = notes.replace(/,/g, ' ').split(/\s+/).filter(note => note.trim());
    } else {
      noteArray = notes;
    }

    const transposed: string[] = [];
    for (const note of noteArray) {
      const trimmedNote = note.trim();
      if (trimmedNote) {
        try {
          const transposedNote = useWestern
            ? this.transposeWesternNote(trimmedNote, semitones)
            : this.transposeNote(trimmedNote, semitones);
          transposed.push(transposedNote);
        } catch (error) {
          console.warn(`Warning: ${error}`);
          transposed.push(trimmedNote);
        }
      }
    }
    return transposed;
  }

  getAvailableNotes(): string[] {
    return [...this.chromatic_scale];
  }

  getAvailableWesternNotes(): string[] {
    return [...this.western_notes];
  }
}

export const transposer = new HindustaniTransposer();
