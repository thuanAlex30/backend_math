/**
 * Knowledge graph tĩnh — chương trình Toán Việt Nam (lớp 6–12).
 * Dùng cho Graph RAG: duyệt prerequisite, gợi ý ôn tập cá nhân hóa.
 */
export const MATH_GRAPH = {
  nodes: [
    // ─── Lớp 6 ───
    { id: 'so_hoc_6', name: 'Số học cơ bản', grade: 6, level: 1 },
    { id: 'phan_so', name: 'Phân số & Tỉ lệ', grade: 6, level: 2 },
    { id: 'hinh_hoc_6', name: 'Hình học cơ bản', grade: 6, level: 1 },
    { id: 'thap_phan', name: 'Số thập phân', grade: 6, level: 2 },
    // ─── Lớp 7 ───
    { id: 'dai_so_7', name: 'Đại số 7 (tỉ lệ, hàm số)', grade: 7, level: 2 },
    { id: 'hinh_hoc_7', name: 'Hình học 7 (tam giác)', grade: 7, level: 2 },
    { id: 'ti_le', name: 'Tỉ lệ thuận & nghịch', grade: 7, level: 2 },
    // ─── Lớp 8 ───
    { id: 'da_thuc', name: 'Đa thức & Phân tích đa thức', grade: 8, level: 2 },
    { id: 'hinh_binh_hanh', name: 'Hình bình hành & Hình thang', grade: 8, level: 2 },
    { id: 'phuong_trinh_bac_nhat_8', name: 'Phương trình bậc nhất', grade: 8, level: 2 },
    { id: 'tam_giac_dong_dang', name: 'Tam giác đồng dạng', grade: 8, level: 3 },
    // ─── Lớp 9 ───
    { id: 'he_pt_bac_nhat_9', name: 'Hệ phương trình bậc nhất', grade: 9, level: 3 },
    { id: 'ham_so_9', name: 'Hàm số bậc nhất & bậc 2', grade: 9, level: 3 },
    { id: 'phuong_trinh_bac_hai', name: 'Phương trình bậc 2', grade: 9, level: 3 },
    { id: 'he_thuc_viete', name: 'Hệ thức Viete', grade: 9, level: 3 },
    { id: 'hinh_tron', name: 'Đường tròn', grade: 9, level: 3 },
    { id: 'to_hop_xac_suat_9', name: 'Tổ hợp & Xác suất 9', grade: 9, level: 3 },
    // ─── Lớp 10 ───
    { id: 'ham_so', name: 'Hàm số', grade: 10, level: 1 },
    { id: 'phuong_trinh', name: 'Phương trình', grade: 10, level: 1 },
    { id: 'bat_phuong_trinh', name: 'Bất phương trình', grade: 10, level: 1 },
    { id: 'bat_phuong_trinh_bac_hai', name: 'Bất phương trình bậc hai', grade: 10, level: 2 },
    { id: 'vector', name: 'Vector', grade: 10, level: 2 },
    { id: 'phuong_trinh_duong_thang', name: 'Phương trình đường thẳng', grade: 10, level: 2 },
    { id: 'phuong_trinh_duong_tron', name: 'Phương trình đường tròn', grade: 10, level: 2 },
    // ─── Lớp 11 ───
    { id: 'gioi_han', name: 'Giới hạn hàm số', grade: 11, level: 2 },
    { id: 'dao_ham', name: 'Đạo hàm', grade: 11, level: 3 },
    { id: 'dao_ham_ung_dung', name: 'Ứng dụng đạo hàm', grade: 11, level: 4 },
    { id: 'luong_giac', name: 'Lượng giác', grade: 11, level: 2 },
    { id: 'ham_so_mu', name: 'Hàm số mũ', grade: 11, level: 3 },
    { id: 'logarit', name: 'Logarit', grade: 11, level: 3 },
    { id: 'ham_so_log', name: 'Hàm số logarit', grade: 11, level: 3 },
    { id: 'to_hop', name: 'Tổ hợp', grade: 11, level: 2 },
    { id: 'xac_suat', name: 'Xác suất', grade: 11, level: 3 },
    { id: 'hinh_hoc_khong_gian', name: 'Hình học không gian', grade: 11, level: 3 },
    // ─── Lớp 12 ───
    { id: 'nguyen_ham', name: 'Nguyên hàm', grade: 12, level: 3 },
    { id: 'tich_phan', name: 'Tích phân', grade: 12, level: 4 },
    { id: 'tich_phan_ung_dung', name: 'Ứng dụng tích phân', grade: 12, level: 5 },
    { id: 'so_phuc', name: 'Số phức', grade: 12, level: 3 },
    { id: 'hinh_hoc_giai_tich', name: 'Hình học giải tích', grade: 12, level: 4 },
  ],
  edges: [
    // Grade 6 → 7
    { from: 'so_hoc_6', to: 'phan_so', relation: 'prerequisite_of' },
    { from: 'phan_so', to: 'ti_le', relation: 'prerequisite_of' },
    { from: 'hinh_hoc_6', to: 'hinh_hoc_7', relation: 'prerequisite_of' },
    { from: 'thap_phan', to: 'phan_so', relation: 'related_to' },
    // Grade 7 → 8
    { from: 'phan_so', to: 'dai_so_7', relation: 'prerequisite_of' },
    { from: 'ti_le', to: 'dai_so_7', relation: 'prerequisite_of' },
    { from: 'ti_le', to: 'hinh_hoc_7', relation: 'related_to' },
    { from: 'phan_so', to: 'hinh_hoc_7', relation: 'related_to' },
    // Grade 8 → 9
    { from: 'dai_so_7', to: 'phuong_trinh_bac_nhat_8', relation: 'prerequisite_of' },
    { from: 'phuong_trinh_bac_nhat_8', to: 'he_pt_bac_nhat_9', relation: 'prerequisite_of' },
    { from: 'hinh_hoc_7', to: 'tam_giac_dong_dang', relation: 'prerequisite_of' },
    { from: 'tam_giac_dong_dang', to: 'hinh_tron', relation: 'prerequisite_of' },
    { from: 'da_thuc', to: 'phuong_trinh_bac_nhat_8', relation: 'prerequisite_of' },
    { from: 'hinh_binh_hanh', to: 'tam_giac_dong_dang', relation: 'related_to' },
    { from: 'dai_so_7', to: 'ham_so_9', relation: 'prerequisite_of' },
    { from: 'phan_so', to: 'phuong_trinh_bac_hai', relation: 'prerequisite_of' },
    // Grade 9 → 10
    { from: 'phuong_trinh_bac_hai', to: 'phuong_trinh', relation: 'prerequisite_of' },
    { from: 'he_pt_bac_nhat_9', to: 'bat_phuong_trinh', relation: 'prerequisite_of' },
    { from: 'ham_so_9', to: 'ham_so', relation: 'prerequisite_of' },
    { from: 'hinh_tron', to: 'phuong_trinh_duong_tron', relation: 'prerequisite_of' },
    { from: 'to_hop_xac_suat_9', to: 'to_hop', relation: 'prerequisite_of' },
    // Grade 10 → 11
    { from: 'ham_so', to: 'gioi_han', relation: 'prerequisite_of' },
    { from: 'gioi_han', to: 'dao_ham', relation: 'prerequisite_of' },
    { from: 'dao_ham', to: 'dao_ham_ung_dung', relation: 'prerequisite_of' },
    { from: 'dao_ham', to: 'nguyen_ham', relation: 'prerequisite_of' },
    { from: 'luong_giac', to: 'ham_so_mu', relation: 'related_to' },
    { from: 'logarit', to: 'ham_so_log', relation: 'prerequisite_of' },
    { from: 'ham_so_mu', to: 'ham_so_log', relation: 'related_to' },
    { from: 'to_hop', to: 'xac_suat', relation: 'prerequisite_of' },
    { from: 'vector', to: 'hinh_hoc_khong_gian', relation: 'prerequisite_of' },
    // Grade 11 → 12
    { from: 'nguyen_ham', to: 'tich_phan', relation: 'prerequisite_of' },
    { from: 'tich_phan', to: 'tich_phan_ung_dung', relation: 'prerequisite_of' },
    { from: 'tich_phan', to: 'hinh_hoc_giai_tich', relation: 'prerequisite_of' },
    { from: 'phuong_trinh', to: 'bat_phuong_trinh', relation: 'prerequisite_of' },
    { from: 'bat_phuong_trinh', to: 'bat_phuong_trinh_bac_hai', relation: 'prerequisite_of' },
    { from: 'phuong_trinh', to: 'phuong_trinh_duong_thang', relation: 'related_to' },
    { from: 'phuong_trinh_duong_thang', to: 'phuong_trinh_duong_tron', relation: 'prerequisite_of' },
    // Cross-grade relationships
    { from: 'luong_giac', to: 'hinh_hoc_khong_gian', relation: 'related_to' },
    { from: 'ham_so', to: 'dao_ham_ung_dung', relation: 'related_to' },
    { from: 'phuong_trinh', to: 'so_phuc', relation: 'related_to' },
    { from: 'dao_ham', to: 'tich_phan', relation: 'harder_than' },
    { from: 'gioi_han', to: 'tich_phan', relation: 'prerequisite_of' },
    { from: 'bat_phuong_trinh_bac_hai', to: 'dao_ham_ung_dung', relation: 'related_to' },
  ],
};

/** Map nhanh id → node */
export const NODE_BY_ID = Object.fromEntries(MATH_GRAPH.nodes.map((n) => [n.id, n]));
