import { useRouter, useSearchParams } from 'next/navigation';
import { PlusIcon } from '@/components/icons/PlusIcon';
import { ChatIcon } from '@/components/icons/ChatIcon';
import { useEffect, useState } from 'react';
import { listSessions, createSession } from '@/lib/api';

export type Session = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export const Sidebar = () => {
  const searchParams = useSearchParams();
  const currentSession = searchParams.get('session');
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await listSessions();
      setSessions(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    const session = await createSession('Untitled');
    setSessions([session, ...sessions]);
    router.push(`?session=${session.id}`);
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentSession && sessions.length) {
      router.push(`?session=${sessions[0].id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, currentSession]);

  return (
    <div className="max-w-[230px] w-full bg-white border p-4">
      <button className="bg-teal-600 transition-colors hover:bg-teal-700 rounded-xl px-4 py-3 w-full flex gap-3 items-center shadow-lg shadow-teal-900/10" onClick={handleCreateSession} disabled={loading}>
        <PlusIcon />
        <span>New Session</span>
      </button>
      <div className="mt-6">
        {sessions.map((session) => (
          <button
            key={session.id}
            className={`rounded-xl hover:bg-slate-50 transition-colors px-4 py-3 w-full flex gap-3 items-center ${session.id === currentSession ? 'bg-slate-100' : 'bg-white'}`}
            onClick={() => router.push(`?session=${session.id}`)}
          >
            <div className="w-2 mr-3">
              <ChatIcon />
            </div>
            <span className="text-gray-900 truncate">{session.name || session.id}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
