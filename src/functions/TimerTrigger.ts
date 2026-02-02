import { app, InvocationContext, output } from "@azure/functions";
import { NewsArticle } from "../types/NewsArticle";

const eventHubOutput = output.eventHub({
    connection: 'EventHubConnection',
    eventHubName: '%INPUT_EVENTHUB_NAME%'
});

// Sample data for generating realistic news articles
const titleTemplates = [
    "Breaking: Major Discovery in {topic}",
    "New {topic} Study Reveals Surprising Benefits",
    "{topic} Industry Faces Major Transformation",
    "Global Markets Show Strong Recovery Amid {topic}",
    "International Trade Agreements Reshape {topic}",
    "Sports Stars Unite for {topic}",
    "Cultural Festival Celebrates {topic}",
    "Technology Breakthrough in {topic}"
];

const topics = [
    "Renewable Energy Technology", "Artificial Intelligence", "Climate Change",
    "Space Exploration", "Healthcare Innovation", "Economic Policy",
    "Sports Excellence", "Cultural Diversity", "Quantum Computing",
    "Sustainable Agriculture"
];

const authors = [
    "Sarah Johnson", "Michael Chen", "Emily Rodriguez", "David Kim",
    "Lisa Zhang", "Alex Thompson", "Maria Garcia", "James Wilson"
];

const sources = [
    "Tech Today", "Health Herald", "Finance Focus", "Sports Spotlight",
    "Culture Corner", "Science Daily", "Global News", "Innovation Weekly"
];

const categories = ["Technology", "Health", "Business", "Sports", "Culture", "Science"];

function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateArticleId(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const uuid = crypto.randomUUID().slice(0, 8).toUpperCase();
    return `NEWS-${date}-${uuid}`;
}

export async function TimerTrigger(myTimer: any, context: InvocationContext): Promise<void> {
    context.log('🗞️ News Generator started');
    
    // Generate 3-8 news articles
    const articleCount = randomInt(3, 8);
    const articles: NewsArticle[] = [];
    
    for (let i = 0; i < articleCount; i++) {
        const topic = randomChoice(topics);
        const contentRepeat = randomInt(10, 20);
        
        const article: NewsArticle = {
            ArticleId: generateArticleId(),
            Title: randomChoice(titleTemplates).replace('{topic}', topic),
            Content: `Comprehensive coverage of the latest developments in ${topic}. `.repeat(contentRepeat),
            Author: randomChoice(authors),
            Source: randomChoice(sources),
            Category: randomChoice(categories),
            PublishedDate: new Date().toISOString(),
            ViewCount: randomInt(100, 10000),
            SentimentScore: Math.round((Math.random() * 2 - 1) * 100) / 100,
            Status: randomChoice(["Published", "Featured"]),
            Tags: Array.from({ length: randomInt(3, 5) }, () => randomChoice(topics))
        };
        
        articles.push(article);
        context.log(`📝 Generated article: ${article.ArticleId} - '${article.Title}' by ${article.Author}`);
    }
    
    // Send articles to input Event Hub
    context.extraOutputs.set(eventHubOutput, articles);
    context.log(`✅ Successfully generated and sent ${articles.length} news article(s) to Event Hub`);
}

app.timer('TimerTrigger', {
    schedule: '*/10 * * * * *', // Every 10 seconds
    handler: TimerTrigger,
    extraOutputs: [eventHubOutput]
});
