/**
 * Wazeer OS v2.1 — Context Builder
 * Assembles the full system prompt by injecting dynamic context:
 * - Pending tasks (what the user still needs to do)
 * - User memories (what we know about the user)
 * - Current project context
 * Replaces {TASKS_CONTEXT}, {MEMORY_CONTEXT}, {PROJECT_CONTEXT} placeholders.
 */

import type { Task, Project, UserMemory, CustomSkill } from '@/types';
import { getRelevantMemories, formatMemoriesAsContext } from './MemoryEngine';

// ═══════════════════════════════════════════════════════════════════
// TASKS CONTEXT
// ═══════════════════════════════════════════════════════════════════

function formatTasksContext(tasks: Task[]): string {
  const pending = tasks.filter((t) => !t.completed);
  if (pending.length === 0) {
    return 'لا توجد مهام معلقة حالياً.';
  }

  // Sort by priority: critical > high > medium > low
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...pending].sort(
    (a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2),
  );

  const lines = sorted.slice(0, 15).map((t, i) => {
    const priorityLabel: Record<string, string> = {
      critical: 'حرج',
      high: 'عالي',
      medium: 'متوسط',
      low: 'منخفض',
    };
    const dueStr = t.dueDate ? ` | الموعد: ${t.dueDate}` : '';
    const tagsStr = t.tags.length > 0 ? ` | ${t.tags.map((tag) => `#${tag}`).join(' ')}` : '';
    return `${i + 1}. [${priorityLabel[t.priority] ?? t.priority}] ${t.text}${dueStr}${tagsStr}`;
  });

  const header = `مهام معلقة (${pending.length} مهامة):`;
  return `${header}\n${lines.join('\n')}`;
}

// ═══════════════════════════════════════════════════════════════════
// PROJECT CONTEXT
// ═══════════════════════════════════════════════════════════════════

function formatProjectContext(project: Project | null | undefined): string {
  if (!project) return 'لا يوجد مشروع نشط حالياً.';
  return `المشروع النشط: ${project.name}\nالوصف: ${project.summary || 'بدون وصف'}`;
}

// ═══════════════════════════════════════════════════════════════════
// SKILLS CONTEXT
// ═══════════════════════════════════════════════════════════════════

function formatSkillsContext(
  customSkills: CustomSkill[] = [],
  enabledSkillIds: string[] = [],
): string {
  const activeCustom = customSkills.filter(
    (s) => s.enabled && (enabledSkillIds.length === 0 || enabledSkillIds.includes(s.id)),
  );
  if (activeCustom.length === 0) return '';

  const skillDescriptions = activeCustom.map((s, idx) => {
    const name = s.nameAr || s.nameEn || 'Skill';
    const desc = s.descAr || s.descEn || '';
    return `${idx + 1}. **${name}**: ${desc}\n   تعليمات التنفيذ: ${s.promptSnippet}`;
  });

  return `\n\n## المهارات المخصصة المفعلة (Custom Skills Active)\nالتزم بالتعليمات والقواعد التالية الخاصة بكل مهارة مفعلة أدناه أثناء صياغة ردودك:\n${skillDescriptions.join('\n')}`;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN BUILDER
// ═══════════════════════════════════════════════════════════════════

/**
 * Builds the complete system prompt with dynamic context injected.
 * Replaces {TASKS_CONTEXT}, {MEMORY_CONTEXT}, {PROJECT_CONTEXT} placeholders.
 *
 * @param basePrompt - The BASE_SYSTEM_PROMPT with placeholders.
 * @param modePrefix - The chat mode prefix (from CHAT_MODES).
 * @param tasks - All user tasks (will filter pending).
 * @param projects - All user projects.
 * @param currentProjectId - Currently active project ID.
 * @param userQuery - The user's current message (for memory relevance scoring).
 * @param customSkills - User-created custom skills.
 * @param enabledSkillIds - List of active skill IDs (built-in and custom).
 * @returns Complete system prompt ready for the LLM.
 */
export async function buildContextualPrompt({
  basePrompt,
  modePrefix,
  tasks,
  projects,
  currentProjectId,
  userQuery,
  customSkills = [],
  enabledSkillIds = [],
}: {
  basePrompt: string;
  modePrefix: string;
  tasks: Task[];
  projects: Project[];
  currentProjectId: string | null;
  userQuery: string;
  customSkills?: CustomSkill[];
  enabledSkillIds?: string[];
}): Promise<string> {
  // 1. Build tasks context (synchronous — fast)
  const tasksContext = formatTasksContext(tasks);

  // 2. Build project context (synchronous)
  const activeProject = projects.find((p) => p.id === currentProjectId) ?? null;
  const projectContext = formatProjectContext(activeProject);

  // 3. Fetch relevant memories (async — may hit IndexedDB)
  let memoryContext = 'لا توجد ذاكرة مخزنة بعد.';
  try {
    const memories = await getRelevantMemories(userQuery, 8);
    if (memories.length > 0) {
      memoryContext = formatMemoriesAsContext(memories);
    }
  } catch (err) {
    console.warn('[ContextBuilder] Failed to load memories:', err);
  }

  // 4. Inject all contexts into the base prompt
  const contextualPrompt = basePrompt
    .replace('{TASKS_CONTEXT}', tasksContext)
    .replace('{MEMORY_CONTEXT}', memoryContext)
    .replace('{PROJECT_CONTEXT}', projectContext);

  // 5. Append mode prefix if any (minister mode has empty prefix)
  let finalPrompt = modePrefix
    ? `${contextualPrompt}\n\n## وضع خاص\n${modePrefix}`
    : contextualPrompt;

  // 6. Append enabled custom skills instructions
  const skillsContext = formatSkillsContext(customSkills, enabledSkillIds);
  if (skillsContext) {
    finalPrompt += skillsContext;
  }

  return finalPrompt;
}

