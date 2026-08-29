import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FileText, Star, Clock, BarChart2, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentPrompts, setRecentPrompts] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, promptsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/prompts?limit=5')
        ]);
        setStats(statsRes.data);
        setRecentPrompts(promptsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col h-full bg-bg overflow-y-auto">
      <div className="p-8 max-w-[1200px] mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold font-sans text-text-primary">Welcome back, {user?.name || user?.email || user?.mobileNumber || 'User'}</h1>
            <p className="text-sm text-text-secondary mt-1">Here's what's happening with your prompts.</p>
          </div>
          <button 
            onClick={() => navigate('/builder')}
            className="bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent-hover transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> New Prompt
          </button>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<FileText />} label="Total Prompts" value={stats?.totalPrompts ?? '-'} />
          <StatCard icon={<Clock />} label="Created this week" value={stats?.promptsThisWeek ?? '-'} />
          <StatCard icon={<Star />} label="Favorites" value={stats?.favPrompts ?? '-'} />
          <StatCard icon={<BarChart2 />} label="Comparisons Run" value={stats?.comparisonsRun ?? '-'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Prompts */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold font-sans text-text-primary">Recent Prompts</h3>
              <button 
                onClick={() => navigate('/library')}
                className="text-sm text-accent hover:underline flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
              {recentPrompts.length === 0 ? (
                <div className="p-8 text-center text-text-secondary text-sm">
                  No prompts created yet. Start building!
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentPrompts.map(prompt => (
                    <div 
                      key={prompt._id}
                      onClick={() => navigate(`/library/${prompt._id}`)}
                      className="p-4 hover:bg-bg cursor-pointer transition-colors flex justify-between items-center group"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary group-hover:text-accent transition-colors">
                          {prompt.title}
                        </span>
                        <span className="text-xs text-text-secondary mt-1 line-clamp-1 max-w-md">
                          {prompt.generatedBody}
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary whitespace-nowrap">
                        {new Date(prompt.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions / Getting Started */}
          <div className="flex flex-col">
             <h3 className="text-lg font-bold font-sans text-text-primary mb-4">Quick Actions</h3>
             <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                <ActionCard 
                  title="Build a Prompt" 
                  desc="Create a structured prompt from scratch"
                  onClick={() => navigate('/builder')} 
                />
                <ActionCard 
                  title="Compare Prompts" 
                  desc="Run A/B tests on two versions of a prompt"
                  onClick={() => navigate('/builder/compare')} 
                />
                <ActionCard 
                  title="Manage Settings" 
                  desc="Update your profile, theme, and data"
                  onClick={() => navigate('/settings')} 
                />
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: any, label: string, value: number | string }) => (
  <div className="bg-surface border border-border p-5 rounded-xl shadow-sm flex flex-col">
    <div className="text-text-secondary mb-3 w-5 h-5 flex items-center justify-center">
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <div className="text-2xl font-bold text-text-primary mb-1">{value}</div>
    <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</div>
  </div>
);

const ActionCard = ({ title, desc, onClick }: { title: string, desc: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col text-left p-3 rounded-lg hover:bg-bg border border-transparent hover:border-border transition-all"
  >
    <span className="font-bold text-sm text-text-primary mb-1">{title}</span>
    <span className="text-xs text-text-secondary">{desc}</span>
  </button>
);

export default Dashboard;
