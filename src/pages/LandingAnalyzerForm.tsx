import React, { useState } from 'react';
import { ChatIcon, SettingsIcon } from '../components/icons';
import { getAgentById } from '../agents/registry';
import { sendMessageToAgent } from '../agents/client';
import LoadingDog from '../components/LoadingDog';

export default function LandingAnalyzerForm({ badgeLabel, agentId }: { badgeLabel: string; agentId: string }) {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultHtml, setResultHtml] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const agent = getAgentById(agentId);
    if (!agent) return;

    try {
      setStatus('sending');
      setErrorMsg(null);
      setResultHtml(null);

      const message = `website_url: ${websiteUrl}`;
      const res = await sendMessageToAgent(agent, { agentId, message });

      if (typeof res === 'string') {
        setResultHtml(res);
        setStatus('done');
        return;
      }
      if (res && Array.isArray((res as any).reply) && (res as any).reply[0]) {
        const r0 = (res as any).reply[0];
        const summary = r0.summary || r0.result || JSON.stringify(r0);
        setResultHtml(summary);
        setStatus('done');
        return;
      }

      setResultHtml(`Response: ${JSON.stringify(res ?? {})}`);
      setStatus('done');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message ?? 'Failed to analyze landing page');
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

        <div className="p-4 space-y-3">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Website URL</label>
              <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" className="w-full border rounded-md px-3 py-2 bg-card" required/>
            </div>
            <button type="submit" className="inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={status==='sending'}>
              Analyze
            </button>
            {status==='sending' && <LoadingDog />}
            {status==='error' && <p className="text-sm text-red-600">{errorMsg}</p>}
          </form>

          {status==='done' && resultHtml && (
            <div className="bg-accent text-accent-foreground px-3 py-2 rounded-xl" dangerouslySetInnerHTML={{ __html: resultHtml }} />
          )}
        </div>
      </div>
    </main>
  );
}
