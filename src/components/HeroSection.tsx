import React, { useState } from 'react';
import {
  ArrowDownRight,
  Check,
  Compass,
  Download,
  Eye,
  EyeOff,
  Github,
  Linkedin,
  Mail,
  Moon,
  SlidersHorizontal,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CIRCUIT_STATIONS } from '../three/stationBuilders.ts';
import { UniverseCanvas } from '../three/UniverseCanvas.tsx';
import { ColorMode, ProfileSettings, SocialLinkItem } from '../types/portfolio.ts';
import { downloadResumePdf } from '../utils/resumeDownload.ts';
import { soundEngine } from '../utils/soundEffects.ts';

interface HeroSectionProps {
  profile: ProfileSettings | null;
  socialLinks: SocialLinkItem[];
  colorMode: ColorMode;
  onToggleColorMode: () => void;
  highQuality: boolean;
  onToggleHighQuality: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onNavigateSection: (sectionId: string) => void;
  scrollProgressRef: React.MutableRefObject<number>;
  heroParallaxRef?: React.RefObject<HTMLDivElement | null>;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  profile,
  socialLinks,
  colorMode,
  onToggleColorMode,
  highQuality,
  onToggleHighQuality,
  soundEnabled,
  onToggleSound,
  onNavigateSection,
  scrollProgressRef,
  heroParallaxRef,
}) => {
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [focusedStationId, setFocusedStationId] = useState<string | null>(null);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [downloadedResume, setDownloadedResume] = useState(false);

  const selectedStation = focusedStationId
    ? CIRCUIT_STATIONS.find((s) => s.id === focusedStationId) || null
    : null;

  const linkedinUrl =
    socialLinks.find((s) => s.platform.toLowerCase().includes('linkedin'))?.url ||
    'https://www.linkedin.com/in/alex-rivera-dev/';
  const githubUrl =
    socialLinks.find((s) => s.platform.toLowerCase().includes('github'))?.url ||
    'https://github.com/your-username';

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

  const handleSelectStation = (sectionId: string, stationId: string) => {
    setFocusedStationId(stationId);
    if (stationId === 'resume' || sectionId === 'resume') {
      onNavigateSection('profile-summary');
    } else if (stationId === 'connect' || sectionId === 'send-direct-message') {
      onNavigateSection('send-direct-message');
    } else {
      onNavigateSection(sectionId);
    }
  };

  return (
    <section
      id="universe"
      data-universe-mode="circuit"
      data-color-mode={colorMode}
      data-controls-collapsed={controlsCollapsed ? 'true' : 'false'}
      className="relative w-full min-h-[780px] lg:h-[calc(100vh-4rem)] lg:max-h-[920px] overflow-hidden border-b border-zinc-200 dark:border-[#FF1E38]/25 bg-[#F5F5F8] dark:bg-[#050507]"
    >
      {/* Full-Bleed Interactive Three.js Isometric Circuit Command Hub Canvas with Scroll Parallax */}
      <div ref={heroParallaxRef} className="absolute inset-0 will-change-transform">
        <UniverseCanvas
          colorMode={colorMode}
          highQuality={highQuality}
          controlsCollapsed={controlsCollapsed}
          onSelectStation={handleSelectStation}
          focusedStationId={focusedStationId}
          scrollProgressRef={scrollProgressRef}
        />
      </div>

      {/* Subtle Edge Legibility Gradient for Editorial Typography Lockup (Hidden when controls collapsed) */}
      {!controlsCollapsed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#F5F5F8]/95 via-[#F5F5F8]/75 to-transparent dark:from-[#050507]/95 dark:via-[#050507]/70 dark:to-transparent lg:w-[54%]"
        />
      )}

      {/* Editorial Hero Typography & Identity Lockup + Bottom HUD Controls */}
      <div className="pointer-events-none relative z-20 mx-auto flex h-full max-w-[1360px] flex-col justify-between px-5 py-8 sm:px-8 sm:py-10">
        {!controlsCollapsed ? (
          <div data-testid="hero-editorial-content" className="pointer-events-auto max-w-xl">
            {/* Status Line */}
            <p className="font-mono-hud text-xs uppercase tracking-[0.14em] text-[#E60023] dark:text-[#FF1E38] font-semibold">
              {profile?.statusText || 'Currently exploring AI, development & innovation.'}
            </p>

            {/* Main Display Headline */}
            <h1 className="headline-balance mt-3 font-display text-4xl sm:text-5xl lg:text-[54px] font-bold leading-[1.05] tracking-[-0.028em] text-[#07070B] dark:text-white">
              {profile?.headline || 'Building beyond the expected.'}
            </h1>

            {/* Identity Subtitle */}
            <p className="mt-4 font-mono-hud text-xs sm:text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold text-[#07070B] dark:text-white">
                {profile?.fullName || 'Alex Rivera'}
              </span>
              {' — '}
              {profile?.subheading ||
                'AI Enthusiast · Prompt Engineer · Vibe Coder · Developer · Student Leader'}
            </p>

            {/* Personal Brand Statement (Black, Red & White Neon hairline card) */}
            <blockquote className="mt-4 border border-zinc-200 dark:border-[#FF1E38]/40 bg-white/85 dark:bg-[#0B0B10]/90 px-4 py-3 font-editorial italic text-base sm:text-lg leading-relaxed text-zinc-800 dark:text-zinc-100 shadow-[0_0_24px_rgba(255,30,56,0.08)]">
              &ldquo;
              {profile?.brandStatement ||
                "I don't just explore technology. I experiment, build, lead, and turn ideas into experiences."}
              &rdquo;
            </blockquote>

            {/* Primary & Secondary Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSelect();
                  onNavigateSection('about');
                }}
                className="hud-reticle inline-flex items-center gap-2 bg-[#FF1E38] px-5 py-3 font-display text-sm font-semibold text-white hover:bg-[#E00E26] shadow-[0_0_22px_rgba(255,30,56,0.45)] transition-all cursor-pointer"
              >
                <span>Explore My Universe</span>
                <ArrowDownRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onNavigateSection('projects');
                }}
                className="hud-reticle inline-flex items-center gap-2 border border-zinc-300 dark:border-white/35 bg-white/95 dark:bg-[#0B0B10]/95 px-5 py-3 font-display text-sm font-semibold text-[#07070B] dark:text-white hover:border-[#FF1E38] dark:hover:border-[#FF1E38] hover:text-[#FF1E38] transition-colors cursor-pointer"
              >
                <span>View My Work</span>
              </button>
            </div>

            {/* Direct Social & Resume Links */}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-mono-hud uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[#E60023] dark:hover:text-[#FF1E38] transition-colors"
              >
                <Linkedin className="h-3.5 w-3.5 text-[#FF1E38]" />
                <span>LinkedIn</span>
              </a>
              <span aria-hidden="true" className="opacity-40">
                ·
              </span>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[#E60023] dark:hover:text-[#FF1E38] transition-colors"
              >
                <Github className="h-3.5 w-3.5 text-[#FF1E38]" />
                <span>GitHub</span>
              </a>
              <span aria-hidden="true" className="opacity-40">
                ·
              </span>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onNavigateSection('send-direct-message');
                }}
                className="inline-flex items-center gap-1.5 uppercase hover:text-[#E60023] dark:hover:text-[#FF1E38] transition-colors cursor-pointer"
              >
                <Mail className="h-3.5 w-3.5 text-[#FF1E38]" />
                <span>Email</span>
              </button>
              {profile?.resumeEnabled !== false && (
                <>
                  <span aria-hidden="true" className="opacity-40">
                    ·
                  </span>
                  <button
                    type="button"
                    data-testid="hero-resume-download-btn"
                    onClick={handleDownloadResume}
                    className="inline-flex items-center gap-1.5 uppercase hover:text-[#E60023] dark:hover:text-[#FF1E38] transition-colors cursor-pointer"
                  >
                    {downloadedResume ? (
                      <Check className="h-3.5 w-3.5 text-[#FF1E38]" />
                    ) : (
                      <Download className="h-3.5 w-3.5 text-[#FF1E38]" />
                    )}
                    <span>
                      {downloadingResume
                        ? 'Downloading...'
                        : downloadedResume
                          ? 'Saved Resume PDF'
                          : 'Resume PDF'}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div aria-hidden="true" />
        )}

        {/* Bottom HUD Bar: Circuit Hub Toggles & Hide/Show Controls */}
        <div className="pointer-events-auto mt-8 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
          {controlsCollapsed ? (
            <button
              type="button"
              data-testid="show-controls-btn"
              onClick={() => {
                soundEngine.playClick();
                setControlsCollapsed(false);
              }}
              className="hud-reticle inline-flex items-center gap-2 border border-zinc-300 dark:border-[#FF1E38]/50 bg-white/95 dark:bg-[#07070B]/95 px-3.5 py-2 font-mono-hud text-xs uppercase tracking-wider text-[#07070B] dark:text-white hover:border-[#FF1E38] cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-[#FF1E38]" />
              <span>Show Controls</span>
            </button>
          ) : (
            <div className="w-full lg:w-auto border border-zinc-300 dark:border-[#FF1E38]/35 bg-white/95 dark:bg-[#07070B]/95 p-3 sm:p-3.5 shadow-[0_0_24px_rgba(0,0,0,0.65)]">
              <div className="flex flex-wrap items-center gap-3">
                {/* High Quality Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={highQuality}
                  onClick={() => {
                    soundEngine.playClick();
                    onToggleHighQuality();
                  }}
                  className="inline-flex items-center gap-2 border border-zinc-200 dark:border-white/20 px-2.5 py-1.5 font-mono-hud text-[11px] uppercase tracking-wider text-zinc-800 dark:text-zinc-200 hover:border-[#FF1E38] cursor-pointer"
                >
                  <SlidersHorizontal className="h-3 w-3 text-[#FF1E38]" />
                  <span>High Quality</span>
                  <span className="font-semibold text-[#E60023] dark:text-[#FF1E38]">
                    {highQuality ? 'ON' : 'ECO'}
                  </span>
                </button>

                {/* Sound Effects Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={soundEnabled}
                  onClick={onToggleSound}
                  className="inline-flex items-center gap-2 border border-zinc-200 dark:border-white/20 px-2.5 py-1.5 font-mono-hud text-[11px] uppercase tracking-wider text-zinc-800 dark:text-zinc-200 hover:border-[#FF1E38] cursor-pointer"
                >
                  {soundEnabled ? (
                    <Volume2 className="h-3 w-3 text-[#FF1E38]" />
                  ) : (
                    <VolumeX className="h-3 w-3 opacity-60" />
                  )}
                  <span>Sound Effects</span>
                  <span className="font-semibold text-[#E60023] dark:text-[#FF1E38]">
                    {soundEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Light / Dark Theme Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={colorMode === 'light'}
                  onClick={() => {
                    soundEngine.playClick();
                    onToggleColorMode();
                  }}
                  className="inline-flex items-center gap-2 border border-zinc-200 dark:border-white/20 px-2.5 py-1.5 font-mono-hud text-[11px] uppercase tracking-wider text-zinc-800 dark:text-zinc-200 hover:border-[#FF1E38] cursor-pointer"
                >
                  {colorMode === 'light' ? (
                    <Sun className="h-3 w-3 text-[#FF1E38]" />
                  ) : (
                    <Moon className="h-3 w-3 text-[#FF1E38]" />
                  )}
                  <span>Light Mode</span>
                  <span className="font-semibold text-[#E60023] dark:text-[#FF1E38]">
                    {colorMode === 'light' ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Hide Controls Button */}
                <button
                  type="button"
                  data-testid="hide-controls-btn"
                  onClick={() => {
                    soundEngine.playClick();
                    setFocusedStationId(null);
                    setControlsCollapsed(true);
                  }}
                  className="inline-flex items-center gap-1.5 border border-zinc-200 dark:border-white/20 px-2.5 py-1.5 font-mono-hud text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:text-[#07070B] dark:hover:text-white cursor-pointer"
                >
                  <EyeOff className="h-3 w-3" />
                  <span>Hide Controls</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Station Telemetry Card when a 3D Node is Focused */}
          {!controlsCollapsed && selectedStation && (
            <button
              type="button"
              data-testid="station-telemetry-card"
              onClick={() => {
                soundEngine.playSelect();
                handleSelectStation(selectedStation.sectionId, selectedStation.id);
              }}
              className="hud-reticle border border-[#FF1E38]/55 bg-white/95 dark:bg-[#0B0B10]/95 px-4 py-2.5 text-left text-xs hover:border-white transition-colors cursor-pointer shadow-[0_0_20px_rgba(255,30,56,0.22)]"
            >
              <div className="flex items-center gap-3 font-mono-hud">
                <Compass className="h-3.5 w-3.5 text-[#FF1E38] shrink-0" />
                <span className="font-bold uppercase tracking-wider text-[#07070B] dark:text-white">
                  {selectedStation.reticleLabel}
                </span>
                <span className="text-zinc-600 dark:text-zinc-300">
                  {selectedStation.subtitle}
                </span>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
