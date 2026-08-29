import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Star, FileText, Search, LayoutGrid, List, Plus } from 'lucide-react';

const Library = () => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewFilter, setViewFilter] = useState<'all' | 'favorites' | 'templates'>('all');
  const [isGrid, setIsGrid] = useState(() => localStorage.getItem('libraryView') !== 'list');
  
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    fetchFoldersAndTags();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPrompts();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedFolder, selectedTags, viewFilter]);

  const fetchFoldersAndTags = async () => {
    const [foldersRes, tagsRes] = await Promise.all([
      api.get('/folders'),
      api.get('/tags')
    ]);
    setFolders(foldersRes.data);
    setTags(tagsRes.data);
  };

  const fetchPrompts = async () => {
    let url = `/prompts?page=1&limit=50`;
    if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
    if (selectedFolder) url += `&folderId=${selectedFolder}`;
    if (viewFilter === 'favorites') url += `&isFavorite=true`;
    if (viewFilter === 'templates') url += `&isTemplate=true`;
    if (selectedTags.length > 0) url += `&tags=${selectedTags.join(',')}`;

    const res = await api.get(url);
    setPrompts(res.data);
  };

  const toggleFavorite = async (e: React.MouseEvent, prompt: any) => {
    e.stopPropagation();
    await api.put(`/prompts/${prompt._id}`, { isFavorite: !prompt.isFavorite });
    setPrompts(prompts.map(p => p._id === prompt._id ? { ...p, isFavorite: !prompt.isFavorite } : p));
  };

  const toggleGrid = () => {
    setIsGrid(!isGrid);
    localStorage.setItem('libraryView', !isGrid ? 'grid' : 'list');
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await api.post('/folders', { name: newFolderName.trim() });
      setFolders([...folders, res.data]);
      setNewFolderName('');
      setShowFolderInput(false);
      setSelectedFolder(res.data._id);
    } catch (e) {
      console.error(e);
      alert('Error creating folder');
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Context Sidebar */}
      <div className="w-56 border-r border-border bg-surface flex flex-col p-4 overflow-y-auto hidden md:flex">
        <div className="mb-6">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Views</h3>
          <ul className="space-y-1">
            <li>
              <button 
                onClick={() => { setViewFilter('all'); setSelectedFolder(null); }}
                className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${viewFilter === 'all' && !selectedFolder ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'}`}
              >All Prompts</button>
            </li>
            <li>
              <button 
                onClick={() => { setViewFilter('favorites'); setSelectedFolder(null); }}
                className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between ${viewFilter === 'favorites' ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'}`}
              >
                Favorites
                <Star size={14} className={viewFilter === 'favorites' ? 'text-accent' : 'text-text-secondary'} />
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setViewFilter('templates'); setSelectedFolder(null); }}
                className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between ${viewFilter === 'templates' ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'}`}
              >
                Templates
                <FileText size={14} className={viewFilter === 'templates' ? 'text-accent' : 'text-text-secondary'} />
              </button>
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Folders</h3>
            <button onClick={() => setShowFolderInput(true)} className="text-text-secondary hover:text-accent transition-colors" title="Create Folder">
              <Plus size={14} />
            </button>
          </div>
          
          {showFolderInput && (
            <div className="mb-2">
              <input
                autoFocus
                type="text"
                placeholder="Folder name..."
                className="w-full bg-bg border border-border rounded text-sm px-2 py-1 outline-none focus:border-accent text-text-primary"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') setShowFolderInput(false);
                }}
                onBlur={() => setTimeout(() => setShowFolderInput(false), 200)}
              />
            </div>
          )}
          
          <ul className="space-y-1">
            {folders.map(f => (
              <li key={f._id}>
                <button 
                  onClick={() => { setSelectedFolder(f._id); setViewFilter('all'); }}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${selectedFolder === f._id ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'}`}
                >{f.name}</button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(t => (
              <button 
                key={t._id}
                onClick={() => {
                  if (selectedTags.includes(t._id)) {
                    setSelectedTags(selectedTags.filter(id => id !== t._id));
                  } else {
                    setSelectedTags([...selectedTags, t._id]);
                  }
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedTags.includes(t._id) ? 'bg-accent text-white border-accent' : 'bg-transparent text-text-secondary border-border hover:border-text-secondary hover:text-text-primary'}`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 flex flex-col h-full overflow-hidden bg-bg">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-sans font-bold text-text-primary">Library</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-border bg-surface rounded-lg w-64 text-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-shadow text-text-primary"
              />
            </div>
            <button 
              onClick={toggleGrid} 
              className="p-2 border border-border bg-surface text-text-secondary rounded-lg hover:text-text-primary transition-colors"
              title={isGrid ? 'List View' : 'Grid View'}
            >
              {isGrid ? <List size={18} /> : <LayoutGrid size={18} />}
            </button>
            <button 
              onClick={() => navigate('/builder')}
              className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent-hover transition-colors"
            >
              New Prompt
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto pr-4 pb-12 ${isGrid ? 'grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 auto-rows-max' : 'flex flex-col gap-2'}`}>
          {prompts.length === 0 && (
            <div className="col-span-full mt-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mb-4 text-text-secondary">
                <FileText size={24} />
              </div>
              <h3 className="font-bold text-lg mb-1">
                {searchQuery ? 'No prompts found matching your search.' : 
                 viewFilter === 'favorites' ? 'No favorites yet.' : 
                 viewFilter === 'templates' ? 'No templates yet.' : 
                 'No prompts yet.'}
              </h3>
              <p className="text-text-secondary mb-6 max-w-sm">
                {searchQuery ? 'Try adjusting your keywords or clearing filters.' :
                 viewFilter === 'favorites' ? 'Star your most-used prompts to find them here quickly.' :
                 viewFilter === 'templates' ? 'Mark generic prompts as templates to reuse them.' :
                 'Build your first prompt to start organizing your library.'}
              </p>
              {!searchQuery && viewFilter === 'all' && (
                <button 
                  onClick={() => navigate('/builder')}
                  className="text-accent font-medium hover:underline flex items-center gap-1"
                >
                  Build your first one <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          )}
          
          {prompts.map(p => (
            <div 
              key={p._id} 
              onClick={() => navigate(`/library/${p._id}`)}
              className={`bg-surface border border-border rounded-lg p-5 cursor-pointer transition-colors group relative flex flex-col ${isGrid ? 'h-56' : 'hover:bg-surface-hover'}`}
            >
              <div className="flex justify-between items-start mb-2 gap-4">
                <h3 className="font-bold text-text-primary text-base leading-tight group-hover:text-accent transition-colors line-clamp-1">
                  {p.title}
                </h3>
                <button 
                  onClick={(e) => toggleFavorite(e, p)}
                  className={`text-lg transition-colors -mt-1 -mr-1 p-1 rounded hover:bg-bg ${p.isFavorite ? 'text-warning' : 'text-text-secondary opacity-0 group-hover:opacity-100 hover:text-text-primary'}`}
                >
                  <Star fill={p.isFavorite ? 'currentColor' : 'none'} size={18} />
                </button>
              </div>
              
              <div className="text-xs text-text-secondary mb-3 flex items-center gap-3">
                {p.folderId && <span className="flex items-center gap-1"><span className="text-border">/</span> {folders.find(f => f._id === p.folderId)?.name}</span>}
                {p.taskType && <span className="flex items-center gap-1 border border-border px-1.5 py-0.5 rounded uppercase tracking-wider text-[10px] font-bold">{p.taskType}</span>}
              </div>

              <p className="text-text-secondary text-sm line-clamp-3 mb-4 flex-grow leading-relaxed font-mono">
                {p.generatedBody}
              </p>

              <div className="flex justify-between items-end mt-auto">
                <div className="flex gap-1.5 flex-wrap">
                  {p.tagIds?.map((tid: any) => {
                    const t = tags.find(tag => tag._id === (typeof tid === 'object' ? tid._id : tid));
                    if (!t) return null;
                    return <span key={t._id} className="text-xs bg-bg border border-border text-text-secondary px-2 py-0.5 rounded-full">{t.name}</span>
                  })}
                </div>
                <span className="text-xs text-text-secondary whitespace-nowrap ml-2">
                  {new Date(p.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Library;
