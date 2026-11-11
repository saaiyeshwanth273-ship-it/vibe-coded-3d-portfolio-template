import { eq } from 'drizzle-orm';
import { withDbContext } from '../db/rls.ts';
import {
  aboutThemes,
  achievements,
  aiCategories,
  aiModels,
  experiences,
  exploringItems,
  leadershipRoles,
  profileSettings,
  projects,
  securitySettings,
  seoSettings,
  skills,
  socialLinks,
  themeSettings,
  timelineEvents,
} from '../db/schema.ts';
import { getOwnerEmail } from '../server/security.ts';

let seedPromise: Promise<void> | null = null;

const VERIFIED_CV_URL = '/assets/aistudio/Alex_Rivera_resume_8bdab9ad.pdf';
const VERIFIED_CV_FILENAME = 'Alex_Rivera_Resume.pdf';

const AQUASENTINEL_PROJECT = {
  slug: 'aquasentinel',
  title: 'AeroSense — Metropolitan Institute of Technology Hackathon',
  tagline: 'Intelligent water quality monitoring and early contamination detection.',
  category: 'Metropolitan Institute of Technology Hackathon · Smart Systems',
  description:
    'Built during the Metropolitan Institute of Technology Hackathon, AeroSense is a real-time water quality monitoring and anomaly detection system engineered to track critical water parameters, detect contamination anomalies early, and surface actionable diagnostic alerts.',
  keyPrinciple:
    'Continuous multi-sensor telemetry coupled with automated anomaly detection turns reactive water testing into proactive safety intelligence.',
  problem:
    'Traditional water quality testing depends on delayed manual lab sampling, leaving campuses and communities blind to sudden turbidity, pH, or contamination spikes between checks.',
  solution:
    'AeroSense continuously ingests water quality sensor telemetry (pH, turbidity, TDS, and temperature), evaluates parameter drift against safety bounds in real time, and generates clear diagnostic status and alert workflows.',
  architecture:
    '1. Multi-Sensor Telemetry Layer: Captures pH, turbidity, total dissolved solids (TDS), and temperature readings.\n2. Anomaly & Threshold Engine: Evaluates incoming sensor streams against potable water safety standards for early anomaly detection.\n3. Diagnostic Alert Layer: Translates telemetry anomalies into clear risk status and rapid mitigation guidance.',
  aiMethodology:
    'Automated sensor-stream anomaly detection and structured diagnostic summarization converting raw water telemetry into actionable safety decisions.',
  techStack: [
    'Python',
    'IoT Water Sensors',
    'Anomaly Detection',
    'Real-Time Telemetry',
    'Git/GitHub',
  ],
  aiModelsUsed: ['Anomaly Detection Engine', 'Telemetry Diagnostic Pipeline'],
  features: [
    'Built during the Metropolitan Institute of Technology Hackathon',
    'Real-time multi-parameter water monitoring (pH, turbidity, TDS, temperature)',
    'Automated threshold breach and contamination drift alerts',
    'Clean diagnostic overview for rapid operator response',
  ],
  futureImprovements: [
    'Planned: Predictive water quality forecasting across multi-node campus networks',
    'Planned: Automated webhook and SMS threshold notifications',
  ],
  screenshots: [] as string[],
  githubUrl: 'https://github.com/your-username/aerosense-telemetry',
  liveDemoUrl: '',
  status: 'Hackathon Build',
  developmentDate: 'Metropolitan Institute of Technology Hackathon',
  isFeatured: false,
  displayOrder: 1,
  isPublished: true,
};

const VIBE_CODED_PORTFOLIO_PROJECT = {
  slug: 'vibe-coded-3d-portfolio',
  title: 'Vibe Coded 3D Portfolio Universe',
  tagline: 'Interactive 3D circuit command hub & full-stack digital universe.',
  category: 'Full-Stack Web & 3D Interactive',
  description:
    'A high-performance interactive 3D digital portfolio universe and full-stack control plane engineered from scratch using Three.js, React, TypeScript, Tailwind CSS, PostgreSQL, and Express. Designed in a Black, Red, and White Neon aesthetic with real-time station navigation, dynamic PDF resume generation, and a secure owner CMS.',
  keyPrinciple:
    'Vibe coding bridges human creative direction with rigorous software architecture, combining immersive 3D spatial computing with production-grade backend isolation.',
  problem:
    'Traditional static developer portfolios are generic, unmemorable, and disconnected from the dynamic AI and spatial workflows builders actually use today.',
  solution:
    'Engineered an interactive 3D isometric circuit command floor with custom procedural silicon die textures, real-time camera transitions, dynamic vector PDF resume generation, role-based PostgreSQL persistence, and zero-trust authentication.',
  architecture:
    '1. 3D Spatial Canvas (Three.js): Hardware-accelerated isometric station floor with custom canvas procedural textures, PBR materials, and smooth camera sweep interpolation.\n2. Reactive Frontend (React + Vite + Tailwind CSS): High-contrast Black, Red, and White Neon HUD interface with interactive skills constellation graph and real-time station reticles.\n3. Full-Stack Control Plane (Node.js + Express): Server-authoritative APIs with HttpOnly cookie sessions, scrypt password hashing, and dynamic vector PDF resume compilation.\n4. Database & Isolation (PostgreSQL + RLS): Row-level security separating public visitor read operations from owner administrative management.',
  aiMethodology:
    'Vibe coding and AI-assisted engineering methodology: rapidly translating architectural vision and creative interaction direction into robust, type-safe full-stack software.',
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
  features: [
    'Interactive 3D isometric circuit command hub with procedural textures',
    'Black, Red, and White Neon cyberpunk design system with HUD reticles',
    'Dynamic vector PDF resume compiler powered by database records',
    'Interactive Technical Skills constellation graph & 12 AI playground domains',
    'Secure owner control plane with Firebase Auth and scrypt session security',
    'Zero client-side secrets isolation with PostgreSQL Row-Level Security',
    'Sanitized Open-Source 3D Portfolio Template Repository (zero secrets, zero personal details)',
  ],
  futureImprovements: [
    'Planned: Real-time 3D interactive particle audio visualizer',
    'Planned: WebGL custom post-processing bloom and chromatic aberration shaders',
  ],
  screenshots: [] as string[],
  githubUrl: 'https://github.com/your-username/vibe-coded-3d-portfolio-template',
  liveDemoUrl: '',
  status: 'Active Build · Open-Source Template',
  developmentDate: '2025 – Present',
  isFeatured: false,
  displayOrder: 2,
  isPublished: true,
};

