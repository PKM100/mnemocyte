# Mnemocyte Smart NPCs API Documentation

This document describes the REST API endpoints for the Mnemocyte Smart NPCs application, which provides intelligent video game characters with emotions, actions, roles, and routines.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, no authentication is required for API access.

## Characters API

### Get All Characters
**GET** `/characters`

Returns a list of all characters with their full details including FOXP2 patterns, actions, and memories.

**Response:**
```json
[
  {
    "id": "npc_1758007586239_kqkr9",
    "name": "John Wick",
    "role": "warrior",
    "species": "human",
    "description": null,
    "isActive": true,
    "foxp2Pattern": {
      "id": "703e06f3-ccad-4766-9ea6-dab76a9ad01f",
      "name": "FOXP2-X1X2A",
      "emotionalWeights": {
        "happiness": 0.09,
        "sadness": 0.77,
        "anger": 0.84
      },
      "behavioralTraits": {
        "sociability": 0.07,
        "energy": 0.86,
        "creativity": 0.83
      }
    },
    "imageUrl": "https://api.dicebear.com/8.x/pixel-art/svg?seed=...",
    "createdAt": "2025-09-16T17:46:26.281Z",
    "updatedAt": "2025-09-16T17:46:26.281Z"
  }
]
```

### Create Character
**POST** `/characters`

Creates a new character with the provided attributes.

**Request Body:**
```json
{
  "name": "Character Name",
  "role": "warrior",
  "species": "human",
  "description": "Character description",
  "actions": [],
  "memories": [],
  "foxp2Pattern": {
    "emotionalWeights": {...},
    "behavioralTraits": {...}
  }
}
```

### Get Character Details
**GET** `/characters/{id}`

Returns detailed information about a specific character.

### Update Character
**PUT** `/characters/{id}`

Updates an existing character's attributes.

### Delete Character
**DELETE** `/characters/{id}`

Removes a character from the system.

### Get Character Status
**GET** `/characters/status`

Returns the current status, activity, and availability of all characters.

## Conversations API

### Get All Conversations
**GET** `/conversations`

Returns a list of all conversations with messages and participants.

**Query Parameters:**
- `includeMessages` (boolean): Include full message history (default: true)
- `limit` (number): Maximum number of conversations to return (default: 20)
- `offset` (number): Number of conversations to skip (default: 0)

**Response:**
```json
[
  {
    "id": "conv_1758045863502",
    "title": "Conversation with John Wick, Rock",
    "type": "session",
    "createdAt": "2025-09-16T18:04:23.502Z",
    "updatedAt": "2025-09-17T15:54:51.043Z",
    "isActive": false,
    "messages": [...],
    "participants": [...],
    "_count": {
      "messages": 13
    }
  }
]
```

### Create Conversation/Send Message
**POST** `/conversations`

Creates a new conversation or adds a message to an existing conversation.

**Request Body:**
```json
{
  "action": "create_conversation",
  "title": "New Conversation",
  "type": "playground",
  "characterId": "npc_1758007586239_kqkr9"
}
```

or

```json
{
  "action": "send_message",
  "conversationId": "conv_123",
  "characterId": "npc_1758007586239_kqkr9",
  "content": "Hello, world!",
  "type": "message"
}
```

## Sessions API

### Get All Sessions
**GET** `/sessions`

Returns a list of all user sessions with their activity data.

### Create Session
**POST** `/sessions`

Creates a new user session.

**Request Body:**
```json
{
  "sessionData": {
    "activeCharacters": ["npc_123", "npc_456"],
    "userCommands": []
  }
}
```

## Rooms API

The Rooms API allows you to create virtual spaces where multiple characters can interact together.

### Get All Rooms
**GET** `/rooms`

Returns a list of all rooms.

**Query Parameters:**
- `includeMembers` (boolean): Include room members (default: false)
- `includeMessages` (boolean): Include recent messages (default: false)
- `limit` (number): Maximum number of rooms to return (default: 20)
- `offset` (number): Number of rooms to skip (default: 0)

**Response:**
```json
[
  {
    "id": "room_1758126357963_o0t7l",
    "name": "Test Gaming Room",
    "description": "A test room for NPC interactions",
    "maxMembers": 5,
    "isActive": true,
    "createdBy": null,
    "metadata": {
      "theme": "fantasy",
      "environment": "tavern"
    },
    "createdAt": "2025-09-17T16:25:57.965Z",
    "updatedAt": "2025-09-17T16:27:06.819Z",
    "memberCount": 2,
    "messageCount": 2
  }
]
```

