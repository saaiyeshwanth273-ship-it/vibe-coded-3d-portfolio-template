import React, { useMemo, useState } from 'react';
import { Cpu, Network, Sparkles, Terminal } from 'lucide-react';
import { AiCategory, AiModelItem, SkillItem } from '../types/portfolio.ts';
import { soundEngine } from '../utils/soundEffects.ts';

interface SkillsPlaygroundSectionProps {
  skills: SkillItem[];
  aiCategories: AiCategory[];
  aiModels: AiModelItem[];
}

export const SkillsPlaygroundSection: React.FC<SkillsPlaygroundSectionProps> = ({
  skills,
  aiCategories,
  aiModels,
}) => {
  const [skillCategoryFilter, setSkillCategoryFilter] = useState<string>('All');
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(
    () => skills[0]?.name || 'Python',
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    () => aiCategories[0]?.id || null,
  );
  const [playgroundView, setPlaygroundView] = useState<'category' | 'constellation'>('category');

  const skillCategories = useMemo(() => {
    const cats = Array.from(new Set(skills.map((s) => s.category)));
    return ['All', ...cats];
  }, [skills]);

  const filteredSkills = useMemo(() => {
    if (skillCategoryFilter === 'All') return skills;
    return skills.filter((s) => s.category === skillCategoryFilter);
  }, [skills, skillCategoryFilter]);

  const activeSkill =
    skills.find((s) => s.name === selectedSkillName) || filteredSkills[0] || skills[0] || null;

  // Deterministic constellation node positions for SVG network visualization
  const constellationNodes = useMemo(() => {
    return skills.map((skill, idx) => {
      const total = Math.max(skills.length, 1);
      const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
      const rx = 34;
      const ry = 32;
      const x = 50 + Math.cos(angle) * rx;
      const y = 50 + Math.sin(angle) * ry;
      return {
        skill,
        x,
        y,
      };
    });
  }, [skills]);

  const nodeLookup = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const n of constellationNodes) {
      map.set(n.skill.name.toLowerCase(), { x: n.x, y: n.y });
    }
    return map;
  }, [constellationNodes]);

  const activeCategory =
    aiCategories.find((c) => c.id === selectedCategoryId) || aiCategories[0] || null;

  const modelsForActiveCategory = useMemo(() => {
    if (!activeCategory) return [];
    return aiModels.filter((m) => m.categoryId === activeCategory.id);
  }, [aiModels, activeCategory]);

  return (
    <div className="border-t border-zinc-200 dark:border-[#FF1E38]/25 bg-white/50 dark:bg-[#08080D]/80">
      <div className="mx-auto max-w-[1360px] px-5 py-16 sm:px-8 sm:py-24 space-y-24">
        {/* SECTION 3: INTERACTIVE TECHNICAL SKILLS CONSTELLATION */}
        <section id="skills" aria-labelledby="skills-heading" className="scroll-mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 dark:border-[#FF1E38]/25 pb-6">
            <div>
              <p className="font-mono-hud text-xs uppercase tracking-[0.16em] text-[#E60023] dark:text-[#FF1E38] font-semibold">
                Connected Capabilities
              </p>
              <h2
                id="skills-heading"
                className="headline-balance mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#07070B] dark:text-white"
              >
                Technical Skills & Engineering Stack
              </h2>
            </div>

            {/* Category Filter Tabs */}
            <div role="tablist" aria-label="Skill Categories" className="flex flex-wrap gap-2">
              {skillCategories.map((cat) => {
                const active = skillCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      soundEngine.playClick();
                      setSkillCategoryFilter(cat);
                    }}
                    className={`border px-3 py-1.5 font-mono-hud text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      active
                        ? 'border-[#FF1E38] bg-[#FF1E38] text-white font-semibold shadow-[0_0_16px_rgba(255,30,56,0.45)]'
                        : 'border-zinc-300 dark:border-white/20 bg-white dark:bg-[#0B0B10] text-zinc-700 dark:text-zinc-300 hover:border-[#FF1E38]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Interactive Node Constellation Diagram (7 Columns) */}
            <div className="lg:col-span-7 border border-zinc-200 dark:border-[#FF1E38]/30 bg-white dark:bg-[#0B0B10] p-5 sm:p-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-white/10">
                <span className="inline-flex items-center gap-2 font-mono-hud text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  <Network className="h-3.5 w-3.5 text-[#FF1E38]" />
                  <span>Skill Relationship Graph (Click a node to inspect)</span>
                </span>
                <span className="font-mono-hud text-xs text-zinc-500 dark:text-zinc-400">
                  {filteredSkills.length} Active Nodes
                </span>
              </div>

              <div className="relative mt-4 h-[340px] sm:h-[380px] w-full bg-[#F5F5F8] dark:bg-[#050507] border border-zinc-200 dark:border-[#FF1E38]/25 overflow-hidden">
                {/* SVG Edges Connecting Related Skills (Red & White Neon) */}
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full pointer-events-none"
                >
                  {constellationNodes.map((source) =>
                    (source.skill.connectedTo || []).map((targetName) => {
                      const targetPos = nodeLookup.get(targetName.toLowerCase());
                      if (!targetPos) return null;
                      const isHighlighted =
                        activeSkill &&
                        (activeSkill.name.toLowerCase() === source.skill.name.toLowerCase() ||
                          activeSkill.name.toLowerCase() === targetName.toLowerCase());
                      return (
                        <line
                          key={`${source.skill.id}-${targetName}`}
                          x1={source.x}
                          y1={source.y}
                          x2={targetPos.x}
                          y2={targetPos.y}
                          stroke={isHighlighted ? '#FF1E38' : '#FFFFFF'}
                          strokeWidth={isHighlighted ? '0.68' : '0.32'}
                          strokeOpacity={isHighlighted ? '0.95' : '0.26'}
                          strokeDasharray={isHighlighted ? undefined : '1.5 1.5'}
                        />
                      );
                    }),
                  )}
                </svg>

                {/* Interactive Skill Nodes */}
                {constellationNodes.map(({ skill, x, y }) => {
                  const isVisible =
                    skillCategoryFilter === 'All' || skill.category === skillCategoryFilter;
                  const isSelected = activeSkill?.id === skill.id;
                  const isConnected =
                    activeSkill &&
                    ((activeSkill.connectedTo || []).some(
                      (c) => c.toLowerCase() === skill.name.toLowerCase(),
                    ) ||
                      (skill.connectedTo || []).some(
                        (c) => c.toLowerCase() === activeSkill.name.toLowerCase(),
                      ));

                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playSelect();
                        setSelectedSkillName(skill.name);
                      }}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      className={`hud-reticle -translate-x-1/2 -translate-y-1/2 absolute px-2.5 py-1.5 font-mono-hud text-xs transition-all cursor-pointer max-w-[165px] truncate ${
                        !isVisible ? 'opacity-25' : 'opacity-100'
                      } ${
                        isSelected
                          ? 'z-20 bg-[#FF1E38] text-white font-bold border border-white shadow-[0_0_18px_rgba(255,30,56,0.65)]'
                          : isConnected
                            ? 'z-10 bg-white dark:bg-[#14141D] text-[#E60023] dark:text-[#FF1E38] border border-[#FF1E38]/75 font-semibold'
                            : 'z-10 bg-white/95 dark:bg-[#0B0B10]/95 text-[#07070B] dark:text-white border border-zinc-300 dark:border-white/25 hover:border-[#FF1E38]'
                      }`}
                    >
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Skill Detail & Structured Directory (5 Columns) */}
            <div className="lg:col-span-5 space-y-5">
              {activeSkill && (
                <div className="hud-reticle border border-[#FF1E38]/55 bg-white dark:bg-[#0B0B10] p-6 shadow-[0_0_24px_rgba(255,30,56,0.12)]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] font-semibold">
                      {activeSkill.category}
                    </span>
                    <Terminal className="h-4 w-4 text-[#FF1E38]" />
                  </div>
                  <h3 className="mt-2 font-display text-2xl font-bold text-[#07070B] dark:text-white">
                    {activeSkill.name}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {activeSkill.description}
                  </p>
                  {activeSkill.connectedTo && activeSkill.connectedTo.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/10 font-mono-hud text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="uppercase tracking-wider opacity-75">Connected to: </span>
                      <span className="text-[#07070B] dark:text-white">
                        {activeSkill.connectedTo.join(' · ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Structured List of All Filtered Skills */}
              <div className="border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#0B0B10] divide-y divide-zinc-100 dark:divide-white/10">
                {filteredSkills.map((skill) => {
                  const selected = activeSkill?.id === skill.id;
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedSkillName(skill.name);
                      }}
                      className={`w-full px-5 py-3.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#FF1E38]/12'
                          : 'hover:bg-zinc-50 dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <div>
                        <p className="font-display text-sm font-semibold text-[#07070B] dark:text-white">
                          {skill.name}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1">
                          {skill.description}
                        </p>
                      </div>
                      <span className="font-mono-hud text-[11px] uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] shrink-0">
                        {skill.category === 'Programming Languages' ? 'Language' : 'AI Craft'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: THE AI PLAYGROUND (Model-Agnostic 12-Category Ecosystem) */}
        <section id="playground" aria-labelledby="playground-heading" className="scroll-mt-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-zinc-200 dark:border-[#FF1E38]/25 pb-6">
            <div className="max-w-2xl">
              <p className="font-mono-hud text-xs uppercase tracking-[0.16em] text-[#E60023] dark:text-[#FF1E38] font-semibold">
                Model-Agnostic Exploration
              </p>
              <h2
                id="playground-heading"
                className="headline-balance mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#07070B] dark:text-white"
              >
                The AI Playground
              </h2>
              <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                A living, model-agnostic map of AI model families I actively explore, prompt,
                experiment with, and build applications around—structured across {aiCategories.length}{' '}
                specialized domains.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setPlaygroundView('category');
                }}
                className={`border px-3.5 py-2 font-mono-hud text-xs uppercase tracking-wider cursor-pointer transition-all ${
                  playgroundView === 'category'
                    ? 'border-[#FF1E38] bg-[#FF1E38] text-white font-semibold shadow-[0_0_16px_rgba(255,30,56,0.45)]'
                    : 'border-zinc-300 dark:border-white/20 bg-white dark:bg-[#0B0B10] text-zinc-700 dark:text-zinc-300'
                }`}
              >
                Category Explorer
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setPlaygroundView('constellation');
                }}
                className={`border px-3.5 py-2 font-mono-hud text-xs uppercase tracking-wider cursor-pointer transition-all ${
                  playgroundView === 'constellation'
                    ? 'border-[#FF1E38] bg-[#FF1E38] text-white font-semibold shadow-[0_0_16px_rgba(255,30,56,0.45)]'
                    : 'border-zinc-300 dark:border-white/20 bg-white dark:bg-[#0B0B10] text-zinc-700 dark:text-zinc-300'
                }`}
              >
                All 12 Ecosystems
              </button>
            </div>
          </div>

          {playgroundView === 'category' ? (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
              {/* 12 Category Tabs (4 Columns) */}
              <div
                role="tablist"
                aria-label="AI Model Categories"
                className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2"
              >
                {aiCategories.map((cat, idx) => {
                  const isActive = activeCategory?.id === cat.id;
                  const modelCount = aiModels.filter((m) => m.categoryId === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => {
                        soundEngine.playSelect();
                        setSelectedCategoryId(cat.id);
                      }}
                      className={`flex items-center justify-between gap-2 border px-4 py-3 text-left transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#FF1E38] bg-[#FF1E38] text-white shadow-[0_0_18px_rgba(255,30,56,0.45)]'
                          : 'border-zinc-200 dark:border-white/15 bg-white dark:bg-[#0B0B10] text-[#07070B] dark:text-white hover:border-[#FF1E38]/60'
                      }`}
                    >
                      <div className="min-w-0">
                        <span
                          className={`block font-mono-hud text-[10px] uppercase tracking-widest ${
                            isActive ? 'text-white/85' : 'text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="font-display text-sm font-semibold truncate block">
                          {cat.name}
                        </span>
                      </div>
                      <span
                        className={`font-mono-hud text-xs shrink-0 ${
                          isActive ? 'text-white font-bold' : 'text-[#E60023] dark:text-[#FF1E38]'
                        }`}
                      >
                        {modelCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Category Details & Model Cards (8 Columns) */}
              <div className="lg:col-span-8 space-y-5">
                {activeCategory && (
                  <div className="border border-zinc-200 dark:border-[#FF1E38]/35 bg-white dark:bg-[#0B0B10] p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] font-semibold">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Active Domain</span>
                      </span>
                      <span className="font-mono-hud text-xs text-zinc-500 dark:text-zinc-400">
                        {modelsForActiveCategory.length} Tracked Models
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-2xl font-bold text-[#07070B] dark:text-white">
                      {activeCategory.name}
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-300">
                      {activeCategory.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {modelsForActiveCategory.map((model) => (
                    <article
                      key={model.id}
                      className="hud-reticle border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-5 flex flex-col justify-between hover:border-[#FF1E38]/60 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono-hud text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            {model.providerOrFamily}
                          </span>
                          <span className="font-mono-hud text-[11px] uppercase tracking-wider font-semibold text-[#E60023] dark:text-[#FF1E38]">
                            {model.experienceLevel}
                          </span>
                        </div>
                        <h4 className="mt-2 font-display text-lg font-bold text-[#07070B] dark:text-white">
                          {model.name}
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                          {model.experienceNotes}
                        </p>
                      </div>

                      {model.useCases && model.useCases.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/10 font-mono-hud text-xs text-zinc-500 dark:text-zinc-400">
                          {model.useCases.join(' · ')}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Matrix / Constellation Overview of All 12 Categories */
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {aiCategories.map((cat) => {
                const catModels = aiModels.filter((m) => m.categoryId === cat.id);
                return (
                  <div
                    key={cat.id}
                    className="border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-6 flex flex-col justify-between hover:border-[#FF1E38]/60 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Cpu className="h-4 w-4 text-[#FF1E38]" />
                        <span className="font-mono-hud text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          {catModels.length} Models
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-lg font-bold text-[#07070B] dark:text-white">
                        {cat.name}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                        {cat.description}
                      </p>

                      <ul className="mt-4 space-y-2 border-t border-zinc-100 dark:border-white/10 pt-3">
                        {catModels.map((m) => (
                          <li
                            key={m.id}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="font-medium text-[#07070B] dark:text-white">
                              {m.name}
                            </span>
                            <span className="font-mono-hud text-[11px] text-[#E60023] dark:text-[#FF1E38]">
                              {m.experienceLevel}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedCategoryId(cat.id);
                        setPlaygroundView('category');
                      }}
                      className="mt-5 w-full border border-zinc-200 dark:border-white/20 py-2 font-mono-hud text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-200 hover:border-[#FF1E38] hover:text-[#FF1E38] cursor-pointer"
                    >
                      Inspect Category
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
