import React from 'react';
import { Link } from 'react-router-dom';

interface NavItemProps {
  href?: string;
  to?: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
}

export const NavItem: React.FC<NavItemProps> = ({ href, to, icon: Icon, children }) => {
  const className = "group flex items-center p-1.5 gap-3 rounded-lg text-foreground transition-colors hover:bg-primary/20";
  const inner = (
    <>
      <span className="p-1.5 rounded-md group-hover:bg-primary/40 transition-colors">
        <Icon />
      </span>
      <span className="text-base font-medium leading-none">{children}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <a href={href ?? '#'} className={className}>
      {inner}
    </a>
  );
};
