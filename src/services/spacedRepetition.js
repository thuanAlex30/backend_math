/**
 * SM-2 spaced repetition — logic server-side (client cũng có thể tính tương tự)
 */

export function sm2Update(card, quality) {
  // quality: 0=Khó, 1=Vừa, 2=Dễ
  let { interval = 0, easeFactor = 2.5, repetitions = 0 } = card;

  if (quality < 1) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (2 - quality) * (0.08 + (2 - quality) * 0.02))
  );

  const next = new Date();
  next.setDate(next.getDate() + interval);

  return {
    interval,
    easeFactor,
    repetitions,
    nextReviewDate: next.toISOString().slice(0, 10),
  };
}

/** Lọc từ due hôm nay từ danh sách SRS cards */
export function getDueWords(cards, today = new Date().toISOString().slice(0, 10)) {
  return cards.filter(
    (c) => !c.nextReviewDate || c.nextReviewDate <= today
  );
}
