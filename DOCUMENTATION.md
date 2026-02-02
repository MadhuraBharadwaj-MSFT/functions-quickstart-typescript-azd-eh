# Detailed Documentation

This document provides in-depth information about the Azure Functions Event Hubs sample application.

## Table of Contents

- [Domain Model](#domain-model)
- [Monitoring and Logs](#monitoring-and-logs)
- [News Generator Details](#news-generator-details)
- [News Processor Details](#news-processor-details)
- [Sample Processing Output](#sample-processing-output)
- [Project Structure](#project-structure)
- [Networking and VNet Integration](#networking-and-vnet-integration)

## Domain Model

### NewsArticle

- **ArticleId**: Unique identifier (NEWS-YYYYMMDD-XXXXXXXX)
- **Title**: Article headline using realistic templates
- **Content**: Article summary/snippet
- **Author**: Article author from pool of 8 journalists
- **Source**: News source (Tech Today, Health Herald, Finance Focus, etc.)
- **Category**: News category (Technology, Health, Business, Sports, Culture, Science)
- **PublishedDate**: When the article was published
- **ViewCount**: Simulated engagement (100-10,000 views)
- **SentimentScore**: Sentiment analysis score (-1.0 to 1.0)
- **Status**: Published or Featured
- **Tags**: Category-specific tags for classification

## Monitoring and Logs

You can monitor your functions in the Azure Portal:

1. Navigate to your function app in the Azure Portal
2. Select "Functions" from the left menu
3. Click on your function (TimerTrigger or EventHubsTrigger)
4. Select "Monitor" to view execution logs

Use the "Live Metrics" feature in Application Insights to see real-time information when testing.

### Application Insights Queries

**News Articles Generated Per Minute**

```kusto
traces
| where message contains "Successfully generated and sent"
| summarize ArticlesGenerated = sum(toint(extract(@"(\d+) news article", 1, message))) by bin(timestamp, 1m)
| render timechart
```

**News Articles Processed Per Minute**

```kusto
traces
| where message contains "NEWS BATCH SUMMARY"
| extend ArticleCount = toint(extract(@"(\d+) articles", 1, message))
| summarize ArticlesProcessed = sum(ArticleCount) by bin(timestamp, 1m)
| render timechart
```

**Viral Articles Detection**

```kusto
traces
| where message contains "Viral article"
| extend ViewCount = toint(extract(@"(\d+,?\d*) views", 1, message))
| summarize ViralArticles = count(), TotalViews = sum(ViewCount) by bin(timestamp, 5m)
| render timechart
```

**Sentiment Analysis Trends**

```kusto
traces
| where message contains "Avg Sentiment"
| extend AvgSentiment = todouble(extract(@"Avg Sentiment: ([+-]?\d*\.?\d+)", 1, message))
| summarize AverageSentiment = avg(AvgSentiment) by bin(timestamp, 5m)
| render timechart
```

## News Generator Details

The news generator runs every 10 seconds and creates 3-8 realistic news articles.

### Features

- **High-frequency timer trigger**: Generates articles every 10 seconds for demo throughput
- **Realistic news data**: Creates authentic articles with proper journalism structure
- **Multi-category support**: Technology, Health, Business, Sports, Culture, Science
- **Event Hub streaming**: Sends articles to Azure Event Hubs with rich metadata
- **Configurable**: Easy to adjust generation frequency and content patterns

### Sample Generated Articles

- **Authors**: Pool of 8 realistic journalist names (Sarah Johnson, Michael Chen, Emily Rodriguez, etc.)
- **Sources**: Tech Today, Health Herald, Finance Focus, Sports Spotlight, Culture Corner, Science Daily, Global News, Innovation Weekly
- **Categories**: 6 different news categories with specific content
- **Title Templates**: "Breaking: Major Discovery in {topic}", "New {topic} Study Reveals Surprising Benefits", etc.
- **Metadata**: Sentiment scores, view counts, category tags

## News Processor Details

The news processor function handles incoming articles from Event Hubs with advanced analytics.

### Features

- **Event Hub trigger**: Automatically processes articles as they stream in
- **Sentiment analysis**: Tracks article sentiment scores (-1.0 to 1.0)
- **Engagement tracking**: Monitors view counts and viral detection
- **Category analytics**: Analyzes trends across news categories
- **Source monitoring**: Tracks performance by news source

### Processing Logic

- ✅ **Validation**: Ensures all required fields are present (title, author, content, etc.)
- 🔥 **Viral detection**: Special handling for articles with >5,000 views
- 😊😢 **Sentiment tracking**: Identifies articles with strong positive/negative sentiment (>0.7)
- 🏷️ **Tag analysis**: Processes category-specific tags for better classification
- 📊 **Batch analytics**: Provides comprehensive statistics per processing batch

## Sample Processing Output

```
🗞️ News Generator started
📝 Generated article: NEWS-20251110-A1B2C3D4 - 'Breaking: Major Discovery in Renewable Energy Technology' by Sarah Johnson
✅ Successfully generated and sent 5 news article(s) to Event Hub
🔄 Event hub function processing 5 message(s)
✅ Successfully processed article NEWS-20251110-A1B2C3D4 - 'Breaking: Major Discovery in Renewable Energy Technology' by Sarah Johnson
🔥 Viral article: NEWS-20251110-E5F6G7H8 - 8,547 views
😊 Strong positive sentiment: NEWS-20251110-I9J0K1L2 (0.89)
🏷️ Well-tagged article: NEWS-20251110-M3N4O5P6 - 5 tags
📰 Processed 5 news articles, 0 failed in batch of 5
📊 NEWS BATCH SUMMARY: 5 articles | Total Views: 18,432 | Avg Views: 3,686 | Avg Sentiment: 0.34 | Status: [Published: 3, Featured: 2]
📂 Top Categories: [Technology: 2, Business: 2, Science: 1] | Top Sources: [Tech Today: 2, Global News: 2, Science Daily: 1]
🔥 Viral articles in batch: 2
😊😢 Strong sentiment articles in batch: 3
🏷️ Well-tagged articles in batch: 4
📤 Sent 5 article(s) to output Event Hub
```

## Project Structure

```
functions-quickstart-typescript-azd-eventhub/
├── src/
│   ├── functions/
│   │   ├── EventHubsTrigger.ts    # Event Hub trigger function (processes news)
│   │   └── TimerTrigger.ts        # Timer trigger (generates news articles)
│   └── types/
│       └── NewsArticle.ts         # Shared NewsArticle interface and validation
├── package.json                    # Node.js dependencies
├── tsconfig.json                   # TypeScript configuration
├── host.json                       # Function host settings
├── local.settings.json             # Local development settings (generated)
├── infra/                          # Infrastructure as Code
│   ├── main.bicep                  # Main infrastructure template
│   ├── main.parameters.json        # Infrastructure parameters
│   ├── abbreviations.json          # Resource naming abbreviations
│   ├── app/                        # Modular infrastructure components
│   │   ├── api.bicep               # Function App (Flex Consumption)
│   │   ├── eventhubs.bicep         # Event Hubs namespace and hubs
│   │   ├── eventhubs-PrivateEndpoint.bicep  # Event Hubs private endpoint
│   │   ├── storage-PrivateEndpoint.bicep    # Storage private endpoints
│   │   ├── vnet.bicep              # Virtual Network configuration
│   │   └── rbac.bicep              # Role-based access control
│   └── scripts/                    # Deployment and setup scripts
│       ├── postprovision.ps1       # Post-provision setup (Windows)
│       └── postprovision.sh        # Post-provision setup (POSIX)
├── .azure/                         # Azure Developer CLI environment
├── azure.yaml                      # Azure Developer CLI configuration
├── README.md                       # Quick start guide
└── DOCUMENTATION.md                # Detailed documentation (this file)
```

## Networking and VNet Integration

This sample supports optional VNet integration with private endpoints for enhanced security.

### Configuration

Set the `VNET_ENABLED` environment variable before deployment:

For simple deployment without VNet (public endpoints):
```bash
azd env set VNET_ENABLED false
```

For secure deployment with VNet (private endpoints):
```bash
azd env set VNET_ENABLED true
```

When `vnetEnabled=true`, the deployment creates:

- Virtual Network with three subnets (app integration, storage endpoints, Event Hub endpoints)
- Private endpoints for Storage (blob, table, queue) and Event Hubs
- Private DNS zones for name resolution
- Network isolation with public access disabled

The VNet deployment takes longer (~4-5 minutes) but provides enhanced security suitable for production workloads.

### VNet Architecture

When VNet integration is enabled, the following network architecture is created:

#### Subnets

1. App Integration Subnet: For Function App VNet integration
2. Storage Private Endpoints Subnet: For Storage Account private endpoints
3. Event Hubs Private Endpoints Subnet: For Event Hubs private endpoints

#### Private Endpoints

- **Storage Account**: Blob, Table, and Queue private endpoints
- **Event Hubs**: Namespace private endpoint

#### DNS Configuration

- Private DNS zones are automatically created and linked to the VNet
- Ensures proper name resolution for private endpoints

### Security Considerations

When using VNet integration:

- Public access to Event Hubs and Storage is disabled
- All traffic flows through private endpoints within the VNet
- Client IP must be added to Event Hubs network rules for local development (done automatically by post-provision scripts)
- Managed Identity is used for authentication between services
