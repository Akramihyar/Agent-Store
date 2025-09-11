import { useEffect, useRef, useState } from 'react';
import { ChatIcon, SettingsIcon, SendIcon } from '../components/icons';
import { getAgentById } from '../agents/registry';
import { sendMessageToAgent } from '../agents/client';
import LoadingDog from '../components/LoadingDog';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
}

export default function CompetitorTrackerForm({ badgeLabel = 'Competitor Tracker', agentId }: { badgeLabel?: string; agentId?: string }) {
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  function appendMessage(role: 'user' | 'agent', content: string) {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, role, content },
    ]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!competitorUrl.trim() || !keywords.trim()) return;

    if (!agentId) {
      setStatus('error');
      setErrorMsg('No agent selected.');
      return;
    }

    const agent = getAgentById(agentId);
    if (!agent) {
      setStatus('error');
      setErrorMsg('Agent not found.');
      return;
    }

    const payload = {
      competitorUrl: competitorUrl.trim(),
      keywords: keywords.trim(),
      frequency,
      timestamp: new Date().toISOString(),
    };

    appendMessage('user', `Tracking competitor: ${competitorUrl}\nKeywords: ${keywords}\nFrequency: ${frequency}`);

    try {
      setStatus('sending');
      setErrorMsg(null);

      const res = await sendMessageToAgent(agent, { 
        agentId: agent.id, 
        message: `Track competitor at ${competitorUrl} for keywords: ${keywords} with ${frequency} monitoring`,
        metadata: payload
      });

      if (res && typeof res === 'string') {
        appendMessage('agent', res);
      } else if (res && res.sheetUrl) {
        appendMessage('agent', `📊 Competitor tracking setup complete! <a href="${res.sheetUrl}" target="_blank" rel="noopener noreferrer" class="underline">View tracking sheet</a>`);
      } else if (res && typeof res === 'object') {
        appendMessage('agent', `Setup complete: ${JSON.stringify(res)}`);
      } else {
        appendMessage('agent', 'Competitor tracking has been configured successfully.');
      }

      setStatus('sent');
      setTimeout(() => setStatus('idle'), 400);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message ?? 'Failed to setup competitor tracking');
    }
  }

  return (
    <main className="relative w-full h-full overflow-hidden bg-background rounded-xl">
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between w-full gap-5 p-3 border-b h-[60px]">
          <div className="flex items-center gap-3">
            <div className="px-2 py-1 rounded-full flex gap-2 items-center text-xs leading-none border bg-rose-50 border-rose-100">
              <ChatIcon size={16} />
              <span>{badgeLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center justify-center w-9 h-9 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground">
              <SettingsIcon size={20} />
            </button>
          </div>
        </header>

        <div className="flex flex-col w-full gap-3 p-3">
          <div className="text-center pb-2">
            <p className="text-sm text-muted-foreground">Monitor competitor changes and keyword rankings automatically.</p>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col w-full gap-4 p-4 border rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="competitor-url" className="text-sm font-medium">Competitor URL</label>
                <input
                  id="competitor-url"
                  type="url"
                  placeholder="https://competitor.com"
                  className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={competitorUrl}
                  onChange={(e) => setCompetitorUrl(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="frequency" className="text-sm font-medium">Frequency</label>
                <select
                  id="frequency"
                  className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="keywords" className="text-sm font-medium">Keywords</label>
              <input
                id="keywords"
                type="text"
                placeholder="keyword1, keyword2, keyword3"
                className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Comma-separated list of keywords to track</p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-white transition-colors bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                disabled={!competitorUrl.trim() || !keywords.trim() || status === 'sending'}
                aria-label="Start tracking"
              >
                <SendIcon />
                <span className="ml-2">Start Tracking</span>
              </button>
            </div>
            {status === 'error' && <p className="text-xs text-red-600">{errorMsg}</p>}
          </form>
        </div>

        <div ref={listRef} className="flex-1 overflow-auto p-3 space-y-2">

          {messages.map((m) => (
            <div key={m.id} className={`max-w-[85%] ${m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'mr-auto bg-accent text-accent-foreground'} px-3 py-2 rounded-xl whitespace-pre-wrap`} dangerouslySetInnerHTML={{ __html: m.content }} />
          ))}

          {status === 'sending' && (
            <div className="mr-auto">
              <LoadingDog />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}