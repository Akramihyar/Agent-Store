#!/bin/bash

CLIENT_NAME="agent-store"
RESOURCE_GROUP="ai-hub-$CLIENT_NAME"
LOG_ANALYTICS_WORKSPACE_NAME="ai-hub-$CLIENT_NAME-loganalytics"
CONTAINER_APP_ENV_NAME="ai-hub-$CLIENT_NAME-appenv"
APP_NAME="ai-hub-$CLIENT_NAME"
LOCATION="germanywestcentral"

# Login to Azure Container Registry
echo "Logging into Azure Container Registry..."
az acr login --name neulandacr

echo "Creating Resource Group $RESOURCE_GROUP..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION"

echo "Creating Log Analytics Workspace $LOG_ANALYTICS_WORKSPACE_NAME..."
az monitor log-analytics workspace create \
    --resource-group "$RESOURCE_GROUP" \
    --workspace-name "$LOG_ANALYTICS_WORKSPACE_NAME" \
    --location "$LOCATION"

# Retrieve Log Analytics Workspace ID and Primary Key
LOG_WORKSPACE_ID=$(az monitor log-analytics workspace show \
    --resource-group "$RESOURCE_GROUP" \
    --workspace-name "$LOG_ANALYTICS_WORKSPACE_NAME" \
    --query customerId -o tsv | tr -d '[:space:]')

LOG_WORKSPACE_KEY=$(az monitor log-analytics workspace get-shared-keys \
    --resource-group "$RESOURCE_GROUP" \
    --workspace-name "$LOG_ANALYTICS_WORKSPACE_NAME" \
    --query primarySharedKey -o tsv)

# Create Container App Environment with Log Analytics integration
echo "Creating Container App Environment $CONTAINER_APP_ENV_NAME..."
az containerapp env create \
    --name "$CONTAINER_APP_ENV_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --logs-workspace-id "$LOG_WORKSPACE_ID" \
    --logs-workspace-key "$LOG_WORKSPACE_KEY"

# Get managed identity ID
echo "Getting managed identity ID..."
IDENTITY_ID=$(az identity show \
    --name shared-identity \
    --resource-group shared-services \
    --query id \
    --output tsv)

if [ -z "$IDENTITY_ID" ]; then
    echo "Error: Could not retrieve managed identity ID"
    exit 1
fi

echo "Using managed identity ID: $IDENTITY_ID"

# DEV Environment
echo "Creating container apps ..."

# backend
echo "Creating backend container app..."
az containerapp create \
    --name "$APP_NAME-backend" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$CONTAINER_APP_ENV_NAME" \
    --image "neulandacr.azurecr.io/hello-world" \
    --registry-server "neulandacr.azurecr.io" \
    --cpu 1.0 \
    --memory 2.0Gi \
    --ingress external \
    --target-port 3001 \
    --min-replicas 1 \
    --max-replicas 2 \
    --user-assigned "$IDENTITY_ID"

# frontend
echo "Creating frontend container app..."
az containerapp create \
    --name "$APP_NAME-frontend" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$CONTAINER_APP_ENV_NAME" \
    --image "neulandacr.azurecr.io/hello-world" \
    --registry-server "neulandacr.azurecr.io" \
    --cpu 1.0 \
    --memory 2.0Gi \
    --ingress external \
    --target-port 80 \
    --min-replicas 1 \
    --max-replicas 2 \
    --user-assigned "$IDENTITY_ID"