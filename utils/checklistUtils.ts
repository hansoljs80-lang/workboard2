
/**
 * Checks if a description string contains checklist items.
 */
export const hasChecklist = (text: string): boolean => {
  if (!text) return false;
  return text.includes('- [ ]') || text.includes('- [x]');
};

/**
 * Parses the description string and calculates checklist progress.
 */
export const getChecklistProgress = (text: string) => {
  if (!text) return { total: 0, checked: 0, percentage: 0 };
  
  const lines = text.split('\n');
  let total = 0;
  let checked = 0;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- [ ]')) {
      total++;
    } else if (trimmed.startsWith('- [x]')) {
      total++;
      checked++;
    }
  });

  return {
    total,
    checked,
    percentage: total === 0 ? 0 : Math.round((checked / total) * 100)
  };
};

/**
 * Toggles the checklist item status at a specific line index.
 * Returns the new full description string.
 */
export const toggleChecklistItem = (text: string, targetLineIndex: number): string => {
  const lines = text.split('\n');
  if (targetLineIndex < 0 || targetLineIndex >= lines.length) return text;

  const line = lines[targetLineIndex];
  const trimmed = line.trim();

  if (trimmed.startsWith('- [ ]')) {
    lines[targetLineIndex] = line.replace('- [ ]', '- [x]');
  } else if (trimmed.startsWith('- [x]')) {
    lines[targetLineIndex] = line.replace('- [x]', '- [ ]');
  }

  return lines.join('\n');
};
