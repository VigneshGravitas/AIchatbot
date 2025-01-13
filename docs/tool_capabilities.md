# AI Chatbot Tool Capabilities

Create alerts:
   With different priorities (P1-P5)
   Add tags and descriptions
   Assign to teams or users

List alerts:
   View all open alerts
   Filter by status, priority, or tags
   Search by message content
Get specific alerts:
   By ID
   By alias
   Check alert details

## Confluence Integration

### Currently Implemented Features

1. **Space Management**
   - List all available Confluence spaces
   - Example: "Show me all Confluence spaces"

2. **Page Operations**
   - List all pages in a specific space
   - Create new pages with formatted content
   - Update existing pages
   - Example: "Create a new page in SD space about deployment procedures"

3. **Content Search**
   - Search for specific content across pages
   - Example: "Find pages containing information about testing"

### Usage Examples

```markdown
# Space Management
Q: "What Confluence spaces do I have access to?"
Q: "List all available spaces"

# Page Operations
Q: "Show me all pages in the SD space"
Q: "Create a new page titled 'Project Overview' in SD space"
Q: "Update the deployment documentation page with new steps"

# Content Search
Q: "Find all pages about deployment"
Q: "Search for content related to testing procedures"
```

## OpsGenie Integration

### Currently Implemented Features

1. **Alert Management**
   - View all current alerts
   - Create new alerts
   - Example: "Show me all active alerts"

2. **Schedule Management**
   - View on-call schedules
   - List schedule details
   - Example: "Who is on call this week?"

3. **Team Management**
   - View on-call participants
   - Get current on-call information
   - Example: "Show me the current on-call team"

### Usage Examples

```markdown
# Alert Management
Q: "Show me all active alerts"
Q: "Create a new alert for database failure"
Q: "List critical alerts"

# Schedule Management
Q: "Show me the on-call schedule"
Q: "What's the current rotation?"
Q: "List all OpsGenie schedules"

# Team Management
Q: "Who's on call right now?"
Q: "Show me the current on-call engineers"
Q: "List on-call participants"
```

## Combined Operations

### Currently Implemented Features

1. **Documentation + Alerts**
   - Create Confluence pages from alert information
   - Document incidents automatically
   - Example: "Create a page documenting current alerts"

2. **Schedule Documentation**
   - Document on-call schedules in Confluence
   - Create rotation documentation
   - Example: "Create a page with this week's on-call schedule"

### Usage Examples

```markdown
# Documentation + Alerts
Q: "Document the current alert situation in Confluence"
Q: "Create an incident report page for the current alert"

# Schedule Documentation
Q: "Create a page showing this week's on-call rotation"
Q: "Document the current on-call schedule in SD space"
```

## Currently Implemented Questions

### Confluence Questions You Can Ask Right Now

1. **Space Related**
   ```
   "Show me all Confluence spaces"
   "List available Confluence spaces"
   "What spaces do I have in Confluence?"
   ```

2. **Page Related**
   ```
   "Show me all pages in the SD space"
   "List all pages in Software Development space"
   "What pages are in my SD Confluence space?"
   ```

3. **Create Pages**
   ```
   "Create a new Confluence page in SD space titled 'Project Overview'"
   "Create a documentation page about [topic] in Confluence"
   "Add a new page to SD space about [topic]"
   ```

4. **Update Pages**
   ```
   "Update the page [page-id] with new content"
   "Add a section to Confluence page [page-id]"
   "Update the content of [page-title] in SD space"
   ```

5. **Search Content**
   ```
   "Find Confluence pages containing 'deployment'"
   "Search for pages about 'testing' in SD space"
   "Look for Confluence content about [topic]"
   ```

### OpsGenie Questions You Can Ask Right Now

1. **Alert Related**
   ```
   "Show me all OpsGenie alerts"
   "List current alerts in OpsGenie"
   "What alerts are active right now?"
   "Create a new OpsGenie alert for [issue]"
   "Raise an alert about [problem]"
   "Create an incident alert for [situation]"
   ```

2. **Schedule Related**
   ```
   "Show me the on-call schedules"
   "List all OpsGenie schedules"
   "What are the current on-call rotations?"
   ```

