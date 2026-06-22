import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Compass, FileCheck2, Headset, Home, LogOut, Moon, Sun, Search, UsersRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  function toggleDarkMode() {
    const isNowDark = document.documentElement.classList.toggle('dark');
    setIsDark(isNowDark);
  }

  function submit(event) {
    event.preventDefault();
    navigate(`/explore?search=${encodeURIComponent(query)}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center">
          <Link to="/dashboard" className="flex items-center gap-2.5 font-black text-xl font-display tracking-tight hover:opacity-90 transition">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-500/20">
              <FileCheck2 size={22} />
            </span>
            <span>
              Habili<span className="text-violet-600 dark:text-violet-400">Trace</span>
            </span>
          </Link>
          <form onSubmit={submit} className="relative flex-1 md:mx-6">
            <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" size={18} />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-11 h-11 bg-slate-100/50 border-slate-200/60 dark:bg-slate-900/50 dark:border-slate-800/60"
              placeholder="Buscar competencias, perfiles o evidencias..."
            />
          </form>
          <nav className="flex flex-wrap items-center gap-2">
            <NavItem to="/dashboard" icon={<Home size={17} />} label="Panel" />
            <NavItem to="/explore" icon={<Compass size={17} />} label="Explorar" />
            <NavItem to="/communities" icon={<UsersRound size={17} />} label="Áreas" />
            <NavItem to="/support" icon={<Headset size={17} />} label="Soporte" />
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            <Button variant="ghost" size="sm" onClick={toggleDarkMode} aria-label="Modo oscuro" className="rounded-lg h-9 w-9 p-0">
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </Button>
            {user && (
              <Button variant="ghost" size="sm" onClick={() => navigate(`/profile/${user.id}`)} className="h-9 px-3 rounded-lg hover:text-violet-600 dark:hover:text-violet-400">
                <span className="font-bold text-xs uppercase opacity-70 block sm:hidden">Perfil</span>
                <span className="hidden sm:inline font-semibold">{user.name}</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/20"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </Button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-all duration-200 ${
          isActive
            ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-100/50 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900/50'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
