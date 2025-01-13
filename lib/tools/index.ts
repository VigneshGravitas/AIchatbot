import { productSearch } from './product';
import { getSpaces, getPagesInSpace as getPages, searchContent, createPage } from './confluence';
import { getAlerts, createAlert, getSchedules, getOnCallParticipants } from './opsgenie';

interface ToolFunction {
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export const tools: Record<string, (...args: any[]) => Promise<any>> = {
  // Product search
  'product.search': productSearch,

  // Confluence tools
  'confluence.getSpaces': getSpaces,
  'confluence.getPages': getPages,
  'confluence.search': searchContent,
  'confluence.createPage': createPage,

  // OpsGenie tools
  'opsgenie.getAlerts': getAlerts,
  'opsgenie.createAlert': createAlert,
  'opsgenie.getSchedules': getSchedules,
  'opsgenie.getOnCall': getOnCallParticipants,
};

export const toolDefinitions: Record<string, ToolFunction> = {
  'product.search': {
    description: 'Search for products in the database',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        category: { type: 'string', description: 'Product category (optional)' },
        maxPrice: { type: 'number', description: 'Maximum price (optional)' }
      },
      required: ['query']
    }
  },

  'confluence.getSpaces': {
    description: 'Get list of Confluence spaces',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of spaces to return (default: 25)' }
      },
      required: []
    }
  },

  'confluence.getPages': {
    description: 'Get list of Confluence pages',
    parameters: {
      type: 'object',
      properties: {
        spaceKey: { type: 'string', description: 'Space key to get pages from (optional)' },
        limit: { type: 'number', description: 'Maximum number of pages to return (default: 25)' }
      },
      required: []
    }
  },

  'confluence.search': {
    description: 'Search Confluence pages',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        spaceKey: { type: 'string', description: 'Space key to search in (optional)' },
        limit: { type: 'number', description: 'Maximum number of results to return (default: 25)' }
      },
      required: ['query']
    }
  },

  'confluence.createPage': {
    description: 'Create a new Confluence page',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Page title' },
        content: { type: 'string', description: 'Page content in storage format' },
        spaceKey: { type: 'string', description: 'Space key' },
        parentId: { type: 'string', description: 'Parent page ID (optional)' }
      },
      required: ['title', 'content', 'spaceKey']
    }
  },

  'opsgenie.getAlerts': {
    description: 'Get list of OpsGenie alerts',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query to filter alerts (optional)' },
        limit: { type: 'number', description: 'Maximum number of alerts to return (default: 20)' }
      },
      required: []
    }
  },

  'opsgenie.createAlert': {
    description: 'Create a new OpsGenie alert',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Alert message' },
        description: { type: 'string', description: 'Alert description (optional)' },
        priority: { 
          type: 'string', 
          enum: ['P1', 'P2', 'P3', 'P4', 'P5'], 
          description: 'Alert priority (P1 highest, P5 lowest, default: P3)' 
        },
        tags: { 
          type: 'array', 
          items: { type: 'string' }, 
          description: 'List of tags to attach to the alert (optional)' 
        }
      },
      required: ['message']
    }
  },

  'opsgenie.getSchedules': {
    description: 'Get list of OpsGenie schedules',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of schedules to return (default: 20)' }
      },
      required: []
    }
  },

  'opsgenie.getOnCall': {
    description: 'Get current on-call participants from OpsGenie schedules',
    parameters: {
      type: 'object',
      properties: {
        scheduleId: { type: 'string', description: 'Specific schedule ID to check (optional)' },
        scheduleName: { type: 'string', description: 'Name of the schedule to check (optional)' }
      },
      required: []
    }
  }
};
