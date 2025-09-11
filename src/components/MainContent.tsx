import { useEffect, useRef, useState } from 'react';
import { ChatIcon, SettingsIcon, SendIcon, PromptIcon, UploadIcon } from './icons';
import { getAgentById } from '../agents/registry';
import { sendMessageToAgent } from '../agents/client';
import LoadingDog from './LoadingDog';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
}

function deriveCompanyName(urlStr: string) {
  try {
    const u = new URL(urlStr);
    const host = u.hostname.toLowerCase();
    // Special-case SharePoint: {company}-my.sharepoint.com
    const m = host.match(/^([a-z0-9-]+)-(?:my\.)?sharepoint\.com$/);
    if (m && m[1]) return m[1].replace(/-/g, ' ');
    const parts = host.split('.');
    if (parts.length >= 2) {
      const sld = parts[parts.length - 2];
      return sld.replace(/-/g, ' ');
    }
  } catch {
    // Silently ignore URL parsing errors
  }
  return 'Company';
}

export default function MainContent({ badgeLabel = 'Individual', agentId }: { badgeLabel?: string; agentId?: string }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const waitTimer = useRef<number | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  useEffect(() => {
    return () => {
      if (waitTimer.current) window.clearTimeout(waitTimer.current);
    };
  }, []);

  function appendMessage(role: 'user' | 'agent', content: string) {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, role, content },
    ]);
  }

  function appendAgentLink(url: string, company?: string) {
    const name = (company && company.trim()) || deriveCompanyName(url);
    const html = `🌳 <a href="${url}" target="_blank" rel="noopener noreferrer" class="underline">${name}</a>`;
    appendMessage('agent', html);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

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

    const userText = message;
    appendMessage('user', userText);

    try {
      setStatus('sending');
      setErrorMsg(null);
      setMessage('');

      const res = await sendMessageToAgent(agent, { agentId: agent.id, message: userText });

      let folderUrl: string | null = null;
      let companyName: string | undefined;
      if (res && Array.isArray(res.reply) && res.reply[0]) {
        const r0 = res.reply[0];
        folderUrl = r0.Folder_url || r0.folder_url || null;
        companyName = r0.Company_name || r0.company_name;
      }

      if (folderUrl) {
        appendAgentLink(folderUrl, companyName);
        setStatus('sent');
        setTimeout(() => setStatus('idle'), 400);
        return;
      }

      if (typeof res === 'string' && res.trim().length > 0) {
        appendMessage('agent', res);
        setStatus('sent');
        setTimeout(() => setStatus('idle'), 400);
        return;
      }
      if (res && res.text && String(res.text).trim().length > 0) {
        appendMessage('agent', String(res.text));
        setStatus('sent');
        setTimeout(() => setStatus('idle'), 400);
        return;
      }
      if (res && typeof res === 'object') {
        appendMessage('agent', `Response: ${JSON.stringify(res)}`);
        setStatus('sent');
        setTimeout(() => setStatus('idle'), 400);
        return;
      }

      setStatus('sending');
      if (waitTimer.current) window.clearTimeout(waitTimer.current);
      waitTimer.current = window.setTimeout(() => {
        setStatus('error');
        setErrorMsg('No response body received from the agent. Please check the n8n webhook Respond settings.');
      }, 120_000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message ?? 'Failed to send message');
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = (e.currentTarget as HTMLTextAreaElement).form;
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
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

        <div ref={listRef} className="flex-1 overflow-auto p-3 space-y-2">
          {messages.length === 0 && status !== 'sending' && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-foreground">
              <p className="text-lg font-semibold">How Can I Help You?</p>
              <p className="text-base">Just upload, and our AI instantly delivers answers from your company data.</p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`max-w-[85%] ${m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'mr-auto bg-accent text-accent-foreground'} px-3 py-2 rounded-xl whitespace-pre-wrap`} dangerouslySetInnerHTML={{ __html: m.content }} />
          ))}

          {status === 'sending' && (
            <div className="mr-auto">
              <LoadingDog />
            </div>
          )}
        </div>

        <div className="flex flex-col w-full gap-3 p-3">
          <form onSubmit={onSubmit} className="flex flex-col w-full gap-2 p-2 border rounded-xl">
            <textarea
              id="message"
              placeholder={agentId ? "Type your message..." : "Select an agent to enable chat"}
              className="w-full p-3 text-base leading-snug tracking-tight transition-colors bg-secondary rounded-xl max-h-[137px] focus-visible:outline-none placeholder:text-muted-foreground resize-none"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={!agentId || status === 'sending'}
            ></textarea>
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                 <button type="button" className="inline-flex items-center justify-center h-9 px-3 text-sm font-medium transition-colors border rounded-md bg-background hover:bg-accent hover:text-accent-foreground">
                  <PromptIcon size={16}/>
                  Prompt Library
                </button>
                <div className="w-px h-[80%] bg-border"></div>
                <button type="button" className="inline-flex items-center justify-center h-9 px-3 text-sm font-medium transition-colors border rounded-md bg-background hover:bg-accent hover:text-accent-foreground">
                  <UploadIcon size={16}/>
                  Upload
                </button>
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center w-9 h-9 text-sm font-medium text-white transition-colors bg-black rounded-full hover:bg-black/80 disabled:opacity-50"
                disabled={!agentId || !message.trim() || status === 'sending'}
                aria-label="Send message"
                title={agentId ? 'Send' : 'Select an agent first'}
              >
                <SendIcon />
              </button>
            </div>
            {status === 'error' && <p className="text-xs text-red-600">{errorMsg}</p>}
          </form>
        </div>
      </div>
    </main>
  );
}
