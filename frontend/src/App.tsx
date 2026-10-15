import { useState } from 'react';
import LandingState from '@/components/LandingState';
import ChatState from '@/components/ChatState';

export default function App() {
  const [stage, setStage] = useState<'landing' | 'chat'>('landing');
  const [fileName, setFileName] = useState('');

  const handleFileUploaded = (name: string) => {
    setFileName(name);
    setStage('chat');
  };

  const handleReset = () => {
    setStage('landing');
    setFileName('');
  };

  if (stage === 'chat') {
    return <ChatState fileName={fileName} onReset={handleReset} />;
  }

  return <LandingState onFileUploaded={handleFileUploaded} />;
}
