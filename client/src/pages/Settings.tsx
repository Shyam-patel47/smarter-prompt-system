import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { User, Shield, Moon, Database, Settings as SettingsIcon, LogOut, Download, Trash2, CheckCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from 'next-themes';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, fetchUser } = useAuth();
  
  return (
    <div className="flex flex-col h-full bg-bg overflow-y-auto">
      <div className="p-8 max-w-[1000px] mx-auto w-full">
        <h1 className="text-2xl font-bold font-sans text-text-primary mb-8">Settings</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 flex flex-col gap-1 shrink-0">
            <TabButton id="profile" icon={<User />} label="Profile" active={activeTab === 'profile'} onClick={setActiveTab} />
            <TabButton id="security" icon={<Shield />} label="Security" active={activeTab === 'security'} onClick={setActiveTab} />
            <TabButton id="appearance" icon={<Moon />} label="Appearance" active={activeTab === 'appearance'} onClick={setActiveTab} />
            <TabButton id="data" icon={<Database />} label="Data & Trash" active={activeTab === 'data'} onClick={setActiveTab} />
            <TabButton id="account" icon={<SettingsIcon />} label="Account" active={activeTab === 'account'} onClick={setActiveTab} />
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-surface border border-border rounded-xl shadow-sm p-6">
            {activeTab === 'profile' && <ProfileTab user={user} fetchUser={fetchUser} />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'appearance' && <AppearanceTab />}
            {activeTab === 'data' && <DataTab />}
            {activeTab === 'account' && <AccountTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ id, icon, label, active, onClick }: any) => (
  <button 
    onClick={() => onClick(id)}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-bg text-accent border border-border' : 'text-text-secondary hover:bg-bg hover:text-text-primary border border-transparent'
    }`}
  >
    {React.cloneElement(icon, { size: 18 })}
    {label}
  </button>
);

/* TABS */

const ProfileTab = ({ user, fetchUser }: any) => {
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [status, setStatus] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/settings/profile', { name, avatarUrl });
      await fetchUser();
      setStatus('Profile updated successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setStatus('Error updating profile');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary mb-1">Profile</h2>
        <p className="text-sm text-text-secondary">Manage your personal information.</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4 max-w-md">
        <div>
          <label className="block text-sm font-bold text-text-primary mb-1">Name</label>
          <input
            type="text"
            className="w-full border border-border bg-bg rounded-lg p-2.5 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-text-primary mb-1">Avatar URL</label>
          <input
            type="text"
            className="w-full border border-border bg-bg rounded-lg p-2.5 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
          />
        </div>
        <div className="pt-2">
          <button type="submit" className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors">
            Save Changes
          </button>
          {status && <span className="ml-4 text-sm text-text-secondary">{status}</span>}
        </div>
      </form>

      <hr className="border-border my-2" />

      <div>
        <h3 className="text-md font-bold text-text-primary mb-4">Linked Identifiers</h3>
        <div className="flex flex-col gap-3 max-w-md">
          
          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-bg">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-text-secondary uppercase">Email</span>
              <span className="text-sm text-text-primary">{user?.email || 'Not linked'}</span>
            </div>
            {user?.email ? (
              user.emailVerified ? <CheckCircle size={16} className="text-success" /> : <ShieldAlert size={16} className="text-warning" />
            ) : (
              <button className="text-xs bg-surface border border-border px-2 py-1 rounded text-text-secondary hover:text-text-primary">Link Email</button>
            )}
          </div>

          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-bg">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-text-secondary uppercase">Mobile</span>
              <span className="text-sm text-text-primary">{user?.mobileNumber || 'Not linked'}</span>
            </div>
            {user?.mobileNumber ? (
              user.mobileVerified ? <CheckCircle size={16} className="text-success" /> : <ShieldAlert size={16} className="text-warning" />
            ) : (
              <button className="text-xs bg-surface border border-border px-2 py-1 rounded text-text-secondary hover:text-text-primary">Link Mobile</button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

const SecurityTab = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setStatus('');
    try {
      await api.post('/settings/change-password', { currentPassword, newPassword });
      setStatus('Password updated. Other sessions invalidated.');
      setCurrentPassword(''); setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating password');
    }
  };

  const handleLogoutAll = async () => {
    try {
      await api.post('/auth/logout-all');
      
      // Clear Compare state
      localStorage.removeItem('compare_base');
      localStorage.removeItem('compare_promptA');
      localStorage.removeItem('compare_promptB');
      localStorage.removeItem('compare_scoreA');
      localStorage.removeItem('compare_scoreB');
      localStorage.removeItem('compare_reasoning');
      
      // Clear Builder state
      localStorage.removeItem('builder_taskType');
      localStorage.removeItem('builder_customTaskType');
      localStorage.removeItem('builder_detailsInput');
      localStorage.removeItem('builder_tone');
      localStorage.removeItem('builder_outputFormat');
      localStorage.removeItem('builder_generatedBody');
      
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary mb-1">Security</h2>
        <p className="text-sm text-text-secondary">Manage your password and active sessions.</p>
      </div>

      <form onSubmit={handlePasswordChange} className="flex flex-col gap-4 max-w-md">
        {error && <div className="text-sm text-danger bg-danger/10 p-2 rounded">{error}</div>}
        {status && <div className="text-sm text-success bg-success/10 p-2 rounded">{status}</div>}
        
        <div>
          <label className="block text-sm font-bold text-text-primary mb-1">Current Password</label>
          <input
            type="password"
            className="w-full border border-border bg-bg rounded-lg p-2.5 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-text-primary mb-1">New Password</label>
          <input
            type="password"
            className="w-full border border-border bg-bg rounded-lg p-2.5 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="pt-2">
          <button type="submit" className="bg-text-primary text-bg px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Update Password
          </button>
        </div>
      </form>

      <hr className="border-border my-2" />

      <div>
        <h3 className="text-md font-bold text-text-primary mb-2">Active Sessions</h3>
        <p className="text-sm text-text-secondary mb-4">Log out of all devices to invalidate any existing sessions (except this one, wait, this will log you out too).</p>
        <button 
          onClick={handleLogoutAll}
          className="flex items-center gap-2 text-sm text-danger border border-danger/20 bg-danger/5 px-4 py-2 rounded-lg hover:bg-danger/10 transition-colors font-medium"
        >
          <LogOut size={16} /> Log out of all devices
        </button>
      </div>
    </div>
  );
};

const AppearanceTab = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary mb-1">Appearance</h2>
        <p className="text-sm text-text-secondary">Customize the interface.</p>
      </div>

      <div className="flex flex-col gap-3 max-w-md">
        <label className="block text-sm font-bold text-text-primary mb-1">Theme Preference</label>
        <div className="grid grid-cols-3 gap-3">
          {['light', 'dark', 'system'].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`p-3 border rounded-lg flex flex-col items-center justify-center gap-2 capitalize text-sm font-medium transition-all ${
                theme === t 
                  ? 'border-accent bg-accent/5 text-accent' 
                  : 'border-border bg-bg text-text-secondary hover:text-text-primary hover:border-text-secondary'
              }`}
            >
              {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'}
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const DataTab = () => {
  const [trash, setTrash] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrash = async () => {
      try {
        const res = await api.get('/prompts/trash');
        setTrash(res.data);
      } catch (err) {
        console.error('Error fetching trash', err);
      }
    };
    fetchTrash();
  }, []);

  const handleExport = async () => {
    try {
      const res = await api.get('/settings/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'smarter_prompt_export.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.put(`/prompts/${id}/restore`);
      setTrash(trash.filter(t => t._id !== id));
    } catch (err) {
      console.error('Restore failed', err);
    }
  };

  const handleHardDelete = async (id: string) => {
    try {
      await api.delete(`/prompts/${id}/hard`);
      setTrash(trash.filter(t => t._id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary mb-1">Data & Export</h2>
        <p className="text-sm text-text-secondary">Export your data or manage deleted items.</p>
      </div>

      <div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 text-sm text-text-primary border border-border bg-bg px-4 py-2 rounded-lg hover:border-text-secondary transition-colors font-medium"
        >
          <Download size={16} /> Export All Data (JSON)
        </button>
        <p className="text-xs text-text-secondary mt-2">Includes all prompts, folders, tags, and comparisons.</p>
      </div>

      <hr className="border-border my-2" />

      <div>
        <h3 className="text-md font-bold text-text-primary mb-2 flex items-center gap-2">
          <Trash2 size={18} className="text-text-secondary" /> Trash
        </h3>
        <p className="text-sm text-text-secondary mb-4">Prompts in trash are permanently deleted after 30 days.</p>
        
        <div className="bg-bg border border-border rounded-lg overflow-hidden divide-y divide-border max-h-[300px] overflow-y-auto">
          {trash.length === 0 ? (
             <div className="p-4 text-center text-sm text-text-secondary">Trash is empty</div>
          ) : (
            trash.map(prompt => (
              <div key={prompt._id} className="p-3 flex justify-between items-center text-sm">
                <span className="text-text-primary font-medium">{prompt.title}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleRestore(prompt._id)} className="text-xs text-accent hover:underline">Restore</button>
                  <button onClick={() => handleHardDelete(prompt._id)} className="text-xs text-danger hover:underline">Delete Forever</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const AccountTab = () => {
  const [confirmWord, setConfirmWord] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmWord !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }
    try {
      await api.delete('/settings/account', { data: { confirmWord } });
      navigate('/signup');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting account');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-danger mb-1">Delete Account</h2>
        <p className="text-sm text-text-secondary">Permanently remove your account and all data.</p>
      </div>

      <div className="border border-danger/20 bg-danger/5 rounded-xl p-5">
        <p className="text-sm text-text-primary font-medium mb-2">Warning: This action is irreversible.</p>
        <p className="text-xs text-text-secondary mb-6">
          This will permanently delete your account, along with all your folders, tags, prompts, and comparisons. 
          There is no way to recover this data once deleted.
        </p>

        <form onSubmit={handleDelete} className="flex flex-col gap-4 max-w-sm">
          {error && <div className="text-sm text-danger">{error}</div>}
          
          <div>
            <label className="block text-xs font-bold text-danger uppercase mb-1">Type DELETE to confirm</label>
            <input
              type="text"
              className="w-full border border-danger/30 bg-bg rounded-lg p-2 text-sm text-danger focus:ring-1 focus:ring-danger outline-none"
              value={confirmWord}
              onChange={(e) => setConfirmWord(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={confirmWord !== 'DELETE'}
            className="bg-danger text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            Permanently Delete Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
