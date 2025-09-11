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

export default function EmailDraftingForm({ badgeLabel = 'Email Drafting', agentId }: { badgeLabel?: string; agentId?: string }) {
  const [goal, setGoal] = useState('outreach');
  const [tone, setTone] = useState('professional');
  const [targetRole, setTargetRole] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
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
    if (!targetRole.trim() || !keyPoints.trim()) return;

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
      goal,
      tone,
      targetRole: targetRole.trim(),
      keyPoints: keyPoints.trim(),
      timestamp: new Date().toISOString(),
    };

    appendMessage('user', `Goal: ${goal}\nTone: ${tone}\nTarget: ${targetRole}\nKey Points: ${keyPoints}`);

    try {
      setStatus('sending');
      setErrorMsg(null);

      const res = await sendMessageToAgent(agent, { 
        agentId: agent.id, 
        message: `Draft ${goal} email with ${tone} tone for ${targetRole}: ${keyPoints}`,
        metadata: payload
      });

      if (res && typeof res === 'string') {
        appendMessage('agent', res);
      } else if (res && res.docUrl) {
        appendMessage('agent', `📝 Email drafts ready! <a href="${res.docUrl}" target="_blank" rel="noopener noreferrer" class="underline">View subject line + 2-3 variants</a>`);
      } else if (res && typeof res === 'object') {
        appendMessage('agent', `Email drafts complete: ${JSON.stringify(res)}`);
      } else {
        appendMessage('agent', 'Email drafts have been generated successfully.');
      }

      setStatus('sent');
      setTimeout(() => setStatus('idle'), 400);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message ?? 'Failed to generate email drafts');
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
            <p className="text-sm text-muted-foreground">Generate professional email drafts with multiple variants and tones.</p>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col w-full gap-4 p-4 border rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="goal" className="text-sm font-medium">Goal</label>
                <select
                  id="goal"
                  className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                >
                  <option value="outreach">Outreach</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="introduction">Introduction</option>
                  <option value="sales">Sales</option>
                  <option value="partnership">Partnership</option>
                  <option value="thank-you">Thank You</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="tone" className="text-sm font-medium">Tone</label>
                <select
                  id="tone"
                  className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                  <option value="persuasive">Persuasive</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="target-role" className="text-sm font-medium">Target Role</label>
              <input
                id="target-role"
                type="text"
                placeholder="e.g., Marketing Director, CEO, Product Manager"
                className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="key-points" className="text-sm font-medium">Key Points</label>
              <textarea
                id="key-points"
                placeholder="Main points to include in the email..."
                className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[100px] resize-none"
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Key messages and points to include</p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-white transition-colors bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                disabled={!targetRole.trim() || !keyPoints.trim() || status === 'sending'}
                aria-label="Generate drafts"
              >
                <SendIcon />
                <span className="ml-2">Generate Drafts</span>
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