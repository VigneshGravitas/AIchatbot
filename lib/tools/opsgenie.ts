import { z } from 'zod';

const OPSGENIE_API_KEY = process.env.OPSGENIE_API_KEY || '';
const OPSGENIE_BASE_URL = 'https://api.opsgenie.com/v2';

// Types for OpsGenie responses
export interface OpsGenieAlert {
  id: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  tags?: string[];
  tinyId?: string;
}

export interface OpsGenieSchedule {
  id: string;
  name: string;
  timezone: string;
  enabled: boolean;
  ownerTeam?: {
    id: string;
    name: string;
  };
}

export interface OpsGenieOnCallParticipant {
  id: string;
  name: string;
  type: string;
  scheduleName: string;
}

export interface OpsGenieResponse {
  status: 'success' | 'error';
  message?: string;
  alerts?: OpsGenieAlert[];
  schedules?: OpsGenieSchedule[];
  onCallParticipants?: OpsGenieOnCallParticipant[];
  total?: number;
}

// Input validation schemas
export const GetAlertsArgsSchema = z.object({
  query: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
});

export const GetSchedulesArgsSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
});

export const GetOnCallParticipantsArgsSchema = z.object({
  scheduleId: z.string().optional(),
  scheduleName: z.string().optional(),
});

export const GetOnCallArgsSchema = z.object({
  scheduleName: z.string().optional(),
});

export type GetAlertsArgs = z.infer<typeof GetAlertsArgsSchema>;
export type GetSchedulesArgs = z.infer<typeof GetSchedulesArgsSchema>;
export type GetOnCallParticipantsArgs = z.infer<typeof GetOnCallParticipantsArgsSchema>;
export type GetOnCallArgs = z.infer<typeof GetOnCallArgsSchema>;

