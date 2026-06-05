import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { MATH_GRAPH, NODE_BY_ID } from '../data/mathGraph.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = path.join(__dirname, '../../data/profiles');

/** Keyword tiếng Việt / không dấu → node id (ưu tiên cụm dài trước) */
const TOPIC_KEYWORDS = [
  { id: 'tich_phan_ung_dung', patterns: ['ứng dụng tích phân', 'ung dung tich phan', 'diện tích giới hạn'] },
  { id: 'dao_ham_ung_dung', patterns: ['ứng dụng đạo hàm', 'ung dung dao ham', 'cực trị', 'cuc tri', 'tiệm cận'] },
  { id: 'hinh_hoc_giai_tich', patterns: ['hình học giải tích', 'hinh hoc giai tich'] },
  { id: 'hinh_hoc_khong_gian', patterns: ['hình học không gian', 'hinh hoc khong gian', 'mp//', 'mp ⊥'] },
  { id: 'bat_phuong_trinh_bac_hai', patterns: ['bất phương trình bậc hai', 'bat phuong trinh bac hai'] },
  { id: 'phuong_trinh_duong_tron', patterns: ['phương trình đường tròn', 'phuong trinh duong tron', 'đường tròn'] },
  { id: 'phuong_trinh_duong_thang', patterns: ['phương trình đường thẳng', 'phuong trinh duong thang', 'đường thẳng'] },
  { id: 'ham_so_log', patterns: ['hàm số logarit', 'ham so logarit', 'logarit'] },
  { id: 'ham_so_mu', patterns: ['hàm số mũ', 'ham so mu', 'mũ x', 'mu x'] },
  { id: 'nguyen_ham', patterns: ['nguyên hàm', 'nguyen ham'] },
  { id: 'tich_phan', patterns: ['tích phân', 'tich phan', '∫', 'integral'] },
  { id: 'dao_ham', patterns: ['đạo hàm', 'dao ham', "f'(x)", 'vi phân'] },
  { id: 'gioi_han', patterns: ['giới hạn', 'gioi han', 'lim'] },
  { id: 'luong_giac', patterns: ['lượng giác', 'luong giac', 'sin', 'cos', 'tan', 'cot'] },
  { id: 'logarit', patterns: ['logarit', 'log '] },
  { id: 'xac_suat', patterns: ['xác suất', 'xac suat', 'probability'] },
  { id: 'to_hop', patterns: ['tổ hợp', 'to hop', 'chỉnh hợp', 'chinh hop', 'n!'] },
  { id: 'so_phuc', patterns: ['số phức', 'so phuc', 'i²', 'phức'] },
  { id: 'vector', patterns: ['vector', 'vectơ', 'vecto', 'tích vô hướng', 'tich vo huong'] },
  { id: 'bat_phuong_trinh', patterns: ['bất phương trình', 'bat phuong trinh'] },
  { id: 'phuong_trinh', patterns: ['phương trình', 'phuong trinh', 'nghiệm', 'nghiem', 'x²', 'x^2'] },
  { id: 'ham_so', patterns: ['hàm số', 'ham so', 'đồ thị', 'do thi', 'parabol'] },
];

/** Tạo thư mục lưu profile nếu chưa có (gọi lúc server khởi động) */
export async function ensureProfilesDir() {
  await mkdir(PROFILES_DIR, { recursive: true });
}

