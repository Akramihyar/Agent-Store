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

export default function AdCopyGeneratorForm({ badgeLabel = 'Ad Copy Generator', agentId }: { badgeLabel?: string; agentId?: string }) {
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('persuasive');
  const [variants, setVariants] = useState(5);
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
    if (!product.trim() || !audience.trim()) return;

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
      product: product.trim(),
      audience: audience.trim(),
      tone,
      variants,
      timestamp: new Date().toISOString(),
    };

    appendMessage('user', `Product: ${product}\nAudience: ${audience}\nTone: ${tone}\nVariants: ${variants}`);

    try {
      setStatus('sending');
      setErrorMsg(null);

      const res = await sendMessageToAgent(agent, { 
        agentId: agent.id, 
        message: `Generate ${variants} ${tone} ad copy variants for ${product} targeting ${audience}`,
        metadata: payload
      });

      if (res && typeof res === 'string') {
        appendMessage('agent', res);
      } else if (res && (res.csvUrl || res.docUrl)) {
        const linkUrl = res.csvUrl || res.docUrl;
        appendMessage('agent', `📋 Ad copy variants ready! <a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="underline">View ${variants} headlines & descriptions</a>`);
      } else if (res && typeof res === 'object') {
        appendMessage('agent', `Ad copy generation complete: ${JSON.stringify(res)}`);
      } else {
        appendMessage('agent', 'Ad copy variants have been generated successfully.');
      }

      setStatus('sent');
      setTimeout(() => setStatus('idle'), 400);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message ?? 'Failed to generate ad copy');
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
            <p className="text-sm text-muted-foreground">Create compelling ad headlines and descriptions with multiple variants.</p>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col w-full gap-4 p-4 border rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="product" className="text-sm font-medium">Product</label>
                <input
                  id="product"
                  type="text"
                  placeholder="e.g., AI Marketing Tool, Fitness App"
                  className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="audience" className="text-sm font-medium">Target Audience</label>
                <input
                  id="audience"
                  type="text"
                  placeholder="e.g., Small business owners, Fitness enthusiasts"
                  className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="tone" className="text-sm font-medium">Tone</label>
                <select
                  id="tone"
                  className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  <option value="persuasive">Persuasive</option>
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="urgent">Urgent</option>
                  <option value="playful">Playful</option>
                  <option value="authoritative">Authoritative</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="variants" className="text-sm font-medium">Number of Variants</label>
                <input
                  id="variants"
                  type="number"
                  min="1"
                  max="20"
                  className="w-full p-3 text-base border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={variants}
                  onChange={(e) => setVariants(parseInt(e.target.value) || 5)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-white transition-colors bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                disabled={!product.trim() || !audience.trim() || status === 'sending'}
                aria-label="Generate ad copy"
              >
                <SendIcon />
                <span className="ml-2">Generate Ad Copy</span>
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