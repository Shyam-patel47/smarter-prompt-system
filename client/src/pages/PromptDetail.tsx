import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Copy, Download, Trash2, Save, History, Star } from 'lucide-react';

const PromptDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [prompt, setPrompt] = useState<any>(null);
  const [body, setBody] = useState('');
  const [notes, setNotes] = useState('');
  const [title, setTitle] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);
  
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPrompt();
    fetchVersions();
  }, [id]);

  const fetchPrompt = async () => {
    try {
      const res = await api.get(`/prompts/${id}`);
      setPrompt(res.data);
      setBody(res.data.generatedBody || '');
      setNotes(res.data.notes || '');
      setTitle(res.data.title);
      setIsFavorite(res.data.isFavorite);
      setIsTemplate(res.data.isTemplate);
    } catch (e) {
      console.error(e);
      navigate('/library');
    }
  };

  const fetchVersions = async () => {
    try {
      const res = await api.get(`/prompts/${id}/versions`);
      setVersions(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    try {
      await api.put(`/prompts/${id}`, {
        title,
        generatedBody: body,
        notes,
        isFavorite,
        isTemplate
      });
      setSaveMessage('Saved successfully');
      setTimeout(() => setSaveMessage(''), 2000);
      fetchVersions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!window.confirm('Restore this version? The current body will be saved as a new version.')) return;
    try {
      await api.post(`/prompts/${id}/restore/${versionId}`);
      fetchPrompt();
      fetchVersions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await api.post('/prompts', {
        ...prompt,
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        title: `${title} (Copy)`,
        generatedBody: body
      });
      navigate(`/library/${res.data._id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportMarkdown = () => {
    const md = body.replace(/\{([^}]+)\}/g, '`{$1}`');
    navigator.clipboard.writeText(md);
    alert('Copied as Markdown!');
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this prompt?')) return;
    try {
      await api.delete(`/prompts/${id}`);
      navigate('/library');
    } catch (e) {
      console.error(e);
    }
  };

  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const renderHighlights = (text: string) => {
    const regex = /(\{[a-z0-9_]+\})/g;
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (regex.test(part)) {
        return <mark key={i} className="bg-accent/20 text-transparent rounded px-0.5">{part}</mark>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!prompt) return <div className="p-8 text-text-secondary">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="border-b border-border bg-surface px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/library')} className="text-text-secondary hover:text-text-primary p-2 -ml-2 rounded-lg hover:bg-surface-hover transition-colors">
            <ArrowLeft size={18} />
          </button>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            className="text-2xl font-bold font-sans text-text-primary bg-transparent border-none outline-none focus:ring-0 p-0 placeholder-text-secondary"
            placeholder="Prompt Title"
          />
          <button 
            onClick={() => setIsFavorite(!isFavorite)} 
            className={`p-1.5 rounded transition-colors ${isFavorite ? 'text-warning' : 'text-text-secondary hover:bg-surface-hover'}`}
          >
            <Star fill={isFavorite ? 'currentColor' : 'none'} size={20} />
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDuplicate} className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors text-text-primary">
            <Copy size={14} /> Duplicate
          </button>
          <button onClick={handleExportMarkdown} className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors text-text-primary">
            <Download size={14} /> Export MD
          </button>
          <div className="w-px h-6 bg-border mx-1 self-center" />
          <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-1.5 text-danger border border-danger/30 rounded-lg text-sm font-medium hover:bg-danger/10 transition-colors">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-text-primary cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={isTemplate} 
                onChange={e => setIsTemplate(e.target.checked)} 
                className="rounded border-border text-accent focus:ring-accent"
              />
              Mark as Template
            </label>
            <button 
              onClick={() => setShowVersions(!showVersions)} 
              className={`flex items-center gap-2 font-medium px-3 py-1.5 rounded-lg transition-colors ${showVersions ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-surface hover:text-text-primary'}`}
            >
              <History size={14} />
              {showVersions ? 'Hide Versions' : 'View Versions'}
            </button>
          </div>

          <div className="flex-1 relative border border-border rounded-xl bg-surface shadow-sm font-mono text-[13px] sm:text-sm">
            <div 
              ref={backdropRef}
              className="absolute inset-0 p-5 whitespace-pre-wrap overflow-hidden pointer-events-none text-transparent break-words leading-relaxed"
            >
              {renderHighlights(body)}
            </div>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              onScroll={handleScroll}
              className="absolute inset-0 p-5 w-full h-full bg-transparent resize-none outline-none break-words focus:ring-1 focus:ring-accent rounded-xl text-text-primary m-0 leading-relaxed"
              placeholder="Start writing your prompt here..."
            />
          </div>

          <div className="h-32 flex flex-col">
            <label className="text-sm font-bold text-text-primary mb-2">Notes & Context</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="flex-1 bg-surface border border-border rounded-xl p-3 text-sm focus:ring-1 focus:ring-accent outline-none text-text-primary resize-y"
              placeholder="Jot down context or instructions for using this prompt..."
            />
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <span className="text-success text-sm font-medium">{saveMessage}</span>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-accent-hover transition-colors"
            >
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>

        {/* Versions Sidebar */}
        {showVersions && (
          <div className="w-80 bg-surface border-l border-border flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-text-primary font-sans">Version History</h3>
              <span className="text-xs bg-bg border border-border px-2 py-0.5 rounded-full text-text-secondary">{versions.length} versions</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {versions.length === 0 ? (
                <div className="text-center text-text-secondary text-sm mt-8 flex flex-col items-center">
                  <History size={24} className="mb-2 opacity-50" />
                  No previous versions.
                </div>
              ) : (
                <ul className="space-y-4">
                  {versions.map((v) => (
                    <li key={v._id} className="relative pl-4 border-l-2 border-border pb-4 last:pb-0">
                      <div className="absolute w-2.5 h-2.5 bg-surface border-2 border-accent rounded-full -left-[7px] top-1" />
                      <p className="text-text-secondary text-xs mb-2 font-medium uppercase tracking-wider">
                        {new Date(v.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                      <p className="text-text-primary text-sm line-clamp-3 mb-3 bg-bg border border-border rounded p-2 font-mono text-[11px]">
                        {v.bodySnapshot}
                      </p>
                      <button 
                        onClick={() => handleRestore(v._id)} 
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        Restore this version
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptDetail;
