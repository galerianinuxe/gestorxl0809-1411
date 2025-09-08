// Logger utility - production optimized logging system
export const createLogger = (prefix: string = '') => {
  const isDev = import.meta.env.DEV;
  
  return {
    // Dev only logs
    debug: (...args: any[]) => {
      if (isDev) console.log(`🔍 ${prefix}`, ...args);
    },
    info: (...args: any[]) => {
      if (isDev) console.info(`ℹ️ ${prefix}`, ...args);
    },
    
    // Always visible logs
    warn: (...args: any[]) => {
      console.warn(`⚠️ ${prefix}`, ...args);
    },
    error: (...args: any[]) => {
      console.error(`❌ ${prefix}`, ...args);
    },
    
    // Success logs (dev only)
    success: (...args: any[]) => {
      if (isDev) console.log(`✅ ${prefix}`, ...args);
    }
  };
};

// Default logger for general use
export const logger = createLogger('[PDV]');