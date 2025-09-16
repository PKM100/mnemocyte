# FOXP2 API Documentation

## Overview
The FOXP2 API provides a comprehensive REST API for managing characters, conversations, rooms, and real-time interactions in the Mnemocyte world. This API supports character CRUD operations, one-on-one character chats, multi-character room conversations, and character status/activity simulation.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, the API does not require authentication. All endpoints are publicly accessible for development purposes.

---

## Characters API

### 1. List All Characters
**GET** `/api/characters`

**Query Parameters:**
- `limit` (number, optional): Number of characters to return (default: 20)
- `offset` (number, optional): Number of characters to skip (default: 0)
- `active` (boolean, optional): Filter by active status

**Response:**
```json
{
  "characters": [
    {
      "id": "character-id",
      "name": "Character Name",
      "role": "Character Role",
      "personality": "Character traits...",
      "currentMood": 0.75,
      "isActive": true,
      "imageUrl": "https://example.com/image.jpg",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "hasMore": false
}
```

### 2. Create New Character
**POST** `/api/characters`

**Request Body:**
```json
{
  "name": "Character Name",
  "role": "Character Role",
  "personality": "Character description and traits",
  "imageUrl": "https://example.com/image.jpg",
  "foxp2Pattern": "genetic or behavioral pattern data"
}
```

**Response:** Returns the created character with generated ID and default values.

### 3. Get Character Details
**GET** `/api/characters/{id}`

