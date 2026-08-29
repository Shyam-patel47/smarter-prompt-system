import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PenSquare, LayoutDashboard, Library, Scale } from 'lucide-react';

const CommandPalette = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { name: 'New Prompt', icon: <PenSquare size={16} />, path: '/builder' },
    { name: 'Go to Library', icon: <Library size={16} />, path: '/library' },
    { name: 'Compare Prompts', icon: <Scale size={16} />, path: '/builder/compare' },
    { name: 'Dashboard', icon: <LayoutDashboard size={16} />, path: '/dashboard' },
  ];

  const filtered = actions.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="text-text-secondary mr-3" size={20} />
          <input 
            autoFocus
            type="text" 
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent outline-none text-text-primary text-lg"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <kbd className="text-xs bg-surface-hover border border-border px-2 py-1 rounded text-text-secondary ml-3">ESC</kbd>
        </div>
        <div className="p-2 max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-text-secondary text-sm">No results found.</div>
          ) : (
            filtered.map((action, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-accent hover:text-white rounded-lg transition-colors group text-text-primary"
                onClick={() => {
                  navigate(action.path);
                  onClose();
                }}
              >
                <span className="text-text-secondary group-hover:text-white/80">{action.icon}</span>
                <span className="font-medium">{action.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
