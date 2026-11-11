import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Box,
  CheckCircle2,
  Compass,
  Cpu,
  Database,
  Download,
  FileCheck2,
  Github,
  Layers,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { ProjectItem } from '../types/portfolio.ts';
import { soundEngine } from '../utils/soundEffects.ts';

interface TemplateManifestData {
  repoName: string;
  defaultGithubUrl: string;
  remoteGithubLive?: boolean;
  description: string;
  isTemplateReady: boolean;
  gitInitialized: boolean;
  commitHash: string;
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

interface ProjectDetailModalProps {
  project: ProjectItem;
  onClose: () => void;
  onOpenTemplateRepo?: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onOpenTemplateRepo,
}) => {
  const [templateManifest, setTemplateManifest] = useState<TemplateManifestData | null>(null);
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [customRepoName, setCustomRepoName] = useState('vibe-coded-3d-portfolio-template');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    htmlUrl: string;
    fullName: string;
    filesCommitted: number;
    commitSha: string;
  } | null>(null);
  const [publishError, setPublishError] = useState('');
  const isComplyAi =
    project.slug === 'complyai-engine' ||
    project.slug === 'complyai' ||
    project.title.toLowerCase().includes('complyai');

  const isVibePortfolio =
    project.slug === 'vibe-coded-3d-portfolio' ||
    project.title.toLowerCase().includes('vibe coded') ||
    project.title.toLowerCase().includes('portfolio universe');

  const isAeroSense =
    project.slug === 'aquasentinel' || project.title.toLowerCase().includes('aquasentinel');

  useEffect(() => {
    if (!isVibePortfolio) return;
    let active = true;
    fetch('/api/template/manifest')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) {
          setTemplateManifest(data);
        }
      })
      .catch(() => {
        // Ignore non-critical manifest fetch error
      });
    return () => {
      active = false;
    };
  }, [isVibePortfolio]);

  const handlePublishToGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishError('');
    setPublishResult(null);
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
        setPublishError(data.error || 'Failed to publish template repository.');
      } else {
        setPublishResult(data);
        setGithubToken('');
      }
    } catch {
      setPublishError('Network error while publishing template repository.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F5F5F8] dark:bg-[#050507] text-[#050507] dark:text-[#FFFFFF]">
      <div className="mx-auto max-w-[1160px] px-5 py-10 sm:px-8 sm:py-16">
        {/* Back Navigation */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="hud-reticle inline-flex items-center gap-2 border border-black/20 dark:border-[#FF1E38]/35 bg-white dark:bg-[#0B0B10] px-4 py-2 font-mono-hud text-xs uppercase tracking-wider text-[#050507] dark:text-white hover:border-[#FF1E38] cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[#E60023] dark:text-[#FF1E38]" />
          <span>Back to Portfolio</span>
        </button>

        {/* Project Hero Header */}
        <header className="mt-8 border border-black/15 dark:border-[#FF1E38]/30 bg-white dark:bg-[#0B0B10] p-6 sm:p-10 shadow-[0_0_32px_rgba(255,30,56,0.08)]">
          <div className="flex flex-wrap items-center gap-3 font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38]">
            <span>{project.category}</span>
            {project.status && (
              <>
                <span aria-hidden="true" className="opacity-40">
                  ·
                </span>
                <span>{project.status}</span>
              </>
            )}
            {project.developmentDate && (
              <>
                <span aria-hidden="true" className="opacity-40">
                  ·
                </span>
                <span>{project.developmentDate}</span>
              </>
            )}
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            {project.title}
          </h1>

          {project.tagline && (
            <p className="mt-3 font-editorial italic text-xl sm:text-2xl text-[#E60023] dark:text-[#FF1E38]">
              &ldquo;{project.tagline}&rdquo;
            </p>
          )}

          <p className="mt-4 max-w-3xl text-base sm:text-lg leading-relaxed text-zinc-700 dark:text-[#E4E4ED]">
            {project.description}
          </p>

          {project.keyPrinciple && (
            <div className="mt-6 border border-black/15 dark:border-[#FF1E38]/35 bg-[#F5F5F8] dark:bg-[#050507] p-4 sm:p-5">
              <p className="font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] font-semibold">
                Key Architectural Principle
              </p>
              <p className="mt-1.5 text-base font-medium text-[#050507] dark:text-white">
                &ldquo;{project.keyPrinciple}&rdquo;
              </p>
            </div>
          )}

          {project.githubUrl && (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={publishResult?.htmlUrl || project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hud-reticle inline-flex items-center gap-2 bg-[#FF1E38] px-5 py-3 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white shadow-[0_0_20px_rgba(255,30,56,0.4)] hover:bg-[#E60023] transition-all"
              >
                <Github className="h-4 w-4" />
                <span>View Source on GitHub</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </header>

        {/* Sanitized Open-Source Template Repository Studio (Only for Vibe Coded 3D Portfolio) */}
        {isVibePortfolio && (
          <section
            aria-label="Sanitized Open-Source Portfolio Template Studio"
            className="mt-8 border border-[#FF1E38]/40 bg-white dark:bg-[#0B0B10] p-6 sm:p-8 shadow-[0_0_28px_rgba(255,30,56,0.1)]"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-black/10 dark:border-white/15 pb-5">
              <div>
                <div className="flex items-center gap-2 font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verified Zero-Secret & Zero-PII Open-Source Template</span>
                </div>
                <h2 className="mt-1.5 font-display text-2xl font-bold">
                  Reusable 3D Portfolio Template Repository
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-[#A0A0B2]">
                  All API keys, OAuth client IDs, session secrets, and personal details have been
                  automatically scrubbed and replaced with clean starter placeholders so anyone can
                  fork or clone this template for their own portfolio.
                </p>
              </div>

              {templateManifest && (
                <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono-hud text-xs">
                  <div className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-300">
                    <div>API Keys: {templateManifest.audit.apiKeysFound}</div>
                    <div>Secrets: {templateManifest.audit.secretsFound}</div>
                    <div>Personal Data: {templateManifest.audit.personalDetailsFound}</div>
                  </div>
                  <div className="border border-black/15 dark:border-white/15 bg-[#F5F5F8] dark:bg-[#050507] px-3 py-2">
                    <div>Files: {templateManifest.audit.totalFiles}</div>
                    <div>Git Commit: {templateManifest.commitHash}</div>
                    <div>Status: Ready to Clone</div>
                  </div>
                </div>
              )}
            </div>

            {showPublishForm && (
              <form
                onSubmit={handlePublishToGitHub}
                className="mt-6 border border-[#FF1E38]/35 bg-[#F5F5F8] dark:bg-[#050507] p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold">
                    One-Click Push Sanitized Template to GitHub
                  </h3>
                  <span className="font-mono-hud text-[11px] uppercase tracking-wider text-zinc-500">
                    Token used in-memory only · Never stored
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-[#A0A0B2]">
                  Enter a one-time GitHub Personal Access Token (with <code>repo</code> or{' '}
                  <code>public_repo</code> scope) to automatically create{' '}
                  <code>vibe-coded-3d-portfolio-template</code> (marked as a GitHub Template
                  Repository) and push all {templateManifest?.audit.totalFiles || 48} sanitized
                  files to the <code>main</code> branch.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="gh-repo-name"
                      className="block font-mono-hud text-xs uppercase tracking-wider mb-1.5"
                    >
                      Target Repository Name
                    </label>
                    <input
                      id="gh-repo-name"
                      type="text"
                      value={customRepoName}
                      onChange={(e) => setCustomRepoName(e.target.value)}
                      required
                      className="w-full border border-black/20 dark:border-white/20 bg-white dark:bg-[#0B0B10] px-3 py-2 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="gh-pat-input"
                      className="block font-mono-hud text-xs uppercase tracking-wider mb-1.5"
                    >
                      GitHub Personal Access Token (One-Time)
                    </label>
                    <input
                      id="gh-pat-input"
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_... or github_pat_..."
                      required
                      autoComplete="off"
                      className="w-full border border-black/20 dark:border-white/20 bg-white dark:bg-[#0B0B10] px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>

                {publishError && (
                  <p className="text-xs font-semibold text-[#E60023] dark:text-[#FF4D64]">
                    {publishError}
                  </p>
                )}

                {publishResult && (
                  <div className="border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Published {publishResult.filesCommitted} sanitized files to{' '}
                      <strong>{publishResult.fullName}</strong> (commit {publishResult.commitSha})!
                    </span>
                    <a
                      href={publishResult.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold"
                    >
                      Open {publishResult.htmlUrl} ↗
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={publishing}
                    className="bg-[#FF1E38] px-5 py-2.5 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white hover:bg-[#E60023] disabled:opacity-50 cursor-pointer"
                  >
                    {publishing
                      ? 'Publishing Sanitized Template...'
                      : 'Create & Push Sanitized Repo to GitHub'}
                  </button>
                </div>
              </form>
            )}

            {templateManifest && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="border border-black/10 dark:border-white/10 bg-[#F5F5F8] dark:bg-[#050507] p-4">
                  <p className="font-mono-hud uppercase tracking-wider font-semibold text-[#E60023] dark:text-[#FF1E38]">
                    Automated Sanitization Guarantees
                  </p>
                  <ul className="mt-2.5 space-y-1.5 text-zinc-700 dark:text-[#E4E4ED]">
                    {templateManifest.audit.sanitizedCategories.map((cat) => (
                      <li key={cat} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#FF1E38] shrink-0" />
                        <span>{cat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border border-black/10 dark:border-white/10 bg-[#F5F5F8] dark:bg-[#050507] p-4">
                  <p className="font-mono-hud uppercase tracking-wider font-semibold text-[#050507] dark:text-white">
                    Quick CLI Setup (From Downloaded Bundle)
                  </p>
                  <pre className="mt-2.5 overflow-x-auto font-mono text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300">
{`tar -xzf vibe-coded-3d-portfolio-template.tar.gz
cd vibe-coded-3d-portfolio-template
cp .env.example .env
npm install && npm run dev`}
                  </pre>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Problem & Solution Grid */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-6 sm:p-7">
            <div className="flex items-center gap-2 font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF4D63] font-semibold">
              <ShieldAlert className="h-4 w-4" />
              <span>The Problem</span>
            </div>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-[#E4E4ED]">
              {project.problem}
            </p>
          </div>

          <div className="border border-black/15 dark:border-[#FF1E38]/25 bg-white dark:bg-[#0B0B10] p-6 sm:p-7">
            <div className="flex items-center gap-2 font-mono-hud text-xs uppercase tracking-wider text-[#050507] dark:text-white font-semibold">
              <CheckCircle2 className="h-4 w-4 text-[#E60023] dark:text-[#FF1E38]" />
              <span>The Solution</span>
            </div>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-[#E4E4ED]">
              {project.solution}
            </p>
          </div>
        </section>

        {/* Interactive Hybrid RAG & AI Architecture Diagram */}
        <section className="mt-8 border border-black/15 dark:border-[#FF1E38]/30 bg-white dark:bg-[#0B0B10] p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold">System Architecture & AI Methodology</h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-[#E4E4ED]">
            {project.architecture}
          </p>

          {isComplyAi && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-black/15 dark:border-[#FF1E38]/25 bg-[#F5F5F8] dark:bg-[#050507] p-4">
                <Database className="h-5 w-5 text-[#E60023] dark:text-[#FF1E38]" />
                <h3 className="mt-3 font-display text-sm font-bold">
                  Regulatory Knowledge Base
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-[#A0A0B2]">
                  Jurisdiction-aware and time-aware document store indexing primary regulatory texts
                  as the verified source of truth.
                </p>
              </div>

              <div className="border border-black/15 dark:border-white/15 bg-[#F5F5F8] dark:bg-[#050507] p-4">
                <Layers className="h-5 w-5 text-[#050507] dark:text-white" />
                <h3 className="mt-3 font-display text-sm font-bold">
                  Hybrid RAG Retrieval
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-[#A0A0B2]">
                  Dual-stage semantic vector search paired with BM25 lexical matching to retrieve
                  both conceptual context and exact legal terminology.
                </p>
              </div>

              <div className="border border-black/15 dark:border-[#FF1E38]/25 bg-[#F5F5F8] dark:bg-[#050507] p-4">
                <Cpu className="h-5 w-5 text-[#E60023] dark:text-[#FF1E38]" />
                <h3 className="mt-3 font-display text-sm font-bold">
                  Gemma Reasoning Engine
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-[#A0A0B2]">
                  Applies structured compliance reasoning and risk detection strictly grounded in
                  retrieved regulatory evidence, plus LoRA/QLoRA/PEFT domain adaptation concepts.
                </p>
              </div>

              <div className="border border-black/15 dark:border-white/15 bg-[#F5F5F8] dark:bg-[#050507] p-4">
                <FileCheck2 className="h-5 w-5 text-[#050507] dark:text-white" />
                <h3 className="mt-3 font-display text-sm font-bold">
                  Citation Validation Gate
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-[#A0A0B2]">
                  Verifies generated compliance actions and clause references against retrieved
                  regulatory records before presenting output.
                </p>
              </div>
            </div>
          )}

          {isVibePortfolio && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-black/15 dark:border-[#FF1E38]/25 bg-[#F5F5F8] dark:bg-[#050507] p-4">
                <Box className="h-5 w-5 text-[#E60023] dark:text-[#FF1E38]" />
                <h3 className="mt-3 font-display text-sm font-bold">
                  3D Spatial Hub (Three.js)
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-[#A0A0B2]">
                  Hardware-accelerated isometric station floor with procedural silicon textures,
                  glowing PBR stations, and smooth camera sweep interpolation.
                </p>
              </div>

              <div className="border border-black/15 dark:border-white/15 bg-[#F5F5F8] dark:bg-[#050507] p-4">
                <Sparkles className="h-5 w-5 text-[#050507] dark:text-white" />
                <h3 className="mt-3 font-display text-sm font-bold">
                  Neon HUD System
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-[#A0A0B2]">
                  High-contrast Black, Red, and White Neon cyberpunk design system with corner-bracket
                  reticles, interactive skills constellation graph, and sound effects.
                </p>
              </div>

              <div className="border border-black/15 dark:border-[#FF1E38]/25 bg-[#F5F5F8] dark:bg-[#050507] p-4">
                <Terminal className="h-5 w-5 text-[#E60023] dark:text-[#FF1E38]" />
                <h3 className="mt-3 font-display text-sm font-bold">
                  Server-Authoritative Control
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-[#A0A0B2]">
                  Node.js + Express backend with scrypt password hashing, HttpOnly session cookies,
                  and dynamic vector PDF resume compilation from live records.
                </p>
              </div>

              <div className="border border-black/15 dark:border-white/15 bg-[#F5F5F8] dark:bg-[#050507] p-4">
                <Database className="h-5 w-5 text-[#050507] dark:text-white" />
                <h3 className="mt-3 font-display text-sm font-bold">
                  PostgreSQL Isolation (RLS)
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-[#A0A0B2]">
                  PostgreSQL with Row-Level Security ensuring zero client-side secret exposure and
                  strict cryptographic isolation between public visitors and owner administration.
                </p>
              </div>
            </div>
          )}

          {isAeroSense && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border border-black/15 dark:border-[#FF1E38]/25 bg-[#F5F5F8] dark:bg-[#050507] p-4">
                <Cpu className="h-5 w-5 text-[#E60023] dark:text-[#FF1E38]" />
                <h3 className="mt-3 font-display text-sm font-bold">
                  Multi-Sensor Telemetry
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-[#A0A0B2]">
                  Continuous streaming ingestion of pH, turbidity, TDS, and temperature metrics.
                </p>
              </div>

              <div className="border border-black/15 dark:border-white/15 bg-[#F5F5F8] dark:bg-[#050507] p-4">
                <Layers className="h-5 w-5 text-[#050507] dark:text-white" />
                <h3 className="mt-3 font-display text-sm font-bold">
                  Real-Time Anomaly Engine
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-[#A0A0B2]">
                  Continuous threshold drift evaluation against potable water safety standards.
                </p>
              </div>

              <div className="border border-black/15 dark:border-[#FF1E38]/25 bg-[#F5F5F8] dark:bg-[#050507] p-4">
                <FileCheck2 className="h-5 w-5 text-[#E60023] dark:text-[#FF1E38]" />
                <h3 className="mt-3 font-display text-sm font-bold">
                  Diagnostic Alert Layer
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-[#A0A0B2]">
                  Rapid status classification and emergency mitigation instructions for operators.
                </p>
              </div>
            </div>
          )}

          {project.aiMethodology && (
            <div className="mt-6 pt-5 border-t border-black/10 dark:border-white/10">
              <h3 className="font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] font-semibold">
                AI Methodology & Model Alignment
              </h3>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-[#E4E4ED]">
                {project.aiMethodology}
              </p>
            </div>
          )}
        </section>

        {/* Technical Stack, Key Features, and Future Improvements */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Technical Stack & Models */}
          <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-6">
            <h2 className="font-display text-lg font-bold">Technical Stack</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {(project.techStack || []).map((tech) => (
                <li
                  key={tech}
                  className="border-b border-black/10 dark:border-white/10 pb-2 font-mono-hud text-xs text-zinc-700 dark:text-[#E4E4ED]"
                >
                  {tech}
                </li>
              ))}
            </ul>

            {project.aiModelsUsed && project.aiModelsUsed.length > 0 && (
              <>
                <h3 className="mt-6 font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] font-semibold">
                  Models & Techniques Explored
                </h3>
                <ul className="mt-3 space-y-1.5 text-xs font-mono-hud text-zinc-600 dark:text-[#E4E4ED]">
                  {project.aiModelsUsed.map((m) => (
                    <li key={m}>· {m}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Implemented Features */}
          <div className="border border-black/15 dark:border-[#FF1E38]/25 bg-white dark:bg-[#0B0B10] p-6">
            <h2 className="font-display text-lg font-bold">Implemented Capabilities</h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-[#E4E4ED]">
              {(project.features || []).map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#E60023] dark:text-[#FF1E38] shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Future Improvements (Explicitly Marked Planned) */}
          <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold">Planned Improvements</h2>
              <Compass className="h-4 w-4 text-[#E60023] dark:text-[#FF1E38]" />
            </div>
            <p className="mt-1 font-mono-hud text-[11px] uppercase tracking-wider text-zinc-500 dark:text-[#A0A0B2]">
              Roadmap (Not yet shipped)
            </p>
            <ul className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-[#E4E4ED]">
              {(project.futureImprovements || []).map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="font-mono-hud text-xs text-[#E60023] dark:text-[#FF1E38] mt-0.5">
                    →
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Uploaded Screenshots Gallery */}
        {project.screenshots && project.screenshots.length > 0 && (
          <section className="mt-8 border border-black/15 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold">Project Screenshots</h2>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.screenshots.map((src, idx) => (
                <figure
                  key={`${src}-${idx}`}
                  className="border border-black/15 dark:border-white/15 bg-[#F5F5F8] dark:bg-[#050507] overflow-hidden"
                >
                  <img
                    src={src}
                    alt={`${project.title} view ${idx + 1}`}
                    className="w-full h-auto object-cover"
                  />
                </figure>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};
