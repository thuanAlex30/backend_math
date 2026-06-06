/**
 * Ngân hàng câu hỏi fallback khi Hugging Face lỗi / demo mode
 * Phủ đủ lớp 6–12
 */

export const fallbackQuestions = {
  math: {
    6: {
      phanso: [
        {
          id: 1,
          question: 'Kết quả của phép tính 2/3 + 1/6 là?',
          options: ['1/2', '2/3', '5/6', '1'],
          correct: 2,
          explanation: 'Quy đồng mẫu số: 2/3 = 4/6, cộng với 1/6 được 5/6.',
        },
        {
          id: 2,
          question: 'Phân số 3/4 tương đương với phân số nào sau đây?',
          options: ['6/8', '4/6', '9/16', '1/4'],
          correct: 0,
          explanation: '3/4 = (3×2)/(4×2) = 6/8.',
        },
        {
          id: 3,
          question: 'Kết quả của 5/6 − 1/3 là?',
          options: ['4/3', '1/2', '1/6', '2/3'],
          correct: 1,
          explanation: '1/3 = 2/6, nên 5/6 − 2/6 = 3/6 = 1/2.',
        },
        {
          id: 4,
          question: 'So sánh: 2/5 và 3/10, phân số nào lớn hơn?',
          options: ['2/5', '3/10', 'Bằng nhau', 'Không so sánh được'],
          correct: 0,
          explanation: '2/5 = 4/10 > 3/10.',
        },
        {
          id: 5,
          question: 'Tích của 1/2 và 2/3 là?',
          options: ['1/3', '2/5', '3/5', '1/6'],
          correct: 0,
          explanation: '(1/2)×(2/3) = 2/6 = 1/3.',
        },
      ],
      default: [
        {
          id: 101,
          question: 'Số 0,75 viết dưới dạng phân số tối giản là?',
          options: ['75/100', '3/4', '7/5', '15/20'],
          correct: 1,
          explanation: '0,75 = 75/100 = 3/4.',
        },
        {
          id: 102,
          question: 'Chu vi hình vuông cạnh 5 cm là?',
          options: ['10 cm', '20 cm', '25 cm', '15 cm'],
          correct: 1,
          explanation: 'Chu vi = 4 × 5 = 20 cm.',
        },
        {
          id: 103,
          question: 'Kết quả của 12 ÷ 4 + 2 là?',
          options: ['2', '5', '8', '14'],
          correct: 1,
          explanation: '12 ÷ 4 = 3, 3 + 2 = 5.',
        },
        {
          id: 104,
          question: 'Diện tích hình chữ nhật dài 8 cm, rộng 3 cm là?',
          options: ['11 cm²', '22 cm²', '24 cm²', '48 cm²'],
          correct: 2,
          explanation: 'S = 8 × 3 = 24 cm².',
        },
        {
          id: 105,
          question: 'Số chia hết cho 3 trong các số sau là?',
          options: ['14', '25', '27', '32'],
          correct: 2,
          explanation: '27 = 3 × 9 nên chia hết cho 3.',
        },
      ],
    },
    7: {
      so_huu_tu: [
        { id: 1, question: '"A book belonging to Mary" viết lại là:', options: ["Mary's book", "Book's Mary", "Mary book", "A Mary book"], correct: 0, explanation: "Sở hữu cách: tên + 's + danh từ." },
        { id: 2, question: '"The legs of the table" viết gọn lại là:', options: ["The tables' legs", "Table's legs", "The table's legs", "Tables legs"], correct: 2, explanation: "Danh từ số nhiều table đã có sẵn 's." },
        { id: 3, question: 'Which sentence is correct?', options: ["He is a friend of my sister", "He is a friend of my sister's", "He is my sister's friend", "My sister friend"], correct: 0, explanation: 'Cấu trúc: a friend of + danh từ.' },
        { id: 4, question: '"Đây là xe của thầy giáo" — dịch:', options: ["This is the teacher's car", "This is a teachers' car", "This is teachers car", "This is a teacher car"], correct: 0, explanation: "Sở hữu cách: the + danh từ + 's." },
        { id: 5, question: '"Those shoes belong to them" viết sở hữu cách:', options: ["Those are theirs shoes", "Those are their shoes'", "Those are their shoes", "Those shoes are theirs"], correct: 3, explanation: 'Dùng theirs (đại danh sở hữu) thay danh từ.' },
      ],
      hien_tai_don: [
        { id: 11, question: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], correct: 1, explanation: 'Hiện tại đơn, ngôi 3 số ít: goes.' },
        { id: 12, question: 'They ___ basketball twice a week.', options: ['play', 'plays', 'playing', 'played'], correct: 0, explanation: 'Trạng từ chỉ tần suất → hiện tại đơn.' },
        { id: 13, question: 'He ___ not ___ English well.', options: ['does / speak', 'do / speaks', 'does / speaks', 'do / speak'], correct: 0, explanation: 'Phủ định hiện tại đơn: S + does not + V nguyên mẫu.' },
        { id: 14, question: 'My mother ___ coffee every morning.', options: ['drink', 'drinks', 'is drinking', 'drank'], correct: 1, explanation: 'Ngôi 3 số ít: drinks.' },
        { id: 15, question: '___ you ___ the lesson yesterday?', options: ['Did / learn', 'Do / learn', 'Does / learn', 'Have / learn'], correct: 0, explanation: 'Yesterday → quá khứ đơn.' },
      ],
      default: [
        { id: 201, question: 'Giá trị tuyệt đối của −8 là:', options: ['8', '−8', '0', '64'], correct: 0, explanation: '|−8| = 8.' },
        { id: 202, question: 'Tỉ số của 15 và 25 là:', options: ['3/5', '5/3', '15/25', '25/15'], correct: 0, explanation: '15/25 = 3/5 (rút gọn).' },
        { id: 203, question: 'Số đối của 3/7 là:', options: ['3/7', '−3/7', '7/3', '0'], correct: 1, explanation: 'Số đối của a là −a.' },
        { id: 204, question: 'Hai góc kề bù có tổng số đo là:', options: ['90°', '180°', '360°', '45°'], correct: 1, explanation: 'Hai góc kề bù có tổng = 180°.' },
        { id: 205, question: 'Giá trị của 2³ là:', options: ['6', '8', '9', '16'], correct: 1, explanation: '2³ = 2×2×2 = 8.' },
      ],
    },
    8: {
      phuong_trinh_bac_nhat: [
        { id: 1, question: 'Nghiệm của phương trình 3x − 6 = 0 là:', options: ['x = 2', 'x = −2', 'x = 3', 'x = 6'], correct: 0, explanation: '3x = 6 → x = 2.' },
        { id: 2, question: 'Phương trình nào là bậc nhất một ẩn?', options: ['2x² + 1 = 0', 'x + 3 = 0', 'x³ − 1 = 0', '1/x = 2'], correct: 1, explanation: 'Dạng ax + b = 0, a ≠ 0.' },
        { id: 3, question: 'x = −1 là nghiệm của phương trình nào?', options: ['x + 1 = 0', 'x − 1 = 0', '2x = 2', 'x/2 = 1'], correct: 0, explanation: 'Thế x = −1: −1+1 = 0.' },
        { id: 4, question: 'Tập nghiệm của x − 5 = 0 là:', options: ['{5}', '{−5}', '{0}', '∅'], correct: 0, explanation: 'x = 5.' },
        { id: 5, question: 'Nếu 2x + 1 = 7 thì x bằng:', options: ['2', '3', '4', '1'], correct: 1, explanation: '2x = 6 → x = 3.' },
      ],
      hinh_hoc_8: [
        { id: 11, question: 'Tứ giác có 4 góc bằng nhau, mỗi góc bằng:', options: ['90°', '180°', '360°', '45°'], correct: 0, explanation: 'Tổng 4 góc = 360°, 360/4 = 90°.' },
        { id: 12, question: 'Hình thang có hai cạnh bên song song là:', options: ['Hình bình hành', 'Hình chữ nhật', 'Hình thoi', 'Hình vuông'], correct: 0, explanation: 'Hình bình hành: 2 cạnh đối //, 2 cạnh bên //.' },
        { id: 13, question: 'Diện tích hình thang có đáy 8 cm, 5 cm và chiều cao 4 cm:', options: ['26 cm²', '52 cm²', '13 cm²', '20 cm²'], correct: 0, explanation: 'S = (8+5)/2 × 4 = 26 cm².' },
        { id: 14, question: 'Diện tích xung quanh hình lập phương cạnh 3 cm là:', options: ['27 cm²', '54 cm²', '36 cm²', '9 cm²'], correct: 1, explanation: 'S_xq = 4×a² = 4×9 = 36 cm².' },
        { id: 15, question: 'Kết quả của (x+2)(x−2) là:', options: ['x²−4', 'x²+4', 'x²−2', '2x−4'], correct: 0, explanation: 'Hằng đẳng thức: a²−b².' },
      ],
      default: [
        { id: 301, question: 'Tỉ lệ thức nào đúng với 2/3 = 6/x?', options: ['x = 9', 'x = 4', 'x = 12', 'x = 8'], correct: 0, explanation: '2/3 = 6/x → 2x = 18 → x = 9.' },
        { id: 302, question: 'Bậc của đơn thức 3x²y³ là:', options: ['2', '3', '5', '6'], correct: 2, explanation: 'Bậc = 2+3 = 5.' },
        { id: 303, question: 'Hệ số góc của đường thẳng y = 3x − 1 là:', options: ['−1', '3', '1', '−3'], correct: 1, explanation: 'Dạng y = ax+b → a = 3.' },
        { id: 304, question: 'Diện tích hình chữ nhật có chiều dài 7 cm, chiều rộng 4 cm:', options: ['28 cm²', '22 cm²', '11 cm²', '14 cm²'], correct: 0, explanation: 'S = 7×4 = 28 cm².' },
        { id: 305, question: 'Phân tích x²−9 thành nhân tử:', options: ['(x−3)(x+3)', '(x−9)(x+1)', '(x−3)²', '(x+3)²'], correct: 0, explanation: 'Hiệu hai bình phương: a²−b².' },
      ],
    },
    9: {
      phuong_trinh_bac_hai: [
        { id: 1, question: 'Nghiệm của x² − 5x + 6 = 0 là?', options: ['x = 2 hoặc x = 3', 'x = −2 hoặc x = −3', 'x = 1 hoặc x = 6', 'Vô nghiệm'], correct: 0, explanation: 'x² − 5x + 6 = (x−2)(x−3) = 0 ⇒ x = 2 hoặc x = 3.' },
        { id: 2, question: 'Biệt thức Δ của x² + 2x + 1 = 0 bằng?', options: ['0', '4', '8', '−4'], correct: 0, explanation: 'Δ = b² − 4ac = 4 − 4 = 0.' },
        { id: 3, question: 'Phương trình x² + 1 = 0 có?', options: ['Hai nghiệm thực', 'Một nghiệm', 'Vô nghiệm thực', 'Vô số nghiệm'], correct: 2, explanation: 'x² = −1 không có nghiệm thực.' },
        { id: 4, question: 'Tổng nghiệm của x² − 7x + 10 = 0 là?', options: ['7', '10', '−7', '−10'], correct: 0, explanation: 'x₁ + x₂ = −b/a = 7.' },
        { id: 5, question: 'Tích nghiệm của x² − 7x + 10 = 0 là?', options: ['7', '10', '−7', '−10'], correct: 1, explanation: 'x₁·x₂ = c/a = 10.' },
      ],
      default: [
        { id: 201, question: 'Hệ số góc của đường thẳng y = 2x − 1 là?', options: ['−1', '1', '2', '−2'], correct: 2, explanation: 'Dạng y = kx + b có k = 2.' },
        { id: 202, question: '√(16) + √(9) bằng?', options: ['5', '7', '25', '√25'], correct: 1, explanation: '4 + 3 = 7.' },
        { id: 203, question: 'Trong tam giác vuông, hai cạnh góc vuông 3 và 4, cạnh huyền là?', options: ['5', '6', '7', '12'], correct: 0, explanation: 'Pythagore: √(3²+4²) = 5.' },
        { id: 204, question: 'Giá trị của (x − 2)² khi x = 5 là?', options: ['3', '9', '6', '1'], correct: 1, explanation: '(5−2)² = 3² = 9.' },
        { id: 205, question: 'Hàm số y = −x + 3 đồng biến hay nghịch biến?', options: ['Đồng biến', 'Nghịch biến', 'Không xác định', 'Hằng số'], correct: 1, explanation: 'Hệ số a = −1 < 0 nên nghịch biến.' },
      ],
    },
    10: {
      he_pt_bac_nhat: [
        { id: 1, question: 'Nghiệm của hệ { x + y = 5, x − y = 1 } là:', options: ['(3,2)', '(2,3)', '(4,1)', '(1,4)'], correct: 0, explanation: 'Cộng: 2x = 6 → x = 3, thế: y = 2.' },
        { id: 2, question: 'Hệ có vô số nghiệm khi:', options: ['Hai PT trùng nhau', 'Hai PT song song', 'Hai PT cắt nhau', 'Một PT bằng 0'], correct: 0, explanation: 'Hai PT trùng nhau → vô số nghiệm.' },
        { id: 3, question: 'Giá trị lớn nhất của y = −x² + 4x là:', options: ['4', '2', '1', '0'], correct: 0, explanation: 'Đỉnh: x = −b/2a = 2, y(2) = −4+8 = 4.' },
        { id: 4, question: 'Tập xác định của y = √(x−1) là:', options: ['[1;+∞)', '(1;+∞)', '(−∞;1]', 'R'], correct: 0, explanation: 'x−1 ≥ 0 → x ≥ 1.' },
        { id: 5, question: 'Công thức khoảng cách giữa A(x₁,y₁) và B(x₂,y₂) là:', options: ['√((x₂−x₁)²+(y₂−y₁)²)', '√((x₂+x₁)²+(y₂+y₁)²)', '(x₂−x₁)+(y₂−y₁)', '√(x₂−x₁)+√(y₂−y₁)'], correct: 0, explanation: 'Công thức Euclidean.' },
      ],
      vector: [
        { id: 11, question: '|→a + →b| ≤ |→a| + |→b| là bất đẳng thức:', options: ['BĐ tam giác', 'BĐ Cauchy', 'BĐ Bunhiacovsky', 'BĐ Schwarz'], correct: 0, explanation: '|→u+→v| ≤ |→u|+|→v| là BĐ tam giác.' },
        { id: 12, question: '→a = (3;−2), →b = (1;4). Tọa độ →a + →b là:', options: ['(4;2)', '(2;−6)', '(3;−2)', '(4;−2)'], correct: 0, explanation: '(3+1, −2+4) = (4,2).' },
        { id: 13, question: 'Nếu →a⊥→b thì tích vô hướng →a·→b bằng:', options: ['0', '|→a||→b|', '1', '−1'], correct: 0, explanation: 'cos 90° = 0 → tích vô hướng = 0.' },
        { id: 14, question: 'Cho A(1,2), B(4,6). Tọa độ →AB là:', options: ['(3;4)', '(−3;−4)', '(3;−4)', '(−3;4)'], correct: 0, explanation: '→AB = (4−1, 6−2) = (3,4).' },
        { id: 15, question: '|→a| = √(3² + 4²) = ?', options: ['5', '7', '25', '12'], correct: 0, explanation: '|→a| = √(9+16) = √25 = 5.' },
      ],
      default: [
        { id: 201, question: 'cot(90°) bằng:', options: ['0', '1', '∞', 'Không xác định'], correct: 0, explanation: 'cot 90° = 0.' },
        { id: 202, question: 'sin²x + cos²x bằng:', options: ['1', '2', '0', 'sin2x'], correct: 0, explanation: 'Đẳng thức lượng giác cơ bản.' },
        { id: 203, question: 'PT đường tròn tâm O(0,0), R = 3 là:', options: ['x²+y²=9', 'x²+y²=3', '(x−3)²+(y−3)²=9', 'x²+y²+9=0'], correct: 0, explanation: 'x²+y²=R² → x²+y²=9.' },
        { id: 204, question: 'Hàm số y = sin x có tập giá trị là:', options: ['[−1;1]', '[0;1]', 'R', '(−1;1)'], correct: 0, explanation: '∀x, −1 ≤ sin x ≤ 1.' },
        { id: 205, question: 'PT ax²+bx+c=0 có nghiệm kép khi:', options: ['Δ = 0', 'Δ > 0', 'Δ < 0', 'a = 0'], correct: 0, explanation: 'Δ = 0 → nghiệm kép.' },
      ],
    },
    11: {
      gioi_han: [
        { id: 1, question: 'lim(x→0) sin(x)/x bằng:', options: ['0', '1', '∞', 'Không tồn tại'], correct: 1, explanation: 'Giới hạn cơ bản, bằng 1.' },
        { id: 2, question: 'lim(x→∞) (3x²+1)/(x²−2) bằng:', options: ['3', '0', '∞', '1'], correct: 0, explanation: 'Chia tử và mẫu cho x²: → 3/1 = 3.' },
        { id: 3, question: 'lim(x→2) (x²−4)/(x−2) bằng:', options: ['4', '0', '2', '∞'], correct: 0, explanation: 'x²−4 = (x−2)(x+2) → lim = 2+2 = 4.' },
        { id: 4, question: 'lim(x→0) (eˣ−1)/x bằng:', options: ['1', '0', 'e', '∞'], correct: 0, explanation: 'Giới hạn cơ bản: (eˣ−1)/x → 1 khi x→0.' },
        { id: 5, question: 'Dãy uₙ = (−1)ⁿ có giới hạn?', options: ['Không tồn tại', '0', '1', '±1'], correct: 0, explanation: 'Dãy dao động, không hội tụ.' },
      ],
      dao_ham: [
        { id: 11, question: 'Đạo hàm của y = x³ là:', options: ['3x²', 'x²', '3x', '3'], correct: 0, explanation: "(x³)' = 3x²." },
        { id: 12, question: 'Đạo hàm của y = sin x là:', options: ['cos x', '−cos x', 'sin x', '−sin x'], correct: 0, explanation: "(sin x)' = cos x." },
        { id: 13, question: 'Đạo hàm của y = ln x (x > 0) là:', options: ['1/x', 'x', 'ln x', 'eˣ'], correct: 0, explanation: "(ln x)' = 1/x." },
        { id: 14, question: 'Tiếp tuyến của y = x² tại x = 1 có hệ số góc là:', options: ['2', '1', '0', '3'], correct: 0, explanation: "y' = 2x, tại x=1: 2×1 = 2." },
        { id: 15, question: 'y = eˣ có y\' bằng:', options: ['eˣ', 'xeˣ⁻¹', 'eˣ−1', 'ln x'], correct: 0, explanation: "(eˣ)' = eˣ." },
      ],
      default: [
        { id: 201, question: 'Xác suất gieo 2 đồng xu cả 2 mặt ngửa:', options: ['1/4', '1/2', '1', '0'], correct: 0, explanation: '2×2 = 4 trường hợp, 1 trường hợp ngửa: 1/4.' },
        { id: 202, question: 'Số hoán vị của 4 phần tử là:', options: ['24', '12', '16', '4'], correct: 0, explanation: '4! = 4×3×2×1 = 24.' },
        { id: 203, question: 'C₄² bằng:', options: ['6', '8', '4', '12'], correct: 0, explanation: '4!/(2!×2!) = 24/4 = 6.' },
        { id: 204, question: 'Góc giữa hai đường thẳng k₁=1 và k₂=−1 là:', options: ['90°', '45°', '0°', '180°'], correct: 0, explanation: 'tan θ = |(k₁−k₂)/(1+k₁k₂)| → chia 0 → θ = 90°.' },
        { id: 205, question: 'PT đường thẳng qua A(1,2) và B(3,6):', options: ['y = 2x', 'y = x+1', 'y = 3x−1', 'y = 4x−2'], correct: 0, explanation: 'Hệ số góc = (6−2)/(3−1)=2, qua A(1,2): y−2=2(x−1) → y=2x.' },
      ],
    },
    12: {
      tich_phan: [
        {
          id: 1,
          question: 'Nguyên hàm của f(x) = 2x là?',
          options: ['x² + C', '2x² + C', 'x + C', '2 + C'],
          correct: 0,
          explanation: '∫2x dx = x² + C.',
        },
        {
          id: 2,
          question: '∫₀¹ x dx bằng?',
          options: ['0', '1/2', '1', '2'],
          correct: 1,
          explanation: '[x²/2]₀¹ = 1/2.',
        },
        {
          id: 3,
          question: 'Nguyên hàm của cos x là?',
          options: ['sin x + C', '−sin x + C', 'cos x + C', '−cos x + C'],
          correct: 0,
          explanation: '(sin x)\' = cos x.',
        },
        {
          id: 4,
          question: 'Đạo hàm của x³ tại x = 2 là?',
          options: ['6', '8', '12', '4'],
          correct: 2,
          explanation: '(x³)\' = 3x², tại x=2: 3×4 = 12.',
        },
        {
          id: 5,
          question: '∫(1/x) dx (x > 0) bằng?',
          options: ['ln|x| + C', '1/x² + C', 'x + C', 'eˣ + C'],
          correct: 0,
          explanation: 'Nguyên hàm của 1/x là ln|x| + C.',
        },
      ],
      default: [
        {
          id: 301,
          question: 'Mô đun của số phức z = 3 + 4i là?',
          options: ['5', '7', '25', '√7'],
          correct: 0,
          explanation: '|z| = √(3²+4²) = 5.',
        },
        {
          id: 302,
          question: 'lim(x→0) sin(x)/x bằng?',
          options: ['0', '1', '∞', 'Không tồn tại'],
          correct: 1,
          explanation: 'Đây là giới hạn cơ bản, bằng 1.',
        },
        {
          id: 303,
          question: 'Tích phân ∫₀^π sin x dx bằng?',
          options: ['0', '1', '2', 'π'],
          correct: 2,
          explanation: '[−cos x]₀^π = −(−1) + 1 = 2.',
        },
        {
          id: 304,
          question: 'Xác suất lấy được số chẵn khi gieo xúc xắc cân đối là?',
          options: ['1/6', '1/3', '1/2', '2/3'],
          correct: 2,
          explanation: 'Các mặt chẵn: 2,4,6 — 3/6 = 1/2.',
        },
        {
          id: 305,
          question: 'Đạo hàm của ln x (x > 0) là?',
          options: ['1/x', 'x', 'ln x', 'eˣ'],
          correct: 0,
          explanation: '(ln x)\' = 1/x.',
        },
      ],
    },
  },
  english: {
    6: {
      greetings: [
        {
          id: 1,
          question: 'How do you say "Xin chào" in English?',
          options: ['Goodbye', 'Hello', 'Thank you', 'Sorry'],
          correct: 1,
          explanation: '"Hello" hoặc "Hi" dùng để chào.',
        },
        {
          id: 2,
          question: 'Which phrase means "Tạm biệt"?',
          options: ['Good morning', 'Goodbye', 'Please', 'Yes'],
          correct: 1,
          explanation: '"Goodbye" = tạm biệt.',
        },
        {
          id: 3,
          question: '"Thank you" means:',
          options: ['Xin lỗi', 'Cảm ơn', 'Làm ơn', 'Không'],
          correct: 1,
          explanation: '"Thank you" = cảm ơn.',
        },
        {
          id: 4,
          question: 'Complete: "Nice to ___ you."',
          options: ['meet', 'meeting', 'met', 'meets'],
          correct: 0,
          explanation: 'Cụm cố định: Nice to meet you.',
        },
        {
          id: 5,
          question: '"How are you?" is used to:',
          options: ['Ask about health', 'Say goodbye', 'Order food', 'Tell time'],
          correct: 0,
          explanation: 'Hỏi thăm sức khỏe / tình hình.',
        },
      ],
      default: [
        {
          id: 101,
          question: 'The opposite of "big" is:',
          options: ['small', 'tall', 'long', 'wide'],
          correct: 0,
          explanation: 'big ↔ small.',
        },
        {
          id: 102,
          question: 'She ___ a student.',
          options: ['am', 'is', 'are', 'be'],
          correct: 1,
          explanation: 'Chủ ngữ ngôi 3 số ít dùng "is".',
        },
        {
          id: 103,
          question: 'I have two ___.',
          options: ['book', 'books', 'bookes', 'a book'],
          correct: 1,
          explanation: 'Số nhiều: book → books.',
        },
        {
          id: 104,
          question: '"Mother" means:',
          options: ['Bố', 'Mẹ', 'Anh trai', 'Bà'],
          correct: 1,
          explanation: 'mother = mẹ.',
        },
        {
          id: 105,
          question: 'Which is a color?',
          options: ['table', 'blue', 'run', 'happy'],
          correct: 1,
          explanation: 'blue = màu xanh dương.',
        },
      ],
    },
    9: {
      default: [
        {
          id: 201,
          question: 'If it rains, we ___ at home.',
          options: ['stay', 'stayed', 'will stay', 'staying'],
          correct: 0,
          explanation: 'Câu điều kiện loại 1: If + HTĐ, HTĐ.',
        },
        {
          id: 202,
          question: 'He said he ___ tired.',
          options: ['is', 'was', 'will be', 'be'],
          correct: 1,
          explanation: 'Reported speech: is → was.',
        },
        {
          id: 203,
          question: 'The book ___ I read was interesting.',
          options: ['who', 'which', 'where', 'whose'],
          correct: 1,
          explanation: 'which/that cho vật (book).',
        },
        {
          id: 204,
          question: '"Environment" means:',
          options: ['Môi trường', 'Giáo dục', 'Công nghệ', 'Du lịch'],
          correct: 0,
          explanation: 'environment = môi trường.',
        },
        {
          id: 205,
          question: 'She has lived here ___ 2015.',
          options: ['for', 'since', 'ago', 'during'],
          correct: 1,
          explanation: 'since + mốc thời gian.',
        },
      ],
    },
    12: {
      default: [
        {
          id: 301,
          question: 'Not only did he pass, ___ he got a scholarship.',
          options: ['but', 'and', 'so', 'or'],
          correct: 0,
          explanation: 'Cấu trúc: Not only... but (also)...',
        },
        {
          id: 302,
          question: 'Had I known, I ___ differently.',
          options: ['act', 'acted', 'would have acted', 'will act'],
          correct: 2,
          explanation: 'Câu điều kiện loại 3 (đảo ngữ).',
        },
        {
          id: 303,
          question: '"Nevertheless" is closest in meaning to:',
          options: ['However', 'Because', 'Therefore', 'Although'],
          correct: 0,
          explanation: 'nevertheless ≈ however (tuy nhiên).',
        },
        {
          id: 304,
          question: 'The passive of "They built the bridge" is:',
          options: [
            'The bridge was built by them',
            'The bridge is built by them',
            'They were built the bridge',
            'The bridge built them',
          ],
          correct: 0,
          explanation: 'Bị động quá khứ: was/were + V3.',
        },
        {
          id: 305,
          question: 'Choose the word with stress on the first syllable:',
          options: ['education', 'important', 'computer', 'develop'],
          correct: 2,
          explanation: 'COM-puter — trọng âm âm tiết 1.',
        },
      ],
    },
  },
};

