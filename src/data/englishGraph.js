/**
 * English Knowledge Graph — Graph RAG cho module Tiếng Anh.
 *
 * 7 skill nodes chính (thay vì prerequisite chain như Toán):
 * vocab ← grammar ← writing  (foundational path)
 * vocab ← listening ← reading  (receptive path)
 * vocab ← pronunciation
 *
 * Mỗi skill node có 3 level: beginner | intermediate | advanced
 * User progress được track trong User.englishStats.skillsPracticed
 */
export const ENGLISH_GRAPH = {
  nodes: [
    // Skill root
    { id: 'vocabulary', name: 'Từ vựng', grade: 6, level: 1, category: 'skill' },

    // Foundational path
    { id: 'grammar', name: 'Ngữ pháp', grade: 6, level: 2, category: 'skill', prereq: 'vocabulary' },
    { id: 'writing', name: 'Viết', grade: 8, level: 3, category: 'skill', prereq: 'grammar' },

    // Receptive path
    { id: 'listening', name: 'Nghe', grade: 6, level: 2, category: 'skill', prereq: 'vocabulary' },
    { id: 'reading', name: 'Đọc', grade: 7, level: 3, category: 'skill', prereq: 'listening' },

    // Pronunciation (side branch)
    { id: 'pronunciation', name: 'Phát âm', grade: 6, level: 2, category: 'skill', prereq: 'vocabulary' },

    // Conversation (advanced synthesis)
    { id: 'conversation', name: 'Hội thoại', grade: 9, level: 4, category: 'skill', prereq: 'grammar' },
  ],

  // Skill → weakness propagation
  // Nếu vocab yếu → các skill phụ thuộc đều受影响
  skillDependencies: {
    vocabulary: [],
    grammar: ['vocabulary'],
    writing: ['vocabulary', 'grammar'],
    listening: ['vocabulary'],
    reading: ['vocabulary', 'listening'],
    pronunciation: ['vocabulary'],
    conversation: ['vocabulary', 'grammar'],
  },

  // Grade-to-skill-level mapping
  gradeSkillTargets: {
    6:  { vocabulary: 'beginner', grammar: 'beginner', listening: 'beginner', pronunciation: 'beginner', reading: 'beginner', writing: 'beginner', conversation: 'beginner' },
    7:  { vocabulary: 'beginner', grammar: 'beginner', listening: 'beginner', pronunciation: 'beginner', reading: 'beginner', writing: 'beginner', conversation: 'beginner' },
    8:  { vocabulary: 'intermediate', grammar: 'intermediate', listening: 'intermediate', pronunciation: 'intermediate', reading: 'intermediate', writing: 'intermediate', conversation: 'intermediate' },
    9:  { vocabulary: 'intermediate', grammar: 'intermediate', listening: 'intermediate', pronunciation: 'intermediate', reading: 'intermediate', writing: 'intermediate', conversation: 'intermediate' },
    10: { vocabulary: 'upper_intermediate', grammar: 'upper_intermediate', listening: 'upper_intermediate', pronunciation: 'upper_intermediate', reading: 'upper_intermediate', writing: 'upper_intermediate', conversation: 'upper_intermediate' },
    11: { vocabulary: 'advanced', grammar: 'advanced', listening: 'advanced', pronunciation: 'advanced', reading: 'advanced', writing: 'advanced', conversation: 'advanced' },
    12: { vocabulary: 'advanced', grammar: 'advanced', listening: 'advanced', pronunciation: 'advanced', reading: 'advanced', writing: 'advanced', conversation: 'advanced' },
  },
};

export const ENGLISH_NODE_BY_ID = Object.fromEntries(
  ENGLISH_GRAPH.nodes.map((n) => [n.id, n])
);

/** Skill label tiếng Việt → English key */
export const SKILL_ID_MAP = {
  'Từ vựng': 'vocabulary',
  'Ngữ pháp': 'grammar',
  'Viết': 'writing',
  'Nghe': 'listening',
  'Đọc': 'reading',
  'Phát âm': 'pronunciation',
  'Hội thoại': 'conversation',
};
