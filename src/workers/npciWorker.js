// NPCI Log Processing Web Worker
// Handles heavy log processing off the main UI thread

// Import API configuration for centralized endpoint management
const API_ENDPOINTS = {
  NPCI: {
    LINKS: {
      PRIMARY: '/npci/links/primary',
      SECONDARY: '/npci/links/secondary',
      BACKUP: '/npci/links/backup',
      WEBSOCKET: '/npci/links/stream'
    }
  }
};

// TFL Section 11: NPCI TCP/IP Links from API Config
const NPCI_LINKS = {
  PRIMARY: API_ENDPOINTS.NPCI.LINKS.PRIMARY,
  SECONDARY: API_ENDPOINTS.NPCI.LINKS.SECONDARY,
  BACKUP: API_ENDPOINTS.NPCI.LINKS.BACKUP
};

// TFL Section 15: Official Status Colors
const STATUS_COLORS = {
  SUCCESS: '#10b981',      // Green for healthy links
  LINK_DOWN: '#991b1b',    // Dark red for link down
  WARNING: '#f59e0b',      // Orange for degraded
  PENDING: '#3b82f6'       // Blue for connecting
};

// Process NPCI log entries
function processLogEntry(logLine) {
  try {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      raw: logLine,
      processed: false
    };

    // Parse common NPCI log patterns
    if (logLine.includes('CONNECTED')) {
      entry.status = 'CONNECTED';
      entry.color = STATUS_COLORS.SUCCESS;
      entry.processed = true;
    } else if (logLine.includes('DISCONNECTED') || logLine.includes('CONNECTION_LOST')) {
      entry.status = 'DISCONNECTED';
      entry.color = STATUS_COLORS.LINK_DOWN;
      entry.processed = true;
    } else if (logLine.includes('TIMEOUT') || logLine.includes('DEGRADED')) {
      entry.status = 'DEGRADED';
      entry.color = STATUS_COLORS.WARNING;
      entry.processed = true;
    } else if (logLine.includes('CONNECTING')) {
      entry.status = 'CONNECTING';
      entry.color = STATUS_COLORS.PENDING;
      entry.processed = true;
    }

    return entry;
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      raw: logLine,
      status: 'ERROR',
      color: STATUS_COLORS.LINK_DOWN,
      processed: false,
      error: error.message
    };
  }
}

// Simulate NPCI log stream (replace with actual implementation)
function startLogStream() {
  const logs = [
    'NPCI Primary Link CONNECTED',
    'TLS Handshake OK',
    'Heartbeat received',
    'NPCI Secondary Link CONNECTING',
    'Connection established',
    'Link status: HEALTHY'
  ];

  let index = 0;
  processingInterval = setInterval(() => {
    const logLine = logs[index % logs.length];
    const processed = processLogEntry(logLine);
    
    // Send processed data to main thread
    self.postMessage({
      type: 'LOG_PROCESSED',
      data: processed
    });
    
    index++;
  }, 2000); // Process logs every 2 seconds
}

function stopLogStream() {
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
  }
}

// Handle messages from main thread
self.onmessage = function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'START_MONITORING':
      startLogStream();
      self.postMessage({
        type: 'MONITORING_STARTED',
        data: { links: Object.keys(NPCI_LINKS) }
      });
      break;

    case 'STOP_MONITORING':
      stopLogStream();
      self.postMessage({
        type: 'MONITORING_STOPPED'
      });
      break;

    case 'PROCESS_LOG':
      const processed = processLogEntry(data.logLine);
      self.postMessage({
        type: 'LOG_PROCESSED',
        data: processed
      });
      break;

    case 'GET_STATUS':
      self.postMessage({
        type: 'STATUS_UPDATE',
        data: {
          monitoring: processingInterval !== null,
          links: NPCI_LINKS,
          colors: STATUS_COLORS
        }
      });
      break;

    default:
      self.postMessage({
        type: 'ERROR',
        data: { message: `Unknown message type: ${type}` }
      });
  }
};

// Cleanup on worker termination
self.onclose = function() {
  stopLogStream();
};
