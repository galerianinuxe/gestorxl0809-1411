// Utility function to clean material names by removing trailing "0" characters
export const cleanMaterialName = (materialName: string): string => {
  if (!materialName || typeof materialName !== 'string') {
    return materialName;
  }
  
  // Remove trailing "0" characters from the material name
  // This handles cases where the name gets corrupted with extra zeros
  let cleanedName = materialName.trim();
  
  // Keep removing trailing "0" characters until there are none left
  // But ensure we don't remove all characters if the name is just "0"
  while (cleanedName.endsWith('0') && cleanedName.length > 1) {
    cleanedName = cleanedName.slice(0, -1).trim();
  }
  
  // Only log in development mode to reduce production noise
  if (import.meta.env.DEV && materialName !== cleanedName) {
    console.log('Material name cleaned:', {
      original: materialName,
      cleaned: cleanedName
    });
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
