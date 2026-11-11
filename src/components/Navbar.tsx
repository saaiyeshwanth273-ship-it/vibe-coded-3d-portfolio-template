import React, { useState } from 'react';
import { Check, Cpu, Download, Github, Linkedin, Mail, Menu, X } from 'lucide-react';
import { ProfileSettings, SocialLinkItem } from '../types/portfolio.ts';
import { downloadResumePdf } from '../utils/resumeDownload.ts';
import { soundEngine } from '../utils/soundEffects.ts';

interface NavbarProps {
  profile: ProfileSettings | null;
  onNavigateSection: (sectionId: string) => void;
  onNavigateHome: () => void;
  scrollProgressBarRef?: React.RefObject<HTMLDivElement | null>;
}

const NAV_ITEMS = [
  { id: 'universe', label: 'Universe' },
  { id: 'about', label: 'About' },
  { id: 'exploring', label: 'Exploring' },
  { id: 'skills', label: 'Skills & AI' },
  { id: 'projects', label: 'Projects' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'connect', label: 'Connect' },
];

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  onNavigateSection,
  onNavigateHome,
  scrollProgressBarRef,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [downloadedResume, setDownloadedResume] = useState(false);

  const resumeDownloadUrl = profile?.resumeUrl?.startsWith('/api/uploads/')
    ? profile.resumeUrl
    : '/api/resume/download';
  const resumeFilename = profile?.resumeFilename || 'Alex_Rivera_Resume.pdf';

  const handleDownloadResume = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (downloadingResume) return;
    soundEngine.playSelect();
    setDownloadingResume(true);
    await downloadResumePdf(resumeDownloadUrl, resumeFilename);
    setDownloadingResume(false);
    setDownloadedResume(true);
    window.setTimeout(() => setDownloadedResume(false), 2200);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-[#FF1E38]/30 bg-white/90 dark:bg-[#050507]/92 backdrop-blur-md">
      {/* Scroll Progress Indicator Bar (Red-to-White Neon Laser) */}
      <div className="h-[2px] w-full bg-transparent overflow-hidden">
        <div
          ref={scrollProgressBarRef}
          style={{ transform: 'scaleX(0)' }}
          className="h-full w-full origin-left bg-gradient-to-r from-[#FF1E38] via-white to-[#FF1E38] transition-transform duration-75"
        />
      </div>

      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-5 sm:px-8">
        {/* Brand Identity Lockup */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onNavigateHome();
            onNavigateSection('universe');
          }}
          className="group flex items-center gap-3 text-left focus:outline-none cursor-pointer"
        >
          <div className="hud-reticle flex h-9 w-9 items-center justify-center border border-[#FF1E38]/55 bg-[#FF1E38]/12 text-[#E60023] dark:text-[#FF1E38] shadow-[0_0_14px_rgba(255,30,56,0.22)]">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <span className="block font-display text-sm font-bold tracking-tight text-[#07070B] dark:text-white">
              {profile?.fullName || 'Alex Rivera'}
            </span>
            <span className="block font-mono-hud text-[10px] uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
              AI · Prompt · Vibe Coding
            </span>
          </div>
        </button>

        {/* Primary Section Links */}
        <nav aria-label="Primary Portfolio Navigation" className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onNavigateSection(item.id);
              }}
              className="px-3 py-1.5 font-mono-hud text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-300 hover:text-[#E60023] dark:hover:text-[#FF1E38] transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Resume Action & Mobile Menu Button */}
        <div className="flex items-center gap-2.5">
          {profile?.resumeEnabled !== false && (
            <button
              type="button"
              data-testid="navbar-resume-download-btn"
              onClick={handleDownloadResume}
              className="hud-reticle inline-flex items-center gap-1.5 border border-[#FF1E38]/60 bg-[#FF1E38]/12 px-3.5 py-1.5 font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-white hover:bg-[#FF1E38] hover:text-white hover:shadow-[0_0_18px_rgba(255,30,56,0.5)] transition-all cursor-pointer"
            >
              {downloadedResume ? (
                <Check className="h-3.5 w-3.5 text-[#FF1E38] group-hover:text-white" />
              ) : (
                <Download className="h-3.5 w-3.5 text-[#FF1E38]" />
              )}
              <span>
                {downloadingResume
                  ? 'Saving...'
                  : downloadedResume
                    ? 'Saved PDF'
                    : 'Resume'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden flex h-9 w-9 items-center justify-center border border-zinc-300 dark:border-[#FF1E38]/35 bg-white dark:bg-[#0B0B10] text-zinc-700 dark:text-zinc-200 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Portfolio Navigation"
          className="lg:hidden border-t border-zinc-200 dark:border-[#FF1E38]/25 bg-white dark:bg-[#07070B] px-5 py-4"
        >
          <div className="grid grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setMobileMenuOpen(false);
                  onNavigateSection(item.id);
                }}
                className="border border-zinc-200 dark:border-white/15 px-3 py-2 text-left font-mono-hud text-xs uppercase tracking-wider text-[#07070B] dark:text-white hover:border-[#FF1E38] hover:text-[#FF1E38] cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};

interface FooterProps {
  profile: ProfileSettings | null;
  socialLinks: SocialLinkItem[];
  onNavigateSection: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ profile, socialLinks, onNavigateSection }) => {
  const linkedinUrl =
    socialLinks.find((s) => s.platform.toLowerCase().includes('linkedin'))?.url ||
    'https://www.linkedin.com/in/alex-rivera-dev/';
  const githubUrl =
    socialLinks.find((s) => s.platform.toLowerCase().includes('github'))?.url ||
    'https://github.com/your-username';

  return (
    <footer className="border-t border-zinc-200 dark:border-[#FF1E38]/25 bg-white dark:bg-[#040406] py-12">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <p className="font-display text-base font-bold text-[#07070B] dark:text-white">
            {profile?.fullName || 'Alex Rivera'}
          </p>
          <p className="mt-1 font-mono-hud text-xs text-zinc-600 dark:text-zinc-400">
            {profile?.subheading ||
              'AI Enthusiast · Prompt Engineer · Vibe Coder · Developer · Student Leader'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 font-mono-hud text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-[#E60023] dark:hover:text-[#FF1E38] transition-colors"
          >
            <Linkedin className="h-3.5 w-3.5" />
            <span>LinkedIn</span>
          </a>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-[#E60023] dark:hover:text-[#FF1E38] transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onNavigateSection('send-direct-message');
            }}
            className="inline-flex items-center gap-1.5 uppercase hover:text-[#E60023] dark:hover:text-[#FF1E38] transition-colors cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Contact</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
