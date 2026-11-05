const isProd = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

export const environment = {
  production: isProd,
  apiUrl: isProd ? 'https://ethiobridge-backend-rack.onrender.com/api/v1' : 'http://localhost:8080/api/v1',
  aiServiceUrl: isProd ? 'https://ethio-bridge-o152.onrender.com/ai/v1' : 'http://localhost:8000/ai/v1',
  keycloakUrl: 'http://localhost:8180',
  keycloakRealm: 'ethiobridge',
  keycloakClientId: 'ethiobridge-frontend'
};
