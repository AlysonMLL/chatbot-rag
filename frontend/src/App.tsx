import { useState } from 'react';
import LandingState from '@/components/LandingState';
import ChatState from '@/components/ChatState';
import { API_URL } from '@/config';
import type { UploadInfo } from '@/types';

export default function App() {
  const [file, setFile] = useState<UploadInfo | null>(null);

  const handleReset = () => {
    // Libera a memória do servidor; se falhar, a sessão expira sozinha.
    if (file) {
      fetch(`${API_URL}/api/files/${file.file_id}`, { method: 'DELETE' }).catch(() => {});
    }
    setFile(null);
  };

  if (file) {
    return <ChatState file={file} onReset={handleReset} />;
  }

  return <LandingState onFileUploaded={setFile} />;
}
