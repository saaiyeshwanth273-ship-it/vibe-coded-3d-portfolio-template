import React from 'react';
import { Award, Briefcase, CheckCircle2, Sparkles, Trophy, Users } from 'lucide-react';
import {
  AchievementItem,
  CertificationItem,
  ExperienceItem,
  LeadershipRole,
  TimelineEventItem,
} from '../types/portfolio.ts';
import { cleanDisplayList, cleanDisplayText } from '../utils/resumeDownload.ts';

interface AchievementsLeadershipTimelineProps {
  achievements: AchievementItem[];
  leadershipRoles: LeadershipRole[];
  experiences: ExperienceItem[];
  timelineEvents: TimelineEventItem[];
  certifications: CertificationItem[];
}

const TIER_LABELS: Record<AchievementItem['recognitionTier'], string> = {
  medal: 'Performance Medal',
  second_place: 'Second Place',
  finalist: 'Finalist Recognition',
  recognition: 'Special Recognition',
};

export const AchievementsLeadershipTimeline: React.FC<AchievementsLeadershipTimelineProps> = ({
  achievements,
  leadershipRoles,
  experiences,
  timelineEvents,
  certifications,
}) => {
  return (
    <div className="space-y-24 py-16 sm:py-24">
      {/* =================================================================== */}
      {/* Achievements & Milestones Section */}
      {/* =================================================================== */}
      <section
        id="achievements"
        aria-labelledby="achievements-heading"
        className="mx-auto max-w-[1360px] px-5 sm:px-8 scroll-mt-20"
      >
        <div className="max-w-3xl">
          <p className="font-mono-hud text-xs uppercase tracking-[0.16em] text-[#E60023] dark:text-[#FF1E38] font-semibold">
            Milestones & Recognition
          </p>
          <h2
            id="achievements-heading"
            className="headline-balance mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#07070B] dark:text-white"
          >
            Achievements forged through teamwork, execution, and discipline.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
            Verified honors across hackathons, engineering bootcamps, and institutional leadership.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {achievements.map((ach) => {
            const cleanedHighlights = cleanDisplayList(ach.highlights);
            const tierLabel = TIER_LABELS[ach.recognitionTier] || 'Milestone';
            return (
              <article
                key={ach.id}
                className="hud-reticle border border-zinc-200 dark:border-[#FF1E38]/35 bg-white dark:bg-[#0B0B10] p-6 sm:p-7 flex flex-col justify-between transition-all hover:border-[#FF1E38] hover:shadow-[0_0_24px_rgba(255,30,56,0.16)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-mono-hud text-[11px] uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] font-semibold">
                      <Trophy className="h-3.5 w-3.5" />
                      <span>{tierLabel}</span>
                    </span>
                    <span className="font-mono-hud text-[11px] text-zinc-500 dark:text-zinc-400">
                      {ach.eventOrIssuer}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-xl font-bold text-[#07070B] dark:text-white">
                    {ach.title}
                  </h3>

                  {ach.teamContext && (
                    <p className="mt-1 font-mono-hud text-xs text-[#E60023] dark:text-[#FF1E38]">
                      {ach.teamContext}
                    </p>
                  )}

                  <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {ach.description}
                  </p>
                </div>

                {cleanedHighlights.length > 0 && (
                  <div className="mt-6 border-t border-zinc-100 dark:border-white/10 pt-4">
                    <p className="font-mono-hud text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Key Qualities Demonstrated
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {cleanedHighlights.map((hl) => (
                        <span
                          key={hl}
                          className="border border-zinc-200 dark:border-white/15 bg-[#F5F5F8] dark:bg-[#050507] px-2 py-0.5 font-mono-hud text-[11px] text-zinc-700 dark:text-zinc-200"
                        >
                          {hl}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* =================================================================== */}
      {/* Leadership, Community & Industry Experience Section */}
      {/* =================================================================== */}
      <section
        id="leadership"
        aria-labelledby="leadership-heading"
        className="mx-auto max-w-[1360px] px-5 sm:px-8 scroll-mt-20"
      >
        <div className="max-w-3xl">
          <p className="font-mono-hud text-xs uppercase tracking-[0.16em] text-[#E60023] dark:text-[#FF1E38] font-semibold">
            Leadership, Community & Experience
          </p>
          <h2
            id="leadership-heading"
            className="headline-balance mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#07070B] dark:text-white"
          >
            Leading councils, representing communities, and building in the field.
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Leadership Roles (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 font-mono-hud text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              <Users className="h-4 w-4 text-[#FF1E38]" />
              <span>Student Governance & Campus Representation</span>
            </div>

            {leadershipRoles.map((role) => {
              const cleanedResponsibilities = cleanDisplayList(role.responsibilities);
              const cleanedHighlights = cleanDisplayList(role.highlights);
              const cleanedStartDate = cleanDisplayText(role.startDate) || 'Current';
              const cleanedEndDate = cleanDisplayText(role.endDate) || 'Present';

              return (
                <article
                  key={role.id}
                  className="border border-zinc-200 dark:border-[#FF1E38]/35 bg-white dark:bg-[#0B0B10] p-6 sm:p-7 transition-colors hover:border-[#FF1E38]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="font-mono-hud text-[11px] uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] font-semibold">
                        {role.roleType}
                      </span>
                      <h3 className="mt-1 font-display text-xl font-bold text-[#07070B] dark:text-white">
                        {role.position}
                      </h3>
                      <p className="font-mono-hud text-xs text-zinc-600 dark:text-zinc-300">
                        {role.organization}
                      </p>
                    </div>
                    <span className="border border-[#FF1E38]/50 bg-[#FF1E38]/12 px-2.5 py-1 font-mono-hud text-[11px] uppercase tracking-wider text-[#E60023] dark:text-white">
                      {role.isCurrent ? 'Active Role' : `${cleanedStartDate} – ${cleanedEndDate}`}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {role.description}
                  </p>

                  {cleanedResponsibilities.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      <p className="font-mono-hud text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Key Responsibilities
                      </p>
                      <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                        {cleanedResponsibilities.map((r) => (
                          <li key={r} className="flex items-start gap-2">
                            <span className="text-[#FF1E38]">·</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {cleanedHighlights.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-1.5 border-t border-zinc-100 dark:border-white/10 pt-4">
                      {cleanedHighlights.map((hl) => (
                        <span
                          key={hl}
                          className="border border-zinc-200 dark:border-white/15 bg-[#F5F5F8] dark:bg-[#050507] px-2.5 py-1 font-mono-hud text-[11px] text-zinc-700 dark:text-zinc-200"
                        >
                          {hl}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Industry Internship & Certifications (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2 font-mono-hud text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              <Briefcase className="h-4 w-4 text-[#FF1E38]" />
              <span>Industry Experience & Internship</span>
            </div>

            {experiences.map((exp) => {
              const cleanedStartDate = cleanDisplayText(exp.startDate) || 'Current';
              const cleanedEndDate = cleanDisplayText(exp.endDate) || 'Present';
              const cleanedResponsibilities = cleanDisplayList(exp.responsibilities);
              const cleanedSkillsUsed = cleanDisplayList(exp.skillsUsed);

              return (
                <article
                  key={exp.id}
                  className="border border-zinc-200 dark:border-white/25 bg-white dark:bg-[#0B0B10] p-6 sm:p-7 transition-colors hover:border-[#FF1E38]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="font-mono-hud text-[11px] uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] font-semibold">
                        {exp.employmentType}
                      </span>
                      <h3 className="mt-1 font-display text-xl font-bold text-[#07070B] dark:text-white">
                        {exp.position} — {exp.organization}
                      </h3>
                    </div>
                    <span className="border border-white/35 bg-white/10 px-2.5 py-1 font-mono-hud text-[11px] uppercase tracking-wider text-[#07070B] dark:text-white">
                      {exp.isCurrent ? 'Current' : `${cleanedStartDate} – ${cleanedEndDate}`}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {exp.description}
                  </p>

                  {cleanedResponsibilities.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      <p className="font-mono-hud text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Responsibilities
                      </p>
                      <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                        {cleanedResponsibilities.map((r) => (
                          <li key={r} className="flex items-start gap-2">
                            <span className="text-[#FF1E38]">·</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {cleanedSkillsUsed.length > 0 && (
                    <div className="mt-5 border-t border-zinc-100 dark:border-white/10 pt-4">
                      <p className="font-mono-hud text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Applied Stack & Focus
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {cleanedSkillsUsed.map((sk) => (
                          <span
                            key={sk}
                            className="border border-zinc-200 dark:border-white/15 bg-[#F5F5F8] dark:bg-[#050507] px-2.5 py-1 font-mono-hud text-[11px] text-zinc-700 dark:text-zinc-200"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {/* Certifications & Continuous Learning */}
            {certifications.length > 0 && (
              <div className="border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-6">
                <div className="flex items-center gap-2 font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38]">
                  <Award className="h-4 w-4" />
                  <span>Certifications & Continuous Learning</span>
                </div>
                <div className="mt-4 space-y-4">
                  {certifications.map((cert) => {
                    const cleanedSkillsCovered = cleanDisplayList(cert.skillsCovered);
                    return (
                      <div
                        key={cert.id}
                        className="border-t border-zinc-100 dark:border-white/10 pt-3 first:border-t-0 first:pt-0"
                      >
                        <h4 className="font-display text-sm font-bold text-[#07070B] dark:text-white">
                          {cert.title}
                        </h4>
                        <p className="font-mono-hud text-xs text-zinc-500 dark:text-zinc-400">
                          {cert.issuer} · {cert.issueDate}
                        </p>
                        {cleanedSkillsCovered.length > 0 && (
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                            {cleanedSkillsCovered.join(' · ')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chronological Journey Timeline */}
        {timelineEvents.length > 0 && (
          <div className="mt-16 border-t border-zinc-200 dark:border-[#FF1E38]/25 pt-12">
            <div className="flex items-center gap-2 font-mono-hud text-xs uppercase tracking-[0.15em] text-[#E60023] dark:text-[#FF1E38] font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Chronological Trajectory</span>
            </div>
            <h3 className="mt-2 font-display text-2xl font-bold text-[#07070B] dark:text-white">
              The Journey So Far
            </h3>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {timelineEvents.map((ev, index) => (
                <div
                  key={ev.id}
                  className="border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-5 flex flex-col justify-between transition-colors hover:border-[#FF1E38]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 font-mono-hud text-[11px]">
                      <span className="text-[#E60023] dark:text-[#FF1E38] font-semibold uppercase">
                        0{index + 1} · {ev.category}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400">{ev.dateLabel}</span>
                    </div>
                    <h4 className="mt-2.5 font-display text-base font-bold text-[#07070B] dark:text-white">
                      {ev.title}
                    </h4>
                    <p className="mt-0.5 font-mono-hud text-xs text-zinc-500 dark:text-zinc-400">
                      {ev.organization}
                    </p>
                    <p className="mt-2.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {ev.summary}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 font-mono-hud text-[10px] uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38]">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified Milestone</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
