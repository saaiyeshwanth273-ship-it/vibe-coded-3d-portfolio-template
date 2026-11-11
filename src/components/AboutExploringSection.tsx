import React, { useState } from 'react';
import {
  BookOpen,
  Briefcase,
  Compass,
  Cpu,
  GraduationCap,
  Sparkles,
  Users,
} from 'lucide-react';
import { AboutTheme, ExploringItem, ProfileSettings } from '../types/portfolio.ts';
import { cleanDisplayText } from '../utils/resumeDownload.ts';
import { soundEngine } from '../utils/soundEffects.ts';

interface AboutExploringSectionProps {
  profile: ProfileSettings | null;
  aboutThemes: AboutTheme[];
  exploringItems: ExploringItem[];
  highlightedSection?: string | null;
}

export const AboutExploringSection: React.FC<AboutExploringSectionProps> = ({
  profile,
  aboutThemes,
  exploringItems,
  highlightedSection,
}) => {
  const [activeThemeSlug, setActiveThemeSlug] = useState<string>(
    aboutThemes[0]?.slug || 'curiosity',
  );
  const [selectedExploringId, setSelectedExploringId] = useState<number | null>(null);

  const activeTheme =
    aboutThemes.find((t) => t.slug === activeThemeSlug) || aboutThemes[0] || null;

  return (
    <div className="space-y-24 py-16 sm:py-24">
      {/* =================================================================== */}
      {/* About Section — Interactive Identity & Narrative Explorer */}
      {/* =================================================================== */}
      <section
        id="about"
        aria-labelledby="about-heading"
        className="mx-auto max-w-[1360px] px-5 sm:px-8 scroll-mt-20"
      >
        <div className="max-w-3xl">
          <p className="font-mono-hud text-xs uppercase tracking-[0.16em] text-[#E60023] dark:text-[#FF1E38] font-semibold">
            Identity & Story
          </p>
          <h2
            id="about-heading"
            className="headline-balance mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#07070B] dark:text-white"
          >
            Driven by curiosity. Grounded in creation and collaborative leadership.
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            {profile?.shortIntro ||
              'I enjoy exploring emerging technologies, transforming ideas into working products, and collaborating with people who believe in building something meaningful.'}
          </p>
        </div>

        {/* Asymmetric 12-Column Layout: 7-Column Interactive Theme Narrative + 5-Column Verified Profile Dossier */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Interactive Narrative Themes (7 Columns) */}
          <div className="lg:col-span-7 border border-zinc-200 dark:border-[#FF1E38]/30 bg-white dark:bg-[#0B0B10] p-6 sm:p-8">
            <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-white/10 pb-4">
              {aboutThemes.map((theme) => {
                const isActive = activeTheme?.slug === theme.slug;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playSelect();
                      setActiveThemeSlug(theme.slug);
                    }}
                    className={`px-4 py-2 font-mono-hud text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#FF1E38] text-white font-semibold shadow-[0_0_16px_rgba(255,30,56,0.45)]'
                        : 'border border-zinc-200 dark:border-white/15 text-zinc-700 dark:text-zinc-300 hover:border-[#FF1E38] hover:text-[#FF1E38]'
                    }`}
                  >
                    {theme.title}
                  </button>
                );
              })}
            </div>

            {activeTheme && (
              <div className="mt-6">
                <p className="font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38]">
                  {activeTheme.subtitle}
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold text-[#07070B] dark:text-white">
                  {activeTheme.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {activeTheme.narrative}
                </p>

                {activeTheme.highlights && activeTheme.highlights.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-white/10">
                    <p className="font-mono-hud text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Core Pillars
                    </p>
                    <ul className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {activeTheme.highlights.map((item) => (
                        <li
                          key={item}
                          className="border border-zinc-200 dark:border-[#FF1E38]/25 bg-[#F5F5F8] dark:bg-[#050507] p-3 font-mono-hud text-xs text-[#07070B] dark:text-white"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Verified Profile Snapshot Dossier (5 Columns) — Target for 3D RESUME Station */}
          <div
            id="profile-summary"
            data-testid="profile-summary-card"
            className={`lg:col-span-5 scroll-mt-24 border bg-white dark:bg-[#0B0B10] p-6 sm:p-8 transition-all duration-500 ${
              highlightedSection === 'profile-summary'
                ? 'border-[#FF1E38] ring-2 ring-[#FF1E38]/55 shadow-[0_0_32px_rgba(255,30,56,0.3)]'
                : 'border-zinc-200 dark:border-[#FF1E38]/35'
            }`}
          >
            <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-white/15 pb-5">
              {profile?.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt={profile.fullName}
                  className="h-14 w-14 object-cover border border-[#FF1E38]"
                />
              ) : (
                <div className="hud-reticle flex h-14 w-14 shrink-0 items-center justify-center border border-[#FF1E38]/60 bg-[#FF1E38]/12 font-display text-lg font-bold tracking-wider text-[#E60023] dark:text-[#FF1E38]">
                  AR
                </div>
              )}
              <div>
                <h3 className="font-display text-xl font-bold text-[#07070B] dark:text-white">
                  {profile?.fullName || 'Alex Rivera'}
                </h3>
                <p className="mt-0.5 font-mono-hud text-xs text-[#E60023] dark:text-[#FF1E38]">
                  {profile?.education || 'B.Tech Computer Science, Specialization in AI/ML'}
                </p>
              </div>
            </div>

            <dl className="mt-4 divide-y divide-zinc-200/70 dark:divide-white/10 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-3.5 items-start">
                <dt className="sm:col-span-4 flex items-center gap-2 font-mono-hud text-[11px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                  <GraduationCap className="h-3.5 w-3.5 text-[#FF1E38] shrink-0" />
                  <span>Education</span>
                </dt>
                <dd className="sm:col-span-8 font-medium text-[#07070B] dark:text-white">
                  {profile?.education || 'B.Tech Computer Science, Specialization in AI/ML'} —{' '}
                  {profile?.university || 'Metropolitan Institute of Technology'}, {profile?.institution || 'School of Computing & AI'}
                </dd>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-3.5 items-start">
                <dt className="sm:col-span-4 flex items-center gap-2 font-mono-hud text-[11px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                  <Cpu className="h-3.5 w-3.5 text-[#FF1E38] shrink-0" />
                  <span>Focus</span>
                </dt>
                <dd className="sm:col-span-8 font-medium text-[#07070B] dark:text-white">
                  {profile?.specialization || 'Artificial Intelligence & Machine Learning'}
                </dd>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-3.5 items-start">
                <dt className="sm:col-span-4 flex items-center gap-2 font-mono-hud text-[11px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                  <Briefcase className="h-3.5 w-3.5 text-[#FF1E38] shrink-0" />
                  <span>Internship</span>
                </dt>
                <dd className="sm:col-span-8 font-medium text-[#07070B] dark:text-white">
                  {profile?.currentInternship || 'Intern at Acme AI Labs'}
                </dd>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-3.5 items-start">
                <dt className="sm:col-span-4 flex items-center gap-2 font-mono-hud text-[11px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                  <Users className="h-3.5 w-3.5 text-[#FF1E38] shrink-0" />
                  <span>Leadership</span>
                </dt>
                <dd className="sm:col-span-8 font-medium text-[#07070B] dark:text-white">
                  {profile?.leadershipSummary ||
                    'Vice President, University Engineering Council · Campus Ambassador at OpenTech Developer Community'}
                </dd>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-3.5 items-start">
                <dt className="sm:col-span-4 flex items-center gap-2 font-mono-hud text-[11px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                  <Sparkles className="h-3.5 w-3.5 text-[#FF1E38] shrink-0" />
                  <span>Interests</span>
                </dt>
                <dd className="sm:col-span-8 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {profile?.currentInterests ||
                    'AI & Machine Learning, Prompt Engineering, Vibe Coding, Software Development, Product Experimentation'}
                </dd>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-3.5 items-start">
                <dt className="sm:col-span-4 flex items-center gap-2 font-mono-hud text-[11px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                  <Compass className="h-3.5 w-3.5 text-[#FF1E38] shrink-0" />
                  <span>Direction</span>
                </dt>
                <dd className="sm:col-span-8 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {profile?.careerDirection ||
                    'Exploring the intersection of artificial intelligence, software engineering, and human imagination to turn ideas into working digital products.'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* Currently Exploring Section */}
      {/* =================================================================== */}
      <section
        id="exploring"
        aria-labelledby="exploring-heading"
        className="mx-auto max-w-[1360px] px-5 sm:px-8 scroll-mt-20"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="font-mono-hud text-xs uppercase tracking-[0.16em] text-[#E60023] dark:text-[#FF1E38] font-semibold">
              Currently Exploring
            </p>
            <h2
              id="exploring-heading"
              className="headline-balance mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#07070B] dark:text-white"
            >
              Active frontiers in AI, engineering, and community leadership.
            </h2>
          </div>
          <p className="font-mono-hud text-xs text-zinc-600 dark:text-zinc-400">
            Select any domain card to focus
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exploringItems.map((item) => {
            const isSelected = selectedExploringId === item.id;
            const cleanedDetails = cleanDisplayText(item.details);

            return (
              <article
                key={item.id}
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedExploringId(isSelected ? null : item.id);
                }}
                className={`hud-reticle border p-6 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#FF1E38] bg-white dark:bg-[#12121A] shadow-[0_0_24px_rgba(255,30,56,0.2)]'
                    : 'border-zinc-200 dark:border-white/15 bg-white dark:bg-[#0B0B10] hover:border-[#FF1E38]/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-hud text-[11px] uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] font-semibold">
                    {item.category}
                  </span>
                  <BookOpen className="h-4 w-4 text-zinc-400 dark:text-zinc-400" />
                </div>

                <h3 className="mt-3 font-display text-xl font-bold text-[#07070B] dark:text-white">
                  {item.title}
                </h3>

                <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {item.summary}
                </p>

                {isSelected && cleanedDetails && (
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/10 font-mono-hud text-xs text-zinc-600 dark:text-zinc-300">
                    {cleanedDetails}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
