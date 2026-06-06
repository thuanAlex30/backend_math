/**
 * English Graph RAG Service
 * - Inject personalized context vào AI prompts dựa trên skill profile
 * - Gợi ý skill yếu để ôn tập
 * - Context cho từng module: vocab, grammar, listening, reading, writing, pronunciation, chat
 */
import { ENGLISH_GRAPH, ENGLISH_NODE_BY_ID } from '../data/englishGraph.js';

const SKILL_KEYS = ['vocabulary', 'grammar', 'pronunciation', 'listening', 'reading', 'writing', 'chat'];

const SKILL_LABELS = {
  vocabulary: 'Từ vựng',
  grammar: 'Ngữ pháp',
  pronunciation: 'Phát âm',
  listening: 'Nghe',
  reading: 'Đọc hiểu',
  writing: 'Viết',
  chat: 'Hội thoại',
};

/**
 * Lấy skill status từ englishStats.skillsPracticed
 * @param {object} skillsPracticed - { vocab: 0, grammar: 0, ... }
 * @returns {{ id, name, level, status, score, prereqs }[]}
 */
export function getEnglishSkillStatuses(skillsPracticed) {
  if (!skillsPracticed) return ENGLISH_GRAPH.nodes.map((n) => ({ ...n, status: 'unknown', score: 0 }));

  return ENGLISH_GRAPH.nodes.map((node) => {
    const score = skillsPracticed[node.id] ?? 0;
    let status = 'unknown';
    if (score >= 10) status = 'strong';
    else if (score >= 3) status = 'learning';
    else if (score > 0) status = 'weak';

    // Propagate weakness from prerequisites
    const deps = ENGLISH_GRAPH.skillDependencies[node.id] || [];
    const hasWeakPrereq = deps.some((dep) => {
      const ds = skillsPracticed[dep] ?? 0;
      return ds < 3 && ds < score * 0.5;
    });
    if (hasWeakPrereq && status === 'strong') status = 'learning';

    return { ...node, status, score };
  });
}

/**
 * Lấy các skill yếu cần ôn tập
 */
export function getWeakEnglishSkills(skillsPracticed) {
  const statuses = getEnglishSkillStatuses(skillsPracticed);
  return statuses
    .filter((s) => s.status === 'weak' || s.status === 'learning')
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
}

/**
 * Lấy skill mạnh
 */
export function getStrongEnglishSkills(skillsPracticed) {
  const statuses = getEnglishSkillStatuses(skillsPracticed);
  return statuses.filter((s) => s.status === 'strong');
}

/**
 * Xây context cá nhân hóa cho AI prompt dựa trên skill profile
 * @param {object} skillsPracticed
 * @param {string} module - vocab | grammar | listening | reading | writing | pronunciation | chat
 * @param {number} grade
 */
export function buildEnglishPersonalizedContext(skillsPracticed, module, grade) {
  if (!skillsPracticed) return '';

  const weak = getWeakEnglishSkills(skillsPracticed);
  const parts = [];

  if (weak.length > 0) {
    const names = weak.map((s) => s.name).join(', ');
    parts.push(`Học sinh đang yếu hoặc chưa vững: ${names}.`);
  }

  const moduleNode = ENGLISH_NODE_BY_ID[module];
  if (moduleNode) {
    parts.push(`Kỹ năng hiện tại: ${moduleNode.name}.`);

    // Gợi ý nền tảng cần ôn nếu prerequisite chưa vững
    const prereqs = ENGLISH_GRAPH.skillDependencies[module] || [];
    for (const prereq of prereqs) {
      const ps = skillsPracticed[prereq] ?? 0;
      if (ps < 3) {
        const prereqNode = ENGLISH_NODE_BY_ID[prereq];
        parts.push(`Cần củng cố nền tảng ${prereqNode?.name || prereq} trước khi học ${moduleNode.name}.`);
      }
    }
  }

  // Progress hiện tại
  const practicedCount = SKILL_KEYS.filter((k) => (skillsPracticed[k] ?? 0) > 0).length;
  if (practicedCount > 0) {
    parts.push(`Đã luyện ${practicedCount}/${SKILL_KEYS.length} kỹ năng.`);
  }

  if (parts.length === 0) return '';

  return `[Graph RAG — Cá nhân hóa English]\n${parts.join('\n')}`;
}

/**
 * Map skill practiced từ module result để cập nhật profile
 * @param {string} module - vocab | grammar | ...
 * @param {number} score - 0-100
 * @param {number} grade
 */
export function gradeToSkillScore(module, score, grade) {
  // Chuyển điểm % → "skill level" (count of practice sessions)
  // 1 lần practice = +1 score, mỗi 3 điểm perfect = +1
  if (score >= 80) return 2;
  if (score >= 50) return 1;
  return 0;
}

/**
 * Cập nhật skill practiced count sau khi hoàn thành 1 bài tập
 * @param {object} skillsPracticed
 * @param {string} module
 * @param {number} score 0-100
 */
export function updateSkillPracticed(skillsPracticed, module, score) {
  if (!skillsPracticed || !module) return skillsPracticed;
  const current = skillsPracticed[module] ?? 0;
  // Chỉ tăng count khi score >= 50%
  const bonus = score >= 80 ? 2 : score >= 50 ? 1 : 0;
  return { ...skillsPracticed, [module]: Math.min(current + bonus, 100) };
}