### Create Room
**POST** `/rooms`

Creates a new room for character interactions.

**Request Body:**
```json
{
  "name": "Room Name",
  "description": "Room description",
  "maxMembers": 10,
  "metadata": {
    "theme": "fantasy",
    "environment": "tavern"
  }
}
```

### Get Room Details
**GET** `/rooms/{id}`

Returns detailed information about a specific room.

**Query Parameters:**
- `includeMembers` (boolean): Include room members (default: true)
- `includeMessages` (boolean): Include message history (default: false)
- `messageLimit` (number): Maximum messages to return (default: 50)

### Update Room
**PUT** `/rooms/{id}`

Updates room properties like name, description, or metadata.

### Delete Room
**DELETE** `/rooms/{id}`

Deletes a room and all associated members and messages.

### Room Members API

#### Get Room Members
**GET** `/rooms/{id}/members`

Returns all members of a specific room.

#### Add Character to Room
**POST** `/rooms/{id}/members`

Adds a character to a room.

**Request Body:**
```json
{
  "characterId": "npc_1758007586239_kqkr9",
  "role": "member"
}
```

#### Remove Character from Room
**DELETE** `/rooms/{id}/members?characterId={characterId}`

Removes a character from a room.

### Room Chat API

#### Get Room Messages
**GET** `/rooms/{id}/chat`

Returns messages from a room conversation.

**Query Parameters:**
- `limit` (number): Maximum messages to return (default: 50)
- `offset` (number): Number of messages to skip (default: 0)
- `before` (ISO timestamp): Get messages before this time
- `after` (ISO timestamp): Get messages after this time

#### Send Message to Room
**POST** `/rooms/{id}/chat`

Sends a message to a room where all members can see it.

**Request Body:**
```json
{
  "characterId": "npc_1758007586239_kqkr9",
  "content": "Hello everyone in the room!",
  "type": "message",
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "roommsg_1758126403309_m8dsyn",
    "content": "Hello everyone in the room!",
    "characterId": "npc_1758007586239_kqkr9",
    "character": {
      "id": "npc_1758007586239_kqkr9",
      "name": "John Wick",
      "role": "warrior"
    },
    "type": "message",
    "timestamp": "2025-09-17T16:26:43.333Z",
    "messageOrder": 1
  },
  "roomMembers": [...]
}
```

## Character Roles API

### Get All Character Roles
**GET** `/character-roles`

Returns available character roles like warrior, guardian, scholar, etc.

## Memory Templates API

### Get All Memory Templates
**GET** `/memory-templates`

Returns predefined memory templates for character backstories.

## Testing API

### Get Database Stats
**GET** `/test`

Returns database statistics and sample data.

### Run API Tests
**POST** `/test`

Runs comprehensive tests against all API endpoints.

**Request Body:**
```json
{
  "baseUrl": "http://localhost:3000/api"
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a descriptive message:

```json
{
  "error": "Character not found"
}
```

## Room-Based Conversations

The rooms feature enables multi-character conversations where:

1. **Create a Room** - Use `POST /rooms` to create a virtual space
2. **Add Characters** - Use `POST /rooms/{id}/members` to add NPCs to the room
3. **Start Conversations** - Use `POST /rooms/{id}/chat` to send messages
4. **All Room Members** see messages sent to the room
5. **Track Activity** - Monitor member activity and message history

This allows for complex multi-character interactions where NPCs can respond to each other's messages within a shared context.

## Data Models

### Character
- `id` - Unique identifier
- `name` - Character name
- `role` - Character role/class
- `species` - Character species
- `description` - Character description
- `isActive` - Whether character is available
- `foxp2Pattern` - Emotional and behavioral AI patterns
- `actions` - Available character actions
- `memories` - Character backstory and memories

### Room
- `id` - Unique identifier
- `name` - Room name
- `description` - Room description
- `maxMembers` - Maximum allowed members
- `isActive` - Whether room accepts new messages
- `metadata` - Custom room properties (theme, environment, etc.)

### RoomMember
- `id` - Unique identifier
- `roomId` - Associated room
- `characterId` - Associated character
- `role` - Member role in room
- `joinedAt` - When character joined
- `lastSeen` - Last activity timestamp

### RoomMessage
- `id` - Unique identifier
- `roomId` - Associated room
- `characterId` - Message sender (null for system messages)
- `content` - Message content
- `type` - Message type (message, action, system)
- `timestamp` - When message was sent
- `messageOrder` - Sequential order within room
