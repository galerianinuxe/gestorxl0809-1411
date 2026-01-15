// Utility functions for detecting device information

export const detectDeviceType = (): string => {
  const ua = navigator.userAgent;
  
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
};

export const detectBrowser = (): string => {
  const ua = navigator.userAgent;
  
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung Browser';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Trident')) return 'Internet Explorer';
  if (ua.includes('Edge')) return 'Edge Legacy';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  
  return 'Unknown';
};

export const detectOS = (): string => {
  const ua = navigator.userAgent;
  
  if (ua.includes('Windows NT 10.0')) return 'Windows 10/11';
  if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
  if (ua.includes('Windows NT 6.2')) return 'Windows 8';
  if (ua.includes('Windows NT 6.1')) return 'Windows 7';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Linux')) return 'Linux';
  
  return 'Unknown';
};

// Interface for geo IP data
export interface GeoIPData {
  ip: string;
  country?: string;
  city?: string;
}

// Cache to avoid multiple API calls
let cachedGeoData: GeoIPData | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getClientIPWithGeo = async (): Promise<GeoIPData> => {
  // Check cache first
  if (cachedGeoData && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return cachedGeoData;
  }

  // List of fallback APIs (priority order)
  const APIs = [
    {
      url: 'https://ipapi.co/json/',
      parse: (data: any): GeoIPData => ({
        ip: data.ip,
        country: data.country_name || data.country,
        city: data.city
      })
    },
    {
      url: 'https://ipwho.is/',
      parse: (data: any): GeoIPData => ({
        ip: data.ip,
        country: data.country,
        city: data.city
      })
    },
    {
      url: 'https://api.ipify.org?format=json',
      parse: (data: any): GeoIPData => ({
        ip: data.ip,
        country: undefined,
        city: undefined
      })
    },
    {
      url: 'https://api.ip.sb/geoip',
      parse: (data: any): GeoIPData => ({
        ip: data.ip,
        country: data.country,
        city: data.city
      })
    }
  ];

  for (const api of APIs) {
    try {
      const response = await fetch(api.url, {
        signal: AbortSignal.timeout(5000),
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        const result = api.parse(data);
        
        if (result.ip && result.ip !== '0.0.0.0') {
          cachedGeoData = result;
          cacheTimestamp = Date.now();
          console.log('✅ IP detected:', result.ip, result.country, result.city);
          return result;
        }
      }
    } catch {
      // Try next API
      continue;
    }
  }

  // Final fallback
  console.warn('⚠️ Could not detect IP from any API');
  return { ip: '0.0.0.0', country: undefined, city: undefined };
};

// Keep original function for backward compatibility
export const getClientIP = async (): Promise<string> => {
  const geoData = await getClientIPWithGeo();
  return geoData.ip;
};

export const generateSessionToken = (): string => {
  return crypto.randomUUID();
};
