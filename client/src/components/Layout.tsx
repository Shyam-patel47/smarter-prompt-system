import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { PenSquare, Library, Scale, LayoutDashboard, Sun, Moon, Search, Settings } from 'lucide-react';
import { useTheme } from 'next-themes';
import CommandPalette from './CommandPalette';

const Layout = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(open => !open);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
    { label: 'Builder', icon: <PenSquare size={18} />, path: '/builder' },
    { label: 'Library', icon: <Library size={18} />, path: '/library' },
    { label: 'Compare', icon: <Scale size={18} />, path: '/builder/compare' },
    { label: 'Settings', icon: <Settings size={18} />, path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-bg text-text-primary overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-surface flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-sans font-bold flex items-center gap-2">
            <span className="bg-accent text-white w-6 h-6 rounded flex items-center justify-center text-sm">S</span>
            Smarter Prompt
          </h1>
        </div>

        <div className="p-3">
          <button 
            onClick={() => setCmdOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary bg-bg border border-border rounded-lg hover:border-accent transition-colors mb-4"
          >
            <Search size={16} />
            <span className="flex-1 text-left">Search or command...</span>
            <kbd className="text-xs bg-surface border border-border px-1.5 rounded">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/builder'}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-accent/10 text-accent' 
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border flex items-center justify-between">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div 
            onClick={() => navigate('/settings')}
            className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity"
            title="Settings"
          >
            U
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-bg relative">
        <Outlet />
      </main>

      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
};

export default Layout;
