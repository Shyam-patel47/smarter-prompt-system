import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Scale, Library as LibraryIcon, Check } from 'lucide-react';

const Compare = () => {
  const [baseTaskDescription, setBaseTaskDescription] = useState(() => localStorage.getItem('compare_base') || '');
  
  const [promptABody, setPromptABody] = useState(() => localStorage.getItem('compare_promptA') || '');
  const [promptAScore, setPromptAScore] = useState<number | ''>(() => {
    const saved = localStorage.getItem('compare_scoreA');
    return saved ? Number(saved) : '';
  });
  
  const [promptBBody, setPromptBBody] = useState(() => localStorage.getItem('compare_promptB') || '');
  const [promptBScore, setPromptBScore] = useState<number | ''>(() => {
    const saved = localStorage.getItem('compare_scoreB');
    return saved ? Number(saved) : '';
  });
  
  const [comparisons, setComparisons] = useState<any[]>([]);
  const [showLibraryPicker, setShowLibraryPicker] = useState<'A' | 'B' | null>(null);
  const [libraryPrompts, setLibraryPrompts] = useState<any[]>([]);
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationReasoning, setEvaluationReasoning] = useState(() => localStorage.getItem('compare_reasoning') || '');

  const currentWinner = (promptAScore !== '' && promptBScore !== '')
    ? (promptAScore > promptBScore ? 'a' : promptBScore > promptAScore ? 'b' : 'tie')
    : 'none';

  useEffect(() => {
    fetchComparisons();
  }, []);

  // Persist form state to localStorage
  useEffect(() => { localStorage.setItem('compare_base', baseTaskDescription); }, [baseTaskDescription]);
  useEffect(() => { localStorage.setItem('compare_promptA', promptABody); }, [promptABody]);
  useEffect(() => { localStorage.setItem('compare_promptB', promptBBody); }, [promptBBody]);
  useEffect(() => { localStorage.setItem('compare_reasoning', evaluationReasoning); }, [evaluationReasoning]);
  
  useEffect(() => {
    if (promptAScore === '') localStorage.removeItem('compare_scoreA');
    else localStorage.setItem('compare_scoreA', String(promptAScore));
  }, [promptAScore]);
  
  useEffect(() => {
    if (promptBScore === '') localStorage.removeItem('compare_scoreB');
    else localStorage.setItem('compare_scoreB', String(promptBScore));
  }, [promptBScore]);

  const fetchComparisons = async () => {
    try {
      const res = await api.get('/comparisons');
      setComparisons(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenPicker = async (side: 'A' | 'B') => {
    setShowLibraryPicker(side);
    try {
      const res = await api.get('/prompts?limit=50');
      setLibraryPrompts(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectLibraryPrompt = (body: string) => {
    if (showLibraryPicker === 'A') setPromptABody(body);
    else if (showLibraryPicker === 'B') setPromptBBody(body);
    setShowLibraryPicker(null);
  };

  const handleAutoEvaluate = async () => {
    setIsEvaluating(true);
    setEvaluationReasoning('');
    try {
      const res = await api.post('/comparisons/evaluate', {
        baseTaskDescription,
        promptABody,
        promptBBody
      });
      setPromptAScore(res.data.scoreA);
      setPromptBScore(res.data.scoreB);
      setEvaluationReasoning(res.data.reasoning);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Error evaluating prompts');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.post('/comparisons', {
        baseTaskDescription,
        promptABody,
        promptAScore: promptAScore === '' ? undefined : promptAScore,
        promptBBody,
        promptBScore: promptBScore === '' ? undefined : promptBScore
      });
      
      setBaseTaskDescription('');
      setPromptABody('');
      setPromptBBody('');
      setPromptAScore('');
      setPromptBScore('');
      
      fetchComparisons();
    } catch (e) {
      console.error(e);
      alert('Error saving comparison');
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg overflow-y-auto">
      <div className="p-8 max-w-[1400px] mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-surface border border-border rounded-lg">
            <Scale size={20} className="text-text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-sans text-text-primary">A/B Testing</h1>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 mb-8">
          <label className="block text-sm font-bold text-text-primary mb-2">Base Task Description</label>
          <input 
            type="text" 
            value={baseTaskDescription}
            onChange={e => setBaseTaskDescription(e.target.value)}
            placeholder="e.g. Write a persuasive email for our Q4 product launch..."
            className="w-full bg-bg border border-border text-text-primary text-sm rounded-lg p-3 focus:ring-1 focus:ring-accent outline-none transition-shadow"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Panel A */}
          <div className={`flex-1 bg-surface rounded-xl p-6 transition-all duration-300 relative border ${currentWinner === 'a' ? 'border-accent ring-1 ring-accent' : 'border-border'}`}>
            {currentWinner === 'a' && (
              <div className="absolute -top-3 -right-3 bg-accent text-white p-1 rounded-full shadow-lg">
                <Check size={16} strokeWidth={3} />
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-bold font-sans ${currentWinner === 'a' ? 'text-accent' : 'text-text-primary'}`}>
                Prompt A
              </h2>
              <button 
                onClick={() => handleOpenPicker('A')} 
                className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary border border-border bg-bg px-2.5 py-1.5 rounded transition-colors"
              >
                <LibraryIcon size={14} /> Load from Library
              </button>
            </div>
            <textarea 
              rows={8}
              value={promptABody}
              onChange={e => setPromptABody(e.target.value)}
              className="w-full bg-bg border border-border text-text-primary font-mono text-sm rounded-lg p-4 mb-4 focus:ring-1 focus:ring-accent outline-none resize-y"
              placeholder="Paste or type Prompt A here..."
            />
            <div className="flex items-center justify-between bg-bg border border-border rounded-lg p-3">
              <label className="font-bold text-sm text-text-primary uppercase tracking-wider">Score</label>
              <input 
                type="number" 
                min={0} max={100}
                value={promptAScore}
                onChange={e => setPromptAScore(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-20 bg-transparent border-none text-right text-lg font-bold text-text-primary focus:ring-0 p-0 placeholder-text-secondary"
                placeholder="—"
              />
            </div>
          </div>

          {/* Panel B */}
          <div className={`flex-1 bg-surface rounded-xl p-6 transition-all duration-300 relative border ${currentWinner === 'b' ? 'border-accent ring-1 ring-accent' : 'border-border'}`}>
            {currentWinner === 'b' && (
              <div className="absolute -top-3 -right-3 bg-accent text-white p-1 rounded-full shadow-lg">
                <Check size={16} strokeWidth={3} />
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-bold font-sans ${currentWinner === 'b' ? 'text-accent' : 'text-text-primary'}`}>
                Prompt B
              </h2>
              <button 
                onClick={() => handleOpenPicker('B')} 
                className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary border border-border bg-bg px-2.5 py-1.5 rounded transition-colors"
              >
                <LibraryIcon size={14} /> Load from Library
              </button>
            </div>
            <textarea 
              rows={8}
              value={promptBBody}
              onChange={e => setPromptBBody(e.target.value)}
              className="w-full bg-bg border border-border text-text-primary font-mono text-sm rounded-lg p-4 mb-4 focus:ring-1 focus:ring-accent outline-none resize-y"
              placeholder="Paste or type Prompt B here..."
            />
            <div className="flex items-center justify-between bg-bg border border-border rounded-lg p-3">
              <label className="font-bold text-sm text-text-primary uppercase tracking-wider">Score</label>
              <input 
                type="number" 
                min={0} max={100}
                value={promptBScore}
                onChange={e => setPromptBScore(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-20 bg-transparent border-none text-right text-lg font-bold text-text-primary focus:ring-0 p-0 placeholder-text-secondary"
                placeholder="—"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end mb-12 border-b border-border pb-12">
          {evaluationReasoning && (
            <div className="w-full mb-6 p-4 bg-surface border border-accent/20 rounded-lg text-sm text-text-primary">
              <span className="font-bold text-accent mb-1 block">AI Evaluator Notes:</span>
              {evaluationReasoning}
            </div>
          )}
          
          <div className="flex gap-4">
            <button 
              onClick={handleAutoEvaluate}
              disabled={!baseTaskDescription || !promptABody || !promptBBody || isEvaluating}
              className="bg-surface border border-accent text-accent font-medium py-2.5 px-6 rounded-lg hover:bg-accent/10 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isEvaluating ? 'Evaluating...' : 'Auto-Evaluate with AI ✨'}
            </button>
            <button 
              onClick={handleSave}
              disabled={!baseTaskDescription || !promptABody || !promptBBody}
              className="bg-text-primary text-bg font-medium py-2.5 px-8 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Save Comparison
            </button>
          </div>
        </div>

        {/* History */}
        <div>
          <h3 className="text-lg font-bold font-sans text-text-primary mb-4">Comparison History</h3>
          <div className="space-y-3">
            {comparisons.length === 0 && (
              <div className="text-center py-8 text-text-secondary border border-dashed border-border rounded-xl">
                No comparisons yet. Test two prompts above to start your A/B history.
              </div>
            )}
            {comparisons.map(c => (
              <div key={c._id} className="bg-surface border border-border rounded-lg p-4 flex justify-between items-center group hover:border-text-secondary transition-colors">
                <div className="flex-1 pr-4">
                  <p className="font-bold text-text-primary text-sm mb-1">{c.baseTaskDescription}</p>
                  <p className="text-xs text-text-secondary">{new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-6 font-mono text-sm bg-bg border border-border rounded-md px-4 py-2">
                  <div className={`flex flex-col items-center ${c.winner === 'a' ? 'text-accent font-bold' : 'text-text-secondary'}`}>
                    <span className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">A</span>
                    <span>{c.promptAScore || '-'}</span>
                  </div>
                  <div className={`flex flex-col items-center ${c.winner === 'b' ? 'text-accent font-bold' : 'text-text-secondary'}`}>
                    <span className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">B</span>
                    <span>{c.promptBScore || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Picker Modal */}
      {showLibraryPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-2xl flex flex-col max-h-[80vh] shadow-2xl">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h2 className="font-bold font-sans text-text-primary">Select Prompt from Library</h2>
              <button onClick={() => setShowLibraryPicker(null)} className="text-text-secondary hover:text-text-primary text-xl">&times;</button>
            </div>
            <div className="overflow-y-auto p-4 flex flex-col gap-2">
              {libraryPrompts.map(p => (
                <div 
                  key={p._id} 
                  onClick={() => handleSelectLibraryPrompt(p.generatedBody)}
                  className="p-4 border border-border rounded-lg hover:border-accent hover:bg-accent/5 cursor-pointer transition-colors group"
                >
                  <h4 className="font-bold text-sm text-text-primary mb-1 group-hover:text-accent transition-colors">{p.title}</h4>
                  <p className="text-xs text-text-secondary line-clamp-2 font-mono">{p.generatedBody}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compare;
