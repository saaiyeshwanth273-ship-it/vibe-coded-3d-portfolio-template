import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  FileCheck2,
  Github,
  Layers,
  X,
} from 'lucide-react';
import { ProjectItem } from '../types/portfolio.ts';
import { soundEngine } from '../utils/soundEffects.ts';

interface DeviceFlowInfo {
  status: 'pending' | 'publishing' | 'completed' | 'expired' | 'error';
  userCode?: string;
  verificationUri?: string;
  expiresInSec?: number;
  htmlUrl?: string;
  error?: string;
}

interface ProjectsSectionProps {
  projects: ProjectItem[];
  onSelectProject: (project: ProjectItem) => void;
  onOpenTemplateRepo?: () => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects,
  onSelectProject,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [deviceFlow, setDeviceFlow] = useState<DeviceFlowInfo | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const fetchFlow = () => {
      fetch('/api/template/device-flow')
        .then((r) => (r.ok ? r.json() : null))
        .then((data: DeviceFlowInfo | null) => {
          if (active && data) {
            setDeviceFlow(data);
          }
        })
        .catch(() => {});
    };
    fetchFlow();
    const intervalId = window.setInterval(() => {
      if (showAuthModal || (deviceFlow && deviceFlow.status !== 'completed')) {
        fetchFlow();
      }
    }, 3500);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [showAuthModal, deviceFlow?.status]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(projects.map((p) => p.category)));
    return ['All', ...cats];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'All') return projects;
    return projects.filter((p) => p.category === selectedCategory);
  }, [projects, selectedCategory]);

  const featuredProject =
    filteredProjects.find((p) => p.slug === 'complyai-engine' || p.isFeatured) ||
    filteredProjects[0] ||
    null;

  const secondaryProjects = filteredProjects.filter((p) => p.id !== featuredProject?.id);

  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="mx-auto max-w-[1360px] px-5 py-16 sm:px-8 sm:py-24 scroll-mt-20"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 dark:border-[#FF1E38]/25 pb-6">
        <div>
          <p className="font-mono-hud text-xs uppercase tracking-[0.16em] text-[#E60023] dark:text-[#FF1E38] font-semibold">
            Selected Engineering & AI Builds
          </p>
          <h2
            id="projects-heading"
            className="headline-balance mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#07070B] dark:text-white"
          >
            Projects & Architecture
          </h2>
        </div>

        {categories.length > 2 && (
          <div role="tablist" aria-label="Project Categories" className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat}
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedCategory(cat);
                }}
                className={`border px-3 py-1.5 font-mono-hud text-xs uppercase tracking-wider cursor-pointer transition-all ${
                  selectedCategory === cat
                    ? 'border-[#FF1E38] bg-[#FF1E38] text-white font-semibold shadow-[0_0_16px_rgba(255,30,56,0.45)]'
                    : 'border-zinc-300 dark:border-white/20 bg-white dark:bg-[#0B0B10] text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Primary Flagship Spotlight: NexusRAG */}
      {featuredProject && (
        <article className="mt-10 border border-[#FF1E38]/45 bg-white dark:bg-[#0B0B10] p-6 sm:p-10 shadow-[0_0_32px_rgba(255,30,56,0.08)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Project Overview & Key Principle (7 Columns) */}
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-3 font-mono-hud text-xs uppercase tracking-wider">
                <span className="text-[#E60023] dark:text-[#FF1E38] font-semibold">
                  Featured Project
                </span>
                <span aria-hidden="true" className="opacity-40">
                  ·
                </span>
                <span className="text-zinc-600 dark:text-zinc-300">
                  {featuredProject.category}
                </span>
                {featuredProject.status && (
                  <>
                    <span aria-hidden="true" className="opacity-40">
                      ·
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {featuredProject.status}
                    </span>
                  </>
                )}
              </div>

              <h3 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#07070B] dark:text-white">
                {featuredProject.title}
              </h3>

              {featuredProject.tagline && (
                <p className="mt-2 font-editorial italic text-lg sm:text-xl text-[#E60023] dark:text-[#FF1E38]">
                  &ldquo;{featuredProject.tagline}&rdquo;
                </p>
              )}

              <p className="mt-4 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                {featuredProject.description}
              </p>

              {featuredProject.keyPrinciple && (
                <div className="mt-5 border border-zinc-200 dark:border-[#FF1E38]/40 bg-[#F5F5F8] dark:bg-[#050507] p-4">
                  <p className="font-mono-hud text-[11px] uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] font-semibold">
                    Core Architectural Principle
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#07070B] dark:text-white">
                    &ldquo;{featuredProject.keyPrinciple}&rdquo;
                  </p>
                </div>
              )}

              {/* Tech & AI Stack */}
              {featuredProject.techStack && featuredProject.techStack.length > 0 && (
                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-white/10 font-mono-hud text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="uppercase tracking-wider opacity-75">Architecture Stack: </span>
                  <span className="text-[#07070B] dark:text-white font-medium">
                    {featuredProject.techStack.join(' · ')}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSelect();
                    onSelectProject(featuredProject);
                  }}
                  className="hud-reticle inline-flex items-center gap-2 bg-[#FF1E38] px-5 py-3 font-display text-sm font-semibold text-white hover:bg-[#E00E26] shadow-[0_0_20px_rgba(255,30,56,0.45)] transition-all cursor-pointer"
                >
                  <span>Inspect Architecture & Case Study</span>
                  <ArrowUpRight className="h-4 w-4" />
                </button>

                {featuredProject.githubUrl && (
                  <a
                    href={featuredProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hud-reticle inline-flex items-center gap-2 border border-zinc-300 dark:border-white/30 bg-white dark:bg-[#050507] px-4 py-3 font-mono-hud text-xs uppercase tracking-wider text-[#07070B] dark:text-white hover:border-[#FF1E38] hover:text-[#FF1E38] transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    <span>GitHub Repository</span>
                  </a>
                )}
              </div>
            </div>

            {/* Interactive System Blueprint Preview (5 Columns) */}
            <div className="lg:col-span-5 border border-zinc-200 dark:border-[#FF1E38]/30 bg-[#F5F5F8] dark:bg-[#050507] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/15 pb-3">
                <span className="font-mono-hud text-xs uppercase tracking-wider font-semibold text-[#E60023] dark:text-[#FF1E38]">
                  Hybrid Retrieval & Reasoning Flow
                </span>
                <Layers className="h-4 w-4 text-[#FF1E38]" />
              </div>

              <div className="space-y-3 text-xs">
                <div className="border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-3.5">
                  <div className="flex items-center gap-2 font-mono-hud font-semibold text-[#07070B] dark:text-white">
                    <Database className="h-3.5 w-3.5 text-[#FF1E38]" />
                    <span>1. Verified Regulatory Knowledge Corpus</span>
                  </div>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    Jurisdiction-aware and time-aware regulatory indexing preventing stale policy
                    references.
                  </p>
                </div>

                <div className="border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-3.5">
                  <div className="flex items-center gap-2 font-mono-hud font-semibold text-[#07070B] dark:text-white">
                    <Layers className="h-3.5 w-3.5 text-[#FF1E38]" />
                    <span>2. Hybrid RAG: Semantic Vectors + BM25 Lexical</span>
                  </div>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    Combines dense semantic similarity with exact BM25 clause & statute matching.
                  </p>
                </div>

                <div className="border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-3.5">
                  <div className="flex items-center gap-2 font-mono-hud font-semibold text-[#07070B] dark:text-white">
                    <Cpu className="h-3.5 w-3.5 text-[#FF1E38]" />
                    <span>3. Gemma Reasoning + Citation Validation</span>
                  </div>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    Synthesizes clear action items, flags compliance risks, and validates citations
                    against retrieved source clauses.
                  </p>
                </div>

                <div className="border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-3.5">
                  <div className="flex items-center gap-2 font-mono-hud font-semibold text-[#07070B] dark:text-white">
                    <FileCheck2 className="h-3.5 w-3.5 text-[#FF1E38]" />
                    <span>4. PEFT / LoRA / QLoRA Adaptation Track</span>
                  </div>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    Parameter-efficient fine-tuning concepts explored for specialized regulatory
                    domain adaptation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      )}

      {/* Secondary Engineering Projects (AeroSense — Metropolitan Institute of Technology Hackathon & additional builds) */}
      {secondaryProjects.length > 0 && (
        <div
          className={`mt-8 grid grid-cols-1 gap-6 ${
            secondaryProjects.length === 1
              ? ''
              : secondaryProjects.length === 2
              ? 'lg:grid-cols-2'
              : 'md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {secondaryProjects.map((proj) => {
            const isSingleFull = secondaryProjects.length === 1;
            return (
              <article
                key={proj.id}
                className="border border-zinc-200 dark:border-[#FF1E38]/35 bg-white dark:bg-[#0B0B10] p-6 sm:p-8 flex flex-col justify-between"
              >
                <div
                  className={
                    isSingleFull ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-start' : ''
                  }
                >
                  <div className={isSingleFull ? 'lg:col-span-7' : ''}>
                    <div className="flex flex-wrap items-center gap-2 font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38]">
                      <span className="font-semibold">{proj.category}</span>
                      {proj.developmentDate && (
                        <>
                          <span aria-hidden="true" className="opacity-40">
                            ·
                          </span>
                          <span className="text-zinc-800 dark:text-white font-semibold">
                            {proj.developmentDate}
                          </span>
                        </>
                      )}
                      {proj.status && (
                        <>
                          <span aria-hidden="true" className="opacity-40">
                            ·
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400">{proj.status}</span>
                        </>
                      )}
                    </div>

                    <h3 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#07070B] dark:text-white">
                      {proj.title}
                    </h3>

                    {proj.tagline && (
                      <p className="mt-1.5 font-editorial italic text-base sm:text-lg text-[#E60023] dark:text-[#FF1E38]">
                        &ldquo;{proj.tagline}&rdquo;
                      </p>
                    )}

                    <p className="mt-3 text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {proj.description}
                    </p>

                    {proj.techStack && proj.techStack.length > 0 && (
                      <p className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/10 font-mono-hud text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="uppercase tracking-wider opacity-75">Stack: </span>
                        <span className="text-[#07070B] dark:text-white font-medium">
                          {proj.techStack.join(' · ')}
                        </span>
                      </p>
                    )}

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playSelect();
                          onSelectProject(proj);
                        }}
                        className="hud-reticle inline-flex items-center gap-1.5 bg-[#FF1E38] px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#E00E26] shadow-[0_0_16px_rgba(255,30,56,0.4)] transition-all cursor-pointer"
                      >
                        <span>Inspect Architecture & Case Study</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>

                      {proj.githubUrl && (
                        <a
                          href={
                            proj.slug === 'vibe-coded-3d-portfolio' && deviceFlow?.htmlUrl
                              ? deviceFlow.htmlUrl
                              : proj.githubUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (
                              proj.slug === 'vibe-coded-3d-portfolio' &&
                              deviceFlow &&
                              deviceFlow.status !== 'completed'
                            ) {
                              e.preventDefault();
                              soundEngine.playSelect();
                              setShowAuthModal(true);
                            }
                          }}
                          className="hud-reticle inline-flex items-center gap-2 border border-zinc-300 dark:border-white/30 bg-white dark:bg-[#050507] px-4 py-2.5 font-mono-hud text-xs uppercase tracking-wider text-[#07070B] dark:text-white hover:border-[#FF1E38] hover:text-[#FF1E38] transition-colors"
                        >
                          <Github className="h-3.5 w-3.5" />
                          <span>GitHub Repository</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {isSingleFull && (
                    <div className="lg:col-span-5 border border-zinc-200 dark:border-[#FF1E38]/30 bg-[#F5F5F8] dark:bg-[#050507] p-5 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/15 pb-2.5">
                        <span className="font-mono-hud uppercase tracking-wider font-semibold text-[#E60023] dark:text-[#FF1E38]">
                          {proj.developmentDate || 'Hackathon Architecture'}
                        </span>
                        <Cpu className="h-4 w-4 text-[#FF1E38]" />
                      </div>
                      <div className="border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-3.5">
                        <p className="font-mono-hud uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] font-semibold">
                          Problem Addressed
                        </p>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-300 leading-relaxed">
                          {proj.problem}
                        </p>
                      </div>
                      <div className="border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-3.5">
                        <p className="font-mono-hud uppercase tracking-wider text-[#07070B] dark:text-white font-semibold">
                          Engineered Solution
                        </p>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-300 leading-relaxed">
                          {proj.solution}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 1-Click GitHub Device Authorization Modal (Creates repo under your-username) */}
      {showAuthModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gh-device-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <div className="relative w-full max-w-lg border border-[#FF1E38] bg-white dark:bg-[#0B0B10] p-6 sm:p-8 text-[#050507] dark:text-white shadow-[0_0_40px_rgba(255,30,56,0.25)]">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 p-1.5 text-zinc-500 hover:text-[#FF1E38] cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {deviceFlow?.status === 'completed' ? (
              <div className="text-center space-y-4 py-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <h3
                  id="gh-device-modal-title"
                  className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400"
                >
                  Repository Created on Your GitHub!
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  All 52 sanitized template files (zero API keys, zero personal details) have been
                  pushed to{' '}
                  <strong className="font-mono-hud">
                    your-username/vibe-coded-3d-portfolio-template
                  </strong>
                  .
                </p>
                <div className="pt-2">
                  <a
                    href={
                      deviceFlow.htmlUrl ||
                      'https://github.com/your-username/vibe-coded-3d-portfolio-template'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowAuthModal(false)}
                    className="hud-reticle inline-flex items-center gap-2 bg-[#FF1E38] px-6 py-3 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white hover:bg-[#E00E26]"
                  >
                    <Github className="h-4 w-4" />
                    <span>Open Repository on GitHub</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] font-semibold">
                  <Github className="h-4 w-4" />
                  <span>1-Click GitHub Repository Activation</span>
                </div>

                <h3 id="gh-device-modal-title" className="mt-1.5 font-display text-2xl font-bold">
                  Authorize Creating Repo in Your GitHub Account
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  To create{' '}
                  <code className="font-mono-hud text-[#E60023] dark:text-[#FF4D64]">
                    your-username/vibe-coded-3d-portfolio-template
                  </code>{' '}
                  directly inside your GitHub account with all 52 sanitized template files, enter
                  this 8-character code on GitHub:
                </p>

                <div className="mt-5 flex items-center justify-between gap-3 border border-[#FF1E38]/50 bg-[#F5F5F8] dark:bg-[#050507] p-4">
                  <div>
                    <p className="font-mono-hud text-[10px] uppercase tracking-widest text-zinc-500">
                      Your One-Time GitHub Device Code
                    </p>
                    <p className="mt-1 font-mono-hud text-2xl sm:text-3xl font-bold tracking-[0.18em] text-[#E60023] dark:text-[#FF1E38]">
                      {deviceFlow?.userCode || 'LOADING...'}
                    </p>
                  </div>

                  {deviceFlow?.userCode && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(deviceFlow.userCode || '').catch(() => {});
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="hud-reticle inline-flex items-center gap-1.5 border border-black/20 dark:border-white/25 bg-white dark:bg-[#0B0B10] px-3.5 py-2 font-mono-hud text-xs uppercase tracking-wider hover:border-[#FF1E38] cursor-pointer"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#FF1E38]" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <a
                    href={deviceFlow?.verificationUri || 'https://github.com/login/device'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (deviceFlow?.userCode) {
                        navigator.clipboard.writeText(deviceFlow.userCode).catch(() => {});
                        setCopiedCode(true);
                      }
                    }}
                    className="flex-1 hud-reticle inline-flex items-center justify-center gap-2 bg-[#FF1E38] px-5 py-3 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white hover:bg-[#E00E26] text-center"
                  >
                    <Github className="h-4 w-4" />
                    <span>Copy Code & Open github.com/login/device</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <p className="mt-4 font-mono-hud text-[11px] text-zinc-500 dark:text-zinc-400">
                  {deviceFlow?.status === 'publishing'
                    ? '✓ Authorized! Creating repository and pushing 52 sanitized files to your GitHub now...'
                    : 'Waiting for you to click Authorize on GitHub — this window will automatically create and open your repository as soon as you approve.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
