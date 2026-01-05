// Utility function to clean material names by removing trailing "0" characters
export const cleanMaterialName = (materialName: string): string => {
  if (!materialName || typeof materialName !== 'string') {
    return materialName;
  }
  
  // Trim whitespace first
  let cleanedName = materialName.trim();
  
  // Check for pattern where name ends with space + single digit zero (e.g., "Alum chap 0")
  // This handles cases like "Material Name 0" -> "Material Name"
  if (cleanedName.match(/\s+0$/)) {
    cleanedName = cleanedName.replace(/\s+0$/, '').trim();
  }
  
  // Also check for pattern where name ends directly with zero after a letter (e.g., "Alum chap0")
  // But don't remove zeros that are part of meaningful names like "H2O" or numbers like "100"
  if (cleanedName.length > 1 && cleanedName.endsWith('0')) {
    const secondToLast = cleanedName[cleanedName.length - 2];
    // Use Unicode regex to include accented letters (e.g., ã, é, ç)
    if (/\p{L}/u.test(secondToLast)) {
      cleanedName = cleanedName.slice(0, -1).trim();
    }
  }
  
  return cleanedName;
};

// Function to clean all material names in order items
export const cleanOrderItemNames = (items: any[]): any[] => {
  if (!items || !Array.isArray(items)) {
    return items;
  }
  
  return items.map(item => ({
    ...item,
    materialName: cleanMaterialName(item.materialName)
  }));
};
