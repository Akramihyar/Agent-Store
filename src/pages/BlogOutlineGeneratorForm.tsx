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

export default function BlogOutlineGeneratorForm({ badgeLabel = 'Blog Outline Generator', agentId }: { badgeLabel?: string; agentId?: string }) {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [length, setLength] = useState('medium');
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
    if (!topic.trim()) return;

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
      topic: topic.trim(),
      keywords: keywords.trim(),
      length,
      timestamp: new Date().toISOString(),
    };

    appendMessage('user', `Topic: ${topic}${keywords ? `\nKeywords: ${keywords}` : ''}\nLength: ${length}`);

    try {
      setStatus('sending');
      setErrorMsg(null);

      const res = await sendMessageToAgent(agent, { 
        agentId: agent.id, 
        message: `Generate ${length} blog outline for "${topic}"${keywords ? ` targeting keywords: ${keywords}` : ''}`,
        metadata: payload
      });

      if (res && typeof res === 'string') {
        appendMessage('agent', res);
      } else if (res && res.docUrl) {
        appendMessage('agent', `📋 Blog outline ready! <a href="${res.docUrl}" target="_blank" rel="noopener noreferrer" class="underline">View structured outline with H2/H3s</a>`);
      } else if (res && typeof res === 'object') {
        appendMessage('agent', `Blog outline generation complete: ${JSON.stringify(res)}`);
      } else {
        appendMessage('agent', 'Blog outline has been generated successfully.');
      }

      setStatus('sent');
      setTimeout(() => setStatus('idle'), 400);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message ?? 'Failed to generate blog outline');
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
            <p className="text-sm text-muted-foreground">Generate structured blog outlines with SEO-optimized headings.</p>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col w-full gap-4 p-4 border rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="topic" className="text-sm font-medium">Blog Topic</label>
                <input
                  id="topic"
                  type="text"
                  placeholder="e.g., AI in Healthcare, Remote Work Best Practices"
                  className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="length" className="text-sm font-medium">Article Length</label>
                <select
                  id="length"
                  className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                >
                  <option value="short">Short (800-1200 words)</option>
                  <option value="medium">Medium (1200-2000 words)</option>
                  <option value="long">Long (2000+ words)</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="keywords" className="text-sm font-medium">Target Keywords (Optional)</label>
              <input
                id="keywords"
                type="text"
                placeholder="keyword1, keyword2, keyword3"
                className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Comma-separated SEO keywords to target</p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-white transition-colors bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                disabled={!topic.trim() || status === 'sending'}
                aria-label="Generate outline"
              >
                <SendIcon />
                <span className="ml-2">Generate Outline</span>
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