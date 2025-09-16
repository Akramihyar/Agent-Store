import { AgentDefinition } from './types';

// In a larger app, import per-agent modules here
// import { supportAgent } from './support';
// import { salesAgent } from './sales';
// import { opsAgent } from './ops';

// const N8N_TEST_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/website-scraper';
// const SCRAPER_AGENT_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/website-scraper'; // Legacy - not used
const SEO_AGENT_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/seo-audit-agent';
const RESEARCH_AGENT_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/research-agent';
const SUPPORT_AGENT_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/support-agent';
const OPS_AGENT_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/ops-agent';
const LANDING_ANALYZER_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/landing-analyzer';
const LEADGEN_AGENT_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/lead-generator';
const IMAGE_GEN_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/image-generation';
const COMPETITOR_TRACKER_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/competitor-tracker';
const PRICING_SCRAPER_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/pricing-scraper';
const SOCIAL_LISTENING_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/social-listening';
const EMAIL_DRAFTING_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/email-drafting';
const AD_COPY_GENERATOR_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/ad-copy-generator';
const BLOG_OUTLINE_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/blog-outline-generator';
const NEWSLETTER_CURATOR_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/newsletter-curator';
const WEBSITE_INTELLIGENCE_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/website-Intelligence';

export const agents: AgentDefinition[] = [
  {
    id: 'support',
    name: 'Support Agent',
    description: 'Answers customer support questions.',
    icon: 'support',
    endpoint: { type: 'webhook', url: SUPPORT_AGENT_WEBHOOK, method: 'POST' },
  },
  {
    id: 'sales',
    name: 'Website Intelligence Agent',
    description: 'Get the full website content in an LLM ready text file along with download available PDFs.',
    icon: 'sales',
    endpoint: { type: 'webhook', url: WEBSITE_INTELLIGENCE_WEBHOOK, method: 'POST' },
  },
  {
    id: 'seo',
    name: 'Website Audit Agent',
    description: 'Comprehensive SEO Webiste Audit Report.',
    icon: 'generic',
    endpoint: { type: 'webhook', url: SEO_AGENT_WEBHOOK, method: 'POST' },
  },
  {
    id: 'ops',
    name: 'Ops Agent',
    description: 'Assists with operational tasks and checklists.',
    icon: 'ops',
    endpoint: { type: 'webhook', url: OPS_AGENT_WEBHOOK, method: 'POST' },
  },
  {
    id: 'research',
    name: 'Research Agent',
    description: 'Finds and summarizes sources.',
    icon: 'generic',
    endpoint: { type: 'webhook', url: RESEARCH_AGENT_WEBHOOK, method: 'POST' },
  },
  {
    id: 'landing',
    name: 'Landing Page Analyzer',
    description: 'Analyzes a landing page for clarity and conversion signals.',
    icon: 'generic',
    endpoint: { type: 'webhook', url: LANDING_ANALYZER_WEBHOOK, method: 'POST' },
  },
  {
    id: 'leadgen',
    name: 'Lead Generator Agent',
    description: 'Generate B2B lead lists based on campaign criteria.',
    icon: 'generic',
    endpoint: { type: 'webhook', url: LEADGEN_AGENT_WEBHOOK, method: 'POST' },
  },
  {
    id: 'imgen',
    name: 'Image Generation Agent',
    description: 'Creates images from your prompt.',
    icon: 'generic',
    endpoint: { type: 'webhook', url: IMAGE_GEN_WEBHOOK, method: 'POST' },
  },
  {
    id: 'competitor-tracker',
    name: 'Competitor Tracker Agent',
    description: 'Track competitor changes and keyword rankings with automated monitoring.',
    icon: 'generic',
    endpoint: { type: 'webhook', url: COMPETITOR_TRACKER_WEBHOOK, method: 'POST' },
  },
  {
    id: 'pricing-scraper',
    name: 'Pricing Scraper Agent',
    description: 'Monitor product prices over time and track pricing changes.',
    icon: 'generic',
    endpoint: { type: 'webhook', url: PRICING_SCRAPER_WEBHOOK, method: 'POST' },
  },
  {
    id: 'social-listening',
    name: 'Social Listening Agent',
    description: 'Monitor mentions, sentiment, and conversations across social platforms.',
    icon: 'generic',
    endpoint: { type: 'webhook', url: SOCIAL_LISTENING_WEBHOOK, method: 'POST' },
  },
  {
    id: 'email-drafting',
    name: 'Email Drafting Agent',
    description: 'Generate professional email drafts with multiple variants and tones.',
    icon: 'generic',
    endpoint: { type: 'webhook', url: EMAIL_DRAFTING_WEBHOOK, method: 'POST' },
  },
  {
    id: 'ad-copy-generator',
    name: 'Ad Copy Generator Agent',
    description: 'Create compelling ad headlines and descriptions for multiple variants.',
    icon: 'generic',
    endpoint: { type: 'webhook', url: AD_COPY_GENERATOR_WEBHOOK, method: 'POST' },
  },
  {
    id: 'blog-outline',
    name: 'Blog Outline Generator Agent',
    description: 'Generate structured blog outlines with SEO-optimized headings.',
    icon: 'generic',
    endpoint: { type: 'webhook', url: BLOG_OUTLINE_WEBHOOK, method: 'POST' },
  },
  {
    id: 'newsletter-curator',
    name: 'Newsletter Curator Agent',
    description: 'Curate and draft newsletters from multiple sources and keywords.',
    icon: 'generic',
    endpoint: { type: 'webhook', url: NEWSLETTER_CURATOR_WEBHOOK, method: 'POST' },
  },
];

export function getAgentById(id?: string) {
  if (!id) return undefined;
  return agents.find(a => a.id === id);
}
