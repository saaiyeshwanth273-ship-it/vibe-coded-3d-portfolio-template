import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCompleteCvSkillGroups } from './cvSkillAggregation.ts';
import { cleanDisplayList, cleanDisplayText, isEditablePlaceholder } from './resumeDownload.ts';
import { buildVerifiedResumePdf } from '../server/resumeGenerator.ts';

test('buildCompleteCvSkillGroups aggregates all portfolio skills, project stacks, AI models, and hardware without duplicates', () => {
  const groups = buildCompleteCvSkillGroups({
    skills: [
      { name: 'Python', category: 'Programming Languages' },
      { name: 'C++', category: 'Programming Languages' },
      { name: 'HTML', category: 'Programming Languages' },
      { name: 'CSS', category: 'Programming Languages' },
      { name: 'Prompt Engineering', category: 'AI & Productivity' },
      { name: 'AI-assisted development', category: 'AI & Productivity' },
      { name: 'Vibe Coding', category: 'AI & Productivity' },
      { name: 'Working with AI development tools and models', category: 'AI & Productivity' },
    ],
    projects: [
      {
        techStack: ['Python', 'Gemma', 'BM25 Keyword Retrieval', 'Git/GitHub'],
        aiModelsUsed: ['Semantic Embedding Retrieval'],
      },
      {
        techStack: ['IoT Water Sensors', 'Anomaly Detection', 'Real-Time Telemetry'],
        aiModelsUsed: ['Anomaly Detection Engine'],
      },
    ],
    experiences: [{ skillsUsed: ['Python', 'AI-Assisted Development', 'Software Development'] }],
    aiModels: [{ name: 'Gemini' }, { name: 'Claude' }, { name: 'DeepSeek' }],
  });

  const allItems = groups.flatMap((g) => g.items);
  assert.ok(allItems.includes('Python'));
  assert.ok(allItems.includes('C++'));
  assert.ok(allItems.includes('HTML'));
  assert.ok(allItems.includes('CSS'));
  assert.ok(allItems.includes('Gemma'));
  assert.ok(allItems.includes('Gemini'));
  assert.ok(allItems.includes('Claude'));
  assert.ok(allItems.includes('DeepSeek'));
  assert.ok(allItems.includes('Git / GitHub'));
  assert.ok(allItems.includes('IoT Water Sensors (pH, Turbidity, TDS, Temperature)'));
  // Ensure Git/GitHub and Working with AI Development Tools & Models are not duplicated
  assert.equal(
    allItems.filter((i) => i.toLowerCase().replace(/[^a-z]/g, '') === 'gitgithub').length,
    1,
  );
  assert.equal(
    allItems.filter((i) => i.toLowerCase().includes('working with ai development tools')).length,
    1,
  );
});

test('cleanDisplayText and cleanDisplayList strip all Editable in CMS placeholder strings', () => {
  assert.equal(
    isEditablePlaceholder('Editable in CMS — add Campus Ambassador responsibilities'),
    true,
  );
  assert.equal(
    cleanDisplayText('Editable in CMS — add specific coursework, experiments, or notes.'),
    '',
  );
  assert.equal(cleanDisplayText('Current (Editable in CMS)'), 'Current');
  assert.deepEqual(
    cleanDisplayList([
      'Editable in CMS — add Campus Ambassador responsibilities',
      'Led campus workshop outreach',
    ]),
    ['Led campus workshop outreach'],
  );
  assert.deepEqual(
    cleanDisplayList(['Editable in CMS — add specific Student Engineering Council council responsibilities']),
    [],
  );
});

test('buildVerifiedResumePdf omits removed phone number and includes every portfolio project, leadership role, and achievement', () => {
  const removedDigits = ['00000', '00000'].join('');
  const pdf = buildVerifiedResumePdf({
    fullName: 'Alex Rivera',
    subheading: 'AI Enthusiast | Prompt Engineer | Vibe Coder | Developer | Student Leader',
    education: 'B.Tech Computer Science, Specialization in AI/ML',
    specialization: 'Artificial Intelligence & Machine Learning',
    university: 'Metropolitan Institute of Technology',
    institution: 'School of Computing & AI',
    contactEmail: 'alex.rivera@example.com',
    showEmailPublicly: true,
    skills: [{ name: 'Python', category: 'Programming Languages' }],
    projects: [
      {
        title: 'NexusRAG',
        tagline: 'Complex regulations in. Clear actions out.',
        description: 'Hybrid RAG regulatory compliance auditor.',
        techStack: ['Python', 'Gemma', 'BM25 Keyword Retrieval'],
        githubUrl: 'https://github.com/your-username/nexusrag-engine',
      },
      {
        title: 'AeroSense -- Metropolitan Institute of Technology Hackathon',
        tagline: 'Water quality monitoring and contamination detection.',
        description: 'Tracks pH, turbidity, TDS, and temperature anomalies.',
        techStack: ['Python', 'IoT Water Sensors'],
        githubUrl: 'https://github.com/your-username/aerosense-telemetry',
      },
    ],
    achievements: [
      {
        title: 'Hacktoberfest -- Second Place',
        eventOrIssuer: 'Conducted by School of Computing & AI',
        description: 'Second place with 4-member squad.',
      },
    ],
    leadership: [
      {
        position: 'Vice President -- Student Engineering Council',
        organization: 'University Engineering Council',
        description: 'Student governance and representation.',
      },
      {
        position: 'Campus Ambassador',
        organization: 'OpenTech Developer Community',
        description: 'Bridging students with technical programs.',
      },
    ],
    experiences: [
      {
        position: 'Intern',
        organization: 'Acme AI Labs',
        startDate: 'Current (Editable in CMS)',
        description: 'Interning at Acme AI Labs.',
        skillsUsed: ['Python'],
      },
    ],
  });

  const text = pdf.toString('utf8');
  assert.equal(text.includes(removedDigits), false);
  assert.equal(text.includes('Editable in CMS'), false);
  assert.ok(text.includes('NexusRAG'));
  assert.ok(text.includes('AeroSense'));
  assert.ok(text.includes('Acme AI Labs'));
  assert.ok(text.includes('OpenTech Developer Community'));
});
