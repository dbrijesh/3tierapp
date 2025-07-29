export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com',
  cognito: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_XXXXXXXXX',
    clientId: 'your-cognito-client-id',
    domain: 'your-cognito-domain',
    redirectUri: 'https://your-frontend-domain.com/callback'
  },
  azureAD: {
    tenantId: 'your-tenant-id',
    clientId: 'your-azure-client-id',
    clientSecret: 'your-azure-client-secret',
    redirectUri: 'https://your-frontend-domain.com/callback'
  }
};