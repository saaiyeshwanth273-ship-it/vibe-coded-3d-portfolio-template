import React from 'react';
import { PublicPortfolioPayload } from '../types/portfolio.ts';
import { buildCompleteCvSkillGroups } from '../utils/cvSkillAggregation.ts';

interface VerifiedCurriculumVitaeSheetProps {
  resumeUrl: string;
  portfolio?: PublicPortfolioPayload | null;
}

export const VerifiedCurriculumVitaeSheet: React.FC<VerifiedCurriculumVitaeSheetProps> = ({
  resumeUrl,
  portfolio,
}) => {
  if (resumeUrl.startsWith('/api/uploads/')) {
    return (
      <iframe
        src={resumeUrl}
        title="Verified Curriculum Vitae — Alex Rivera"
        className="w-full h-[74vh] border border-black/15 dark:border-[#FF1E38]/30 bg-white"
      />
    );
  }

  const profile = portfolio?.profile;
  const fullName = profile?.fullName || 'Alex Rivera';
  const subheading =
    profile?.subheading ||
    'AI Enthusiast · Prompt Engineer · Vibe Coder · Developer · Student Leader';
  const contactEmail =
    profile?.showEmailPublicly !== false && profile?.contactEmail
      ? profile.contactEmail
      : 'alex.rivera@example.com';
  const linkedinUrl =
    portfolio?.socialLinks?.find((s) => s.platform.toLowerCase().includes('linkedin'))?.url ||
    'https://www.linkedin.com/in/alex-rivera-dev/';
  const githubUrl =
    portfolio?.socialLinks?.find((s) => s.platform.toLowerCase().includes('github'))?.url ||
    'https://github.com/your-username';

  const skillsList = portfolio?.skills || [
    { name: 'Python', category: 'Programming Languages' },
    { name: 'C++', category: 'Programming Languages' },
    { name: 'HTML', category: 'Programming Languages' },
    { name: 'CSS', category: 'Programming Languages' },
    { name: 'Prompt Engineering', category: 'AI & Productivity' },
    { name: 'AI-assisted development', category: 'AI & Productivity' },
    { name: 'Vibe Coding', category: 'AI & Productivity' },
    { name: 'Working with AI development tools and models', category: 'AI & Productivity' },
  ];

  const projectsList = portfolio?.projects || [
    {
      title: 'NexusRAG',
      tagline: 'Complex regulations in. Clear actions out.',
      category: 'AI / Regulatory Compliance Engine',
      status: 'Active Project',
      developmentDate: '2025 – Present',
      description:
        'An AI-powered legal and regulatory compliance auditor designed to help small businesses, startups, HR teams, and compliance professionals understand regulatory requirements, identify potential compliance gaps, and convert complex legal requirements into actionable steps.',
      solution:
        'Combines a verified regulatory knowledge base with hybrid retrieval (semantic search + BM25 keyword retrieval), Gemma-powered reasoning, citation validation, and LoRA / QLoRA / PEFT domain adaptation concepts.',
      techStack: [
        'Python',
        'Gemma',
        'Retrieval-Augmented Generation (RAG)',
        'Semantic Vector Search',
        'BM25 Keyword Retrieval',
        'LoRA / QLoRA / PEFT Concepts',
      ],
      aiModelsUsed: ['Gemma', 'Semantic Embedding Retrieval', 'BM25 Lexical Retriever'],
      githubUrl: 'https://github.com/your-username/nexusrag-engine',
    },
    {
      title: 'AeroSense — Metropolitan Institute of Technology Hackathon',
      tagline: 'Intelligent water quality monitoring and early contamination detection.',
      category: 'Metropolitan Institute of Technology Hackathon · Smart Systems',
      status: 'Hackathon Build',
      developmentDate: 'Metropolitan Institute of Technology Hackathon',
      description:
        'Real-time water quality monitoring and anomaly detection system built during the Metropolitan Institute of Technology Hackathon to track critical water parameters (pH, turbidity, TDS, temperature) and surface early contamination alerts.',
      solution:
        'Continuously ingests multi-sensor water telemetry and evaluates parameter drift against potable water safety bounds in real time.',
      techStack: [
        'Python',
        'IoT Water Sensors',
        'Anomaly Detection',
        'Real-Time Telemetry',
        'Git/GitHub',
      ],
      aiModelsUsed: ['Anomaly Detection Engine', 'Telemetry Diagnostic Pipeline'],
      githubUrl: 'https://github.com/your-username/aerosense-telemetry',
    },
    {
      title: 'Vibe Coded 3D Portfolio Universe',
      tagline: 'Interactive 3D circuit command hub & full-stack digital universe.',
      category: 'Full-Stack Web & 3D Interactive',
      status: 'Active Build',
      developmentDate: '2025 – Present',
      description:
        'A high-performance interactive 3D digital portfolio universe and full-stack control plane engineered from scratch using Three.js, React, TypeScript, Tailwind CSS, PostgreSQL, and Express.',
      solution:
        'Engineered an interactive 3D isometric circuit command floor with custom procedural silicon die textures, real-time camera transitions, dynamic vector PDF resume generation, role-based PostgreSQL persistence, and zero-trust authentication.',
      techStack: [
        'React',
        'TypeScript',
        'Three.js',
        'Tailwind CSS',
        'Node.js & Express',
        'PostgreSQL',
        'Vibe Coding',
      ],
      aiModelsUsed: ['AI-Assisted Architecture', 'Vibe Coding Workflows', 'Claude & Gemini'],
      githubUrl: 'https://github.com/your-username/vibe-coded-3d-portfolio-template',
    },
  ];

  const experiencesList = portfolio?.experiences || [
    {
      position: 'Intern',
      organization: 'Acme AI Labs',
      startDate: 'Current',
      endDate: 'Present',
      description:
        'Currently interning at Acme AI Labs, applying software engineering, AI exploration, and collaborative problem-solving in an active industry environment.',
      skillsUsed: ['Python', 'AI-Assisted Development', 'Software Development'],
    },
  ];

  const leadershipList = portfolio?.leadershipRoles || [
    {
      position: 'Vice President — Student Engineering Council',
      organization: 'University Engineering Council',
      startDate: 'Current',
      endDate: 'Present',
      description:
        'Serving as Vice President of the University Engineering Council, contributing to student governance, peer representation, and collaborative community involvement.',
    },
    {
      position: 'Campus Ambassador',
      organization: 'OpenTech Developer Community',
      startDate: 'Current',
      endDate: 'Present',
      description:
        'Serving as Campus Ambassador at OpenTech Developer Community, bridging student learners with technical programs and campus initiatives.',
    },
  ];

  const achievementsList = portfolio?.achievements || [
    {
      title: 'School of Computing & AI Bootcamp — Performance Medal',
      eventOrIssuer: 'School of Computing & AI Bootcamp',
      teamContext: 'Individual Recognition',
      description:
        'Received a medal for performance during the School of Computing & AI Bootcamp, recognizing dedication, problem-solving, and consistent execution.',
    },
    {
      title: 'Hacktoberfest — Second Place',
      eventOrIssuer: 'Hacktoberfest · Conducted by School of Computing & AI',
      teamContext: 'Team of 4 Members (Same Squad)',
      description:
        'Secured second place at Hacktoberfest conducted by School of Computing & AI alongside a four-member team, highlighting collaborative engineering and execution.',
    },
    {
      title: 'Metropolitan Institute of Technology Hackathon — Finalist',
      eventOrIssuer: 'Metropolitan Institute of Technology Hackathon',
      teamContext: 'Led a Team of 4 Members',
      description:
        'Reached the finalist stage at the Metropolitan Institute of Technology Hackathon while leading a team of four members under tight time constraints.',
    },
  ];

  const aiCategories =
    portfolio?.aiCategories && portfolio.aiCategories.length > 0
      ? portfolio.aiCategories
      : [
          { name: 'Large Language Models' },
          { name: 'Multimodal Models' },
          { name: 'Image Generation Models' },
          { name: 'Video Generation Models' },
          { name: 'Speech & Audio Models' },
          { name: 'Coding Models' },
          { name: 'Embedding Models' },
          { name: 'Vision Models' },
          { name: 'Open-Source Models' },
          { name: 'Agentic AI Systems' },
          { name: 'Reasoning Models' },
          { name: 'Small Language Models' },
        ];
  const aiModels =
    portfolio?.aiModels && portfolio.aiModels.length > 0
      ? portfolio.aiModels
      : [
          { name: 'Gemini' },
          { name: 'GPT' },
          { name: 'Claude' },
          { name: 'Gemma' },
          { name: 'Llama' },
          { name: 'DeepSeek' },
          { name: 'Qwen' },
          { name: 'Mistral' },
          { name: 'Gemini Multimodal' },
          { name: 'Flux' },
          { name: 'Stable Diffusion' },
          { name: 'Veo' },
          { name: 'Whisper' },
          { name: 'DeepSeek Coder & Qwen Coder' },
          { name: 'Semantic Vector Embeddings' },
          { name: 'PaliGemma & Vision-Language' },
          { name: 'Citation-Validated RAG Workflows' },
          { name: 'DeepSeek-R1 & Thinking Models' },
          { name: 'Gemma 2B / 9B & Compact SLMs' },
        ];
  const certificationsList = portfolio?.certifications || [];
  const exploringList =
    portfolio?.exploringItems && portfolio.exploringItems.length > 0
      ? portfolio.exploringItems
      : [
          { title: 'AI and Machine Learning' },
          { title: 'Prompt Engineering' },
          { title: 'Vibe Coding' },
          { title: 'Software Development' },
          { title: 'Product Experimentation' },
          { title: 'Leadership and Collaboration' },
        ];
  const aboutThemesList =
    portfolio?.aboutThemes && portfolio.aboutThemes.length > 0
      ? portfolio.aboutThemes
      : [
          { title: 'Curiosity', subtitle: 'Discovering new ways to think and build with AI' },
          { title: 'Creation', subtitle: 'Turning ideas into working software products' },
          { title: 'Leadership', subtitle: 'Representing peers and leading collaborative teams' },
        ];
  const hasSmartwatchProject = projectsList.some((p) =>
    p.title.toLowerCase().includes('smartwatch'),
  );
  const hasSplLeadership = leadershipList.some((l) =>
    l.position.toLowerCase().includes('school pupil'),
  );

  const skillGroups = buildCompleteCvSkillGroups({
    skills: skillsList,
    projects: projectsList,
    experiences: experiencesList,
    aiModels,
    certifications: certificationsList,
  });

  return (
    <article
      aria-label="Verified Curriculum Vitae — Alex Rivera"
      data-testid="verified-cv-sheet"
      className="mx-auto max-w-[860px] border border-[#FF1E38]/40 bg-white dark:bg-[#08090E] text-[#050507] dark:text-[#FFFFFF] shadow-[0_0_36px_rgba(255,30,56,0.16)] font-sans overflow-hidden relative"
    >
      {/* Top Dual-Tone Architectural Micro-Bar */}
      <div className="flex h-1.5 w-full" aria-hidden="true">
        <div className="w-2/3 bg-[#090B10] dark:bg-white/90" />
        <div className="w-1/3 bg-[#FF1E38]" />
      </div>

      {/* Bespoke Obsidian & Crimson Executive Masthead */}
      <header className="bg-[#0B0E17] text-white border-b-2 border-[#FF1E38] px-6 sm:px-10 pt-7 pb-5 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* AR Geometric Monogram Crest */}
            <div
              aria-hidden="true"
              className="flex flex-col items-center justify-center w-14 h-14 border border-[#FF1E38] bg-[#141826] shrink-0 shadow-[0_0_16px_rgba(255,30,56,0.25)]"
            >
              <span className="font-display text-base font-extrabold tracking-wider text-white leading-none">
                AR
              </span>
              <span className="w-8 h-[1px] bg-[#FF1E38] my-1" />
              <span className="font-mono text-[9px] font-bold tracking-widest text-[#FF4D64] leading-none">
                AI // ML
              </span>
            </div>

            <div>
              <h4 className="font-display text-2xl sm:text-[28px] font-extrabold tracking-tight text-white uppercase leading-tight">
                {fullName}
              </h4>
              <p className="mt-1 text-xs sm:text-[13.5px] font-semibold text-[#FF6B7E] tracking-wide">
                {subheading}
              </p>
            </div>
          </div>

          <div className="self-start sm:self-center shrink-0 border border-[#FF1E38]/70 bg-[#141826] px-3 py-1.5 text-[11px] font-mono font-bold tracking-widest text-white uppercase">
            B.TECH AI &amp; ML // 2030
          </div>
        </div>

        {/* Interactive Clickable Contact & Profile Command Bar */}
        <div className="mt-5 pt-3.5 border-t border-white/10 flex flex-wrap items-center gap-2.5 text-xs">
          <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-zinc-300 font-medium">
            San Francisco, CA
          </span>

          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#171C2C] hover:bg-[#FF1E38] border border-[#FF1E38]/70 text-white font-semibold transition-colors cursor-pointer"
          >
            <span>Email: {contactEmail}</span>
            <span aria-hidden="true" className="text-[#FF6B7E] group-hover:text-white">↗</span>
          </a>

          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#171C2C] hover:bg-[#FF1E38] border border-[#FF1E38]/70 text-white font-semibold transition-colors cursor-pointer"
          >
            <span>LinkedIn: View Profile</span>
            <span aria-hidden="true">↗</span>
          </a>

          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#171C2C] hover:bg-[#FF1E38] border border-[#FF1E38]/70 text-white font-semibold transition-colors cursor-pointer"
          >
            <span>GitHub: your-username</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <div className="p-6 sm:p-10 space-y-6 text-[13.5px] leading-[1.65] text-zinc-800 dark:text-[#E4E4ED]">
        {/* 01 // PROFILE & EXECUTIVE SUMMARY */}
        <section aria-labelledby="cv-profile">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-zinc-200 dark:border-white/15 relative">
            <span className="px-2 py-0.5 bg-[#0B0E17] dark:bg-[#FF1E38] text-white font-mono text-[11px] font-bold tracking-wider">
              01
            </span>
            <h5
              id="cv-profile"
              className="font-display text-xs sm:text-[13px] font-extrabold tracking-[0.08em] text-[#0B0E17] dark:text-white uppercase"
            >
              PROFILE &amp; EXECUTIVE SUMMARY
            </h5>
          </div>
          <div className="mt-3 pl-3.5 border-l-2 border-[#FF1E38] space-y-1.5">
            <p>
              {profile?.shortIntro ||
                'B.Tech Computer Science (AI/ML) student at Metropolitan Institute of Technology & School of Computing & AI, interning at Acme AI Labs and serving as Vice President of the Student Engineering Council General Council of School of Computing & AI and Campus Ambassador at OpenTech Developer Community. Dedicated to transforming ideas into working AI systems and meaningful software products.'}
            </p>
            <p className="text-zinc-700 dark:text-[#C8C8D8]">
              <strong className="text-[#050507] dark:text-white">Career Direction:</strong>{' '}
              {profile?.careerDirection ||
                'Exploring the intersection of artificial intelligence, software engineering, and human imagination to turn ideas into working digital products.'}
            </p>
            <p className="text-zinc-700 dark:text-[#C8C8D8]">
              <strong className="text-[#050507] dark:text-white">Core Pillars:</strong>{' '}
              {aboutThemesList.map((t) => `${t.title} (${t.subtitle})`).join(' · ')}
            </p>
            <p className="pt-0.5">
              <em className="italic font-semibold text-[#C8001D] dark:text-[#FF4D64]">
                &ldquo;
                {profile?.brandStatement ||
                  "I don't just explore technology. I experiment, build, lead, and turn ideas into experiences."}
                &rdquo;
              </em>
            </p>
          </div>
        </section>

        {/* 02 // EDUCATION */}
        <section aria-labelledby="cv-education">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-zinc-200 dark:border-white/15">
            <span className="px-2 py-0.5 bg-[#0B0E17] dark:bg-[#FF1E38] text-white font-mono text-[11px] font-bold tracking-wider">
              02
            </span>
            <h5
              id="cv-education"
              className="font-display text-xs sm:text-[13px] font-extrabold tracking-[0.08em] text-[#0B0E17] dark:text-white uppercase"
            >
              EDUCATION &amp; ACADEMIC FOUNDATION
            </h5>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-bold text-[#050507] dark:text-white">
              {profile?.education || 'B.Tech Computer Science, Specialization in AI/ML'}
            </p>
            <span className="text-xs font-bold text-[#C8001D] dark:text-[#FF4D64]">
              Expected Graduation: 2030
            </span>
          </div>
          <p className="text-zinc-700 dark:text-[#C8C8D8]">
            {profile?.university || 'Metropolitan Institute of Technology'}, in association with{' '}
            {profile?.institution || 'School of Computing & AI'} | Focus:{' '}
            {profile?.specialization || 'Artificial Intelligence & Machine Learning'}
          </p>
        </section>

        {/* 03 // TECHNICAL SKILLS & AI ECOSYSTEMS */}
        <section aria-labelledby="cv-skills">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-zinc-200 dark:border-white/15">
            <span className="px-2 py-0.5 bg-[#0B0E17] dark:bg-[#FF1E38] text-white font-mono text-[11px] font-bold tracking-wider">
              03
            </span>
            <h5
              id="cv-skills"
              className="font-display text-xs sm:text-[13px] font-extrabold tracking-[0.08em] text-[#0B0E17] dark:text-white uppercase"
            >
              TECHNICAL SKILLS &amp; AI ECOSYSTEMS
            </h5>
          </div>
          <ul className="mt-3 space-y-1.5">
            {skillGroups.map((group) => (
              <li key={group.label} className="flex items-baseline gap-2">
                <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0 translate-y-[-1px]" />
                <div>
                  <strong className="text-[#050507] dark:text-white">{group.label}:</strong>{' '}
                  <span>{group.items.join(', ')}</span>
                </div>
              </li>
            ))}
            {aiCategories.length > 0 && (
              <li className="flex items-baseline gap-2">
                <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0 translate-y-[-1px]" />
                <div>
                  <strong className="text-[#050507] dark:text-white">
                    AI Playground Domains ({aiCategories.length}):
                  </strong>{' '}
                  <span>{aiCategories.map((c) => c.name).join(', ')}</span>
                </div>
              </li>
            )}
          </ul>
        </section>

        {/* 04 // EXPERIENCE & INTERNSHIP */}
        {experiencesList.length > 0 && (
          <section aria-labelledby="cv-experience">
            <div className="flex items-center gap-2.5 pb-1.5 border-b border-zinc-200 dark:border-white/15">
              <span className="px-2 py-0.5 bg-[#0B0E17] dark:bg-[#FF1E38] text-white font-mono text-[11px] font-bold tracking-wider">
                04
              </span>
              <h5
                id="cv-experience"
                className="font-display text-xs sm:text-[13px] font-extrabold tracking-[0.08em] text-[#0B0E17] dark:text-white uppercase"
              >
                EXPERIENCE &amp; INDUSTRY INTERNSHIP
              </h5>
            </div>
            <div className="mt-3 space-y-3">
              {experiencesList.map((exp, idx) => {
                const cleanStart = (exp.startDate || '').replace(/\s*\(Editable in CMS\)/gi, '').trim();
                const period = [cleanStart, exp.endDate || 'Present']
                  .filter(Boolean)
                  .join(' — ');
                return (
                  <div key={`${exp.organization}-${idx}`}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-bold text-[#050507] dark:text-white">
                        {exp.position} — {exp.organization}
                      </p>
                      {period && (
                        <span className="text-xs font-bold text-[#C8001D] dark:text-[#FF4D64]">
                          {period}
                        </span>
                      )}
                    </div>
                    <p className="mt-1">{exp.description}</p>
                    {exp.skillsUsed && exp.skillsUsed.length > 0 && (
                      <p className="mt-1 text-xs text-zinc-700 dark:text-[#C8C8D8]">
                        <strong className="text-[#050507] dark:text-white">Skills Applied:</strong>{' '}
                        {exp.skillsUsed.join(', ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 05 // SIGNATURE PROJECTS & ENGINEERING BUILDS */}
        <section aria-labelledby="cv-projects">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-zinc-200 dark:border-white/15">
            <span className="px-2 py-0.5 bg-[#0B0E17] dark:bg-[#FF1E38] text-white font-mono text-[11px] font-bold tracking-wider">
              05
            </span>
            <h5
              id="cv-projects"
              className="font-display text-xs sm:text-[13px] font-extrabold tracking-[0.08em] text-[#0B0E17] dark:text-white uppercase"
            >
              SIGNATURE PROJECTS &amp; ENGINEERING BUILDS
            </h5>
          </div>
          <div className="mt-3 space-y-4">
            {projectsList.map((proj, idx) => (
              <div key={`${proj.title}-${idx}`} className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-100 dark:bg-white/5 border-l-4 border-[#FF1E38] px-3 py-1.5">
                  <p className="font-bold text-[#050507] dark:text-white">{proj.title}</p>
                  <span className="text-xs font-bold text-[#C8001D] dark:text-[#FF4D64]">
                    {[proj.category, proj.status].filter(Boolean).join(' · ')}
                  </span>
                </div>
                {proj.tagline && (
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 pl-2">
                    {proj.tagline}
                  </p>
                )}
                <ul className="space-y-1 pl-3">
                  <li className="flex items-baseline gap-2">
                    <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0 translate-y-[-1px]" />
                    <span>{proj.description}</span>
                  </li>
                  {proj.solution && (
                    <li className="flex items-baseline gap-2">
                      <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0 translate-y-[-1px]" />
                      <span>
                        <strong className="text-[#050507] dark:text-white">Architecture &amp; Solution:</strong>{' '}
                        {proj.solution}
                      </span>
                    </li>
                  )}
                  {proj.techStack && proj.techStack.length > 0 && (
                    <li className="flex items-baseline gap-2">
                      <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0 translate-y-[-1px]" />
                      <span>
                        <strong className="text-[#050507] dark:text-white">Tech Stack:</strong>{' '}
                        {proj.techStack.join(', ')}
                      </span>
                    </li>
                  )}
                  {proj.githubUrl && (
                    <li className="flex items-center gap-2 pt-0.5">
                      <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0" />
                      <strong className="text-[#050507] dark:text-white">GitHub Repository:</strong>{' '}
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#FFF1F2] dark:bg-[#FF1E38]/15 border border-[#FF1E38]/50 text-[#C8001D] dark:text-[#FF6B7E] font-semibold text-xs hover:bg-[#FF1E38] hover:text-white transition-colors"
                      >
                        <span>{proj.githubUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            ))}

            {!hasSmartwatchProject && (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-100 dark:bg-white/5 border-l-4 border-[#FF1E38] px-3 py-1.5">
                  <p className="font-bold text-[#050507] dark:text-white">
                    Custom Smartwatch (Arduino) — Self-Built Smart Wearable
                  </p>
                  <span className="text-xs font-bold text-[#C8001D] dark:text-[#FF4D64]">
                    Embedded Hardware Build
                  </span>
                </div>
                <ul className="space-y-1 pl-3">
                  <li className="flex items-baseline gap-2">
                    <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0 translate-y-[-1px]" />
                    <span>
                      Designed and built a working smartwatch from scratch using an Arduino dev module,
                      a MAX sensor for heart-rate sensing, and an IMU for motion tracking.
                    </span>
                  </li>
                  <li className="flex items-baseline gap-2">
                    <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0 translate-y-[-1px]" />
                    <span>
                      Engineered two embedded mini-experiences on the device (a Chrome Dino-style
                      runner game and a dice-roll simulator) alongside live heart-rate monitoring and
                      custom firmware logic.
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* 06 // LEADERSHIP & CAMPUS GOVERNANCE */}
        <section aria-labelledby="cv-leadership">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-zinc-200 dark:border-white/15">
            <span className="px-2 py-0.5 bg-[#0B0E17] dark:bg-[#FF1E38] text-white font-mono text-[11px] font-bold tracking-wider">
              06
            </span>
            <h5
              id="cv-leadership"
              className="font-display text-xs sm:text-[13px] font-extrabold tracking-[0.08em] text-[#0B0E17] dark:text-white uppercase"
            >
              LEADERSHIP &amp; CAMPUS GOVERNANCE
            </h5>
          </div>
          <ul className="mt-3 space-y-2">
            {leadershipList.map((role, idx) => {
              const cleanPosition = role.position.replace(/\s*[—–-]+\s*Student Engineering Council$/i, '').trim();
              return (
                <li key={`${role.position}-${idx}`} className="flex items-baseline gap-2">
                  <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0 translate-y-[-1px]" />
                  <div>
                    <strong className="text-[#050507] dark:text-white">
                      {cleanPosition} — {role.organization}
                    </strong>
                    {role.startDate ? (
                      <span className="ml-2 text-xs font-bold text-[#C8001D] dark:text-[#FF4D64]">
                        ({role.startDate} — {role.endDate || 'Present'})
                      </span>
                    ) : null}
                    : {role.description}
                  </div>
                </li>
              );
            })}
            <li className="flex items-baseline gap-2">
              <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0 translate-y-[-1px]" />
              <div>
                <strong className="text-[#050507] dark:text-white">
                  Hackathon Team Lead (4-Member Squad)
                </strong>{' '}
                — Metropolitan Institute of Technology Hackathon &amp; School of Computing & AI Hacktoberfest: Led a four-member collaborative
                squad across competitive engineering builds under tight deadlines.
              </div>
            </li>
            {!hasSplLeadership && (
              <li className="flex items-baseline gap-2">
                <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0 translate-y-[-1px]" />
                <div>
                  <strong className="text-[#050507] dark:text-white">
                    School Pupil Leader (SPL) — Central Science Academy
                  </strong>{' '}
                  <span className="text-xs font-bold text-[#C8001D] dark:text-[#FF4D64]">
                    (2022–2023)
                  </span>{' '}
                  — selected to represent and lead the student body.
                </div>
              </li>
            )}
          </ul>
        </section>

        {/* 07 // ACHIEVEMENTS & RECOGNITION */}
        {achievementsList.length > 0 && (
          <section aria-labelledby="cv-achievements">
            <div className="flex items-center gap-2.5 pb-1.5 border-b border-zinc-200 dark:border-white/15">
              <span className="px-2 py-0.5 bg-[#0B0E17] dark:bg-[#FF1E38] text-white font-mono text-[11px] font-bold tracking-wider">
                07
              </span>
              <h5
                id="cv-achievements"
                className="font-display text-xs sm:text-[13px] font-extrabold tracking-[0.08em] text-[#0B0E17] dark:text-white uppercase"
              >
                ACHIEVEMENTS &amp; COMPETITIVE MILESTONES
              </h5>
            </div>
            <ul className="mt-3 space-y-2">
              {achievementsList.map((ach, idx) => (
                <li key={`${ach.title}-${idx}`} className="flex items-baseline gap-2">
                  <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0 translate-y-[-1px]" />
                  <div>
                    <strong className="text-[#050507] dark:text-white">{ach.title}</strong> —{' '}
                    <span className="font-semibold text-[#C8001D] dark:text-[#FF4D64]">
                      {ach.eventOrIssuer}
                      {ach.teamContext ? ` (${ach.teamContext})` : ''}
                    </span>
                    : {ach.description}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CERTIFICATIONS (When published) */}
        {certificationsList.length > 0 && (
          <section aria-labelledby="cv-certifications">
            <div className="flex items-center gap-2.5 pb-1.5 border-b border-zinc-200 dark:border-white/15">
              <span className="px-2 py-0.5 bg-[#0B0E17] dark:bg-[#FF1E38] text-white font-mono text-[11px] font-bold tracking-wider">
                08
              </span>
              <h5
                id="cv-certifications"
                className="font-display text-xs sm:text-[13px] font-extrabold tracking-[0.08em] text-[#0B0E17] dark:text-white uppercase"
              >
                CERTIFICATIONS &amp; CREDENTIALS
              </h5>
            </div>
            <ul className="mt-3 space-y-1.5">
              {certificationsList.map((cert, idx) => (
                <li key={`${cert.title}-${idx}`} className="flex items-baseline gap-2">
                  <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0 translate-y-[-1px]" />
                  <div>
                    <strong className="text-[#050507] dark:text-white">{cert.title}</strong> — {cert.issuer}
                    {cert.issueDate ? ` (${cert.issueDate})` : ''}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ACTIVE FOCUS, INTERESTS & LANGUAGES */}
        <section aria-labelledby="cv-languages">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-zinc-200 dark:border-white/15">
            <span className="px-2 py-0.5 bg-[#0B0E17] dark:bg-[#FF1E38] text-white font-mono text-[11px] font-bold tracking-wider">
              {certificationsList.length > 0 ? '09' : '08'}
            </span>
            <h5
              id="cv-languages"
              className="font-display text-xs sm:text-[13px] font-extrabold tracking-[0.08em] text-[#0B0E17] dark:text-white uppercase"
            >
              ACTIVE FOCUS, INTERESTS &amp; LANGUAGES
            </h5>
          </div>
          <ul className="mt-3 space-y-1.5">
            {exploringList.length > 0 && (
              <li className="flex items-baseline gap-2">
                <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0 translate-y-[-1px]" />
                <div>
                  <strong className="text-[#050507] dark:text-white">Currently Exploring:</strong>{' '}
                  {exploringList.map((e) => e.title).join(', ')}
                </div>
              </li>
            )}
            <li className="flex items-baseline gap-2">
              <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0 translate-y-[-1px]" />
              <div>
                <strong className="text-[#050507] dark:text-white">Core Interests:</strong>{' '}
                {profile?.currentInterests ||
                  'AI & Machine Learning, Prompt Engineering, Vibe Coding, Software Development, Product Experimentation'}
              </div>
            </li>
            <li className="flex items-baseline gap-2">
              <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#FF1E38] shrink-0 translate-y-[-1px]" />
              <div>
                <strong className="text-[#050507] dark:text-white">Spoken Languages:</strong> Tamil, English
              </div>
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
};
