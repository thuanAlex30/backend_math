/**
 * Chương trình phân lớp 6–12 — Toán & Tiếng Anh (VN)
 */

const MATH_TOPICS = {
  6: [
    { id: 'phanso', label: 'Phân số' },
    { id: 'sothapphan', label: 'Số thập phân' },
    { id: 'hinh_hoc_co_ban', label: 'Hình học cơ bản' },
    { id: 'do_luong', label: 'Đo lường' },
    { id: 'thong_ke_co_ban', label: 'Thống kê cơ bản' },
  ],
  7: [
    { id: 'so_huu_ti', label: 'Số hữu tỉ' },
    { id: 'bieu_thuc_dai_so', label: 'Biểu thức đại số' },
    { id: 'phuong_trinh_bac_nhat', label: 'Phương trình bậc nhất' },
    { id: 'hinh_hoc', label: 'Hình học' },
    { id: 'tam_giac', label: 'Tam giác' },
  ],
  8: [
    { id: 'can_bac_hai', label: 'Căn bậc hai' },
    { id: 'phuong_trinh_bac_hai', label: 'Phương trình bậc hai' },
    { id: 'he_phuong_trinh', label: 'Hệ phương trình' },
    { id: 'bat_dang_thuc', label: 'Bất đẳng thức' },
    { id: 'tu_giac', label: 'Tứ giác' },
  ],
  9: [
    { id: 'phuong_trinh_bac_hai', label: 'Phương trình bậc hai' },
    { id: 'ham_so_bac_nhat', label: 'Hàm số bậc nhất' },
    { id: 'he_thuc_luong', label: 'Hệ thức lượng' },
    { id: 'hinh_tron', label: 'Đường tròn' },
    { id: 'thong_ke', label: 'Thống kê' },
  ],
  10: [
    { id: 'ham_so', label: 'Hàm số' },
    { id: 'phuong_trinh', label: 'Phương trình' },
    { id: 'bat_phuong_trinh', label: 'Bất phương trình' },
    { id: 'vector', label: 'Vector' },
    { id: 'luong_giac_co_ban', label: 'Lượng giác cơ bản' },
  ],
  11: [
    { id: 'gioi_han', label: 'Giới hạn' },
    { id: 'dao_ham', label: 'Đạo hàm' },
    { id: 'luong_giac', label: 'Lượng giác' },
    { id: 'logarit', label: 'Logarit' },
    { id: 'xac_suat', label: 'Xác suất' },
  ],
  12: [
    { id: 'nguyen_ham', label: 'Nguyên hàm' },
    { id: 'tich_phan', label: 'Tích phân' },
    { id: 'so_phuc', label: 'Số phức' },
    { id: 'hinh_hoc_khong_gian', label: 'Hình học không gian' },
    { id: 'xac_suat_nang_cao', label: 'Xác suất nâng cao' },
  ],
};

const ENGLISH_TOPICS = {
  6: [
    { id: 'alphabet-numbers', label: 'Bảng chữ cái & số' },
    { id: 'greetings', label: 'Chào hỏi' },
    { id: 'family', label: 'Gia đình' },
    { id: 'present-simple', label: 'Hiện tại đơn' },
    { id: 'school', label: 'Trường học' },
  ],
  7: [
    { id: 'daily-routine', label: 'Thói quen hàng ngày' },
    { id: 'present-continuous', label: 'Hiện tại tiếp diễn' },
    { id: 'food', label: 'Đồ ăn' },
    { id: 'past-simple', label: 'Quá khứ đơn' },
    { id: 'hobbies', label: 'Sở thích' },
  ],
  8: [
    { id: 'comparatives', label: 'So sánh hơn' },
    { id: 'future-simple', label: 'Tương lai đơn' },
    { id: 'travel', label: 'Du lịch' },
    { id: 'health', label: 'Sức khỏe' },
    { id: 'passive-basic', label: 'Bị động cơ bản' },
  ],
  9: [
    { id: 'conditionals-0-1', label: 'Câu điều kiện loại 0–1' },
    { id: 'reported-speech', label: 'Câu gián tiếp' },
    { id: 'technology', label: 'Công nghệ' },
    { id: 'environment', label: 'Môi trường' },
    { id: 'relative-clauses', label: 'Mệnh đề quan hệ' },
  ],
  10: [
    { id: 'present-perfect', label: 'Hiện tại hoàn thành' },
    { id: 'passive', label: 'Câu bị động' },
    { id: 'conditionals', label: 'Câu điều kiện' },
    { id: 'education', label: 'Giáo dục' },
    { id: 'media', label: 'Truyền thông' },
  ],
  11: [
    { id: 'advanced-grammar', label: 'Ngữ pháp nâng cao' },
    { id: 'academic-writing', label: 'Viết học thuật' },
    { id: 'science', label: 'Khoa học' },
    { id: 'global-issues', label: 'Vấn đề toàn cầu' },
    { id: 'formal-email', label: 'Email trang trọng' },
  ],
  12: [
    { id: 'thpt-exam-vocab', label: 'Từ vựng ôn thi THPT' },
    { id: 'thpt-grammar', label: 'Ngữ pháp ôn thi' },
    { id: 'reading-comprehension', label: 'Đọc hiểu' },
    { id: 'writing-essay', label: 'Viết luận' },
    { id: 'listening-exam', label: 'Nghe thi' },
  ],
};

export const CURRICULUM = {
  math: MATH_TOPICS,
  english: ENGLISH_TOPICS,
};

export const GRADES = [6, 7, 8, 9, 10, 11, 12];

export function isValidGrade(grade) {
  return GRADES.includes(Number(grade));
}

export function isValidSubject(subject) {
  return subject === 'math' || subject === 'english';
}

/** Danh sách chủ đề theo lớp và môn */
export function getTopics(subject, grade) {
  const g = Number(grade);
  if (!isValidSubject(subject) || !isValidGrade(g)) return [];
  return CURRICULUM[subject][g] || [];
}

/** Nhãn hiển thị của chủ đề */
export function getTopicLabel(subject, grade, topicId) {
  const topics = getTopics(subject, grade);
  const found = topics.find((t) => t.id === topicId);
  return found?.label || topicId;
}
