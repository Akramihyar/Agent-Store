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

export default function SocialListeningForm({ badgeLabel = 'Social Listening', agentId }: { badgeLabel?: string; agentId?: string }) {
  const [keywords, setKeywords] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['twitter', 'linkedin']);
  const [timeWindow, setTimeWindow] = useState('7d');
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

  function handlePlatformChange(platform: string, checked: boolean) {
    if (checked) {
      setPlatforms(prev => [...prev, platform]);
    } else {
      setPlatforms(prev => prev.filter(p => p !== platform));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keywords.trim() || platforms.length === 0) return;

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
      keywords: keywords.trim(),
      platforms,
      timeWindow,
      timestamp: new Date().toISOString(),
    };

    appendMessage('user', `Listening for: ${keywords}\nPlatforms: ${platforms.join(', ')}\nTime window: ${timeWindow}`);

    try {
      setStatus('sending');
      setErrorMsg(null);

      const res = await sendMessageToAgent(agent, { 
        agentId: agent.id, 
        message: `Monitor social media for keywords: ${keywords} on platforms: ${platforms.join(', ')} over ${timeWindow}`,
        metadata: payload
      });

      if (res && typeof res === 'string') {
        appendMessage('agent', res);
      } else if (res && (res.dashboardUrl || res.sheetUrl)) {
        const linkUrl = res.dashboardUrl || res.sheetUrl;
        appendMessage('agent', `📊 Social listening dashboard ready! <a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="underline">View mentions & sentiment</a>`);
      } else if (res && typeof res === 'object') {
        appendMessage('agent', `Social listening setup complete: ${JSON.stringify(res)}`);
      } else {
        appendMessage('agent', 'Social media monitoring has been configured successfully.');
      }

      setStatus('sent');
      setTimeout(() => setStatus('idle'), 400);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message ?? 'Failed to setup social listening');
    }
  }

  const availablePlatforms = [
    { id: 'twitter', label: 'Twitter/X' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'reddit', label: 'Reddit' },
    { id: 'youtube', label: 'YouTube' },
  ];

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
            <p className="text-sm text-muted-foreground">Monitor mentions, sentiment, and conversations across social platforms.</p>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col w-full gap-4 p-4 border rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="keywords" className="text-sm font-medium">Keywords</label>
                <input
                  id="keywords"
                  type="text"
                  placeholder="brand name, product, competitors"
                  className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">Comma-separated keywords to monitor</p>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="time-window" className="text-sm font-medium">Time Window</label>
                <select
                  id="time-window"
                  className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                >
                  <option value="1d">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Platforms</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availablePlatforms.map((platform) => (
                  <label key={platform.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platforms.includes(platform.id)}
                      onChange={(e) => handlePlatformChange(platform.id, e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{platform.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Select platforms to monitor</p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-white transition-colors bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                disabled={!keywords.trim() || platforms.length === 0 || status === 'sending'}
                aria-label="Start listening"
              >
                <SendIcon />
                <span className="ml-2">Start Listening</span>
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