/** Câu mẫu chung khi không có ngân hàng theo lớp */
const GENERIC_MATH = [
  {
    id: 9001,
    question: '2 + 2 × 3 bằng?',
    options: ['12', '8', '10', '6'],
    correct: 1,
    explanation: 'Nhân trước: 2×3=6, 2+6=8.',
  },
  {
    id: 9002,
    question: 'Giá trị của |−5| là?',
    options: ['−5', '5', '0', '10'],
    correct: 1,
    explanation: 'Giá trị tuyệt đối luôn không âm.',
  },
  {
    id: 9003,
    question: 'Phương trình 2x = 10 có nghiệm?',
    options: ['x = 5', 'x = 20', 'x = 2', 'x = 8'],
    correct: 0,
    explanation: 'x = 10/2 = 5.',
  },
  {
    id: 9004,
    question: 'Góc vuông có số đo?',
    options: ['45°', '60°', '90°', '180°'],
    correct: 2,
    explanation: 'Góc vuông = 90°.',
  },
  {
    id: 9005,
    question: 'Diện tích hình tròn bán kính r có công thức?',
    options: ['2πr', 'πr²', 'πr', 'r²'],
    correct: 1,
    explanation: 'S = πr².',
  },
];

const GENERIC_ENGLISH = [
  {
    id: 9101,
    question: 'She ___ to school every day.',
    options: ['go', 'goes', 'going', 'gone'],
    correct: 1,
    explanation: 'Hiện tại đơn, ngôi 3 số ít: goes.',
  },
  {
    id: 9102,
    question: '"Beautiful" means:',
    options: ['Xấu', 'Đẹp', 'Nhanh', 'To'],
    correct: 1,
    explanation: 'beautiful = đẹp.',
  },
  {
    id: 9103,
    question: 'I ___ TV when he called.',
    options: ['watch', 'watched', 'was watching', 'am watching'],
    correct: 2,
    explanation: 'Quá khứ tiếp diễn: was watching.',
  },
  {
    id: 9104,
    question: 'The synonym of "happy" is:',
    options: ['sad', 'glad', 'angry', 'tired'],
    correct: 1,
    explanation: 'glad ≈ happy.',
  },
  {
    id: 9105,
    question: '"Although" introduces a:',
    options: ['clause of contrast', 'question', 'command', 'list'],
    correct: 0,
    explanation: 'Although = mặc dù (tương phản).',
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Lấy câu hỏi fallback (ít nhất count câu)
 */
export function getFallbackQuestions(subject, grade, topicId, count = 5) {
  const g = Number(grade);
  const bank = fallbackQuestions[subject]?.[g];
  let pool = [];

  if (bank) {
    if (topicId && bank[topicId]?.length) {
      pool = [...bank[topicId]];
    }
    if (pool.length < count && bank.default?.length) {
      pool = [...pool, ...bank.default];
    }
  }

  if (pool.length < count) {
    const generic = subject === 'english' ? GENERIC_ENGLISH : GENERIC_MATH;
    pool = [...pool, ...generic];
  }

  const unique = [];
  const seen = new Set();
  for (const q of shuffle(pool)) {
    const key = q.question;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({
      question: q.question,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation,
    });
    if (unique.length >= count) break;
  }

  return unique.slice(0, count);
}
