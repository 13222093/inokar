import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from './Button';

const NavItem = ({ to, icon, label }: { to: string, icon: string, label: string }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-3 flex items-center gap-3 cursor-pointer duration-200 transition-all ${
          isActive
            ? "bg-surface-container-high text-tertiary rounded-r-full border-l-4 border-tertiary"
            : "text-outline hover:bg-surface-container-high hover:text-primary"
        }`
      }
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="font-headline font-semibold">{label}</span>
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant/15 flex flex-col py-8 z-[50]">
      <div className="px-6 mb-10">
        <h1 className="text-xl font-black text-primary font-headline tracking-tighter">LiqUIFI</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-outline font-bold">Liquid Intelligence</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        <NavItem to="/" icon="dashboard" label="Dashboard" />
        <NavItem to="/portfolio" icon="domain" label="Property Portfolio" />
        <NavItem to="/analytics" icon="analytics" label="Risk Analytics" />
        <NavItem to="/settings" icon="settings" label="Settings" />
      </nav>

      <div className="px-6 mb-6">
        <Button className="w-full" icon={<span className="material-symbols-outlined text-sm">add</span>}>New Analysis</Button>
      </div>

      <div className="px-4 pt-6 border-t border-outline-variant/15 space-y-1">
        <div className="text-outline hover:text-primary px-4 py-2 flex items-center gap-3 cursor-pointer transition-all">
          <span className="material-symbols-outlined">help</span>
          <span className="font-headline font-semibold text-sm">Support</span>
        </div>
        <div className="text-outline hover:text-primary px-4 py-2 flex items-center gap-3 cursor-pointer transition-all">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-headline font-semibold text-sm">Logout</span>
        </div>
      </div>
    </aside>
  );
};
