# OpsGenie API Commands and Example Questions for AI Chatbot

This document contains various OpsGenie API commands and example questions that can be integrated with an AI chatbot using LMStudio LLM model.

## API Key and Base URL
```bash

BASE_URL="https://api.opsgenie.com/v2"
```

## Common Commands

### 1. Check Who's On-Call
```bash
# Get all on-call schedules
curl -H "Authorization: GenieKey $API_KEY" "$BASE_URL/schedules/on-calls"

Example Questions:
- Who is currently on-call?
- Who is the on-call engineer for WFM team?
- Show me the EEM team's on-call schedule
- Who is the domain manager on duty?
```

### 2. List Alerts
```bash
# Get all alerts
curl -H "Authorization: GenieKey $API_KEY" "$BASE_URL/alerts"

# Get filtered alerts (P1 alerts for specific teams)
curl -H "Authorization: GenieKey $API_KEY" "$BASE_URL/alerts?query=status: open and (tag: \"WiserGroup: Global-EEM-AppOps\" or tag: \"WiserGroup: Global-WFM-AppOps\") and tag: \"WiserAutoGenerate: true\" and tag: \"Env: preprod\" and \"WiserPriority: P1\" and tag: \"WiserCaseStatus:New\" NOT tag: \"WiserCaseStatus:Resolved\" NOT tag: \"WiserCaseStatus:Closed\""

Example Questions:
- Show me all open alerts
- What are the current P1 incidents?
- Are there any critical alerts for WFM team?
- List all unresolved EEM alerts
- Show alerts from preprod environment
```

### 3. Alert Details
```bash
# Get specific alert details
curl -H "Authorization: GenieKey $API_KEY" "$BASE_URL/alerts/{alertId}"

Example Questions:
- Give me details about alert #1234
- What's the status of incident ABC123?
- Who is assigned to alert XYZ?
- When was this alert created?
```

### 4. Create Alert
```bash
curl -H "Authorization: GenieKey $API_KEY" \
     -H "Content-Type: application/json" \
     -X POST \
     -d '{
       "message": "Test alert",
       "description": "This is a test alert",
       "priority": "P3",
       "tags": ["test"]
     }' \
     "$BASE_URL/alerts"

Example Questions:
- Create a new alert for server down
- Raise a P1 incident for database failure
- Create alert for network connectivity issues
- Generate warning alert for high CPU usage
```

### 5. Update Alert Status
```bash
# Acknowledge an alert
curl -H "Authorization: GenieKey $API_KEY" \
     -X POST \
     "$BASE_URL/alerts/{alertId}/acknowledge"

# Close an alert
curl -H "Authorization: GenieKey $API_KEY" \
     -X POST \
     "$BASE_URL/alerts/{alertId}/close"

Example Questions:
- Acknowledge alert #1234
- Close incident ABC123
- Mark alert XYZ as resolved
- Update the status of alert #4567
```

### 6. Add Note to Alert
```bash
curl -H "Authorization: GenieKey $API_KEY" \
     -H "Content-Type: application/json" \
     -X POST \
     -d '{
       "note": "Investigation in progress"
     }' \
     "$BASE_URL/alerts/{alertId}/notes"

Example Questions:
- Add note to alert #1234
- Update incident ABC123 with status
- Add comment to alert XYZ
- Append investigation details to incident
```

### 7. Get Teams and Users
```bash
# List teams
curl -H "Authorization: GenieKey $API_KEY" "$BASE_URL/teams"

# List team members
curl -H "Authorization: GenieKey $API_KEY" "$BASE_URL/teams/{teamId}/members"

Example Questions:
- List all teams
- Show members of WFM team
- Who are in the EEM team?
- Get team details for AppOps
```

### 8. Escalation Policies
```bash
# Get escalation policies
curl -H "Authorization: GenieKey $API_KEY" "$BASE_URL/policies"

Example Questions:
- What's the escalation policy for P1 alerts?
- Show me the on-call escalation chain
- Who gets notified after the primary on-call?
- What's the escalation path for WFM team?
```

## Integration Tips for AI Chatbot

1. **Parameter Extraction**:
   - Extract alert IDs from natural language
   - Identify team names and priorities from questions
   - Parse date ranges for historical queries

2. **Response Formatting**:
   - Format timestamps to readable format
   - Prioritize critical information in responses
   - Include relevant links or references

3. **Error Handling**:
   - Handle API rate limits
   - Manage authentication errors
   - Provide helpful error messages

4. **Context Awareness**:
   - Maintain conversation context for follow-up questions
   - Remember recently discussed alerts
   - Track user's team context

## Common Use Cases

1. **Incident Management**:
   - Create and track incidents
   - Update alert statuses
   - Add notes and comments
   - Escalate to appropriate teams

2. **On-Call Management**:
   - Check current on-call schedule
   - Find backup contacts
   - View upcoming shifts
   - Handle shift swaps

3. **Alert Monitoring**:
   - Track alert trends
   - Monitor critical services
   - View alert history
   - Check resolution times

4. **Team Coordination**:
   - Find team members
   - Check team availability
   - Coordinate responses
   - Manage escalations
