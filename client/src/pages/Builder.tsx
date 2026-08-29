import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Wand2, Copy, Save, SlidersHorizontal, Eye } from 'lucide-react';

const Builder = () => {
  const navigate = useNavigate();
  const [taskType, setTaskType] = useState(() => localStorage.getItem('builder_taskType') || 'Marketing Copy');
  const [customTaskType, setCustomTaskType] = useState(() => localStorage.getItem('builder_customTaskType') || '');
  const [detailsInput, setDetailsInput] = useState(() => localStorage.getItem('builder_detailsInput') || '');
  const [tone, setTone] = useState(() => localStorage.getItem('builder_tone') || 'Professional');
  const [outputFormat, setOutputFormat] = useState(() => localStorage.getItem('builder_outputFormat') || 'Paragraphs');
  
  const [generatedBody, setGeneratedBody] = useState(() => localStorage.getItem('builder_generatedBody') || '');
  const [variables, setVariables] = useState<any[]>([]);
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [title, setTitle] = useState('');
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  // Persist form state to localStorage
  useEffect(() => { localStorage.setItem('builder_taskType', taskType); }, [taskType]);
  useEffect(() => { localStorage.setItem('builder_customTaskType', customTaskType); }, [customTaskType]);
  useEffect(() => { localStorage.setItem('builder_detailsInput', detailsInput); }, [detailsInput]);
  useEffect(() => { localStorage.setItem('builder_tone', tone); }, [tone]);
  useEffect(() => { localStorage.setItem('builder_outputFormat', outputFormat); }, [outputFormat]);
  useEffect(() => { localStorage.setItem('builder_generatedBody', generatedBody); }, [generatedBody]);
  const generateWithAI = async () => {
    if (!detailsInput) {
      alert('Please enter some details and context first.');
      return;
    }

    setIsGenerating(true);
    try {
      const finalTaskType = taskType === 'Custom' ? customTaskType : taskType;
      
      // Extract variables for tracking
      const regex = /\{([a-z0-9_]+)\}/g;
      const matches = Array.from(detailsInput.matchAll(regex)).map(m => m[1]);
      const uniqueVars = Array.from(new Set(matches));
      setVariables(uniqueVars.map((v, i) => ({ key: v, label: v, orderIndex: i })));

      const res = await api.post('/prompts/generate', {
        taskType: finalTaskType,
        detailsInput,
        tone,
        outputFormat,
        variables: uniqueVars
      });
      
      setGeneratedBody(res.data.generatedBody);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Error generating prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await api.get('/folders');
      setFolders(res.data);
      if (res.data.length > 0) setSelectedFolder(res.data[0]._id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedBody);
    alert('Copied to clipboard!');
  };

  const handleSave = async () => {
    try {
      const finalTaskType = taskType === 'Custom' ? customTaskType : taskType;
      const res = await api.post('/prompts', {
        title,
        folderId: selectedFolder || undefined,
        taskType: finalTaskType,
        tone,
        outputFormat,
        detailsInput,
        generatedBody,
        variables
      });
      setShowSaveModal(false);
      navigate(`/library/${res.data._id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to save prompt');
    }
  };

  return (
    <div className="flex h-full w-full bg-bg">
      {/* Configuration Panel */}
      <div className="w-1/2 border-r border-border bg-surface flex flex-col">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <SlidersHorizontal size={18} className="text-text-secondary" />
          <h1 className="text-lg font-bold font-sans text-text-primary">Configure Prompt</h1>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
          <div>
            <label className="block text-sm font-bold text-text-primary mb-2">Task Type</label>
            <select 
              value={taskType}
              onChange={e => setTaskType(e.target.value)}
              className="w-full bg-bg border border-border text-text-primary text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none"
            >
              <option>Marketing Copy</option>
              <option>Email</option>
              <option>Blog Post</option>
              <option>Social Media Post</option>
              <option>Code</option>
              <option>Research Summary</option>
              <option>Custom</option>
            </select>
            {taskType === 'Custom' && (
              <input 
                type="text" 
                placeholder="Describe your custom task..." 
                value={customTaskType}
                onChange={e => setCustomTaskType(e.target.value)}
                className="mt-3 w-full bg-bg border border-border text-text-primary text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-text-primary mb-2">Details & Context</label>
            <textarea 
              rows={5}
              placeholder="e.g. Write a persuasive product description for a productivity app aimed at remote professionals."
              value={detailsInput}
              onChange={e => setDetailsInput(e.target.value)}
              className="w-full bg-bg border border-border text-text-primary text-sm rounded-lg p-3 focus:ring-1 focus:ring-accent focus:border-accent outline-none resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2">Tone</label>
              <select 
                value={tone}
                onChange={e => setTone(e.target.value)}
                className="w-full bg-bg border border-border text-text-primary text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none"
              >
                <option>Professional</option>
                <option>Casual</option>
                <option>Persuasive</option>
                <option>Academic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2">Format</label>
              <select 
                value={outputFormat}
                onChange={e => setOutputFormat(e.target.value)}
                className="w-full bg-bg border border-border text-text-primary text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none"
              >
                <option>Paragraphs</option>
                <option>Bullet Points</option>
                <option>Markdown</option>
                <option>JSON</option>
              </select>
            </div>
          </div>
          
          <button 
            onClick={generateWithAI}
            disabled={isGenerating || !detailsInput}
            className="mt-4 w-full py-3 bg-accent text-white font-bold rounded-lg hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 size={18} />
                Generate with AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="w-1/2 flex flex-col">
        <div className="p-6 border-b border-border flex justify-between items-center bg-bg">
          <div className="flex items-center gap-3">
            <Eye size={18} className="text-text-secondary" />
            <h2 className="text-lg font-bold font-sans text-text-primary">Live Output</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 border border-border bg-surface text-text-primary text-sm rounded-lg hover:bg-surface-hover transition-colors"
            >
              <Copy size={14} /> Copy
            </button>
            <button 
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors"
            >
              <Save size={14} /> Save
            </button>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="bg-surface border border-border rounded-xl p-6 min-h-full font-mono text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
            {!detailsInput ? (
              <span className="text-text-secondary">Your prompt will appear here...</span>
            ) : (
              generatedBody
            )}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl border border-border w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-bold font-sans mb-6">Save Prompt</h2>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-bg border border-border text-text-primary p-2.5 rounded-lg focus:ring-1 focus:ring-accent outline-none"
                  placeholder="e.g. Q4 Launch Email"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">Folder (Optional)</label>
                <select 
                  value={selectedFolder}
                  onChange={e => setSelectedFolder(e.target.value)}
                  className="w-full bg-bg border border-border text-text-primary p-2.5 rounded-lg focus:ring-1 focus:ring-accent outline-none"
                >
                  <option value="">None</option>
                  {folders.map(f => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={!title}
                className="px-6 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                Save to Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Builder;