export async function ensureSeeded(): Promise<void> {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    const ownerEmail = getOwnerEmail();
    await withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
      const existing = await tx.select().from(profileSettings).limit(1);
      if (existing.length > 0) {
        if (!existing[0].resumeUrl) {
          await tx.update(profileSettings).set({
            resumeUrl: VERIFIED_CV_URL,
            resumeFilename: VERIFIED_CV_FILENAME,
          });
        }
        const existingThemes = await tx.select().from(themeSettings).limit(1);
        if (existingThemes[0] && existingThemes[0].defaultUniverseMode !== 'circuit') {
          await tx
            .update(themeSettings)
            .set({ defaultUniverseMode: 'circuit' })
            .where(eq(themeSettings.id, existingThemes[0].id));
        }
        const existingAqua = await tx
          .select({ id: projects.id })
          .from(projects)
          .where(eq(projects.slug, 'aquasentinel'))
          .limit(1);
        if (existingAqua.length === 0) {
          await tx.insert(projects).values(AQUASENTINEL_PROJECT);
        }
        const existingPortfolio = await tx
          .select({
            id: projects.id,
            githubUrl: projects.githubUrl,
            liveDemoUrl: projects.liveDemoUrl,
          })
          .from(projects)
          .where(eq(projects.slug, 'vibe-coded-3d-portfolio'))
          .limit(1);
        if (existingPortfolio.length === 0) {
          await tx.insert(projects).values(VIBE_CODED_PORTFOLIO_PROJECT);
        } else if (
          existingPortfolio[0].githubUrl !== VIBE_CODED_PORTFOLIO_PROJECT.githubUrl ||
          existingPortfolio[0].liveDemoUrl !== ''
        ) {
          await tx
            .update(projects)
            .set({
              githubUrl: VIBE_CODED_PORTFOLIO_PROJECT.githubUrl,
              liveDemoUrl: '',
              status: VIBE_CODED_PORTFOLIO_PROJECT.status,
              features: VIBE_CODED_PORTFOLIO_PROJECT.features,
            })
            .where(eq(projects.id, existingPortfolio[0].id));
        }

        // Scrub any legacy 'Editable in CMS' placeholders from existing rows
        const existingExploring = await tx.select().from(exploringItems);
        for (const row of existingExploring) {
          if (row.details && /editable in cms/i.test(row.details)) {
            await tx
              .update(exploringItems)
              .set({ details: '' })
              .where(eq(exploringItems.id, row.id));
          }
        }
        const existingLeadership = await tx.select().from(leadershipRoles);
        for (const role of existingLeadership) {
          const cleanResp = (role.responsibilities || []).filter(
            (r) => !/editable in cms/i.test(r),
          );
          const cleanAct = (role.activities || []).filter((a) => !/editable in cms/i.test(a));
          const cleanAch = (role.achievements || []).filter((a) => !/editable in cms/i.test(a));
          if (
            cleanResp.length !== (role.responsibilities || []).length ||
            cleanAct.length !== (role.activities || []).length ||
            cleanAch.length !== (role.achievements || []).length
          ) {
            await tx
              .update(leadershipRoles)
              .set({
                responsibilities: cleanResp,
                activities: cleanAct,
                achievements: cleanAch,
              })
              .where(eq(leadershipRoles.id, role.id));
          }
        }
        const existingExp = await tx.select().from(experiences);
        for (const exp of existingExp) {
          const cleanedStart = (exp.startDate || '')
            .replace(/\(\s*editable in cms[^)]*\)/gi, '')
            .trim();
          const cleanResp = (exp.responsibilities || []).filter(
            (r) => !/editable in cms/i.test(r),
          );
          const cleanAch = (exp.achievements || []).filter((a) => !/editable in cms/i.test(a));
          if (
            cleanedStart !== exp.startDate ||
            cleanResp.length !== (exp.responsibilities || []).length ||
            cleanAch.length !== (exp.achievements || []).length
          ) {
            await tx
              .update(experiences)
              .set({
                startDate: cleanedStart || 'Current',
                responsibilities: cleanResp,
                achievements: cleanAch,
              })
              .where(eq(experiences.id, exp.id));
          }
        }
        return;
      }

      await tx.insert(profileSettings).values({
        fullName: 'Alex Rivera',
        headline: 'Building beyond the expected.',
        subheading: 'AI Enthusiast · Prompt Engineer · Vibe Coder · Developer · Student Leader',
        brandStatement:
          "I don't just explore technology. I experiment, build, lead, and turn ideas into experiences.",
        shortIntro:
          'I enjoy exploring emerging technologies, transforming ideas into working products, and collaborating with people who believe in building something meaningful.',
        statusText: 'Currently exploring AI, development & innovation.',
        education: 'B.Tech Computer Science, Specialization in AI/ML',
        specialization: 'Artificial Intelligence & Machine Learning',
        university: 'Metropolitan Institute of Technology',
        institution: 'School of Computing & AI',
        currentInternship: 'Intern at Acme AI Labs',
        leadershipSummary:
          'Vice President, University Engineering Council · Campus Ambassador at OpenTech Developer Community',
        currentInterests:
          'AI & Machine Learning, Prompt Engineering, Vibe Coding, Software Development, Product Experimentation',
        careerDirection:
          'Exploring the intersection of artificial intelligence, software engineering, and human imagination to turn ideas into working digital products.',
        contactEmail: ownerEmail,
        showEmailPublicly: true,
        profileImageUrl: '',
        resumeUrl: VERIFIED_CV_URL,
        resumeFilename: VERIFIED_CV_FILENAME,
        resumeEnabled: true,
      });

      await tx.insert(aboutThemes).values([
        {
          slug: 'curiosity',
          title: 'Curiosity',
          subtitle: 'Discovering new ways to think and build with AI',
          narrative:
            'My journey begins with an insatiable curiosity for artificial intelligence, emerging software paradigms, and how rapidly evolving models can unlock new ways of solving problems through continuous experimentation.',
          highlights: [
            'AI & Machine Learning Exploration',
            'Hands-on Model Experimentation',
            'Continuous Technical Learning',
          ],
          accentToken: 'cyan',
          displayOrder: 0,
          isPublished: true,
        },
        {
          slug: 'creation',
          title: 'Creation',
          subtitle: 'Turning ideas into working software products',
          narrative:
            'Curiosity becomes meaningful when built into reality. Through prompt engineering, AI-assisted development, and vibe coding, I transform raw concepts into structured applications like NexusRAG.',
          highlights: [
            'Prompt Engineering & Retrieval Design',
            'Vibe Coding & AI-Assisted Workflows',
            'Practical Full-Stack & Python Builds',
          ],
          accentToken: 'violet',
          displayOrder: 1,
          isPublished: true,
        },
        {
          slug: 'leadership',
          title: 'Leadership',
          subtitle: 'Representing peers and leading collaborative teams',
          narrative:
            'Technology thrives on collaboration. From serving as Vice President of the Student Engineering Council General Council at School of Computing & AI and Campus Ambassador at OpenTech Developer Community to leading four-member hackathon teams, I believe in building together.',
          highlights: [
            'Vice President, University Engineering Council',
            'Campus Ambassador at OpenTech Developer Community',
            'Hackathon Team Lead (4-Member Squad)',
          ],
          accentToken: 'gold',
          displayOrder: 2,
          isPublished: true,
        },
      ]);

      await tx.insert(exploringItems).values([
        {
          title: 'AI and Machine Learning',
          category: 'Academic & Applied Focus',
          summary:
            'Pursuing B.Tech Computer Science with an AI/ML specialization at Metropolitan Institute of Technology & School of Computing & AI, studying how retrieval, reasoning, and domain knowledge combine in real applications.',
          details: '',
          accentToken: 'violet',
          displayOrder: 0,
          isPublished: true,
        },
        {
          title: 'Prompt Engineering',
          category: 'AI Interaction Design',
          summary:
            'Crafting structured prompt architectures, system instructions, and citation-grounded reasoning flows that guide language models toward reliable, verifiable outputs.',
          details: '',
          accentToken: 'cyan',
          displayOrder: 1,
          isPublished: true,
        },
        {
          title: 'Vibe Coding',
          category: 'Rapid Product Synthesis',
          summary:
            'Combining human product intuition with AI-assisted coding environments to iterate quickly from early concept to functional, interactive software experiences.',
          details: '',
          accentToken: 'blue',
          displayOrder: 2,
          isPublished: true,
        },
        {
          title: 'Software Development',
          category: 'Core Engineering',
          summary:
            'Writing clean, structured software using Python, C++, HTML, and CSS while currently gaining hands-on industry experience as an intern at Acme AI Labs.',
          details: '',
          accentToken: 'cyan',
          displayOrder: 3,
          isPublished: true,
        },
        {
          title: 'Product Experimentation',
          category: 'Builder Mindset',
          summary:
            'Testing new ideas in the open—such as building NexusRAG to make complex regulatory requirements understandable and actionable for teams.',
          details: '',
          accentToken: 'violet',
          displayOrder: 4,
          isPublished: true,
        },
        {
          title: 'Leadership and Collaboration',
          category: 'Community & Governance',
          summary:
            'Contributing to student leadership as Vice President of Student Engineering Council at School of Computing & AI, representing OpenTech Developer Community as Campus Ambassador, and collaborating in hackathon teams.',
          details: '',
          accentToken: 'gold',
          displayOrder: 5,
          isPublished: true,
        },
      ]);

      await tx.insert(skills).values([
        {
          name: 'Python',
          category: 'Programming Languages',
          description: 'Core language used for AI pipelines, backend logic, and NexusRAG.',
          connectedTo: [
            'Prompt Engineering',
            'AI-assisted development',
            'Working with AI development tools and models',
          ],
          accentToken: 'cyan',
          displayOrder: 0,
          isPublished: true,
        },
        {
          name: 'C++',
          category: 'Programming Languages',
          description: 'Foundational systems and algorithmic problem-solving language.',
          connectedTo: ['Python'],
          accentToken: 'blue',
          displayOrder: 1,
          isPublished: true,
        },
        {
          name: 'HTML',
          category: 'Programming Languages',
          description: 'Semantic web document structure and accessible interface markup.',
          connectedTo: ['CSS', 'Vibe Coding'],
          accentToken: 'cyan',
          displayOrder: 2,
          isPublished: true,
        },
        {
          name: 'CSS',
          category: 'Programming Languages',
          description: 'Responsive layout styling, typography, and visual presentation.',
          connectedTo: ['HTML', 'Vibe Coding'],
          accentToken: 'blue',
          displayOrder: 3,
          isPublished: true,
        },
        {
          name: 'Prompt Engineering',
          category: 'AI & Productivity',
          description:
            'Structuring context, constraints, and reasoning steps for accurate AI outputs.',
          connectedTo: [
            'Python',
            'AI-assisted development',
            'Working with AI development tools and models',
          ],
          accentToken: 'violet',
          displayOrder: 4,
          isPublished: true,
        },
        {
          name: 'AI-assisted development',
          category: 'AI & Productivity',
          description:
            'Accelerating software architecture, debugging, and iteration alongside AI tools.',
          connectedTo: ['Prompt Engineering', 'Vibe Coding', 'Python'],
          accentToken: 'violet',
          displayOrder: 5,
          isPublished: true,
        },
        {
          name: 'Vibe Coding',
          category: 'AI & Productivity',
          description:
            'Rapidly translating creative product direction into interactive prototypes.',
          connectedTo: ['AI-assisted development', 'HTML', 'CSS'],
          accentToken: 'cyan',
          displayOrder: 6,
          isPublished: true,
        },
        {
          name: 'Working with AI development tools and models',
          category: 'AI & Productivity',
          description:
            'Evaluating and integrating foundation models, embeddings, and retrieval workflows.',
          connectedTo: ['Prompt Engineering', 'AI-assisted development', 'Python'],
          accentToken: 'violet',
          displayOrder: 7,
          isPublished: true,
        },
      ]);

      const insertedCategories = await tx
        .insert(aiCategories)
        .values([
          {
            name: 'Large Language Models',
            slug: 'large-language-models',
            description: 'General-purpose frontier and open foundation text models.',
            accentToken: 'violet',
            displayOrder: 0,
            isPublished: true,
          },
          {
            name: 'Multimodal Models',
            slug: 'multimodal-models',
            description: 'Models reasoning across text, images, documents, and audio.',
            accentToken: 'cyan',
            displayOrder: 1,
            isPublished: true,
          },
          {
            name: 'Image Generation Models',
            slug: 'image-generation-models',
            description: 'Diffusion and flow-matching visual synthesis models.',
            accentToken: 'violet',
            displayOrder: 2,
            isPublished: true,
          },
          {
            name: 'Video Generation Models',
            slug: 'video-generation-models',
            description: 'Temporal generative video synthesis systems.',
            accentToken: 'blue',
            displayOrder: 3,
            isPublished: true,
          },
          {
            name: 'Speech & Audio Models',
            slug: 'speech-audio-models',
            description: 'Automatic speech recognition, voice synthesis, and audio models.',
            accentToken: 'cyan',
            displayOrder: 4,
            isPublished: true,
          },
          {
            name: 'Coding Models',
            slug: 'coding-models',
            description: 'Models specialized in code synthesis, refactoring, and repository reasoning.',
            accentToken: 'blue',
            displayOrder: 5,
            isPublished: true,
          },
          {
            name: 'Embedding Models',
            slug: 'embedding-models',
            description: 'Dense semantic vector representations for RAG and hybrid search.',
            accentToken: 'cyan',
            displayOrder: 6,
            isPublished: true,
          },
          {
            name: 'Vision Models',
            slug: 'vision-models',
            description: 'Visual understanding, document OCR, and image-text alignment.',
            accentToken: 'violet',
            displayOrder: 7,
            isPublished: true,
          },
          {
            name: 'Open-Source Models',
            slug: 'open-source-models',
            description: 'Open-weight model families inspected for local and custom adaptation.',
            accentToken: 'cyan',
            displayOrder: 8,
            isPublished: true,
          },
          {
            name: 'Agentic AI Systems',
            slug: 'agentic-ai-systems',
            description: 'Tool-calling, retrieval-augmented, and multi-step workflow architectures.',
            accentToken: 'violet',
            displayOrder: 9,
            isPublished: true,
          },
          {
            name: 'Reasoning Models',
            slug: 'reasoning-models',
            description: 'Deliberative chain-of-thought models for structured problem solving.',
            accentToken: 'blue',
            displayOrder: 10,
            isPublished: true,
          },
          {
            name: 'Small Language Models',
            slug: 'small-language-models',
            description: 'Compact parameter models suited for efficiency and focused tasks.',
            accentToken: 'cyan',
            displayOrder: 11,
            isPublished: true,
          },
        ])
        .returning();

      const catBySlug = new Map(insertedCategories.map((c) => [c.slug, c.id]));

      await tx.insert(aiModels).values([
        {
          categoryId: catBySlug.get('large-language-models')!,
          name: 'Gemini',
          providerOrFamily: 'Google',
          experienceLevel: 'Building With',
          experienceNotes: 'Explored for multimodal reasoning, prompt workflows, and rapid prototyping.',
          useCases: ['Prompt Engineering', 'Prototyping'],
          displayOrder: 0,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('large-language-models')!,
          name: 'GPT',
          providerOrFamily: 'OpenAI',
          experienceLevel: 'Prompting',
          experienceNotes: 'Explored structured prompting, ideation, and software assistance.',
          useCases: ['Ideation', 'Prompt Design'],
          displayOrder: 1,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('large-language-models')!,
          name: 'Claude',
          providerOrFamily: 'Anthropic',
          experienceLevel: 'Prompting',
          experienceNotes: 'Explored long-context reasoning and AI-assisted development.',
          useCases: ['Code Review', 'Writing'],
          displayOrder: 2,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('open-source-models')!,
          name: 'Gemma',
          providerOrFamily: 'Google Open Weights',
          experienceLevel: 'Building With',
          experienceNotes: 'Used as the reasoning backbone concept in NexusRAG alongside RAG.',
          useCases: ['Regulatory Reasoning', 'RAG'],
          displayOrder: 0,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('open-source-models')!,
          name: 'Llama',
          providerOrFamily: 'Meta',
          experienceLevel: 'Exploring',
          experienceNotes: 'Following open-weight architecture releases and community tooling.',
          useCases: ['Open-Weight Ecosystem'],
          displayOrder: 1,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('open-source-models')!,
          name: 'DeepSeek',
          providerOrFamily: 'DeepSeek',
          experienceLevel: 'Experimenting',
          experienceNotes: 'Exploring open reasoning and coding capabilities.',
          useCases: ['Reasoning', 'Code'],
          displayOrder: 2,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('open-source-models')!,
          name: 'Qwen',
          providerOrFamily: 'Alibaba Cloud',
          experienceLevel: 'Exploring',
          experienceNotes: 'Tracking open multilingual and coding model variants.',
          useCases: ['Coding', 'General'],
          displayOrder: 3,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('open-source-models')!,
          name: 'Mistral',
          providerOrFamily: 'Mistral AI',
          experienceLevel: 'Exploring',
          experienceNotes: 'Studying efficient open-weight transformer models.',
          useCases: ['Efficiency', 'Text'],
          displayOrder: 4,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('multimodal-models')!,
          name: 'Gemini Multimodal',
          providerOrFamily: 'Google',
          experienceLevel: 'Experimenting',
          experienceNotes: 'Testing document and visual context understanding.',
          useCases: ['Document Analysis', 'Vision + Text'],
          displayOrder: 0,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('image-generation-models')!,
          name: 'Flux',
          providerOrFamily: 'Black Forest Labs',
          experienceLevel: 'Exploring',
          experienceNotes: 'Exploring prompt adherence in modern image synthesis.',
          useCases: ['Visual Concepts'],
          displayOrder: 0,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('image-generation-models')!,
          name: 'Stable Diffusion',
          providerOrFamily: 'Stability AI',
          experienceLevel: 'Exploring',
          experienceNotes: 'Studying open diffusion pipelines and conditioning.',
          useCases: ['Open Image Synthesis'],
          displayOrder: 1,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('video-generation-models')!,
          name: 'Veo',
          providerOrFamily: 'Google',
          experienceLevel: 'Exploring',
          experienceNotes: 'Following advances in controllable generative video.',
          useCases: ['Motion Synthesis'],
          displayOrder: 0,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('speech-audio-models')!,
          name: 'Whisper',
          providerOrFamily: 'OpenAI Open Weights',
          experienceLevel: 'Exploring',
          experienceNotes: 'Exploring speech-to-text transcription workflows.',
          useCases: ['Transcription'],
          displayOrder: 0,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('coding-models')!,
          name: 'DeepSeek Coder & Qwen Coder',
          providerOrFamily: 'Open Ecosystem',
          experienceLevel: 'Experimenting',
          experienceNotes: 'Testing AI-assisted coding and vibe coding workflows.',
          useCases: ['AI-Assisted Coding'],
          displayOrder: 0,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('embedding-models')!,
          name: 'Semantic Vector Embeddings',
          providerOrFamily: 'RAG Retrieval',
          experienceLevel: 'Building With',
          experienceNotes: 'Paired with BM25 keyword retrieval in NexusRAG hybrid search.',
          useCases: ['Hybrid RAG Search'],
          displayOrder: 0,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('vision-models')!,
          name: 'PaliGemma & Vision-Language',
          providerOrFamily: 'Open Vision Ecosystem',
          experienceLevel: 'Exploring',
          experienceNotes: 'Studying visual-text grounding and document layout parsing.',
          useCases: ['Visual Grounding'],
          displayOrder: 0,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('agentic-ai-systems')!,
          name: 'Citation-Validated RAG Workflows',
          providerOrFamily: 'Applied Architecture',
          experienceLevel: 'Building With',
          experienceNotes:
            'Designing retrieval pipelines where verified knowledge acts as the source of truth.',
          useCases: ['NexusRAG Architecture'],
          displayOrder: 0,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('reasoning-models')!,
          name: 'DeepSeek-R1 & Thinking Models',
          providerOrFamily: 'Reasoning Ecosystem',
          experienceLevel: 'Experimenting',
          experienceNotes: 'Observing structured multi-step reasoning on analytical tasks.',
          useCases: ['Analytical Decomposition'],
          displayOrder: 0,
          isPublished: true,
        },
        {
          categoryId: catBySlug.get('small-language-models')!,
          name: 'Gemma 2B / 9B & Compact SLMs',
          providerOrFamily: 'Compact Models',
          experienceLevel: 'Experimenting',
          experienceNotes:
            'Exploring LoRA / QLoRA / PEFT adaptation concepts for focused domain tasks.',
          useCases: ['Domain Adaptation Concepts'],
          displayOrder: 0,
          isPublished: true,
        },
      ]);

      await tx.insert(projects).values([
        {
          slug: 'complyai',
          title: 'NexusRAG',
          tagline: 'Complex regulations in. Clear actions out.',
          category: 'AI / Regulatory Compliance Engine',
          description:
            'An AI-powered legal and regulatory compliance auditor designed to help small businesses, startups, HR teams, and compliance professionals understand regulatory requirements, identify potential compliance gaps, and convert complex legal requirements into actionable steps.',
          keyPrinciple:
            'AI models provide reasoning and language intelligence. Verified regulatory knowledge provides the source of truth.',
          problem:
            'Small businesses, startups, HR teams, and compliance professionals must navigate dense legal and regulatory texts across jurisdictions. Manual review is slow, fragmented, and prone to missing subtle compliance obligations or temporal updates.',
          solution:
            'NexusRAG combines a verified regulatory knowledge base with hybrid retrieval (semantic search + BM25 keyword retrieval) and Gemma-powered reasoning to analyze regulatory documents, surface potential compliance risks, validate citations, and produce clear, actionable steps.',
          architecture:
            '1. Ingestion & Regulatory Knowledge Base: Stores jurisdiction-aware and time-aware regulatory documents as the verified source of truth.\n2. Hybrid Retrieval Layer: Combines dense semantic search with lexical BM25 keyword retrieval for high-recall regulatory clause matching.\n3. Gemma Reasoning & Risk Engine: Synthesizes retrieved clauses to detect potential compliance gaps and translate obligations into structured actions.\n4. Citation Validation Gate: Cross-checks generated compliance findings against retrieved regulatory passages.',
          aiMethodology:
            'Retrieval-Augmented Generation (RAG) grounded in verified regulatory corpora, paired with hybrid semantic + BM25 retrieval, jurisdiction-aware and time-aware context filtering, citation validation, and LoRA / QLoRA / PEFT domain adaptation concepts.',
          techStack: [
            'Python',
            'Gemma',
            'Retrieval-Augmented Generation (RAG)',
            'Semantic Vector Search',
            'BM25 Keyword Retrieval',
            'LoRA / QLoRA / PEFT Concepts',
          ],
          aiModelsUsed: ['Gemma', 'Semantic Embedding Retrieval', 'BM25 Lexical Retriever'],
          features: [
            'Gemma-powered regulatory reasoning and plain-language synthesis',
            'Hybrid retrieval combining semantic search and BM25 keyword matching',
            'Jurisdiction-aware and time-aware regulatory context handling',
            'Compliance risk detection and gap analysis for teams',
            'Citation validation anchored to verified regulatory knowledge',
          ],
          futureImprovements: [
            'Planned: Expanded multi-jurisdiction regulatory knowledge packs',
            'Planned: Interactive audit export reports for HR and compliance teams',
            'Planned: Automated regulatory change tracking alerts',
          ],
          screenshots: [],
          githubUrl: 'https://github.com/your-username/nexusrag-engine',
          liveDemoUrl: '',
          status: 'Active Project',
          developmentDate: '2025 – Present',
          isFeatured: true,
          displayOrder: 0,
          isPublished: true,
        },
        AQUASENTINEL_PROJECT,
        VIBE_CODED_PORTFOLIO_PROJECT,
      ]);

      await tx.insert(achievements).values([
        {
          title: 'School of Computing & AI Bootcamp — Performance Medal',
          eventOrIssuer: 'School of Computing & AI Bootcamp',
          recognitionTier: 'medal',
          teamContext: 'Individual Recognition',
          description:
            'Received a medal for performance during my School of Computing & AI Bootcamp, recognizing dedication, problem-solving, and consistent execution as an academic and professional milestone.',
          highlights: [
            'Performance Medal',
            'Academic & Professional Milestone',
            'School of Computing & AI Bootcamp',
          ],
          achievedDate: '',
          certificateUrl: '',
          photoUrl: '',
          displayOrder: 0,
          isPublished: true,
        },
        {
          title: 'Hacktoberfest — Second Place',
          eventOrIssuer: 'Hacktoberfest · Conducted by School of Computing & AI',
          recognitionTier: 'second_place',
          teamContext: 'Team of 4 Members (Same Squad)',
          description:
            'Secured second place at Hacktoberfest conducted by School of Computing & AI alongside the same four-member team, highlighting strong collaboration, competitive execution, and teamwork.',
          highlights: [
            'Second Place Recognition',
            'Team of 4 Members',
            'Collaboration & Execution',
          ],
          achievedDate: '',
          certificateUrl: '',
          photoUrl: '',
          displayOrder: 1,
          isPublished: true,
        },
        {
          title: 'Metropolitan Institute of Technology Hackathon — Finalist',
          eventOrIssuer: 'Metropolitan Institute of Technology Hackathon',
          recognitionTier: 'finalist',
          teamContext: 'Led a Team of 4 Members',
          description:
            'Reached the finalist stage at the Metropolitan Institute of Technology Hackathon while leading a team of four members, focusing on team leadership, collaboration, problem-solving, and building under time constraints.',
          highlights: [
            'Finalist Recognition',
            'Led a Team of 4',
            'Building Under Time Constraints',
          ],
          achievedDate: '',
          certificateUrl: '',
          photoUrl: '',
          displayOrder: 2,
          isPublished: true,
        },
      ]);

      await tx.insert(leadershipRoles).values([
        {
          position: 'Vice President — Student Engineering Council',
          organization: 'University Engineering Council',
          roleType: 'Student Leadership',
          startDate: 'Current',
          endDate: 'Present',
          isCurrent: true,
          description:
            'Serving as Vice President of the University Engineering Council, contributing to student governance, peer representation, and collaborative community involvement.',
          responsibilities: [],
          activities: [],
          achievements: [],
          highlights: [
            'Leadership',
            'Responsibility',
            'Collaboration',
            'Communication',
            'Student Community Involvement',
          ],
          displayOrder: 0,
          isPublished: true,
        },
        {
          position: 'Campus Ambassador',
          organization: 'OpenTech Developer Community',
          roleType: 'Campus Representation',
          startDate: 'Current',
          endDate: 'Present',
          isCurrent: true,
          description:
            'Serving as Campus Ambassador at OpenTech Developer Community, bridging student learners with technical programs and campus initiatives.',
          responsibilities: [],
          activities: [],
          achievements: [],
          highlights: ['Campus Representation', 'Communication', 'Community Building'],
          displayOrder: 1,
          isPublished: true,
        },
      ]);

      await tx.insert(experiences).values([
        {
          organization: 'Acme AI Labs',
          position: 'Intern',
          employmentType: 'Current Internship',
          startDate: 'Current',
          endDate: 'Present',
          isCurrent: true,
          description:
            'Currently interning at Acme AI Labs, applying software engineering, AI exploration, and collaborative problem-solving in an active industry environment.',
          responsibilities: [],
          skillsUsed: ['Python', 'AI-Assisted Development', 'Software Development'],
          achievements: [],
          displayOrder: 0,
          isPublished: true,
        },
      ]);

      await tx.insert(timelineEvents).values([
        {
          title: 'B.Tech Computer Science (AI/ML Specialization)',
          organization: 'Metropolitan Institute of Technology · School of Computing & AI',
          category: 'Education',
          dateLabel: 'Undergraduate',
          summary:
            'Pursuing B.Tech in Computer Science with specialization in Artificial Intelligence & Machine Learning.',
          accentToken: 'blue',
          displayOrder: 0,
          isPublished: true,
        },
        {
          title: 'School of Computing & AI Bootcamp — Performance Medal',
          organization: 'School of Computing & AI',
          category: 'Achievement',
          dateLabel: 'Milestone',
          summary:
            'Awarded a performance medal during the School of Computing & AI Bootcamp for strong technical foundation and execution.',
          accentToken: 'gold',
          displayOrder: 1,
          isPublished: true,
        },
        {
          title: 'Metropolitan Institute of Technology Hackathon — Finalist',
          organization: 'Metropolitan Institute of Technology',
          category: 'Achievement',
          dateLabel: 'Hackathon',
          summary:
            'Led a four-member team to the finalist stage, collaborating and building under tight time constraints.',
          accentToken: 'gold',
          displayOrder: 2,
          isPublished: true,
        },
        {
          title: 'Hacktoberfest — Second Place',
          organization: 'Conducted by School of Computing & AI',
          category: 'Achievement',
          dateLabel: 'Competition',
          summary:
            'Secured second place alongside the same four-member team through collaborative engineering and execution.',
          accentToken: 'gold',
          displayOrder: 3,
          isPublished: true,
        },
        {
          title: 'Vice President — Student Engineering Council General Council',
          organization: 'School of Computing & AI',
          category: 'Leadership',
          dateLabel: 'Student Leadership',
          summary:
            'Elected Vice President of the Student Engineering Council General Council of School of Computing & AI, championing student community involvement and communication.',
          accentToken: 'gold',
          displayOrder: 4,
          isPublished: true,
        },
        {
          title: 'Campus Ambassador',
          organization: 'OpenTech Developer Community',
          category: 'Leadership',
          dateLabel: 'Campus Role',
          summary:
            'Representing OpenTech Developer Community as Campus Ambassador, connecting students with technical learning opportunities.',
          accentToken: 'cyan',
          displayOrder: 5,
          isPublished: true,
        },
        {
          title: 'Intern — Current Role',
          organization: 'Acme AI Labs',
          category: 'Internship',
          dateLabel: 'Current',
          summary:
            'Currently interning at Acme AI Labs, gaining hands-on professional software and technology experience.',
          accentToken: 'blue',
          displayOrder: 6,
          isPublished: true,
        },
        {
          title: 'NexusRAG — AI Regulatory Compliance Engine',
          organization: 'Personal Project',
          category: 'Project',
          dateLabel: 'Featured Build',
          summary:
            'Built NexusRAG: an AI-powered regulatory compliance auditor combining hybrid RAG (semantic + BM25) with Gemma reasoning.',
          accentToken: 'violet',
          displayOrder: 7,
          isPublished: true,
        },
      ]);

      await tx.insert(socialLinks).values([
        {
          platform: 'LinkedIn',
          label: 'LinkedIn',
          url: 'https://www.linkedin.com/in/alex-rivera-dev/',
          iconKey: 'linkedin',
          displayOrder: 0,
          isPublished: true,
        },
        {
          platform: 'GitHub',
          label: 'GitHub',
          url: 'https://github.com/your-username',
          iconKey: 'github',
          displayOrder: 1,
          isPublished: true,
        },
        {
          platform: 'NexusRAG',
          label: 'NexusRAG Repo',
          url: 'https://github.com/your-username/nexusrag-engine',
          iconKey: 'code',
          displayOrder: 2,
          isPublished: true,
        },
      ]);

      await tx.insert(seoSettings).values({
        siteTitle: 'Alex Rivera — AI/ML Builder, Prompt Engineer & Student Leader',
        metaDescription:
          'Explore the interactive 3D portfolio of Alex Rivera — B.Tech CSE (AI/ML) student at Metropolitan Institute of Technology & School of Computing & AI, creator of NexusRAG, Acme AI Labs intern, and Student Engineering Council Vice President.',
        ogTitle: 'Alex Rivera — Building Beyond the Expected',
        ogDescription:
          'Interactive 3D digital universe & circuit command portfolio showcasing NexusRAG, AI model exploration, achievements, and student leadership.',
        canonicalUrl: '',
        keywords:
          'Alex Rivera, AI/ML Student, Prompt Engineer, Vibe Coder, Developer, Student Leader, NexusRAG, Metropolitan Institute of Technology, School of Computing & AI, Acme AI Labs',
        authorName: 'Alex Rivera',
        structuredDataRole: 'AI/ML Student, Prompt Engineer & Developer',
      });

      await tx.insert(themeSettings).values({
        defaultColorMode: 'dark',
        defaultUniverseMode: 'circuit',
        highQualityDefault: true,
        soundEffectsDefault: false,
        accentPrimary: '#FF1E38',
        accentViolet: '#FFFFFF',
        accentCyan: '#FF2A42',
        accentGold: '#FF4D63',
      });

      await tx.insert(securitySettings).values({
        ownerEmail,
        passwordHash: process.env.OWNER_PASSWORD_HASH || '',
        totpEnabled: false,
        totpSecret: '',
        sessionTtlHours: 24,
        contactRateLimitPer15Min: 5,
      });
    });
  })();

  try {
    await seedPromise;
  } catch (err) {
    seedPromise = null;
    throw err;
  }
}
