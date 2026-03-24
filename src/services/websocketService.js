/**
 * WebSocket Service
 * Manages real-time connections using centralized configuration
 */

import { API_CONFIG, isDevelopment } from '../config/apiConfig';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.url = API_CONFIG.wsURL;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnecting = false;
    this.heartbeatInterval = null;
  }

  /**
   * Connect to WebSocket
   */
  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      const token = localStorage.getItem('authToken');
      const wsURL = token ? `${this.url}?token=${token}` : this.url;
      
      this.ws = new WebSocket(wsURL);
      
      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.notifyListeners('connected', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        this.notifyListeners('disconnected', { code: event.code, reason: event.reason });
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.notifyListeners('error', { error });
      };

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.isConnecting = false;
      this.reconnect();
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(data) {
    const { type, payload } = data;
    
    if (isDevelopment()) {
      console.log('📨 WebSocket message:', type, payload);
    }

    // Notify specific listeners
    this.notifyListeners(type, payload);
    
    // Notify general message listeners
    this.notifyListeners('message', data);
  }

  /**
   * Send message to WebSocket
   */
  send(type, payload = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload, timestamp: Date.now() });
      this.ws.send(message);
      
      if (isDevelopment()) {
        console.log('📤 WebSocket sent:', type, payload);
      }
    } else {
      console.warn('WebSocket not connected, cannot send message:', type);
    }
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
  }

  /**
   * Unsubscribe from event types
   */
  unsubscribe(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
    }
  }

  /**
   * Notify all listeners for an event type
   */
  notifyListeners(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('WebSocket listener error:', error);
        }
      });
    }
  }

  /**
   * Reconnect with exponential backoff
   */
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.notifyListeners('maxReconnectAttemptsReached', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('ping');
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.listeners.clear();
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  /**
   * Get connection status
   */
  getStatus() {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'CONNECTED';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
export const wsService = new WebSocketService();

// Auto-connect in development mode
if (isDevelopment() && import.meta.env.VITE_ENABLE_WEBSOCKET === 'true') {
  // Delay connection to allow authentication
  setTimeout(() => {
    wsService.connect();
  }, 1000);
}

export default wsService;
