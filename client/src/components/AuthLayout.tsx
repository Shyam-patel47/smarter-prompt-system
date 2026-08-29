import { Hexagon } from 'lucide-react';

export const AuthLayout = ({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle?: string }) => {
  return (
    <div className="min-h-screen bg-bg flex font-display text-text-primary">
      {/* Left panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-surface border-r border-border flex-col justify-between p-12">
        <div className="flex items-center gap-2 text-2xl font-sans font-bold">
          <Hexagon className="text-accent" size={32} />
          Smarter Prompt
        </div>
        
        <div>
          <h2 className="text-4xl font-sans font-bold leading-tight mb-4">
            Build prompts like software.
          </h2>
          <p className="text-text-secondary text-lg max-w-md">
            Stop pasting unstructured text into ChatGPT. Build, test, version, and share prompts with engineering rigor.
          </p>
        </div>
        
        <div className="text-text-secondary text-sm">
          © {new Date().getFullYear()} Smarter Prompt Systems
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 text-2xl font-sans font-bold mb-8">
            <Hexagon className="text-accent" size={32} />
            Smarter Prompt
          </div>
          <h1 className="text-3xl font-sans font-bold mb-2">{title}</h1>
          {subtitle && <p className="text-text-secondary mb-8">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
};
