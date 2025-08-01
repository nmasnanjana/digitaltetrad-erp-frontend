'use client';

import { useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

export function FaviconUpdater(): null {
  const { settings } = useSettings();

  useEffect(() => {
    const updateFavicon = () => {
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll('link[rel*="icon"]');
      existingLinks.forEach(link => link.remove());

      if (settings?.company_logo) {
        // Create a new favicon link using the company logo
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = settings.company_logo;
        document.head.appendChild(link);

        // Also add apple-touch-icon for iOS devices
        const appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        appleLink.href = settings.company_logo;
        document.head.appendChild(appleLink);
      } else {
        // Create a placeholder favicon using canvas
        const createPlaceholderFavicon = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 32;
          canvas.height = 32;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Background
            ctx.fillStyle = '#1976d2'; // Primary color
            ctx.fillRect(0, 0, 32, 32);
            
            // Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const text = settings?.company_name && settings.company_name !== 'Company Name' 
              ? settings.company_name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
              : 'ERP';
            
            ctx.fillText(text, 16, 16);
            
            // Convert to data URL
            const dataURL = canvas.toDataURL('image/png');
            
            // Create favicon link
            const link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/png';
            link.href = dataURL;
            document.head.appendChild(link);
            
            // Also add apple-touch-icon
            const appleLink = document.createElement('link');
            appleLink.rel = 'apple-touch-icon';
            appleLink.href = dataURL;
            document.head.appendChild(appleLink);
          }
        };
        
        createPlaceholderFavicon();
      }
    };

    const updateTitle = () => {
      if (settings?.company_name && settings.company_name !== 'Company Name') {
        document.title = `${settings.company_name} - ERP System`;
      } else {
        document.title = 'ERP System';
      }
    };

    updateFavicon();
    updateTitle();
  }, [settings?.company_logo, settings?.company_name]);

  return null;
} 