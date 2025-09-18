targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment that can be used as part of naming resource convention')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('Name of the resource group to create')
param resourceGroupName string = 'rg-${environmentName}'

@description('Next.js authentication secret')
@secure()
param nextAuthSecret string

@description('Next.js authentication URL')
param nextAuthUrl string

@description('Azure OpenAI API key')
@secure()
param azureOpenAiApiKey string

@description('Azure OpenAI endpoint')
param azureOpenAiEndpoint string

@description('Azure OpenAI deployment name')
param azureOpenAiDeploymentName string

@description('PostgreSQL administrator username')
param postgresAdminUsername string = 'mnemocyte_admin'

@description('PostgreSQL administrator password')
@secure()
param postgresAdminPassword string

// Generate a unique token for resource naming
var resourceToken = uniqueString(subscription().id, location, environmentName)
var resourcePrefix = 'mnc'

// Create the resource group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: resourceGroupName
  location: location
  tags: {
    'azd-env-name': environmentName
  }
}

// Deploy resources to the resource group
module resources 'resources.bicep' = {
  name: 'resources'
  scope: resourceGroup
  params: {
    location: location
    environmentName: environmentName
    resourceToken: resourceToken
    resourcePrefix: resourcePrefix
    nextAuthSecret: nextAuthSecret
    nextAuthUrl: nextAuthUrl
    azureOpenAiApiKey: azureOpenAiApiKey
    azureOpenAiEndpoint: azureOpenAiEndpoint
    azureOpenAiDeploymentName: azureOpenAiDeploymentName
    postgresAdminUsername: postgresAdminUsername
    postgresAdminPassword: postgresAdminPassword
  }
}

// Outputs
output RESOURCE_GROUP_ID string = resourceGroup.id
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = resources.outputs.AZURE_CONTAINER_REGISTRY_ENDPOINT
output AZURE_CONTAINER_REGISTRY_NAME string = resources.outputs.AZURE_CONTAINER_REGISTRY_NAME
output AZURE_CONTAINER_APPS_ENVIRONMENT_ID string = resources.outputs.AZURE_CONTAINER_APPS_ENVIRONMENT_ID
output AZURE_KEY_VAULT_ENDPOINT string = resources.outputs.AZURE_KEY_VAULT_ENDPOINT
output AZURE_OPENAI_ENDPOINT string = azureOpenAiEndpoint
output AZURE_OPENAI_DEPLOYMENT_NAME string = azureOpenAiDeploymentName
output DATABASE_URL string = resources.outputs.DATABASE_URL
output NEXTAUTH_URL string = nextAuthUrl