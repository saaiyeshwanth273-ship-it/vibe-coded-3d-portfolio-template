import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileCode,
  FileText,
  FolderGit2,
  GitBranch,
  GitCommit,
  Github,
  KeyRound,
  Lock,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { soundEngine } from '../utils/soundEffects.ts';

interface TemplateManifestData {
  repoName: string;
  defaultGithubUrl: string;
  remoteGithubLive?: boolean;
  description: string;
  isTemplateReady: boolean;
  gitInitialized: boolean;
  commitHash: string;
  readmeContent?: string;
  audit: {
    totalFiles: number;
    totalBytes: number;
    apiKeysFound: number;
    secretsFound: number;
    personalDetailsFound: number;
    passed: boolean;
    sanitizedCategories: string[];
  };
  files: Array<{ path: string; sizeBytes: number }>;
}

interface TemplateRepositoryPageProps {
  onBack: () => void;
}

export const TemplateRepositoryPage: React.FC<TemplateRepositoryPageProps> = ({ onBack }) => {
  const [manifest, setManifest] = useState<TemplateManifestData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('README.md');
  const [selectedFileContent, setSelectedFileContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [fileFilter, setFileFilter] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);

  const [githubToken, setGithubToken] = useState<string>('');
  const [customRepoName, setCustomRepoName] = useState<string>('vibe-coded-3d-portfolio-template');
  const [publishing, setPublishing] = useState<boolean>(false);
  const [publishError, setPublishError] = useState<string>('');
  const [publishSuccess, setPublishSuccess] = useState<{
    htmlUrl: string;
    fullName: string;
    filesCommitted: number;
    commitSha: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch('/api/template/manifest')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: TemplateManifestData | null) => {
        if (!active || !data) return;
        setManifest(data);
        if (data.readmeContent) {
          setSelectedFileContent(data.readmeContent);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSelectFile = async (filePath: string) => {
    soundEngine.playClick();
    setSelectedFilePath(filePath);
    if (filePath === 'README.md' && manifest?.readmeContent) {
      setSelectedFileContent(manifest.readmeContent);
      return;
    }
    setLoadingFile(true);
    try {
      const res = await fetch(`/api/template/file?path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedFileContent(data.content || '');
      }
    } catch {
      setSelectedFileContent('// Unable to load file content.');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleCopyCode = () => {
    if (!selectedFileContent) return;
    navigator.clipboard.writeText(selectedFileContent).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const cliCommand = `tar -xzf vibe-coded-3d-portfolio-template.tar.gz && cd vibe-coded-3d-portfolio-template && npm install && npm run dev`;

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommand).catch(() => {});
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handlePublishToGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishError('');
    setPublishSuccess(null);
    setPublishing(true);
    try {
      const res = await fetch('/api/template/publish-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken,
          repoName: customRepoName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.error || 'Failed to publish template repository to GitHub.');
      } else {
        setPublishSuccess(data);
        setGithubToken('');
        setManifest((prev) =>
          prev
            ? {
                ...prev,
                remoteGithubLive: true,
                defaultGithubUrl: data.htmlUrl || prev.defaultGithubUrl,
              }
            : prev,
        );
      }
    } catch {
      setPublishError('Network error while publishing to GitHub.');
    } finally {
      setPublishing(false);
    }
  };

  const isLiveOnGithub = Boolean(manifest?.remoteGithubLive || publishSuccess?.htmlUrl);
  const liveGithubUrl =
    publishSuccess?.htmlUrl ||
    manifest?.defaultGithubUrl ||
    'https://github.com/your-username/vibe-coded-3d-portfolio-template';

  const filteredFiles = (manifest?.files || []).filter((f) =>
    fileFilter.trim()
      ? f.path.toLowerCase().includes(fileFilter.trim().toLowerCase())
      : true,
  );

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F5F5F8] dark:bg-[#050507] text-[#050507] dark:text-white">
      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-8 sm:py-12">
        {/* Top Back Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onBack();
            }}
            className="hud-reticle inline-flex items-center gap-2 border border-black/20 dark:border-[#FF1E38]/35 bg-white dark:bg-[#0B0B10] px-4 py-2 font-mono-hud text-xs uppercase tracking-wider text-[#050507] dark:text-white hover:border-[#FF1E38] cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#E60023] dark:text-[#FF1E38]" />
            <span>Back to Portfolio Projects</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 font-mono-hud text-xs">
            <span className="inline-flex items-center gap-1.5 border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>0 API Keys · 0 Secrets · 0 Personal Details</span>
            </span>
          </div>
        </div>

        {/* GitHub-Style Repository Header */}
        <header className="mt-6 border border-black/15 dark:border-[#FF1E38]/35 bg-white dark:bg-[#0B0B10] p-6 sm:p-8 shadow-[0_0_32px_rgba(255,30,56,0.08)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-black/10 dark:border-white/15 pb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <FolderGit2 className="h-6 w-6 text-[#E60023] dark:text-[#FF1E38] shrink-0" />
                <h1 className="font-mono-hud text-lg sm:text-2xl font-bold tracking-tight break-all">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    your-username
                  </span>
                  <span className="mx-1.5 text-zinc-400">/</span>
                  <span className="text-[#050507] dark:text-white">
                    vibe-coded-3d-portfolio-template
                  </span>
                </h1>
                <span className="border border-[#FF1E38]/50 bg-[#FFF1F2] dark:bg-[#FF1E38]/15 px-2.5 py-0.5 font-mono-hud text-[11px] uppercase tracking-wider font-semibold text-[#E60023] dark:text-[#FF4D64]">
                  Public Template
                </span>
              </div>

              <p className="mt-2.5 max-w-3xl text-sm sm:text-base text-zinc-600 dark:text-[#C8C8D8]">
                Open-source interactive 3D isometric circuit command hub and full-stack developer
                portfolio template built with Three.js, React 19, TypeScript, Tailwind CSS, Express,
                and PostgreSQL. Pre-sanitized with starter placeholder data so anyone can clone or
                fork it immediately.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 font-mono-hud text-xs text-zinc-600 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5 text-[#050507] dark:text-white font-semibold">
                  <GitBranch className="h-3.5 w-3.5 text-[#FF1E38]" />
                  <span>main</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <GitCommit className="h-3.5 w-3.5 text-[#FF1E38]" />
                  <span>Commit {manifest?.commitHash || '16be489'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5 text-[#FF1E38]" />
                  <span>{manifest?.audit.totalFiles || 52} Sanitized Source Files</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>MIT Open-Source Template</span>
                </span>
              </div>
            </div>

            {/* Primary Template Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href="/api/template/download-bundle"
                download="vibe-coded-3d-portfolio-template.tar.gz"
                className="hud-reticle inline-flex items-center gap-2 bg-[#FF1E38] px-5 py-3 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white shadow-[0_0_20px_rgba(255,30,56,0.4)] hover:bg-[#E60023] transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Use This Template (.tar.gz)</span>
              </a>

              {isLiveOnGithub && (
                <a
                  href={liveGithubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hud-reticle inline-flex items-center gap-2 border border-emerald-500/60 bg-emerald-500/15 px-4 py-3 font-mono-hud text-xs uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white transition-colors"
                >
                  <Github className="h-4 w-4" />
                  <span>Open Live on GitHub.com</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Clone / Setup Command Bar */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F5F5F8] dark:bg-[#050507] border border-black/10 dark:border-white/10 p-3.5">
            <div className="flex items-center gap-2.5 overflow-x-auto font-mono-hud text-xs">
              <Terminal className="h-4 w-4 text-[#FF1E38] shrink-0" />
              <code className="text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                {cliCommand}
              </code>
            </div>
            <button
              type="button"
              onClick={handleCopyCli}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto border border-black/20 dark:border-white/20 bg-white dark:bg-[#0B0B10] px-3 py-1.5 font-mono-hud text-[11px] uppercase tracking-wider hover:border-[#FF1E38] cursor-pointer shrink-0"
            >
              {copiedCli ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[#FF1E38]" />
                  <span>Copy Quickstart</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* 1-Click Push to GitHub Account Panel (Solves GitHub 404 until user authorizes push) */}
        <section
          aria-label="Publish Template Repository to Your GitHub Account"
          className="mt-6 border border-[#FF1E38]/45 bg-white dark:bg-[#0B0B10] p-6 shadow-[0_0_24px_rgba(255,30,56,0.08)]"
        >
          {isLiveOnGithub ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-display text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    Template Repository is Live on GitHub.com!
                  </h2>
                  <p className="mt-0.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
                    All {manifest?.audit.totalFiles || 52} sanitized files are published at{' '}
                    <a
                      href={liveGithubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-mono-hud font-semibold text-[#E60023] dark:text-[#FF4D64]"
                    >
                      {liveGithubUrl}
                    </a>
                  </p>
                </div>
              </div>
              <a
                href={liveGithubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hud-reticle inline-flex items-center gap-2 bg-emerald-600 px-4 py-2.5 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white hover:bg-emerald-500 transition-colors shrink-0"
              >
                <Github className="h-4 w-4" />
                <span>Visit Repository on GitHub</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : (
            <div>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] font-semibold">
                    <Github className="h-4 w-4" />
                    <span>Sync to github.com/your-username/vibe-coded-3d-portfolio-template</span>
                  </div>
                  <h2 className="mt-1 font-display text-xl font-bold">
                    Push This Sanitized Template Repo Live to Your GitHub Account in 1 Click
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-[#C8C8D8] max-w-3xl">
                    Your sanitized template repository is hosted and browsable right below! Because
                    GitHub requires your account permission to create a new repository under{' '}
                    <code className="font-mono-hud text-[#E60023] dark:text-[#FF4D64]">
                      your-username
                    </code>
                    , follow the 2 quick steps below to publish it live to{' '}
                    <code className="font-mono-hud">github.com</code> as an official GitHub Template
                    Repository:
                  </p>
                </div>

                <a
                  href="https://github.com/settings/tokens/new?description=Vibe+3D+Portfolio+Template+Publisher&scopes=repo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hud-reticle inline-flex items-center gap-2 border border-[#FF1E38] bg-[#FFF1F2] dark:bg-[#FF1E38]/15 px-4 py-2.5 font-mono-hud text-xs uppercase tracking-wider font-semibold text-[#E60023] dark:text-[#FF4D64] hover:bg-[#FF1E38] hover:text-white transition-colors shrink-0"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Step 1: Generate 1-Time GitHub Token</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <form
                onSubmit={handlePublishToGitHub}
                className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
              >
                <div className="md:col-span-5">
                  <label className="block font-mono-hud text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Step 2: Paste GitHub Token (`repo` scope — used once in-memory, never stored)
                  </label>
                  <input
                    type="password"
                    required
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="YOUR_GITHUB_TOKEN"
                    className="mt-1 w-full border border-black/20 dark:border-white/20 bg-[#F5F5F8] dark:bg-[#050507] px-3 py-2 font-mono-hud text-xs text-[#050507] dark:text-white focus:border-[#FF1E38] focus:outline-none"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block font-mono-hud text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Target Repository Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customRepoName}
                    onChange={(e) => setCustomRepoName(e.target.value)}
                    className="mt-1 w-full border border-black/20 dark:border-white/20 bg-[#F5F5F8] dark:bg-[#050507] px-3 py-2 font-mono-hud text-xs text-[#050507] dark:text-white focus:border-[#FF1E38] focus:outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <button
                    type="submit"
                    disabled={publishing}
                    className="w-full hud-reticle inline-flex items-center justify-center gap-2 bg-[#FF1E38] px-4 py-2.5 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white hover:bg-[#E60023] disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    <span>{publishing ? 'Publishing 52 Files...' : 'Publish to GitHub Now'}</span>
                  </button>
                </div>
              </form>

              {publishError && (
                <div className="mt-3 flex items-center gap-2 border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-300">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{publishError}</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Interactive GitHub File Tree & Source Code Explorer */}
        <section
          aria-label="Template Repository Source Code Explorer"
          className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Left Column: Repository File Tree (4 Columns) */}
          <div className="lg:col-span-4 border border-black/15 dark:border-white/15 bg-white dark:bg-[#0B0B10]">
            <div className="border-b border-black/10 dark:border-white/10 p-4">
              <div className="flex items-center justify-between font-mono-hud text-xs">
                <span className="font-semibold uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38]">
                  Repository Files ({filteredFiles.length})
                </span>
                <span className="text-zinc-500">branch: main</span>
              </div>

              <div className="mt-3 relative">
                <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fileFilter}
                  onChange={(e) => setFileFilter(e.target.value)}
                  placeholder="Filter files (e.g. seed.ts, .env)..."
                  className="w-full border border-black/15 dark:border-white/15 bg-[#F5F5F8] dark:bg-[#050507] pl-8 pr-3 py-1.5 font-mono-hud text-xs text-[#050507] dark:text-white focus:border-[#FF1E38] focus:outline-none"
                />
              </div>
            </div>

            <div className="max-h-[540px] overflow-y-auto divide-y divide-black/5 dark:divide-white/5 font-mono-hud text-xs">
              {loading ? (
                <div className="p-6 text-center text-zinc-500">
                  Loading sanitized repository tree...
                </div>
              ) : (
                filteredFiles.map((file) => {
                  const isSelected = file.path === selectedFilePath;
                  return (
                    <button
                      key={file.path}
                      type="button"
                      onClick={() => handleSelectFile(file.path)}
                      className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#FFF1F2] dark:bg-[#FF1E38]/20 text-[#E60023] dark:text-[#FF4D64] font-semibold border-l-2 border-[#FF1E38]'
                          : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {file.path.endsWith('.md') ? (
                          <FileText className="h-3.5 w-3.5 shrink-0 text-[#FF1E38]" />
                        ) : (
                          <Code2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        )}
                        <span className="truncate">{file.path}</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        {(file.sizeBytes / 1024).toFixed(1)} KB
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Source Code Viewer & Sanitization Proof (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#0B0B10]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 bg-[#F5F5F8] dark:bg-[#050507] px-4 py-3 font-mono-hud text-xs">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-[#FF1E38]" />
                  <span className="font-semibold text-[#050507] dark:text-white">
                    {selectedFilePath}
                  </span>
                  <span className="border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">
                    Sanitized
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 border border-black/15 dark:border-white/15 bg-white dark:bg-[#0B0B10] px-3 py-1 text-[11px] hover:border-[#FF1E38] cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Copied File</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-[#FF1E38]" />
                      <span>Copy File Contents</span>
                    </>
                  )}
                </button>
              </div>

              <div className="max-h-[540px] overflow-auto bg-[#090A0F] p-4 font-mono text-xs leading-relaxed text-zinc-200">
                {loadingFile ? (
                  <div className="py-12 text-center text-zinc-400">
                    Loading sanitized file content...
                  </div>
                ) : (
                  <pre className="whitespace-pre overflow-x-auto">
                    {selectedFileContent.split('\n').map((line, i) => (
                      <div key={i} className="table-row hover:bg-white/5">
                        <span className="table-cell select-none pr-4 text-right text-zinc-600 w-10">
                          {i + 1}
                        </span>
                        <span className="table-cell">{line}</span>
                      </div>
                    ))}
                  </pre>
                )}
              </div>
            </div>

            {/* Security & Anonymization Audit Breakdown */}
            <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-6">
              <div className="flex items-center gap-2 font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] font-semibold">
                <Sparkles className="h-4 w-4" />
                <span>Automated Security & Privacy Scrubbing Report</span>
              </div>
              <h3 className="mt-1 font-display text-lg font-bold">
                What Was Removed Before Creating This Open-Source Template
              </h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="border border-black/10 dark:border-white/10 bg-[#F5F5F8] dark:bg-[#050507] p-3.5">
                  <p className="font-mono-hud font-semibold text-emerald-600 dark:text-emerald-400">
                    ✓ All API Keys & OAuth Secrets Removed
                  </p>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    Firebase Web API keys, Google OAuth Client IDs, Resend API tokens, and session
                    secrets are replaced with safe placeholder constants (
                    <code>YOUR_FIREBASE_WEB_API_KEY</code>).
                  </p>
                </div>
                <div className="border border-black/10 dark:border-white/10 bg-[#F5F5F8] dark:bg-[#050507] p-3.5">
                  <p className="font-mono-hud font-semibold text-emerald-600 dark:text-emerald-400">
                    ✓ Personal Identity Replaced with Starter Profile
                  </p>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    All personal names, email addresses, universities, clubs, and locations are
                    replaced with generic starter placeholders (<code>Alex Rivera</code>,{' '}
                    <code>alex.rivera@example.com</code>).
                  </p>
                </div>
                <div className="border border-black/10 dark:border-white/10 bg-[#F5F5F8] dark:bg-[#050507] p-3.5">
                  <p className="font-mono-hud font-semibold text-emerald-600 dark:text-emerald-400">
                    ✓ Personal Uploads & PDF Attachments Excluded
                  </p>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    Private resume PDFs, screenshots, and local uploads are excluded from the Git
                    tree and <code>.gitignore</code>.
                  </p>
                </div>
                <div className="border border-black/10 dark:border-white/10 bg-[#F5F5F8] dark:bg-[#050507] p-3.5">
                  <p className="font-mono-hud font-semibold text-emerald-600 dark:text-emerald-400">
                    ✓ Ready-to-Use Starter Projects & Seed Data
                  </p>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    Includes generic starter projects (<code>NexusRAG</code>,{' '}
                    <code>AeroSense</code>, and <code>Vibe Coded 3D Portfolio Universe</code>) in{' '}
                    <code>src/db/seed.ts</code> so anyone can customize their own portfolio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
