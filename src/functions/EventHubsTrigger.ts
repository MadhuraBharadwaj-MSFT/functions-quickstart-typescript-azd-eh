import { app, InvocationContext, output } from "@azure/functions";
import { NewsArticle, isNewsArticle } from "../types/NewsArticle";

const eventHubOutput = output.eventHub({
    connection: 'EventHubConnection',
    eventHubName: '%OUTPUT_EVENTHUB_NAME%'
});

export async function EventHubsTrigger(messages: unknown[], context: InvocationContext): Promise<void> {
    context.log(`🔄 Event hub function processing ${messages.length} message(s)`);
    
    const processedArticles: NewsArticle[] = [];
    let failedCount = 0;
    
    for (const message of messages) {
        try {
            // Parse the incoming message if it's a string
            const eventData = typeof message === 'string' ? JSON.parse(message) : message;
            
            // Handle both single article and array of articles
            const items: unknown[] = Array.isArray(eventData) ? eventData : [eventData];
            
            for (const item of items) {
                // Validate that the item conforms to NewsArticle interface
                if (!isNewsArticle(item)) {
                    context.warn(`⚠️ Invalid article format, skipping: ${JSON.stringify(item).substring(0, 100)}...`);
                    failedCount++;
                    continue;
                }
                
                const article = item;
                
                // Track for batch summary
                processedArticles.push(article);
                
                // High-engagement detection
                if (article.ViewCount >= 5000) {
                    context.log(`🔥 Viral article: ${article.ArticleId} - ${article.ViewCount.toLocaleString()} views`);
                }
                
                // Status logging
                if (article.Status === "Featured") {
                    context.log(`🌟 Featured article: ${article.ArticleId}`);
                }
                
                // Strong sentiment detection
                if (Math.abs(article.SentimentScore) >= 0.7) {
                    const emoji = article.SentimentScore > 0 ? "😊" : "😢";
                    context.log(`${emoji} Strong ${article.SentimentScore > 0 ? "positive" : "negative"} sentiment: ${article.ArticleId} (${article.SentimentScore.toFixed(2)})`);
                }
                
                // Well-tagged articles
                if (article.Tags.length >= 5) {
                    context.log(`🏷️ Well-tagged article: ${article.ArticleId} - ${article.Tags.length} tags`);
                }
                
                context.log(`✅ Successfully processed article ${article.ArticleId} - '${article.Title}' by ${article.Author}`);
            }
            
        } catch (error) {
            failedCount++;
            context.error(`❌ Error processing message: ${error}`);
        }
    }
    
    // Log batch processing summary
    const total = processedArticles.length;
    context.log(`📰 Processed ${total} news articles, ${failedCount} failed in batch of ${messages.length}`);
    
    if (processedArticles.length > 0) {
        // Calculate batch statistics
        const totalViews = processedArticles.reduce((sum, a) => sum + a.ViewCount, 0);
        const avgViews = total > 0 ? Math.floor(totalViews / total) : 0;
        const avgSentiment = total > 0 
            ? processedArticles.reduce((sum, a) => sum + a.SentimentScore, 0) / total 
            : 0;
        
        // Count by status
        const statusCounts: Record<string, number> = {};
        for (const article of processedArticles) {
            statusCounts[article.Status] = (statusCounts[article.Status] || 0) + 1;
        }
        const statusStr = Object.entries(statusCounts).map(([k, v]) => `${k}: ${v}`).join(', ');
        
        context.log(`📊 NEWS BATCH SUMMARY: ${total} articles | Total Views: ${totalViews.toLocaleString()} | Avg Views: ${avgViews.toLocaleString()} | Avg Sentiment: ${avgSentiment.toFixed(2)} | Status: [${statusStr}]`);
        
        // Category and source analysis
        const categories: Record<string, number> = {};
        const sources: Record<string, number> = {};
        for (const article of processedArticles) {
            categories[article.Category] = (categories[article.Category] || 0) + 1;
            sources[article.Source] = (sources[article.Source] || 0) + 1;
        }
        
        const topCats = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const topSrcs = Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 3);
        
        const catsStr = topCats.map(([k, v]) => `${k}: ${v}`).join(', ');
        const srcsStr = topSrcs.map(([k, v]) => `${k}: ${v}`).join(', ');
        
        context.log(`📂 Top Categories: [${catsStr}] | Top Sources: [${srcsStr}]`);
        
        // Viral and well-tagged article counts
        const viralCount = processedArticles.filter(a => a.ViewCount >= 5000).length;
        const wellTagged = processedArticles.filter(a => a.Tags.length >= 5).length;
        const strongSentiment = processedArticles.filter(a => Math.abs(a.SentimentScore) >= 0.7).length;
        
        if (viralCount > 0) {
            context.log(`🔥 Viral articles in batch: ${viralCount}`);
        }
        if (strongSentiment > 0) {
            context.log(`😊😢 Strong sentiment articles in batch: ${strongSentiment}`);
        }
        if (wellTagged > 0) {
            context.log(`🏷️ Well-tagged articles in batch: ${wellTagged}`);
        }
        
        // Send processed articles to output Event Hub
        context.extraOutputs.set(eventHubOutput, processedArticles);
        context.log(`📤 Sent ${processedArticles.length} article(s) to output Event Hub`);
    }
}

app.eventHub('EventHubsTrigger', {
    connection: 'EventHubConnection',
    eventHubName: '%INPUT_EVENTHUB_NAME%',
    cardinality: 'many',
    extraOutputs: [eventHubOutput],
    handler: EventHubsTrigger
});
