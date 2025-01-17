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
export interface ToolResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
}

export async function getSpaces(args: GetSpacesArgs = { limit: 25, start: 0 }): Promise<ToolResponse> {
  console.log('[Confluence Debug] getSpaces called with args:', args);
  try {
    const validatedArgs = GetSpacesArgsSchema.parse(args);
    console.log('[Confluence Debug] Validated args:', validatedArgs);
    
    const response = await confluenceRequest(`/space?limit=${validatedArgs.limit}&start=${validatedArgs.start}`);
    console.log('[Confluence Debug] Got response from confluenceRequest');
    
    if (!response.results || !Array.isArray(response.results)) {
      console.error('[Confluence Debug] Unexpected response format:', response);
      return {
        status: 'error',
        message: 'Unexpected response format from Confluence API'
      };
    }

    return {
      status: 'success',
      data: response as ConfluenceSpaceList
    };
  } catch (error: any) {
    console.error('[Confluence Debug] Error in getSpaces:', error);
    return {
      status: 'error',
      message: `Error fetching Confluence spaces: ${error.message || 'Unknown error'}`
    };
  }
}

export async function searchContent(cql: string): Promise<ToolResponse> {
  try {
    const response = await confluenceRequest(`/content/search?cql=${encodeURIComponent(cql)}`);
    return {
      status: 'success',
      data: response
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: `Error searching Confluence: ${error.message || 'Unknown error'}`
    };
  }
}

export async function getPagesInSpace(spaceKey: string): Promise<ToolResponse> {
  try {
    const response = await confluenceRequest(`/content?spaceKey=${spaceKey}&expand=body.storage`);
    return {
      status: 'success',
      data: response as ConfluencePageList
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: `Error fetching pages: ${error.message || 'Unknown error'}`
    };
  }
}

export async function getPageById(pageId: string): Promise<ToolResponse> {
  try {
    const response = await confluenceRequest(`/content/${pageId}?expand=body.storage,version`);
    return {
      status: 'success',
      data: response as ConfluencePage
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: `Error fetching page: ${error.message || 'Unknown error'}`
    };
  }
}

export async function createPage(spaceKey: string, title: string, content: string): Promise<ToolResponse> {
  try {
    const response = await confluenceRequest('/content', {
      method: 'POST',
      body: JSON.stringify({
        type: 'page',
        title,
        space: { key: spaceKey },
        body: {
          storage: {
            value: content,
            representation: 'storage'
          }
        }
      })
    });
    return {
      status: 'success',
      data: response as ConfluencePage
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: `Error creating page: ${error.message || 'Unknown error'}`
    };
  }
}

export async function updatePage(pageId: string, title: string, content: string, version: number): Promise<ToolResponse> {
  try {
    const response = await confluenceRequest(`/content/${pageId}`, {
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
    return {
      status: 'success',
      data: response as ConfluencePage
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: `Error updating page: ${error.message || 'Unknown error'}`
    };
  }
}
