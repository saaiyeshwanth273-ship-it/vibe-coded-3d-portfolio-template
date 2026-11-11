export interface CvSkillGroup {
  label: string;
  items: string[];
}

export interface CvAggregationInput {
  skills: Array<{ name: string; category: string }>;
  projects: Array<{ techStack?: string[]; aiModelsUsed?: string[] }>;
  experiences: Array<{ skillsUsed?: string[] }>;
  aiModels?: Array<{ name: string; providerOrFamily?: string }>;
  certifications?: Array<{ skillsCovered?: string[] }>;
}

const DEFAULT_PROGRAMMING_SKILLS = ['Python', 'C++', 'HTML', 'CSS'];

const DEFAULT_AI_WORKFLOW_SKILLS = [
  'Prompt Engineering',
  'AI-Assisted Development',
  'Vibe Coding',
  'Working with AI Development Tools & Models',
  'Retrieval-Augmented Generation (RAG)',
  'Semantic Vector Search',
  'BM25 Keyword Retrieval',
  'Citation Validation',
  'LoRA / QLoRA / PEFT Concepts',
  'Anomaly Detection',
  'Real-Time Telemetry',
];

const DEFAULT_HARDWARE_TOOL_SKILLS = [
  'Git / GitHub',
  'IoT Water Sensors (pH, Turbidity, TDS, Temperature)',
  'Arduino (Custom Smartwatch)',
  'MAX Heart-Rate Sensor & IMU Motion Tracking',
  'Circuit Wiring, Sensor Calibration & Firmware Logic',
];

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9+]+/g, ' ')
    .trim();
}

function addUnique(target: string[], seen: Set<string>, candidate: string): void {
  const clean = candidate.trim();
  if (!clean) return;
  const key = normalizeKey(clean);
  if (!key || seen.has(key)) return;
  seen.add(key);
  target.push(clean);
}

/**
 * Aggregates and deduplicates every skill, tech stack item, AI model ecosystem,
 * experience tool, and hardware capability mentioned across the portfolio into
 * clean CV skill groups.
 */
export function buildCompleteCvSkillGroups(input: CvAggregationInput): CvSkillGroup[] {
  const programming: string[] = [];
  const progSeen = new Set<string>();

  const aiAndSystems: string[] = [];
  const aiSeen = new Set<string>();

  const modelsAndEcosystems: string[] = [];
  const modelSeen = new Set<string>();

  const toolsAndHardware: string[] = [];
  const toolSeen = new Set<string>();

  const combinedGlobalSeen = new Set<string>();

  for (const s of input.skills) {
    const cat = s.category.toLowerCase();
    const k = normalizeKey(s.name);
    if (cat.includes('language') || cat.includes('programming')) {
      addUnique(programming, progSeen, s.name);
      combinedGlobalSeen.add(k);
    } else if (cat.includes('tool') || cat.includes('hardware') || cat.includes('devops')) {
      addUnique(toolsAndHardware, toolSeen, s.name);
      combinedGlobalSeen.add(k);
    } else {
      addUnique(aiAndSystems, aiSeen, s.name);
      combinedGlobalSeen.add(k);
    }
  }

  for (const fallbackLang of DEFAULT_PROGRAMMING_SKILLS) {
    const k = normalizeKey(fallbackLang);
    if (!combinedGlobalSeen.has(k)) {
      addUnique(programming, progSeen, fallbackLang);
      combinedGlobalSeen.add(k);
    }
  }

  for (const fallbackAi of DEFAULT_AI_WORKFLOW_SKILLS) {
    const k = normalizeKey(fallbackAi);
    if (!combinedGlobalSeen.has(k)) {
      addUnique(aiAndSystems, aiSeen, fallbackAi);
      combinedGlobalSeen.add(k);
    }
  }

  // Seed hardware defaults first so richer descriptions (e.g. IoT Water Sensors with pH, turbidity, TDS, temp) take precedence
  for (const hw of DEFAULT_HARDWARE_TOOL_SKILLS) {
    const k = normalizeKey(hw);
    if (!combinedGlobalSeen.has(k)) {
      addUnique(toolsAndHardware, toolSeen, hw);
      combinedGlobalSeen.add(k);
    }
  }

  for (const proj of input.projects) {
    for (const tech of proj.techStack || []) {
      const k = normalizeKey(tech);
      if (combinedGlobalSeen.has(k)) continue;
      if (k.includes('git') || k.includes('iot') || k.includes('sensor') || k.includes('arduino')) {
        addUnique(toolsAndHardware, toolSeen, tech);
      } else {
        addUnique(aiAndSystems, aiSeen, tech);
      }
      combinedGlobalSeen.add(k);
    }
    for (const mdl of proj.aiModelsUsed || []) {
      const k = normalizeKey(mdl);
      if (!combinedGlobalSeen.has(k)) {
        addUnique(modelsAndEcosystems, modelSeen, mdl);
        combinedGlobalSeen.add(k);
      }
    }
  }

  for (const exp of input.experiences) {
    for (const sk of exp.skillsUsed || []) {
      const k = normalizeKey(sk);
      if (!combinedGlobalSeen.has(k)) {
        addUnique(aiAndSystems, aiSeen, sk);
        combinedGlobalSeen.add(k);
      }
    }
  }

  for (const cert of input.certifications || []) {
    for (const sk of cert.skillsCovered || []) {
      const k = normalizeKey(sk);
      if (!combinedGlobalSeen.has(k)) {
        addUnique(aiAndSystems, aiSeen, sk);
        combinedGlobalSeen.add(k);
      }
    }
  }

  for (const model of input.aiModels || []) {
    const k = normalizeKey(model.name);
    if (!combinedGlobalSeen.has(k)) {
      addUnique(modelsAndEcosystems, modelSeen, model.name);
      combinedGlobalSeen.add(k);
    }
  }

  const groups: CvSkillGroup[] = [];
  if (programming.length > 0) {
    groups.push({ label: 'Programming & Web Languages', items: programming });
  }
  if (aiAndSystems.length > 0) {
    groups.push({ label: 'AI Engineering, Retrieval & Applied Systems', items: aiAndSystems });
  }
  if (modelsAndEcosystems.length > 0) {
    groups.push({
      label: 'AI Model Families & Ecosystems Explored',
      items: modelsAndEcosystems,
    });
  }
  if (toolsAndHardware.length > 0) {
    groups.push({ label: 'Tools, IoT & Embedded Hardware', items: toolsAndHardware });
  }

  return groups;
}
