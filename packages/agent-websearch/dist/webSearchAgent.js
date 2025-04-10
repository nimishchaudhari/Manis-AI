"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSearchAgent = void 0;
const agent_template_1 = require("@acme/agent-template");
const node_fetch_1 = __importDefault(require("node-fetch"));
const playwright_1 = __importDefault(require("playwright"));
class WebSearchAgent extends agent_template_1.AgentService {
    searchConfig;
    constructor(config) {
        super(config, 'web-search', 'web-search-tasks');
        this.searchConfig = config;
    }
    async executeTask(task) {
        if (!task.parameters || typeof task.parameters !== 'object') {
            throw new Error('Invalid or missing task parameters');
        }
        const searchQuery = task.parameters.query || task.parameters.searchQuery;
        if (!searchQuery || typeof searchQuery !== 'string') {
            throw new Error('Invalid or missing search query in task parameters');
        }
        // Default to Google Custom Search if available, otherwise use Playwright
        const usePlaywright = task.parameters.usePlaywright === true ||
            (!this.searchConfig.googleApiKey || !this.searchConfig.googleSearchEngineId);
        try {
            await this.sendCoTLog({
                step: 'search_start',
                details: {
                    method: usePlaywright ? 'Playwright' : 'Google Custom Search API',
                    query: searchQuery
                }
            });
            const results = usePlaywright ?
                await this.playwrightSearch(searchQuery) :
                await this.googleCustomSearch(searchQuery);
            await this.sendCoTLog({
                step: 'search_complete',
                details: {
                    resultCount: results.length
                }
            });
            return results;
        }
        catch (error) {
            await this.sendCoTLog({
                step: 'search_error',
                details: {
                    error: error.message
                }
            });
            throw error;
        }
    }
    async handleTask(task) {
        try {
            await this.sendStatusUpdate({
                status: 'in-progress'
            });
            const result = await this.executeTask(task);
            await this.sendStatusUpdate({
                status: 'completed',
                result
            });
            await this.sendCoTLog({
                step: 'task_complete',
                details: {
                    searchResults: result.length
                }
            });
        }
        catch (error) {
            await this.sendStatusUpdate({
                status: 'failed',
                error: error.message
            });
            await this.sendCoTLog({
                step: 'task_error',
                details: {
                    error: error.message
                }
            });
            throw error;
        }
    }
    async googleCustomSearch(query) {
        if (!this.searchConfig.googleApiKey || !this.searchConfig.googleSearchEngineId) {
            throw new Error('Google Custom Search API key or engine ID is missing');
        }
        const url = `https://www.googleapis.com/customsearch/v1?key=${this.searchConfig.googleApiKey}&cx=${this.searchConfig.googleSearchEngineId}&q=${encodeURIComponent(query)}`;
        const response = await (0, node_fetch_1.default)(url);
        const data = await response.json();
        if (!data.items || !Array.isArray(data.items)) {
            throw new Error('No search results found');
        }
        return data.items.slice(0, 5).map(item => ({
            title: item.title,
            link: item.link,
        }));
    }
    async playwrightSearch(query) {
        const browser = await playwright_1.default.chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        try {
            // Use DuckDuckGo as it's more scraping-friendly
            await page.goto('https://duckduckgo.com');
            await page.fill('input[name="q"]', query);
            await page.keyboard.press('Enter');
            await page.waitForLoadState('networkidle');
            // Extract search results
            const results = await page.evaluate(() => {
                const searchResults = Array.from(document.querySelectorAll('.result__body'));
                return searchResults.slice(0, 5).map(result => {
                    const titleElement = result.querySelector('.result__title a');
                    return {
                        title: titleElement?.textContent?.trim() || '',
                        link: titleElement?.getAttribute('href') || '',
                    };
                });
            });
            return results;
        }
        finally {
            await browser.close();
        }
    }
}
exports.WebSearchAgent = WebSearchAgent;
