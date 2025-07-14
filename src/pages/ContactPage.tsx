import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Instagram, Linkedin } from 'lucide-react';

const ContactPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold gradient-text">Contact Us</h1>
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>

        <div className="space-y-6 text-slate-300">
          <p>
            Thank you for using <strong>Notes Transposer</strong> — a project built with passion for musicians and creators who seek clarity in their craft.
          </p>
          <p>This app is designed to help you easily transpose notes between different scales or shift them by semitones, whether you're working with Hindustani or Western notation.</p>

          <div className="space-y-2">
            <p className="font-semibold text-white">💬 Got Feedback or Facing Issues?</p>
            <p>Whether it’s a bug, a suggestion, or a feature idea — your input is valuable.</p>
          </div>

          <div className="space-y-2">
            <p>Contact the developer:</p>
            <ul className="mb-6 space-y-2">
              <li className="flex items-center gap-2">
                <span>Email:</span>
                <Mail className="h-4 w-4 text-blue-400" />
                <a
                  href="mailto:kishorecn8@gmail.com"
                  className="text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  kishorecn8@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span>Instagram:</span>
                <Instagram className="h-4 w-4 text-pink-400" />
                <a
                  href="https://www.instagram.com/kishore_chandra_n/?igsh=MXY3M3FvYWRzdmw5MA%3D%3D#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:underline"
                >
                  kishore_chandra_n
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span>LinkedIn:</span>
                <Linkedin className="h-4 w-4 text-blue-500" />
                <a
                  href="https://www.linkedin.com/in/kishore-chandra-a581bb329?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Kishore Chandra N
                </a>
              </li>
            </ul>
          </div>

          <p>🙏 <strong>Thank You!</strong><br />
            Your feedback and encouragement help this solo project grow. Feel free to connect — I’m always open to ideas and collaboration.
          </p>

          <p>🎶 Keep transposing. Keep creating.</p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
