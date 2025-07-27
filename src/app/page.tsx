'use client';

import { useEffect, useState, useCallback } from 'react';
import { Preview } from '@/components/Preview';
import { EditorChat } from '@/components/EditorChat';
import { Sidebar } from '@/components/Sidebar';
import { transform } from '@babel/standalone';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, updateSession, getMe } from '@/lib/api';

const App = () => {
  const [code, setCode] = useState<string>('');
  const [chat, setChat] = useState<any[]>([]);
  const [uiState, setUiState] = useState<any>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }
    
    // Verify token is valid
    getMe().then(setUser).catch(() => {
      localStorage.removeItem('token');
      router.push('/auth');
    });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth');
  };

  // Load session data from backend
  const loadSession = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const session = await getSession(id);
      setCode(session.code || '');
      setChat(session.chat || []);
      setUiState(session.uiState || {});
      setCurrentSessionId(id);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load session:', error);
      setLoading(false);
    }
  }, []);

  // Auto-save session data to backend
  const saveSession = useCallback(async (data: { code?: string; chat?: any[]; uiState?: any }) => {
    if (!currentSessionId) return;
    try {
      await updateSession(currentSessionId, {
        code: data.code !== undefined ? data.code : code,
        chat: data.chat !== undefined ? data.chat : chat,
        uiState: data.uiState !== undefined ? data.uiState : uiState
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, [currentSessionId, code, chat, uiState]);

  const runCode = (newCode: string | undefined) => {
    setCode(newCode || '');
    saveSession({ code: newCode });

    try {
      const transformed = transform(newCode || '', { presets: ['react'] }).code;
      setPreview(transformed);
    } catch (err) {
      setPreview(`Error: ${err}`);
    }
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <EditorChat 
        code={code}
        setCode={runCode}
        chat={chat}
        setChat={setChat}
      />
      <Preview code={preview} />
    </div>
  );
};

export default App;