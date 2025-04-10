import { TaskAssignment } from '@acme/shared-mcp';
import { AgentService, AgentConfig } from '@acme/agent-template';
import playwright from 'playwright';

interface SearchResult {
  title: string;
  link: string;
  snippet?: string;
}

export interface WebSearchAgentConfig extends AgentConfig {
  agentId: string;
  taskQueue: string;
  useRealSearchApi?: boolean;
}

export class WebSearchAgent extends AgentService {
  private useRealSearchApi: boolean;

  constructor(config: WebSearchAgentConfig) {
    super(
      config, 
      config.agentId || 'web-search', 
      config.taskQueue || 'agent.web-search.tasks',
      ['web_search'] // This agent's capabilities
    );
    this.useRealSearchApi = config.useRealSearchApi || false;
  }

  async executeTask(task: TaskAssignment): Promise<SearchResult[]> {
    if (!task.parameters || typeof task.parameters !== 'object') {
      throw new Error('Invalid or missing task parameters');
    }

    const searchQuery = task.parameters.query || task.parameters.searchQuery;
    if (!searchQuery || typeof searchQuery !== 'string') {
      throw new Error('Invalid or missing search query in task parameters');
    }

    // Determine search method
    // 1. Tool Manager if available and not explicitly using Playwright
    // 2. Direct Playwright if Tool Manager not available or explicitly requested
    const useToolManager = this.toolManagerClient && 
                          !task.parameters.usePlaywright && 
                          this.useRealSearchApi;

    try {
      await this.sendCoTLog({
        step: 'search_start',
        details: {
          method: useToolManager ? 'Tool Manager API' : 'Playwright',
          query: searchQuery
        }
      });

      let results: SearchResult[];
      
      if (useToolManager) {
        // Use the Tool Manager to perform the search
        results = await this.toolManagerSearch(searchQuery);
      } else {
        // Use Playwright for direct browser automation
        results = await this.playwrightSearch(searchQuery);
      }

      await this.sendCoTLog({
        step: 'search_complete',
        details: {
          resultCount: results.length,
          firstResult: results.length > 0 ? results[0] : null
        }
      });

      return results;
    } catch (error: any) {
      await this.sendCoTLog({
        step: 'search_error',
        details: {
          error: error.message,
          stack: error.stack
        }
      });
      throw error;
    }
  }

  /**
   * Perform search using the Tool Manager
   */
  private async toolManagerSearch(query: string): Promise<SearchResult[]> {
    if (!this.toolManagerClient) {
      throw new Error('Tool Manager client not available');
    }

    this.logger.info(`Performing search via Tool Manager: "${query}"`);
    
    try {
      const result = await this.executeTool('mock_api', {
        endpoint: `/search?q=${encodeURIComponent(query)}`,
        method: 'GET'
      });
      
      // If mock_api returns structured data, we can transform it to our format
      // For now, we'll create a simulated result
      this.logger.info('Search via Tool Manager completed successfully');
      
      // In a real scenario, we would parse the result data
      // Here we're creating mock results based on the query
      return [
        {
          title: `${query} - Latest Information`,
          link: `https://example.com/search?q=${encodeURIComponent(query)}`,
          snippet: `This is information about ${query} that was retrieved via the Tool Manager.`
        },
        {
          title: `Learn more about ${query}`,
          link: `https://example.com/${encodeURIComponent(query.replace(/ /g, '-'))}`,
          snippet: `Comprehensive resource about ${query} with detailed analysis.`
        }
      ];
    } catch (error) {
      this.logger.error('Tool Manager search failed', error);
      throw new Error(`Tool Manager search failed: ${error}`);
    }
  }

  /**
   * Perform search using Playwright directly
   */
  private async playwrightSearch(query: string): Promise<SearchResult[]> {
    this.logger.info(`Performing search via Playwright: "${query}"`);
    
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Use DuckDuckGo as it's more scraping-friendly
      await page.goto('https://duckduckgo.com');
      await page.fill('input[name="q"]', query);
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');

      // Log the navigation event
      await this.sendCoTLog({
        step: 'playwright_navigation',
        details: {
          url: page.url(),
          title: await page.title()
        }
      });

      // Extract search results
      const results = await page.evaluate(() => {
        const searchResults = Array.from(document.querySelectorAll('.result__body'));
        return searchResults.slice(0, 5).map(result => {
          const titleElement = result.querySelector('.result__title a');
          const snippetElement = result.querySelector('.result__snippet');
          
          return {
            title: titleElement?.textContent?.trim() || '',
            link: titleElement?.getAttribute('href') || '',
            snippet: snippetElement?.textContent?.trim() || '',
          };
        });
      });

      this.logger.info(`Found ${results.length} search results for "${query}"`);
      
      return results;
    } catch (error) {
      this.logger.error(`Playwright search error: ${error}`);
      throw error;
    } finally {
      await browser.close();
    }
  }
}