export function sanitizeSessionId(sessionId) {
  return String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

function profilePath(sessionId) {
  return path.join(PROFILES_DIR, `${sanitizeSessionId(sessionId)}.json`);
}

function emptyProfile(sessionId) {
  return { sessionId: sanitizeSessionId(sessionId), topics: {} };
}

/** Đọc profile học sinh từ JSON local */
export async function getStudentProfile(sessionId) {
  if (!sessionId) return null;
  await ensureProfilesDir();
  const fp = profilePath(sessionId);
  try {
    const raw = await readFile(fp, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return emptyProfile(sessionId);
    throw err;
  }
}

/**
 * Cập nhật profile sau mỗi lần làm bài.
 * isCorrect: true → correctCount++, false → errorCount++ (học sinh cần trợ giúp / chưa vững)
 */
export async function updateStudentProfile(sessionId, topicId, isCorrect) {
  if (!sessionId || !topicId) return;
  await ensureProfilesDir();
  const profile = (await getStudentProfile(sessionId)) || emptyProfile(sessionId);
  if (!profile.topics[topicId]) {
    profile.topics[topicId] = { errorCount: 0, correctCount: 0, lastSeen: null };
  }
  const entry = profile.topics[topicId];
  if (isCorrect === true) entry.correctCount += 1;
  else if (isCorrect === false) entry.errorCount += 1;
  entry.lastSeen = new Date().toISOString();
  await writeFile(profilePath(sessionId), JSON.stringify(profile, null, 2), 'utf-8');
  return profile;
}

/** Phân loại chủ đề từ câu hỏi bằng keyword matching */
export async function classifyTopic(question) {
  const q = (question || '').toLowerCase();
  const normalized = q.normalize('NFD').replace(/\p{M}/gu, ''); // bỏ dấu để match linh hoạt

  for (const { id, patterns } of TOPIC_KEYWORDS) {
    for (const p of patterns) {
      const pat = p.toLowerCase();
      const patNorm = pat.normalize('NFD').replace(/\p{M}/gu, '');
      if (q.includes(pat) || normalized.includes(patNorm)) return id;
    }
  }
  return null;
}

/**
 * Duyệt graph ngược từ topicId — tìm prerequisite chưa vững trong profile.
 * Coi "yếu" khi errorCount > correctCount hoặc errorCount >= 2.
 */
export function traverseWeakPrerequisites(profile, mathGraph, topicId) {
  if (!topicId || !profile?.topics) return [];

  const weak = new Set();
  const visited = new Set();

  function isWeak(nodeId) {
    const t = profile.topics[nodeId];
    if (!t) return false;
    return t.errorCount > t.correctCount || t.errorCount >= 2;
  }

  function walkPrereqs(targetId) {
    if (visited.has(targetId)) return;
    visited.add(targetId);

    const prereqEdges = mathGraph.edges.filter(
      (e) => e.to === targetId && e.relation === 'prerequisite_of'
    );

    for (const edge of prereqEdges) {
      if (isWeak(edge.from)) {
        weak.add(edge.from);
      }
      walkPrereqs(edge.from);
    }
  }

  walkPrereqs(topicId);

  // Chủ đề hiện tại cũng yếu → thêm vào danh sách
  if (isWeak(topicId)) {
    weak.add(topicId);
  }

  return [...weak].map((id) => NODE_BY_ID[id]).filter(Boolean);
}

/**
 * Tạo chuỗi context inject vào system prompt — cá nhân hóa theo profile + graph.
 */
export async function buildPersonalizedContext(sessionId, question) {
  if (!sessionId) return '';

  const topicId = await classifyTopic(question);
  const profile = await getStudentProfile(sessionId);
  if (!profile) return '';

  const parts = [];

  if (topicId && profile.topics[topicId]) {
    const t = profile.topics[topicId];
    const node = NODE_BY_ID[topicId];
    if (t.errorCount > t.correctCount || t.errorCount >= 2) {
      parts.push(
        `Học sinh này đang yếu: ${node?.name || topicId} (sai/nhờ giúp ${t.errorCount} lần, đúng ${t.correctCount} lần).`
      );
    }
  }

  const weakNodes = traverseWeakPrerequisites(profile, MATH_GRAPH, topicId);
  if (weakNodes.length > 0) {
    const names = weakNodes.map((n) => n.name).join(', ');
    parts.push(`Cần ôn trước: ${names}. Hãy giải thích từ nền tảng, liên hệ kiến thức nền nếu cần.`);
  } else if (topicId && NODE_BY_ID[topicId]) {
    parts.push(`Chủ đề bài hiện tại: ${NODE_BY_ID[topicId].name}. Điều chỉnh độ chi tiết phù hợp học sinh THPT.`);
  }

  if (parts.length === 0) return '';

  return `[Graph RAG — Cá nhân hóa học sinh]\n${parts.join('\n')}`;
}

/** Trạng thái node theo profile */
export function getTopicStatus(profile, topicId) {
  const t = profile?.topics?.[topicId];
  if (!t) return 'unknown';
  if (t.errorCount > t.correctCount || t.errorCount >= 2) return 'weak';
  if (t.correctCount > t.errorCount && t.correctCount >= 2) return 'strong';
  return 'learning';
}

function severityFromEntry(entry) {
  const diff = (entry?.errorCount || 0) - (entry?.correctCount || 0);
  if (diff >= 3 || (entry?.errorCount || 0) >= 4) return 'high';
  if (diff >= 1 || (entry?.errorCount || 0) >= 2) return 'medium';
  return 'low';
}

/** Chủ đề yếu — sắp xếp theo mức độ nghiêm trọng */
export function getWeakTopics(profile) {
  if (!profile?.topics) return [];
  return Object.entries(profile.topics)
    .filter(([, e]) => e.errorCount > e.correctCount || e.errorCount >= 2)
    .map(([id, e]) => ({
      id,
      name: NODE_BY_ID[id]?.name || id,
      grade: NODE_BY_ID[id]?.grade || null,
      severity: severityFromEntry(e),
      errorCount: e.errorCount,
      correctCount: e.correctCount,
    }))
    .sort((a, b) => b.errorCount - a.errorCount);
}

/** Chủ đề vững */
export function getStrongTopics(profile) {
  if (!profile?.topics) return [];
  return Object.entries(profile.topics)
    .filter(([, e]) => e.correctCount > e.errorCount && e.correctCount >= 2)
    .map(([id, e]) => ({
      id,
      name: NODE_BY_ID[id]?.name || id,
      grade: NODE_BY_ID[id]?.grade || null,
      correctCount: e.correctCount,
    }))
    .sort((a, b) => b.correctCount - a.correctCount);
}

/** Prerequisite cần ôn cho chủ đề yếu */
export function getPrerequisitesToReview(profile, weakTopicIds) {
  const result = [];
  const seen = new Set();
  for (const topicId of weakTopicIds) {
    const prereqs = traverseWeakPrerequisites(profile, MATH_GRAPH, topicId);
    for (const node of prereqs) {
      if (seen.has(node.id)) continue;
      seen.add(node.id);
      result.push({
        id: node.id,
        name: node.name,
        forTopic: topicId,
      });
    }
  }
  return result;
}

/** Bản đồ kiến thức — nodes + edges kèm status */
export function getKnowledgeMap(profile, gradeFilter) {
  let nodes = MATH_GRAPH.nodes.map((n) => ({
    ...n,
    status: getTopicStatus(profile, n.id),
    ...(profile?.topics?.[n.id] || {}),
  }));
  if (gradeFilter) {
    const g = Number(gradeFilter);
    nodes = nodes.filter((n) => n.grade === g);
  }
  return {
    nodes,
    edges: MATH_GRAPH.edges,
  };
}

/** Ghi nhận kết quả luyện tập — cập nhật profile theo tỷ lệ đúng */
export async function recordPracticeResult(sessionId, topicId, correct, total) {
  if (!sessionId || !topicId || !total) return null;
  const ratio = correct / total;
  const isCorrect = ratio >= 0.8;
  return updateStudentProfile(sessionId, topicId, isCorrect);
}
