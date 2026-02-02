/**
 * Represents a news article processed through the Event Hubs pipeline.
 */
export interface NewsArticle {
    ArticleId: string;
    Title: string;
    Content: string;
    Author: string;
    Source: string;
    Category: string;
    PublishedDate: string;
    ViewCount: number;
    SentimentScore: number;
    Status: string;
    Tags: string[];
}

/**
 * Type guard to validate if an object conforms to the NewsArticle interface.
 * @param obj - The object to validate
 * @returns True if the object is a valid NewsArticle
 */
export function isNewsArticle(obj: unknown): obj is NewsArticle {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }
    
    const article = obj as Record<string, unknown>;
    
    return (
        typeof article.ArticleId === 'string' &&
        typeof article.Title === 'string' &&
        typeof article.Content === 'string' &&
        typeof article.Author === 'string' &&
        typeof article.Source === 'string' &&
        typeof article.Category === 'string' &&
        typeof article.PublishedDate === 'string' &&
        typeof article.ViewCount === 'number' &&
        typeof article.SentimentScore === 'number' &&
        typeof article.Status === 'string' &&
        Array.isArray(article.Tags) &&
        article.Tags.every((tag: unknown) => typeof tag === 'string')
    );
}
