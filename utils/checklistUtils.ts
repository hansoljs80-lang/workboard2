
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
 * Updated: Improved regex to handle completion text safely.
 */
export const toggleChecklistItem = (
  text: string, 
  targetLineIndex: number, 
  completedByText?: string // Optional: " (수행: 홍길동)"
): string => {
  const lines = text.split('\n');
  if (targetLineIndex < 0 || targetLineIndex >= lines.length) return text;

  const line = lines[targetLineIndex];
  const trimmed = line.trim();

  // Regex to find " (수행: ...)" pattern anywhere at the end of the content
  // Matches: space + (수행: + any chars + ) + end of string/line
  const completionRegex = /\s*\(수행: [^)]+\)$/;

  if (trimmed.startsWith('- [ ]')) {
    // Checking
    let newLine = line.replace('- [ ]', '- [x]');
    // Remove any existing signature first to avoid duplication (just in case)
    newLine = newLine.replace(completionRegex, '');
    
    if (completedByText) {
      newLine += completedByText;
    }
    lines[targetLineIndex] = newLine;
  } else if (trimmed.startsWith('- [x]')) {
    // Unchecking
    let newLine = line.replace('- [x]', '- [ ]');
    
    // Remove the completion signature
    newLine = newLine.replace(completionRegex, '');
    
    lines[targetLineIndex] = newLine;
  }

  return lines.join('\n');
};
