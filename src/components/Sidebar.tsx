import { NavItem } from './NavItem';
import { Logo } from './icons/Logo';
import {
  ProjectsIcon,
  ChatsIcon,
  PromptsIcon,
  AssistantsIcon,
  AppsIcon,
  UpdatesIcon,
  SearchIcon,
  SettingsIcon,
  FaqIcon,
  CollapseIcon,
  NewChatIcon,
} from './icons';

interface NavigationData {
  mainNav: { name: string; href: string }[];
  secondaryNav: { name: string; href: string }[];
}

const icons: { [key: string]: React.ComponentType<any> } = {
  Projects: ProjectsIcon,
  Chats: ChatsIcon,
  Prompts: PromptsIcon,
  'AI Assistants': AssistantsIcon,
  'AI Apps': AppsIcon,
  Updates: UpdatesIcon,
  Search: SearchIcon,
  Settings: SettingsIcon,
  'Faq Chat': FaqIcon,
};

export default function Sidebar({ navigationData }: { navigationData: NavigationData }) {
  return (
    <div className="flex flex-col justify-between h-full shrink-0 transition-all w-[261px]">
      <div>
        <div className="inline-flex items-center gap-2">
          <Logo />
          <h3 className="text-[1.25rem] leading-snug font-bold whitespace-nowrap">neuland.ai HUB</h3>
        </div>
        <nav className="flex flex-col gap-1 mt-4">
          {navigationData.mainNav.map((item) => {
            const Icon = icons[item.name];
            if (item.name === 'AI Assistants') {
              return (
                <NavItem key={item.name} to="/assistants" icon={Icon}>
                  Agents Store
                </NavItem>
              );
            }
            return (
              <NavItem key={item.name} href={item.href} icon={Icon}>
                {item.name}
              </NavItem>
            );
          })}
          <div className="pt-6 mt-6 border-t">
            {navigationData.secondaryNav.map((item) => (
              <NavItem key={item.name} href={item.href} icon={icons[item.name]}>
                {item.name}
              </NavItem>
            ))}
          </div>
        </nav>
      </div>
      <div className="flex flex-col items-center justify-center w-full gap-3">
        <button className="flex items-center justify-between w-full px-3 py-2 text-foreground rounded-lg cursor-pointer transition-all gap-3 hover:bg-accent">
          <span className="text-sm font-medium leading-none">Collapse</span>
          <span className="transition-transform duration-300">
            <CollapseIcon />
          </span>
        </button>
        <button className="inline-flex items-center justify-center w-full h-11 gap-2 cursor-pointer whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-3">
          <NewChatIcon />
          <span className="text-base font-medium leading-none">Start New Chat</span>
        </button>
        <span className="text-sm text-muted-foreground whitespace-nowrap">Version: 1.46.8@518ef1a7</span>
      </div>
    </div>
  );
}
