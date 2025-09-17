# Azure Deployment Guide for Agent Store

## Prerequisites

1. **Azure CLI** installed and configured
2. **Docker** installed locally
3. **Azure Container Registry** (ACR) created
4. **Azure App Service** or **Azure Container Instances** ready

## Phase 3: Azure Deployment Steps

### 1. Container Registry Setup

```bash
# Create Azure Container Registry (if not exists)
az acr create --resource-group <your-rg> --name <your-acr> --sku Basic

# Login to ACR
az acr login --name <your-acr>

# Get ACR login server
az acr show --name <your-acr> --query loginServer --output tsv
```

### 2. Build and Push to ACR

```bash
# Tag your image for ACR
docker tag agent-store:latest <your-acr>.azurecr.io/agent-store:latest

# Push to ACR
docker push <your-acr>.azurecr.io/agent-store:latest
```

### 3. Deploy to Azure App Service

```bash
# Create App Service Plan (if not exists)
az appservice plan create --name agent-store-plan --resource-group <your-rg> --sku B1 --is-linux

# Create Web App from container
az webapp create --resource-group <your-rg> --plan agent-store-plan --name <your-app-name> --deployment-container-image-name <your-acr>.azurecr.io/agent-store:latest

# Configure container settings
az webapp config container set --name <your-app-name> --resource-group <your-rg> --docker-custom-image-name <your-acr>.azurecr.io/agent-store:latest --docker-registry-server-url https://<your-acr>.azurecr.io
```

### 4. Alternative: Azure Container Instances

```bash
# Deploy to ACI (simpler, but less features)
az container create --resource-group <your-rg> --name agent-store-aci --image <your-acr>.azurecr.io/agent-store:latest --cpu 1 --memory 1 --registry-login-server <your-acr>.azurecr.io --registry-username <acr-username> --registry-password <acr-password> --dns-name-label agent-store-unique --ports 80
```

## Important Considerations

### 1. Environment Variables
Set these in Azure App Service Configuration:
- `NODE_ENV=production`
- Any custom webhook URLs if different from defaults

### 2. Custom Domain & SSL
```bash
# Add custom domain
az webapp config hostname add --webapp-name <your-app-name> --resource-group <your-rg> --hostname <your-domain>

# Enable HTTPS (automatic with App Service)
az webapp update --name <your-app-name> --resource-group <your-rg> --https-only true
```

### 3. n8n Webhook Considerations

**IMPORTANT:** Update your n8n webhook configurations to allow requests from your new Azure domain:

1. **CORS Settings** in n8n:
   - Add your Azure domain to allowed origins
   - Example: `https://your-app.azurewebsites.net`

2. **Webhook Security** (if applicable):
   - Update any IP whitelisting
   - Verify SSL certificate validation

### 4. Health Monitoring

Azure will automatically use the `/health` endpoint we configured in nginx for health checks.

### 5. Scaling Configuration

```bash
# Enable autoscale (App Service)
az webapp config set --name <your-app-name> --resource-group <your-rg> --always-on true

# Configure scale rules if needed
az monitor autoscale create --resource-group <your-rg> --resource <your-app-name> --resource-type Microsoft.Web/sites --name autoscale-agent-store --min-count 1 --max-count 3 --count 1
```

## Testing Deployment

1. **Access your app**: `https://<your-app-name>.azurewebsites.net`
2. **Test health endpoint**: `https://<your-app-name>.azurewebsites.net/health`
3. **Test agent functionality**: Navigate to Agents Store and test a webhook call

## Rollback Plan

Keep Vercel deployment active until Azure is fully tested:
1. Test all agent webhooks work from Azure
2. Verify performance is acceptable
3. Update DNS gradually (subdomain first)
4. Monitor for 24-48 hours before decommissioning Vercel

## Cost Optimization

- **App Service Basic B1**: ~$13/month
- **Container Registry Basic**: ~$5/month
- **Consider Reserved Instances** for long-term cost savings

## CI/CD Integration

Consider setting up GitHub Actions for automated deployments:
```yaml
# .github/workflows/azure-deploy.yml
name: Deploy to Azure
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and push to ACR
        # ... deployment steps
```