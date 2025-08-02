import { queryClient } from './provider';

// WebSocket connection for cache clearing notifications
let ws: WebSocket | null = null;

export const initializeWebSocket = () => {
  // Only initialize if not already connected
  if (ws && ws.readyState === WebSocket.OPEN) {
    return;
  }

  try {
    // Connect to WebSocket server (you'll need to implement this on backend)
    ws = new WebSocket('ws://localhost:4575/ws');

    ws.onopen = () => {
      console.log('WebSocket connected for cache notifications');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'cache:clear') {
          console.log('Received cache clear notification');
          // Clear all cache
          queryClient.clear();
          // Show notification to user
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('ERP System', {
              body: 'System cache has been cleared by administrator',
              icon: '/favicon.ico'
            });
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 5 seconds
      setTimeout(() => {
        initializeWebSocket();
      }, 5000);
    };
  } catch (error) {
    console.error('Failed to initialize WebSocket:', error);
  }
};

export const disconnectWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
};

// Initialize WebSocket when the app starts
if (typeof window !== 'undefined') {
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  // Initialize WebSocket
  initializeWebSocket();
} 