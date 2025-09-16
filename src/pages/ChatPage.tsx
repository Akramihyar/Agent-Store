import { useParams } from 'react-router-dom';
import { getAgentById } from '../agents/registry';
import MainContent from '../components/MainContent';
// import SalesMissionForm from './SalesMissionForm'; // Replaced with WebsiteIntelligenceForm
import SEOMissionForm from './SEOMissionForm';
import ResearchMissionForm from './ResearchMissionForm';
import LandingAnalyzerForm from './LandingAnalyzerForm';
import ImageGenerationForm from './ImageGenerationForm';
import LeadGeneratorForm from './LeadGeneratorForm';
import CompetitorTrackerForm from './CompetitorTrackerForm';
import PricingScraperForm from './PricingScraperForm';
import SocialListeningForm from './SocialListeningForm';
import EmailDraftingForm from './EmailDraftingForm';
import AdCopyGeneratorForm from './AdCopyGeneratorForm';
import BlogOutlineGeneratorForm from './BlogOutlineGeneratorForm';
import NewsletterCuratorForm from './NewsletterCuratorForm';
import WebsiteIntelligenceForm from './WebsiteIntelligenceForm';

export default function ChatPage() {
  const { id } = useParams();
  const agent = getAgentById(id);
  const label = agent ? agent.name : 'AI Agent';

  if (agent?.id === 'sales') {
    return <WebsiteIntelligenceForm badgeLabel={label} agentId={agent.id} />;
  }
  if (agent?.id === 'seo') {
    return <SEOMissionForm badgeLabel={label} agentId={agent.id} />;
  }
  if (agent?.id === 'research') {
    return <ResearchMissionForm badgeLabel={label} agentId={agent.id} />;
  }
  if (agent?.id === 'landing') {
    return <LandingAnalyzerForm badgeLabel={label} agentId={agent.id} />;
  }
  if (agent?.id === 'imgen') {
    return <ImageGenerationForm badgeLabel={label} agentId={agent.id} />;
  }
  if (agent?.id === 'leadgen') {
    return <LeadGeneratorForm badgeLabel={label} agentId={agent.id} />;
  }
  if (agent?.id === 'competitor-tracker') {
    return <CompetitorTrackerForm badgeLabel={label} agentId={agent.id} />;
  }
  if (agent?.id === 'pricing-scraper') {
    return <PricingScraperForm badgeLabel={label} agentId={agent.id} />;
  }
  if (agent?.id === 'social-listening') {
    return <SocialListeningForm badgeLabel={label} agentId={agent.id} />;
  }
  if (agent?.id === 'email-drafting') {
    return <EmailDraftingForm badgeLabel={label} agentId={agent.id} />;
  }
  if (agent?.id === 'ad-copy-generator') {
    return <AdCopyGeneratorForm badgeLabel={label} agentId={agent.id} />;
  }
  if (agent?.id === 'blog-outline') {
    return <BlogOutlineGeneratorForm badgeLabel={label} agentId={agent.id} />;
  }
  if (agent?.id === 'newsletter-curator') {
    return <NewsletterCuratorForm badgeLabel={label} agentId={agent.id} />;
  }

  return <MainContent badgeLabel={label} agentId={agent?.id} />;
}
