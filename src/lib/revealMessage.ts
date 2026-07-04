const WORD_DELAY_MS = 55;

export function revealMessageWordByWord(
  fullText: string,
  onUpdate: (partial: string) => void,
  signal?: { cancelled: boolean },
): Promise<void> {
  const words = fullText.split(/(\s+)/);

  return new Promise((resolve) => {
    let index = 0;
    let revealed = '';

    const tick = () => {
      if (signal?.cancelled) {
        resolve();
        return;
      }

      if (index >= words.length) {
        onUpdate(fullText);
        resolve();
        return;
      }

      revealed += words[index];
      index += 1;
      onUpdate(revealed);

      setTimeout(tick, WORD_DELAY_MS);
    };

    tick();
  });
}
