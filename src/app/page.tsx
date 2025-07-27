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

  const runCode = (newCode: string) => {
    setCode(newCode);
    saveSession({ code: newCode });

    try {
      const transformed = transform(newCode, { presets: ['react'] }).code;
      setPreview(transformed);
    } catch (err) {
      setPreview(`Error: ${err}`);
    }
  };

  // Load session when sessionId changes
  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, currentSessionId, loadSession]);

  // Auto-save chat when it changes
  useEffect(() => {
    if (currentSessionId && chat.length > 0) {
      const timeoutId = setTimeout(() => {
        saveSession({ chat });
      }, 1000); // Debounce for 1 second
      return () => clearTimeout(timeoutId);
    }
  }, [chat, currentSessionId, saveSession]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="px-4 py-2 flex w-full gap-2">
        {sessionId && (
          <>
            <EditorChat 
              code={code} 
              setCode={runCode}
              chat={chat}
              setChat={setChat}
            />
            <Preview code={preview} />
          </>
        )}
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="text-lg">Loading session...</div>
          </div>
        )}
      </div>
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
