import { getSiteURL } from '@/lib/get-site-url';
import { LogLevel } from '@/lib/logger';

export interface Config {
  site: { 
    name: string; 
    description: string; 
    themeColor: string; 
    url: string;
  };
  logLevel: keyof typeof LogLevel;
}

export const config: Config = {
  site: { 
    name: 'ERP System', 
    description: 'Enterprise Resource Planning System', 
    themeColor: '#1976d2', 
    url: getSiteURL()
  },
  logLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL as keyof typeof LogLevel) ?? LogLevel.ALL,
};