3. **On-Call Related**
   ```
   "Who is on call right now?"
   "Show me the current on-call team members"
   "List on-call participants"
   ```

### Combined Questions You Can Ask Right Now

1. **Documentation + Alerts**
   ```
   "Create a Confluence page about the current alert situation"
   "Document the ongoing incident in SD space"
   ```

2. **Schedule + Documentation**
   ```
   "Create a page with the current on-call schedule"
   "Document this week's on-call rotation in Confluence"
   ```

3. **Complex Queries**
   ```
   "Show me all pages in the SD space and who's currently on call"
   "Create a new page documenting the current alert status"
   "List all active alerts and create a summary page in Confluence"
   ```

### Tips for Asking Questions
- Be specific about the space name (use "SD" or "Software Development")
- When creating pages, provide a clear title
- For alerts, include specific details about the issue
- When updating pages, provide the page ID or exact title

## Future Potential Enhancements

### Confluence
1. Page hierarchies and organization
2. Space permissions management
3. Page version control and history
4. Attachment handling
5. Page templates and blueprints

### OpsGenie
1. Alert acknowledgment and closure
2. Escalation policy management
3. Integration configuration
4. Incident war room creation
5. Custom notification rules
6. Analytics and reporting
7. Team routing rules
8. Integration with other services

## Best Practices

1. **Documentation**
   - Use clear, descriptive titles for new pages
   - Include timestamps in incident documentation
   - Structure content with proper headings and sections

2. **Alerts**
   - Provide detailed descriptions for new alerts
   - Include relevant system information
   - Tag alerts appropriately for better organization

3. **Schedules**
   - Keep rotation documentation up to date
   - Include contact information in schedule documentation
   - Document any temporary schedule changes

## AI Chatbot Capabilities Guide

This document outlines all the available commands and capabilities of our AI chatbot.

### 1. Confluence Integration

#### Available Commands:
- **List Spaces**: "List all Confluence spaces"
- **View Pages**: "Show me pages in [space name]"
- **Search Content**: "Search Confluence for [search term]"
- **Create Page**: "Create a new page titled [title] in [space]"
- **Update Page**: "Update the page [title] with [content]"

#### Examples:
```
"List all available Confluence spaces"
"Search Confluence for project documentation"
"Create a new page titled 'Meeting Notes' in the SD space"
```

### 2. OpsGenie Integration

#### Available Commands:
- **View Alerts**: "Show me all active alerts"
- **Create Alert**: "Create a new alert for [issue]"
- **View Schedules**: "Show me the on-call schedule"
- **Check On-Call**: "Who is on call right now?"

#### Alert Creation Options:
- Priority levels: P1 (Critical) to P5 (Low)
- Add tags and descriptions
- Assign to specific teams or users

#### Examples:
```
"Show me all current alerts"
"Create a new alert for server downtime"
"Show me who's on call this week"
"List all OpsGenie schedules"
```

### 3. Product Search

#### Available Commands:
- **Basic Search**: "Search for products matching [term]"
- **Category Search**: "Find products in [category]"
- **Price Filter**: "Show me products under [price]"

#### Search Parameters:
- Query (required)
- Category (optional)
- Maximum price (optional)

#### Examples:
```
"Search for products matching 'laptop'"
"Find products in the electronics category"
"Show me products under $1000"
```

### Tips for Better Results

1. **Be Specific**: Include relevant details in your queries
2. **Use Keywords**: Include key terms like "create", "search", "show", "list"
3. **Specify Context**: Mention the system (Confluence/OpsGenie) when relevant
4. **Include Parameters**: Add priority, team names, or categories when applicable

### Common Patterns

- Use "Show me" or "List" for viewing information
- Use "Create" for new items
- Use "Search" or "Find" for queries
- Use "Update" or "Edit" for modifications

### Error Handling

If you receive an error:
1. Check if all required parameters are provided
2. Verify permissions and access rights
3. Ensure the correct syntax is used
4. Try rephrasing the command

For any issues or questions about capabilities, ask "What can you do?" or "Show me available commands".

---
*Last Updated: January 13, 2025*