**Response:**
```json
{
  "id": "character-id",
  "name": "Character Name",
  "role": "Character Role",
  "personality": "Character traits...",
  "currentMood": 0.75,
  "isActive": true,
  "imageUrl": "https://example.com/image.jpg",
  "conversationCount": 5,
  "recentConversations": [
    {
      "id": "conversation-id",
      "title": "Conversation Title",
      "lastMessage": "Last message content...",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 4. Update Character
**PUT** `/api/characters/{id}`

**Request Body:** (All fields optional for partial updates)
```json
{
  "name": "Updated Name",
  "role": "Updated Role",
  "personality": "Updated personality",
  "currentMood": 0.85,
  "isActive": true,
  "imageUrl": "https://example.com/new-image.jpg"
}
```

### 5. Delete Character
**DELETE** `/api/characters/{id}`

**Response:**
```json
{
  "message": "Character deleted successfully",
  "deletedCharacterId": "character-id"
}
```

---

## Character Chat API

### 6. Chat with Character
**POST** `/api/characters/{id}/chat`

**Request Body:**
```json
{
  "message": "Hello, how are you today?",
  "contextId": "optional-conversation-id"
}
```

**Response:**
```json
{
  "conversationId": "conversation-id",
  "userMessage": {
    "id": "message-id",
    "content": "Hello, how are you today?",
    "timestamp": "2024-01-01T00:00:00Z",
    "sender": "user"
  },
  "characterResponse": {
    "id": "response-id",
    "content": "As Alice, I find your message quite intriguing...",
    "timestamp": "2024-01-01T00:00:00Z",
    "sender": "Alice",
    "characterId": "character-id",
    "mood": 0.78
  },
  "character": {
    "id": "character-id",
    "name": "Alice",
    "role": "Researcher",
    "currentMood": 0.78,
    "status": "active"
  }
}
```

### 7. Get Chat History with Character
**GET** `/api/characters/{id}/chat`

**Query Parameters:**
- `limit` (number, optional): Number of messages (default: 50)
- `offset` (number, optional): Messages to skip (default: 0)

**Response:**
```json
{
  "conversationId": "conversation-id",
  "messages": [
    {
      "id": "message-id",
      "content": "Message content",
      "timestamp": "2024-01-01T00:00:00Z",
      "sender": "user",
      "senderType": "USER",
      "characterId": null
    }
  ],
  "character": {
    "id": "character-id",
    "name": "Alice",
    "role": "Researcher",
    "currentMood": 0.75,
    "status": "active"
  },
  "hasMore": false
}
```

---

## Character Status API

### 8. Get Character Status
**GET** `/api/characters/{id}/status`

**Response:**
```json
{
  "characterId": "character-id",
  "name": "Alice",
  "role": "Researcher",
  "status": "active",
  "activity": {
    "type": "working",
    "description": "Alice is actively engaged in her duties as a Researcher.",
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "mood": {
    "current": 0.75,
    "level": "high",
    "description": "Feeling quite positive"
  },
  "availability": {
    "isActive": true,
    "isInConversation": false,
    "activeConversations": 0,
    "status": "available"
  },
  "metrics": {
    "lastActivityMinutesAgo": 15,
    "totalConversations": 8,
    "recentMessages": 23,
    "lastSeen": "2024-01-01T00:00:00Z"
  },
  "location": {
    "environment": "Mnemocyte World",
    "area": "Researcher Sector",
    "coordinates": {
      "x": 245,
      "y": 680,
      "z": 12
    }
  }
}
```

### 9. Update Character Status
**PUT** `/api/characters/{id}/status`

**Request Body:**
```json
{
  "mood": 0.85,
  "isActive": true
}
```

### 10. Get All Character Statuses
**GET** `/api/characters/status`

**Query Parameters:**
- `includeInactive` (boolean, optional): Include inactive characters (default: false)
- `limit` (number, optional): Number of characters (default: 50)
- `offset` (number, optional): Characters to skip (default: 0)

**Response:**
```json
{
  "characters": [
    {
      "characterId": "character-id",
      "name": "Alice",
      "role": "Researcher",
      "status": "active",
      "activity": {
        "type": "working",
        "description": "Alice is actively engaged...",
        "timestamp": "2024-01-01T00:00:00Z"
      },
      "mood": {
        "current": 0.75,
        "level": "high"
      },
      "availability": {
        "isActive": true,
        "isInConversation": false,
        "activeConversations": 0,
        "status": "available"
      },
      "metrics": {
        "lastActivityMinutesAgo": 15,
        "totalConversations": 8,
        "recentMessages": 23,
        "lastSeen": "2024-01-01T00:00:00Z"
      },
      "imageUrl": "https://example.com/alice.jpg"
    }
  ],
  "summary": {
    "totalCharacters": 12,
    "activeCharacters": 10,
    "charactersInConversation": 3,
    "statusBreakdown": {
      "active": 7,
      "available": 3,
      "in_conversation": 2
    },
    "moodBreakdown": {
      "high": 8,
      "medium": 3,
      "low": 1
    },
    "averageMood": 0.68
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "hasMore": false
}
```

---

## Rooms API

### 11. List All Rooms
**GET** `/api/rooms`

**Query Parameters:**
- `limit` (number, optional): Number of rooms (default: 20)
- `offset` (number, optional): Rooms to skip (default: 0)
- `active` (boolean, optional): Filter by active status

**Response:**
```json
{
  "rooms": [
    {
      "id": "room-id",
      "name": "Research Discussion",
      "description": "A room for researchers to collaborate",
      "isActive": true,
      "isPrivate": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "participants": [
        {
          "id": "character-id",
          "name": "Alice",
          "role": "Researcher",
          "mood": 0.75,
          "isActive": true,
          "imageUrl": "https://example.com/alice.jpg",
          "joinedAt": "2024-01-01T00:00:00Z"
        }
      ],
      "lastMessage": {
        "id": "message-id",
        "content": "Welcome to Research Discussion!",
        "timestamp": "2024-01-01T00:00:00Z",
        "sender": "system"
      },
      "messageCount": 15
    }
  ],
  "hasMore": false
}
```

### 12. Create New Room
**POST** `/api/rooms`

**Request Body:**
```json
{
  "name": "Research Discussion",
  "characterIds": ["character-id-1", "character-id-2"],
  "description": "A room for researchers to collaborate",
  "isPrivate": false
}
```

**Response:** Returns the created room with all participant details.

### 13. Get Room Details
**GET** `/api/rooms/{id}`

**Query Parameters:**
- `messageLimit` (number, optional): Number of messages (default: 50)
- `messageOffset` (number, optional): Messages to skip (default: 0)

**Response:**
```json
{
  "id": "room-id",
  "name": "Research Discussion",
  "description": "A room for researchers to collaborate",
  "isActive": true,
  "isPrivate": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "participants": [
    {
      "id": "character-id",
      "name": "Alice",
      "role": "Researcher",
      "mood": 0.75,
      "isActive": true,
      "imageUrl": "https://example.com/alice.jpg",
      "personality": "Curious and analytical...",
      "joinedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "messages": [
    {
      "id": "message-id",
      "content": "Welcome to Research Discussion!",
      "timestamp": "2024-01-01T00:00:00Z",
      "sender": "system",
      "senderType": "SYSTEM",
      "characterId": null,
      "messageOrder": 1
    }
  ],
  "messageCount": 15,
  "hasMoreMessages": false
}
```

### 14. Update Room
**PUT** `/api/rooms/{id}`

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Room Name",
  "description": "Updated description",
  "isPrivate": true,
  "isActive": false,
  "characterIds": ["character-id-1", "character-id-3"]
}
```

### 15. Delete Room
**DELETE** `/api/rooms/{id}`

**Response:**
```json
{
  "message": "Room deleted successfully",
  "deletedRoomId": "room-id"
}
```

---

## Room Chat API

### 16. Send Message to Room
**POST** `/api/rooms/{id}/chat`

**Request Body:**
```json
{
  "message": "Hello everyone!",
  "characterId": "optional-character-id-if-character-speaking",
  "triggerResponses": true
}
```

**Response:**
```json
{
  "message": {
    "id": "message-id",
    "content": "Hello everyone!",
    "timestamp": "2024-01-01T00:00:00Z",
    "sender": "user",
    "senderType": "USER",
    "characterId": null,
    "messageOrder": 5
  },
  "characterResponses": [
    {
      "id": "response-id",
      "content": "Alice nods thoughtfully...",
      "timestamp": "2024-01-01T00:00:00Z",
      "sender": "Alice",
      "senderType": "CHARACTER",
      "characterId": "alice-id",
      "messageOrder": 6,
      "delay": 2000,
      "mood": 0.78
    }
  ],
  "roomId": "room-id"
}
```

### 17. Get Room Chat History
**GET** `/api/rooms/{id}/chat`

**Query Parameters:**
- `limit` (number, optional): Number of messages (default: 50)
- `offset` (number, optional): Messages to skip (default: 0)
- `since` (ISO timestamp, optional): Get messages since this time

**Response:**
```json
{
  "messages": [
    {
      "id": "message-id",
      "content": "Message content",
      "timestamp": "2024-01-01T00:00:00Z",
      "sender": "Alice",
      "senderType": "CHARACTER",
      "characterId": "character-id",
      "characterImageUrl": "https://example.com/alice.jpg",
      "messageOrder": 1
    }
  ],
  "hasMore": false,
  "roomId": "room-id"
}
```

---

## Status Codes

### Success Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully

### Error Codes
- `400 Bad Request` - Invalid input data or request parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Error Response Format
```json
{
  "error": "Error message description",
  "details": [
    {
      "field": "fieldName",
      "message": "Specific validation error"
    }
  ]
}
```

---

## Activity Types
Characters can have the following activity types:
- `idle` - Character is observing surroundings
- `thinking` - Deep in thought about work
- `working` - Engaged in professional duties
- `socializing` - Interacting with others
- `learning` - Expanding knowledge
- `creating` - Working on innovations
- `exploring` - Discovering new aspects
- `resting` - Taking rest
- `planning` - Strategic planning
- `reflecting` - Contemplating experiences

## Status Types
Characters can have the following status types:
- `active` - Currently active and engaged
- `busy` - Active but focused on tasks
- `available` - Active and available for interaction
- `away` - Temporarily away
- `in_conversation` - Currently in a conversation
- `offline` - Not currently active

---

## Notes

1. **Character Mood**: Ranges from 0.0 to 1.0, affects response generation and activity selection
2. **Message Ordering**: Messages have a `messageOrder` field for proper sequencing
3. **Real-time Features**: The API supports polling for new messages using the `since` parameter
4. **AI Responses**: Character responses are simulated using mood and personality-based templates
5. **Cascade Deletes**: Deleting characters or rooms also removes related conversations and messages
6. **Activity Simulation**: Character activities and statuses are dynamically generated based on mood and role

This API provides a complete foundation for building interactive character-based applications with multi-character conversations and realistic activity simulation.
