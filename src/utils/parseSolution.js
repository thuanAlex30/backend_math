export function extractVisualization(text) {
  const jsonBlock = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlock) {
    try {
      const parsed = JSON.parse(jsonBlock[1]);
      const cleanText = text.replace(/```json[\s\S]*?```/g, '').trim();
      return { solution: cleanText, visualization: parsed };
    } catch {
      /* ignore */
    }
  }
  const inline = text.match(/\{"visualization"\s*:\s*"(graph|geometry|vector)"/);
  if (inline) {
    try {
      const start = text.indexOf(inline[0]);
      const end = text.indexOf('}', start) + 1;
      const parsed = JSON.parse(text.slice(start, end));
      return { solution: text.replace(text.slice(start, end), '').trim(), visualization: parsed };
    } catch {
      /* ignore */
    }
  }
  return { solution: text, visualization: null };
}

export function parseSteps(text) {
  const steps = [];
  const regex = /\*\*(.*?)\*\*:?/g;
  const matches = [...text.matchAll(regex)];

  if (matches.length === 0) {
    return [{ id: 'full', title: 'Lời giải', content: text }];
  }

  for (let i = 0; i < matches.length; i++) {
    const title = matches[i][1].trim();
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const content = text.slice(start, end).trim();
    steps.push({ id: `step-${i}`, title, content });
  }
  return steps;
}