// OpsGenie API functions
export async function getAlerts(args: GetAlertsArgs): Promise<OpsGenieResponse> {
  try {
    const validatedArgs = GetAlertsArgsSchema.parse(args);
    const queryParams = new URLSearchParams();

    // Set default query to show all open and unacknowledged alerts if not specified
    if (validatedArgs.query) {
      queryParams.append('query', validatedArgs.query);
    } else {
      queryParams.append('query', 'status:open OR status:unacked');
    }
    
    queryParams.append('limit', validatedArgs.limit.toString());
    queryParams.append('sort', 'createdAt');
    queryParams.append('order', 'desc');

    const response = await fetch(`${OPSGENIE_BASE_URL}/alerts?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `GenieKey ${OPSGENIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpsGenie API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      status: 'success',
      alerts: data.data.map((alert: any) => ({
        id: alert.id,
        message: alert.message,
        status: alert.status,
        priority: alert.priority,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
        description: alert.description,
        tags: alert.tags,
        tinyId: alert.tinyId
      })),
      total: data.data.length,
    };
  } catch (error) {
    console.error('Error fetching OpsGenie alerts:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Function to create a new alert
export const CreateAlertArgsSchema = z.object({
  message: z.string(),
  description: z.string().optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4', 'P5']).default('P3'),
  tags: z.array(z.string()).optional(),
});

export type CreateAlertArgs = z.infer<typeof CreateAlertArgsSchema>;

export async function createAlert(args: CreateAlertArgs): Promise<OpsGenieResponse> {
  try {
    const validatedArgs = CreateAlertArgsSchema.parse(args);

    const response = await fetch(`${OPSGENIE_BASE_URL}/alerts`, {
      method: 'POST',
      headers: {
        'Authorization': `GenieKey ${OPSGENIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: validatedArgs.message,
        description: validatedArgs.description,
        priority: validatedArgs.priority,
        tags: validatedArgs.tags,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpsGenie API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpsGenie API Response:', data); // Add debug logging

    // The response from OpsGenie alert creation is different, it has requestId instead of id
    return {
      status: 'success',
      message: 'Alert created successfully',
      alerts: [{
        id: data.requestId, // Use requestId instead of data.data.id
        message: validatedArgs.message,
        status: 'open',
        priority: validatedArgs.priority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description: validatedArgs.description,
        tags: validatedArgs.tags,
      }],
    };
  } catch (error) {
    console.error('Error creating OpsGenie alert:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Function to get schedules
export async function getSchedules(args: GetSchedulesArgs): Promise<OpsGenieResponse> {
  try {
    const validatedArgs = GetSchedulesArgsSchema.parse(args);
    const queryParams = new URLSearchParams({
      limit: validatedArgs.limit.toString(),
    });

    const response = await fetch(`${OPSGENIE_BASE_URL}/schedules?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `GenieKey ${OPSGENIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpsGenie API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      status: 'success',
      schedules: data.data.map((schedule: any) => ({
        id: schedule.id,
        name: schedule.name,
        timezone: schedule.timezone,
        enabled: schedule.enabled,
        ownerTeam: schedule.ownerTeam,
      })),
      total: data.data.length,
    };
  } catch (error) {
    console.error('Error fetching OpsGenie schedules:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Function to get on-call participants
export async function getOnCallParticipants(args: GetOnCallParticipantsArgs): Promise<OpsGenieResponse> {
  try {
    console.log('Starting getOnCallParticipants with args:', args);
    const validatedArgs = GetOnCallParticipantsArgsSchema.parse(args);
    console.log('Validated args:', validatedArgs);

    // First get all schedules if no specific schedule is provided
    if (!validatedArgs.scheduleId && !validatedArgs.scheduleName) {
      console.log('No specific schedule provided, fetching all schedules');
      const schedules = await getSchedules({ limit: 100 });
      console.log('Got schedules:', schedules);
      
      if (schedules.status === 'error' || !schedules.schedules) {
        throw new Error('Failed to fetch schedules: ' + schedules.message);
      }

      // Get on-call participants for each schedule
      const allParticipants: OpsGenieOnCallParticipant[] = [];
      for (const schedule of schedules.schedules) {
        console.log('Fetching participants for schedule:', schedule.name);
        const response = await fetch(`${OPSGENIE_BASE_URL}/schedules/${schedule.id}/on-calls`, {
          method: 'GET',
          headers: {
            'Authorization': `GenieKey ${OPSGENIE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('OpsGenie API response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpsGenie API error:', errorText);
          throw new Error(`OpsGenie API error: ${response.status} - ${errorText}`);
        }

        if (response.ok) {
          const data = await response.json();
          console.log('Got participants data:', data);
          if (data.data?.onCallParticipants?.length > 0) {
            // Add schedule name to each participant
            allParticipants.push(...data.data.onCallParticipants.map((p: any) => ({
              id: p.id,
              name: p.name,
              type: p.type,
              scheduleName: schedule.name
            })));
          }
        }
      }

      console.log('Final participants list:', allParticipants);
      return {
        status: 'success',
        onCallParticipants: allParticipants,
        total: allParticipants.length,
        message: allParticipants.length > 0 
          ? `Current on-call: ${allParticipants.map(p => `${p.name} (${p.scheduleName})`).join(', ')}`
          : 'No one is currently on call'
      };
    }

    // Get on-call participants for a specific schedule
    let scheduleId = validatedArgs.scheduleId;

    // If schedule name is provided but not ID, find the ID
    if (!scheduleId && validatedArgs.scheduleName) {
      const schedules = await getSchedules({ limit: 100 });
      if (schedules.status === 'error' || !schedules.schedules) {
        throw new Error('Failed to fetch schedules');
      }

      const schedule = schedules.schedules.find(s => s.name === validatedArgs.scheduleName);
      if (!schedule) {
        throw new Error(`Schedule "${validatedArgs.scheduleName}" not found`);
      }
      scheduleId = schedule.id;
    }

    const response = await fetch(`${OPSGENIE_BASE_URL}/schedules/${scheduleId}/on-calls`, {
      method: 'GET',
      headers: {
        'Authorization': `GenieKey ${OPSGENIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpsGenie API error: ${response.statusText}`);
    }

    const data = await response.json();
    // Add schedule name to each participant
    const participants = data.data?.onCallParticipants?.map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      scheduleName: data.data._parent.name
    })) || [];

    return {
      status: 'success',
      onCallParticipants: participants,
      total: participants.length,
    };
  } catch (error) {
    console.error('Error fetching OpsGenie on-call participants:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Function to get who is on call
export async function getOnCall(args: GetOnCallArgs): Promise<OpsGenieResponse> {
  try {
    console.log('Getting on-call information', { args });
    
    // First, get all schedules
    const schedulesResponse = await fetch(`${OPSGENIE_BASE_URL}/schedules`, {
      method: 'GET',
      headers: {
        'Authorization': `GenieKey ${OPSGENIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!schedulesResponse.ok) {
      console.error('Failed to fetch schedules:', schedulesResponse.statusText);
      throw new Error(`OpsGenie API error: ${schedulesResponse.statusText}`);
    }

    const schedulesData = await schedulesResponse.json();
    console.log('Schedules response:', schedulesData);
    const schedules = schedulesData.data || [];

    // If scheduleName is provided, filter for that schedule
    const targetSchedules = args.scheduleName 
      ? schedules.filter((s: OpsGenieSchedule) => s.name === args.scheduleName)
      : schedules;

    console.log('Target schedules:', targetSchedules);

    if (targetSchedules.length === 0) {
      console.log('No schedules found', { args });
      return {
        status: 'error',
        message: args.scheduleName 
          ? `Schedule "${args.scheduleName}" not found`
          : 'No schedules found',
      };
    }

    // Get on-call participants for each schedule
    const onCallParticipants: OpsGenieOnCallParticipant[] = [];
    
    for (const schedule of targetSchedules) {
      console.log('Fetching on-call for schedule:', schedule.name);
      const onCallResponse = await fetch(`${OPSGENIE_BASE_URL}/schedules/${schedule.id}/on-calls`, {
        method: 'GET',
        headers: {
          'Authorization': `GenieKey ${OPSGENIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!onCallResponse.ok) {
        console.error(`Failed to get on-call info for schedule ${schedule.name}:`, onCallResponse.statusText);
        continue;
      }

      const onCallData = await onCallResponse.json();
      console.log('On-call data for schedule:', schedule.name, onCallData);
      const participants = onCallData.data?.onCallParticipants || [];
      
      participants.forEach((p: any) => {
        onCallParticipants.push({
          id: p.id,
          name: p.name,
          type: p.type,
          scheduleName: schedule.name,
        });
      });
    }

    console.log('Final on-call participants:', onCallParticipants);
    return {
      status: 'success',
      onCallParticipants,
    };
  } catch (error) {
    console.error('Error in getOnCall:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get on-call information',
    };
  }
}
