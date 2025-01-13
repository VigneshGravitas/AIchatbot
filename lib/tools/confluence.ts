import { z } from 'zod';

// Environment variables
const CONFLUENCE_EMAIL = process.env.CONFLUENCE_EMAIL || '';
const CONFLUENCE_API_KEY = process.env.CONFLUENCE_API_KEY || '';
const CONFLUENCE_URL = process.env.CONFLUENCE_URL || '';

if (!CONFLUENCE_EMAIL || !CONFLUENCE_API_KEY || !CONFLUENCE_URL) {
  console.error('Missing required Confluence environment variables');
}

const CONFLUENCE_BASE_URL = `${CONFLUENCE_URL}/wiki/rest/api`;

// Types for Confluence API responses
export interface ConfluencePage {
  id: string;
  type: string;
  status: string;
  title: string;
  body?: {
    storage: {
      value: string;
      representation: string;
    };
  };
  version?: {
    number: number;
    when: string;
  };
}

export interface ConfluenceSpace {
  id: number;
  key: string;
  name: string;
  type: string;
  _links: {
    webui: string;
  };
}

export interface ConfluenceSpaceList {
  results: ConfluenceSpace[];
  start: number;
  limit: number;
  size: number;
}

export interface ConfluencePageList {
  results: ConfluencePage[];
  start: number;
  limit: number;
  size: number;
}

// Input validation schemas
export const GetSpacesArgsSchema = z.object({
  limit: z.number().min(1).max(100).default(25),
  start: z.number().min(0).default(0),
});

export const CreatePageArgsSchema = z.object({
  spaceKey: z.string(),
  title: z.string(),
  content: z.string(),
});

export type GetSpacesArgs = z.infer<typeof GetSpacesArgsSchema>;
export type CreatePageArgs = z.infer<typeof CreatePageArgsSchema>;

// Helper function for Confluence API calls
async function confluenceRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${CONFLUENCE_URL}/wiki/rest/api${endpoint}`;
  console.log('[Confluence Debug] Making request to:', url);
  console.log('[Confluence Debug] Using email:', CONFLUENCE_EMAIL);
  console.log('[Confluence Debug] API Key length:', CONFLUENCE_API_KEY?.length || 0);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${CONFLUENCE_EMAIL}:${CONFLUENCE_API_KEY}`).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('[Confluence Debug] Response status:', response.status);
    console.log('[Confluence Debug] Response status text:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Confluence Debug] Error response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Confluence API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('[Confluence Debug] Response data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('[Confluence Debug] Request error:', error);
    throw error;
  }
}

// Confluence API functions
export async function getSpaces(args: GetSpacesArgs = { limit: 25, start: 0 }): Promise<string> {
  console.log('[Confluence Debug] getSpaces called with args:', args);
  try {
    const validatedArgs = GetSpacesArgsSchema.parse(args);
    console.log('[Confluence Debug] Validated args:', validatedArgs);
    
    const response = await confluenceRequest(`/space?limit=${validatedArgs.limit}&start=${validatedArgs.start}`);
    console.log('[Confluence Debug] Got response from confluenceRequest');
    
    if (!response.results || !Array.isArray(response.results)) {
      console.error('[Confluence Debug] Unexpected response format:', response);
      return 'Error: Unexpected response format from Confluence API';
    }

    if (response.results.length === 0) {
      console.log('[Confluence Debug] No spaces found');
      return 'No Confluence spaces found';
    }

    console.log('[Confluence Debug] Found spaces:', response.results.length);
    const spaces = response.results.map((space: ConfluenceSpace) => 
      `• ${space.name}\n  Key: ${space.key}\n  Type: ${space.type}\n  URL: ${space._links.webui}`
    ).join('\n\n');
    
    const result = `Found ${response.results.length} Confluence space(s):\n\n${spaces}`;
    console.log('[Confluence Debug] Returning formatted result:', result);
    return result;
  } catch (error: any) {
    console.error('[Confluence Debug] Error in getSpaces:', error);
    return `Error fetching Confluence spaces: ${error.message || 'Unknown error'}`;
  }
}

export async function searchContent(cql: string): Promise<any> {
  return confluenceRequest(`/content/search?cql=${encodeURIComponent(cql)}`);
}

export async function getPagesInSpace(spaceKey: string): Promise<ConfluencePageList> {
  return confluenceRequest(`/content?spaceKey=${spaceKey}&expand=body.storage`);
}

export async function getPageById(pageId: string): Promise<ConfluencePage> {
  return confluenceRequest(`/content/${pageId}?expand=body.storage`);
}

export async function createPage(spaceKey: string, title: string, content: string): Promise<ConfluencePage> {
  const validatedArgs = CreatePageArgsSchema.parse({ spaceKey, title, content });
  return confluenceRequest('/content', {
    method: 'POST',
    body: JSON.stringify({
      type: 'page',
      title: validatedArgs.title,
      space: { key: validatedArgs.spaceKey },
      body: {
        storage: {
          value: validatedArgs.content,
          representation: 'storage'
        }
      }
    })
  });
}

export async function updatePage(pageId: string, title: string, content: string, version: number): Promise<ConfluencePage> {
  return confluenceRequest(`/content/${pageId}`, {
    method: 'PUT',
    body: JSON.stringify({
      type: 'page',
      title,
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      },
      version: { number: version + 1 }
    })
  });
}
