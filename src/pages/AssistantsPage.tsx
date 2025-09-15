import { Link } from 'react-router-dom';
import { agents } from '../agents/registry';

// Import agent avatar images
import supportAvatar from '../assets/agents/support.png';
import salesAvatar from '../assets/agents/sales.png';
import seoAvatar from '../assets/agents/seo.png';
import opsAvatar from '../assets/agents/ops.png';
import researchAvatar from '../assets/agents/research.png';
import landingAvatar from '../assets/agents/landing.png';
import leadgenAvatar from '../assets/agents/leadgen.png';
import imgenAvatar from '../assets/agents/imgen.png';
import mysteryAvatar from '../assets/agents/mystery.png';

const getAgentAvatar = (agentId: string) => {
  switch (agentId) {
    case 'support':
      return supportAvatar;
    case 'sales':
      return salesAvatar;
    case 'seo':
      return seoAvatar;
    case 'ops':
      return opsAvatar;
    case 'research':
      return researchAvatar;
    case 'landing':
      return landingAvatar;
    case 'leadgen':
      return leadgenAvatar;
    case 'imgen':
      return imgenAvatar;
    // New agents using mystery avatar
    case 'competitor-tracker':
    case 'pricing-scraper':
    case 'social-listening':
    case 'email-drafting':
    case 'ad-copy-generator':
    case 'blog-outline':
    case 'newsletter-curator':
      return mysteryAvatar;
    default:
      return mysteryAvatar; // fallback
  }
};

export default function AssistantsPage() {
  return (
    <section className="h-full w-full bg-background rounded-xl p-4">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Agents Store</h1>
        <p className="text-sm text-muted-foreground">Pick an agent to start chatting.</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {agents.map((a) => (
          <li key={a.id} className="border rounded-xl p-6 bg-card hover:shadow-md transition-shadow h-full">
            <div className="flex items-start gap-6 h-full">
              {/* Agent Avatar - Left Side */}
              <div className="flex-shrink-0">
                <div 
                  className="w-24 h-24 rounded-xl flex items-center justify-center overflow-hidden"
                  style={{ 
                    background: 'white',
                    backgroundImage: `url(${getAgentAvatar(a.id)})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundColor: 'white'
                  }}
                >
                </div>
              </div>
              
              {/* Agent Content - Right Side */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                <div className="mb-3">
                  <h2 className="text-lg font-semibold text-foreground mb-1">{a.name}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.description}</p>
                </div>
                
                <div className="mt-auto">
                  <Link
                    to={`/assistants/${a.id}/chat`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Launch Agent
                  </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
