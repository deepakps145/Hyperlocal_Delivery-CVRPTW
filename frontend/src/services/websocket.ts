import { useEffect, useRef, useState } from 'react';

type WebSocketMessage = {
  type: 'order_update' | 'rider_update' | 'order_cancelled' | 'order_assigned' | 'order_deleted' | 'route_updated';
  data: any;
};

type WebSocketHookReturn = {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  lastMessage: WebSocketMessage | null;
};

export function useWebSocket(url: string): WebSocketHookReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('WebSocket: No token available, skipping connection');
        return;
      }

      // Close existing connection if any
      if (ws.current) {
        ws.current.close();
      }

      console.log('WebSocket: Attempting connection to', url);
      ws.current = new WebSocket(`${url}?token=${token}`);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        if (mountedRef.current) {
          setIsConnected(true);
        }
        // Clear reconnect timeout if connection successful
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (mountedRef.current) {
            setLastMessage(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        if (mountedRef.current) {
          setIsConnected(false);
          // Attempt to reconnect after 3 seconds only if still mounted
          reconnectTimeout.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log('Attempting to reconnect...');
              connect();
            }
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't let websocket errors crash the app
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    // Delay connection slightly to ensure component is fully mounted
    const initTimeout = setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 100);

    return () => {
      // Cleanup on unmount
      mountedRef.current = false;
      clearTimeout(initTimeout);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  return {
    isConnected,
    sendMessage,
    lastMessage,
  };
}
