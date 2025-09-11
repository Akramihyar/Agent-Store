import React, { useState } from 'react';
import { ChatIcon, SettingsIcon } from '../components/icons';
import { getAgentById } from '../agents/registry';
import { sendMessageToAgent } from '../agents/client';
import LoadingDog from '../components/LoadingDog';

export default function LeadGeneratorForm({ badgeLabel, agentId }: { badgeLabel: string; agentId: string }) {
  const [campaignName, setCampaignName] = useState('');
  const [country, setCountry] = useState('Germany');
  const [cityRegion, setCityRegion] = useState('');
  const [industryKeywords, setIndustryKeywords] = useState('');
  const [companySize, setCompanySize] = useState<'Small' | 'Mid' | 'Large' | 'Enterprise'>('Small');
  const [targetRole, setTargetRole] = useState('');
  const [contactsPerCompany, setContactsPerCompany] = useState(1);
  const [requireVerifiedEmails, setRequireVerifiedEmails] = useState(false);

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

      const message = [
        `campaign_name: ${campaignName}`,
        `location: { country: ${country}${cityRegion ? `, region: ${cityRegion}` : ''} }`,
        `industry_keywords: ${industryKeywords}`,
        `company_size: ${companySize}`,
        `target_role: ${targetRole}`,
        `contacts_per_company: ${contactsPerCompany}`,
        `require_verified_emails: ${requireVerifiedEmails}`,
      ].join('\n');

      const res = await sendMessageToAgent(agent, { agentId, message });

      if (typeof res === 'string') {
        setResultHtml(res);
        setStatus('done');
        return;
      }
      if (res && Array.isArray((res as any).reply) && (res as any).reply[0]) {
        const r0 = (res as any).reply[0];
        const link = r0.report_url || r0.link || r0.url || null;
        const name = r0.title || r0.name || 'Lead List';
        if (link) {
          setResultHtml(`📄 <a href="${link}" target="_blank" rel="noopener noreferrer" class="underline">${name}</a>`);
          setStatus('done');
          return;
        }
        setResultHtml(JSON.stringify(r0));
        setStatus('done');
        return;
      }

      setResultHtml(`Response: ${JSON.stringify(res ?? {})}`);
      setStatus('done');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message ?? 'Failed to run lead generation');
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
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Campaign Name</label>
              <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Manufacturing Leads Stuttgart Q4" className="w-full border rounded-md px-3 py-2 bg-card" required/>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <div className="flex gap-2 items-center">
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="border rounded-md px-3 py-2 bg-card">
                  <option>Germany</option>
                  <option>Austria</option>
                  <option>Switzerland</option>
                  <option>France</option>
                  <option>Netherlands</option>
                </select>
                <input value={cityRegion} onChange={(e) => setCityRegion(e.target.value)} placeholder="Optional: City / Region" className="flex-1 border rounded-md px-3 py-2 bg-card"/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Industry / Keywords</label>
              <input value={industryKeywords} onChange={(e) => setIndustryKeywords(e.target.value)} placeholder="Maschinenbau, IT-Dienstleister, Bauunternehmen" className="w-full border rounded-md px-3 py-2 bg-card" required/>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Company Size</label>
              <select value={companySize} onChange={(e) => setCompanySize(e.target.value as any)} className="border rounded-md px-3 py-2 bg-card">
                <option value="Small">Small (1–50)</option>
                <option value="Mid">Mid (51–250)</option>
                <option value="Large">Large (251–1000)</option>
                <option value="Enterprise">Enterprise (1000+)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Target Role / Job Title</label>
              <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Geschäftsführer, Leiter Einkauf, IT-Leiter" className="w-full border rounded-md px-3 py-2 bg-card" required/>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contacts per Company</label>
              <input type="number" min={1} max={10} value={contactsPerCompany} onChange={(e) => setContactsPerCompany(Number(e.target.value))} className="w-32 border rounded-md px-3 py-2 bg-card"/>
            </div>

            <div className="flex items-center gap-2">
              <input id="verifiedEmails" type="checkbox" checked={requireVerifiedEmails} onChange={(e) => setRequireVerifiedEmails(e.target.checked)} className="h-4 w-4" />
              <label htmlFor="verifiedEmails" className="text-sm">Require verified emails</label>
            </div>

            <button type="submit" className="inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={status==='sending'}>
              Generate Leads
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
