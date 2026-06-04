/**
 * Knowledge graph tĩnh — chương trình Toán THPT Việt Nam (lớp 10–12).
 * Dùng cho Graph RAG: duyệt prerequisite, gợi ý ôn tập cá nhân hóa.
 */
export const MATH_GRAPH = {
  nodes: [
    { id: 'ham_so', name: 'Hàm số', grade: 10, level: 1 },
    { id: 'phuong_trinh', name: 'Phương trình', grade: 10, level: 1 },
    { id: 'bat_phuong_trinh', name: 'Bất phương trình', grade: 10, level: 1 },
    { id: 'bat_phuong_trinh_bac_hai', name: 'Bất phương trình bậc hai', grade: 10, level: 2 },
    { id: 'vector', name: 'Vector', grade: 10, level: 2 },
    { id: 'phuong_trinh_duong_thang', name: 'Phương trình đường thẳng', grade: 10, level: 2 },
    { id: 'phuong_trinh_duong_tron', name: 'Phương trình đường tròn', grade: 10, level: 2 },
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
    { id: 'nguyen_ham', name: 'Nguyên hàm', grade: 12, level: 3 },
    { id: 'tich_phan', name: 'Tích phân', grade: 12, level: 4 },
    { id: 'tich_phan_ung_dung', name: 'Ứng dụng tích phân', grade: 12, level: 5 },
    { id: 'so_phuc', name: 'Số phức', grade: 12, level: 3 },
    { id: 'hinh_hoc_giai_tich', name: 'Hình học giải tích', grade: 12, level: 4 },
  ],
  edges: [
    { from: 'ham_so', to: 'gioi_han', relation: 'prerequisite_of' },
    { from: 'gioi_han', to: 'dao_ham', relation: 'prerequisite_of' },
    { from: 'dao_ham', to: 'dao_ham_ung_dung', relation: 'prerequisite_of' },
    { from: 'dao_ham', to: 'nguyen_ham', relation: 'prerequisite_of' },
    { from: 'nguyen_ham', to: 'tich_phan', relation: 'prerequisite_of' },
    { from: 'tich_phan', to: 'tich_phan_ung_dung', relation: 'prerequisite_of' },
    { from: 'tich_phan', to: 'hinh_hoc_giai_tich', relation: 'prerequisite_of' },
    { from: 'phuong_trinh', to: 'bat_phuong_trinh', relation: 'prerequisite_of' },
    { from: 'bat_phuong_trinh', to: 'bat_phuong_trinh_bac_hai', relation: 'prerequisite_of' },
    { from: 'phuong_trinh', to: 'phuong_trinh_duong_thang', relation: 'related_to' },
    { from: 'phuong_trinh_duong_thang', to: 'phuong_trinh_duong_tron', relation: 'prerequisite_of' },
    { from: 'vector', to: 'hinh_hoc_khong_gian', relation: 'prerequisite_of' },
    { from: 'luong_giac', to: 'ham_so_mu', relation: 'related_to' },
    { from: 'logarit', to: 'ham_so_log', relation: 'prerequisite_of' },
    { from: 'ham_so_mu', to: 'ham_so_log', relation: 'related_to' },
    { from: 'to_hop', to: 'xac_suat', relation: 'prerequisite_of' },
    { from: 'dao_ham', to: 'tich_phan', relation: 'harder_than' },
    { from: 'gioi_han', to: 'tich_phan', relation: 'prerequisite_of' },
    { from: 'ham_so', to: 'dao_ham_ung_dung', relation: 'related_to' },
    { from: 'phuong_trinh', to: 'so_phuc', relation: 'related_to' },
    { from: 'luong_giac', to: 'hinh_hoc_khong_gian', relation: 'related_to' },
    { from: 'bat_phuong_trinh_bac_hai', to: 'dao_ham_ung_dung', relation: 'related_to' },
    { from: 'xac_suat', to: 'tich_phan_ung_dung', relation: 'related_to' },
  ],
};

/** Map nhanh id → node */
export const NODE_BY_ID = Object.fromEntries(MATH_GRAPH.nodes.map((n) => [n.id, n]));
