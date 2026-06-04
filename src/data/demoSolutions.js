export const DEMO_SOLUTIONS = [
  {
    match: /x²?\s*\+\s*5x\s*\+\s*6|x\^2\s*\+\s*5x\s*\+\s*6/i,
    solution: `**Phân tích đề:**
Ta cần giải phương trình bậc hai một ẩn dạng $ax^2 + bx + c = 0$ với $a=1$, $b=5$, $c=6$.

**Lý thuyết áp dụng:**
- Công thức nghiệm: $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$ với $\\Delta = b^2 - 4ac$.
- Hoặc phân tích thành nhân tử nếu biết hai số có tích $c$ và tổng $b$.

**Các bước giải:**
1. Tính biệt thức:
$$\\Delta = 5^2 - 4 \\cdot 1 \\cdot 6 = 25 - 24 = 1$$
2. Vì $\\Delta > 0$, phương trình có hai nghiệm phân biệt:
$$x_1 = \\frac{-5 + \\sqrt{1}}{2} = \\frac{-5 + 1}{2} = -2$$
$$x_2 = \\frac{-5 - 1}{2} = -3$$
3. Kiểm tra: $(-2)^2 + 5(-2) + 6 = 4 - 10 + 6 = 0$ ✓

**Đáp án:** $x_1 = -2$, $x_2 = -3$.

\`\`\`json
{"visualization":"graph","data":{"expression":"x^2+5x+6","latex":"y=x^2+5x+6","roots":[-2,-3]}}
\`\`\``,
    visualization: { visualization: 'graph', data: { expression: 'x^2+5x+6', latex: 'y=x^2+5x+6', roots: [-2, -3] } },
  },
  {
    match: /tam giác|đường tròn|hình học/i,
    solution: `**Phân tích đề:**
Bài toán hình học — cần xác định dữ kiện, hình vẽ và quan hệ góc/cạnh.

**Lý thuyết áp dụng:**
- Định lý Pythagore: $a^2 + b^2 = c^2$ (tam giác vuông).
- Tổng góc tam giác: $180°$.

**Các bước giải:**
1. Vẽ tam giác $ABC$ vuông tại $B$, $AB=3$, $BC=4$.
2. Áp dụng Pythagore: $AC = \\sqrt{3^2 + 4^2} = \\sqrt{25} = 5$.

**Đáp án:** Cạnh huyền $AC = 5$.

\`\`\`json
{"visualization":"geometry","data":{"type":"triangle","points":"A,B,C","sides":[3,4,5]}}
\`\`\``,
    visualization: { visualization: 'geometry', data: { type: 'triangle', sides: [3, 4, 5] } },
  },
];

export function getDemoSolution(question) {
  const q = (question || '').toLowerCase();
  for (const demo of DEMO_SOLUTIONS) {
    if (demo.match.test(q)) return demo;
  }
  return {
    solution: `**Phân tích đề:**
Đề bài: ${question}

**Lý thuyết áp dụng:**
Áp dụng các kiến thức Toán phù hợp với dạng bài (đại số, hình học, giải tích...).

**Các bước giải:**
1. Đọc kỹ đề, ghi lại dữ kiện và yêu cầu.
2. Chọn phương pháp giải phù hợp.
3. Thực hiện tính toán từng bước, không bỏ qua bước trung gian.
4. Kiểm tra lại kết quả.

**Đáp án:** (Kết nối API Hugging Face với \`HUGGINGFACE_API_KEY\` để nhận lời giải AI thật cho bài này.)

*Chế độ demo: thêm API key trong Backend/.env*`,
    visualization: null,
  };
}
