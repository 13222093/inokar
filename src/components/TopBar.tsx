import React from 'react';
import { NavLink } from 'react-router-dom';

export const TopBar: React.FC = () => {
  return (
    <header className="fixed top-0 w-full z-[40] bg-background/80 backdrop-blur-xl border-b border-outline-variant/15 flex justify-between items-center px-8 h-20 pl-[288px]">
      <div className="flex items-center gap-8">
        <div className="hidden md:flex gap-6 items-center">
          <NavLink to="/" className={({ isActive }) => `font-headline text-sm tracking-wide transition-colors duration-300 ${isActive ? "text-primary border-b-2 border-primary pb-1" : "text-outline hover:text-tertiary"}`}>Dashboard</NavLink>
          <NavLink to="/portfolio" className={({ isActive }) => `font-headline text-sm tracking-wide transition-colors duration-300 ${isActive ? "text-primary border-b-2 border-primary pb-1" : "text-outline hover:text-tertiary"}`}>Portfolio</NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `font-headline text-sm tracking-wide transition-colors duration-300 ${isActive ? "text-primary border-b-2 border-primary pb-1" : "text-outline hover:text-tertiary"}`}>Analytics</NavLink>
          <NavLink to="/settings" className={({ isActive }) => `font-headline text-sm tracking-wide transition-colors duration-300 ${isActive ? "text-primary border-b-2 border-primary pb-1" : "text-outline hover:text-tertiary"}`}>Settings</NavLink>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="bg-surface-container-high rounded-full px-4 py-2 flex items-center gap-3 focus-within:ring-2 ring-surface-tint/20 transition-all">
          <span className="material-symbols-outlined text-outline">search</span>
          <input className="bg-transparent border-none focus:ring-0 text-sm text-on-surface w-48 outline-none" placeholder="Search assets..." type="text"/>
        </div>
        <button className="text-outline hover:text-primary transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="text-outline hover:text-primary transition-colors">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
};
