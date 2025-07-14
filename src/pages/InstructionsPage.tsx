import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const InstructionsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold gradient-text">Instructions</h1>
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>

        <div className="space-y-4 text-slate-300">
          <p>
            {/* You can replace this placeholder content with detailed usage instructions later. */}
            Welcome to Notes Transposer. This app helps musicians and learners easily transpose notes between different scales or shift them by semitones.
          </p>
          <ul className="list-disc pl-6">
            <li>Choose between Hindustani or Western notation using the toggle.</li>
            <li>Input your notes in the provided box, formatted line by line or space separated and can include ,-| for alignement with space in between.</li>
            <li>Select semitones to shift notes up/down, or choose source and target scales to transpose.</li>
            <li><strong>For scale transitions,first enter the original notes and the scale you want to transpose to and then input the scale in which you will be playing</strong></li>
            <li>Copy your transposed result if needed.</li>
            <li>Export of notes in PDF and Word Document in available in the website</li>
            <li>Access and manage your previous transpositions in the History tab.</li>
            <li>The capital case letters S R G M P D N represent the notes Sa Re Ga Ma Pa Dha Ni and Re,Ga,Dha and Ni are Shuddha swaras and Ma is Teevra</li>
            <li>The lower case letters  r g m d n represent the komal Re,Ga,Dha,Ni and the Shuddha Ma</li>
            <li>Western notes are represented as C, C#, D, D#, E, F, F#, G, G#, A, A#, B.</li>
            <li>For Western notes, you can use aliases like Db for C#, Eb for D#, etc.</li>
            <li>If wrong letters are used they are printed as it is</li>
            <li><strong>Enter each note followed by a space</strong> .</li>
            <li>Notes can entered in paragraphs and they are transposed and printed in the same alignment</li>

          </ul>

          <p>
            Need help? Feel free to use the Contact Us section for support or questions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstructionsPage;
