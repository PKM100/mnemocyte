# Azure Deployment Guide for Mnemocyte Smart NPCs

This guide will help you deploy your Mnemocyte Smart NPCs application to Azure using Azure Developer CLI (azd) and Azure Container Apps.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Azure Developer CLI (azd)**
   ```bash
   # Install azd (macOS/Linux)
   curl -fsSL https://aka.ms/install-azd.sh | bash
   
   # Or using Homebrew (macOS)
   brew tap azure/azd && brew install azd
   ```

2. **Azure CLI**
   ```bash
   # Install Azure CLI
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   
   # Or using Homebrew (macOS)
   brew install azure-cli
   ```

3. **Docker** (for building container images)
   - Download and install Docker Desktop from https://www.docker.com/products/docker-desktop

## Azure Resources Required

You'll need access to the following Azure services:
- **Azure OpenAI Service** - For AI-powered NPC conversations
- **Azure Container Apps** - For hosting your Next.js application
- **Azure Database for PostgreSQL** - For production database
- **Azure Container Registry** - For storing container images
- **Azure Key Vault** - For secure secret management

## Step 1: Azure Setup

1. **Login to Azure**
   ```bash
   az login
   azd auth login
   ```

2. **Set up Azure OpenAI Service** (if not already done)
   - Go to Azure Portal
   - Create an Azure OpenAI resource
   - Deploy a model (e.g., gpt-35-turbo or gpt-4)
   - Note down:
     - API Key
     - Endpoint URL
     - Deployment name

## Step 2: Environment Configuration

1. **Initialize azd environment**
   ```bash
   azd env new mnemocyte-prod
   ```

2. **Set required environment variables**
   ```bash
   # Azure location (choose closest to your users)
   azd env set AZURE_LOCATION "eastus"
   
   # Next.js authentication
   azd env set NEXTAUTH_SECRET "$(openssl rand -base64 32)"
   azd env set NEXTAUTH_URL "https://your-app-will-be-here.azurecontainerapps.io"
   
   # Azure OpenAI (replace with your values)
   azd env set AZURE_OPENAI_API_KEY "your-openai-api-key"
   azd env set AZURE_OPENAI_ENDPOINT "https://your-openai-resource.openai.azure.com/"
   azd env set AZURE_OPENAI_DEPLOYMENT_NAME "your-model-deployment-name"
   
   # PostgreSQL admin credentials
   azd env set POSTGRES_ADMIN_USERNAME "mnemocyte_admin"
   azd env set POSTGRES_ADMIN_PASSWORD "$(openssl rand -base64 24)"
   ```

## Step 3: Deploy to Azure

1. **Deploy infrastructure and application**
   ```bash
   azd up
   ```
   
   This command will:
   - Create all Azure resources (Container Apps, PostgreSQL, Key Vault, etc.)
   - Build your Docker container
   - Push it to Azure Container Registry
   - Deploy your application
   - Run database migrations

2. **Update NEXTAUTH_URL with actual URL**
   After deployment, azd will output your application URL. Update the environment variable:
   ```bash
   azd env set NEXTAUTH_URL "https://your-actual-app-url.azurecontainerapps.io"
   azd deploy
   ```

## Step 4: Database Migration

Your database will be automatically set up, but you may need to run migrations:

1. **Connect to your deployed container**
   ```bash
   # Get the container app name
   az containerapp list --query "[].name" -o table
   
   # Run database migration
   az containerapp exec -n your-container-app-name -g rg-mnemocyte-prod --command "npx prisma migrate deploy"
   ```

## Step 5: Verify Deployment

1. **Check application health**
   ```bash
   azd show
   ```

2. **View application logs**
   ```bash
   azd logs
   ```

3. **Access your application**
   - Your app will be available at the URL shown in azd output
   - Test character creation and AI conversations

## Environment Variables Reference

The following environment variables are automatically configured:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `NEXTAUTH_URL` - Your application URL
- `AZURE_OPENAI_API_KEY` - Azure OpenAI API key
- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint
- `AZURE_OPENAI_DEPLOYMENT_NAME` - Model deployment name
- `AZURE_OPENAI_API_VERSION` - API version (2024-02-15-preview)
- `NODE_ENV` - Set to 'production'

## Troubleshooting

### Common Issues:

1. **Deployment fails with authentication error**
   ```bash
   az login --use-device-code
   azd auth login --use-device-code
   ```

2. **Database connection issues**
   - Check that PostgreSQL firewall rules allow Azure services
   - Verify DATABASE_URL format in container app environment variables

3. **Azure OpenAI quota exceeded**
   - Check your Azure OpenAI quotas and limits
   - Consider requesting quota increases

4. **Container fails to start**
   ```bash
   # Check container logs
   azd logs
   
   # Or use Azure CLI
   az containerapp logs show -n your-container-app-name -g rg-mnemocyte-prod
   ```

### Useful Commands:

```bash
# Redeploy application only (skip infrastructure)
azd deploy

# Update environment variables
azd env set VARIABLE_NAME "new-value"
azd deploy

# Delete all resources
azd down

# Check deployment status
azd show

# View resource group in Azure Portal
az group show -n rg-mnemocyte-prod --query "properties.provisioningState"
```

## Security Considerations

- All secrets are stored in Azure Key Vault
- Database uses SSL/TLS encryption
- Container apps use managed identity for secure access
- Network access is restricted to HTTPS only

## Scaling and Performance

- Container Apps automatically scale based on HTTP requests
- PostgreSQL can be scaled up/down as needed
- Consider Azure CDN for static assets in production

## Cost Optimization

- Container Apps scale to zero when not in use
- Use Basic tier for PostgreSQL in development
- Monitor costs with Azure Cost Management

## Next Steps

After successful deployment:
1. Set up custom domain and SSL certificate
2. Configure monitoring and alerts
3. Set up CI/CD pipeline for automated deployments
4. Configure backup strategies for your database

---

For more help, see:
- [Azure Developer CLI documentation](https://docs.microsoft.com/azure/developer/azure-developer-cli/)
- [Azure Container Apps documentation](https://docs.microsoft.com/azure/container-apps/)
- [Azure OpenAI documentation](https://docs.microsoft.com/azure/cognitive-services/openai/)