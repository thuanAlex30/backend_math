/**
 * Ngân hàng câu hỏi fallback khi Hugging Face lỗi / demo mode
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
    9: {
      phuong_trinh_bac_hai: [
        {
          id: 1,
          question: 'Nghiệm của phương trình x² − 5x + 6 = 0 là?',
          options: ['x = 2 hoặc x = 3', 'x = −2 hoặc x = −3', 'x = 1 hoặc x = 6', 'Vô nghiệm'],
          correct: 0,
          explanation: 'x² − 5x + 6 = (x−2)(x−3) = 0 ⇒ x = 2 hoặc x = 3.',
        },
        {
          id: 2,
          question: 'Biệt thức Δ của x² + 2x + 1 = 0 bằng?',
          options: ['0', '4', '8', '−4'],
          correct: 0,
          explanation: 'Δ = b² − 4ac = 4 − 4 = 0.',
        },
        {
          id: 3,
          question: 'Phương trình x² + 1 = 0 có?',
          options: ['Hai nghiệm thực', 'Một nghiệm', 'Vô nghiệm thực', 'Vô số nghiệm'],
          correct: 2,
          explanation: 'x² = −1 không có nghiệm thực.',
        },
        {
          id: 4,
          question: 'Tổng nghiệm của x² − 7x + 10 = 0 (theo Viète) là?',
          options: ['7', '10', '−7', '−10'],
          correct: 0,
          explanation: 'x₁ + x₂ = −b/a = 7.',
        },
        {
          id: 5,
          question: 'Tích nghiệm của x² − 7x + 10 = 0 là?',
          options: ['7', '10', '−7', '−10'],
          correct: 1,
          explanation: 'x₁·x₂ = c/a = 10.',
        },
      ],
      default: [
        {
          id: 201,
          question: 'Hệ số góc của đường thẳng y = 2x − 1 là?',
          options: ['−1', '1', '2', '−2'],
          correct: 2,
          explanation: 'Dạng y = kx + b có k = 2.',
        },
        {
          id: 202,
          question: '√(16) + √(9) bằng?',
          options: ['5', '7', '25', '√25'],
          correct: 1,
          explanation: '4 + 3 = 7.',
        },
        {
          id: 203,
          question: 'Trong tam giác vuông, nếu hai cạnh góc vuông 3 và 4 thì cạnh huyền là?',
          options: ['5', '6', '7', '12'],
          correct: 0,
          explanation: 'Theo Pythagore: √(3²+4²) = 5.',
        },
        {
          id: 204,
          question: 'Giá trị của (x − 2)² khi x = 5 là?',
          options: ['3', '9', '6', '1'],
          correct: 1,
          explanation: '(5−2)² = 3² = 9.',
        },
        {
          id: 205,
          question: 'Hàm số y = −x + 3 đồng biến hay nghịch biến?',
          options: ['Đồng biến', 'Nghịch biến', 'Không xác định', 'Hằng số'],
          correct: 1,
          explanation: 'Hệ số a = −1 < 0 nên nghịch biến.',
        },
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
