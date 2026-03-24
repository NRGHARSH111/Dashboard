/**
 * Backend Health Check Utility
 * Helps identify if errors are due to missing backend services
 */

export const checkBackendHealth = async () => {
  // Get URLs from environment variables
  const prometheusUrl = import.meta.env.VITE_PROMETHEUS_URL || 'http://localhost:9090';
  const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3000';
  const elkUrl = import.meta.env.VITE_ELK_URL || 'http://localhost:9200';
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

  const services = [
    { 
      name: 'Prometheus', 
      url: `${prometheusUrl}/api/v1/query`,
      test: () => fetch(`${prometheusUrl}/api/v1/query?query=up`)
    },
    { 
      name: 'Grafana', 
      url: `${grafanaUrl}/api/health`,
      test: () => fetch(`${grafanaUrl}/api/health`)
    },
    { 
      name: 'ELK Stack', 
      url: `${elkUrl}/_cluster/health`,
      test: () => fetch(`${elkUrl}/_cluster/health`)
    },
    { 
      name: 'TFL API', 
      url: `${apiUrl}/health`,
      test: () => fetch(`${apiUrl}/health`)
    },
    { 
      name: 'WebSocket', 
      url: wsUrl,
      test: () => Promise.race([
        new Promise((_, reject) => 
          new WebSocket(wsUrl).addEventListener('error', () => reject(new Error('WebSocket failed')))
        ),
        new Promise(resolve => setTimeout(() => resolve('timeout'), 2000))
      ])
    }
  ];

  console.group('🔍 Backend Health Check');
  const results = {};

  for (const service of services) {
    try {
      const response = await service.test();
      if (response === 'timeout') {
        results[service.name] = { status: 'TIMEOUT', url: service.url };
        console.warn(`⏰ ${service.name}: TIMEOUT - ${service.url}`);
      } else if (response.ok) {
        results[service.name] = { status: 'HEALTHY', url: service.url };
        console.log(`✅ ${service.name}: HEALTHY - ${service.url}`);
      } else {
        results[service.name] = { status: 'ERROR', url: service.url, code: response.status };
        console.error(`❌ ${service.name}: ERROR ${response.status} - ${service.url}`);
      }
    } catch (error) {
      results[service.name] = { status: 'DOWN', url: service.url, error: error.message };
      console.error(`💥 ${service.name}: DOWN - ${service.url} - ${error.message}`);
    }
  }

  const healthyCount = Object.values(results).filter(r => r.status === 'HEALTHY').length;
  console.log(`\n📊 Summary: ${healthyCount}/${services.length} services healthy`);
  
  if (healthyCount === 0) {
    console.warn('\n⚠️  ALL BACKEND SERVICES ARE DOWN!');
    console.warn('   This explains the API failures and undefined data errors.');
    console.warn('   Consider using mock data mode for development.');
  }

  console.groupEnd();
  return results;
};

/**
 * Development mode detector
 */
export const isDevelopmentMode = () => {
  return import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_DATA === 'true';
};

/**
 * API Error Classifier
 */
export const classifyError = (error, endpoint) => {
  if (error.message.includes('Failed to fetch')) {
    return {
      type: 'NETWORK_ERROR',
      severity: 'HIGH',
      message: `Backend service unavailable for ${endpoint}`,
      suggestion: 'Check if backend service is running'
    };
  }
  
  if (error.message.includes('404')) {
    return {
      type: 'ENDPOINT_NOT_FOUND',
      severity: 'MEDIUM', 
      message: `API endpoint ${endpoint} not found`,
      suggestion: 'Verify endpoint URL and backend routing'
    };
  }
  
  if (error.message.includes('401') || error.message.includes('403')) {
    return {
      type: 'AUTH_ERROR',
      severity: 'MEDIUM',
      message: `Authentication failed for ${endpoint}`,
      suggestion: 'Check API keys and authentication tokens'
    };
  }
  
  return {
    type: 'UNKNOWN_ERROR',
    severity: 'LOW',
    message: `Unexpected error for ${endpoint}: ${error.message}`,
    suggestion: 'Check browser console for details'
  };
};
