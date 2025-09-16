# Copilot Studio Integration Guide

## Setting up your Character Agent with FOXP2 Smart NPCs

### 1. Get your Copilot Studio Credentials

#### Method 1: From Copilot Studio Web Interface

1. **Log into Copilot Studio**
   - Go to [https://copilotstudio.microsoft.com](https://copilotstudio.microsoft.com)
   - Sign in with your Microsoft account

2. **Find your Character Agent**
   - Navigate to your "character agent" copilot
   - Click on your agent to open it

3. **Get the Endpoint URL**
   - Go to **Settings** → **Channels** → **Custom Website**
   - Or **Settings** → **Security** → **Web channel security**
   - Look for the **Bot Framework Endpoint** or **Webhook URL**
   - Example: `https://directline.botframework.com/v3/directline/conversations`

4. **Get the Token/Secret**
   
   **For Power Platform endpoints (like yours):**
   - Go to **Settings** → **Security** → **Authentication**
   - Look for **API access** or **Service Principal**
   - You might need to create an **App Registration** in Azure AD
   - Get the **Access Token** or **Client Secret**
   
   **For Direct Line endpoints:**
   - In **Channels** → **Custom Website**, find the **Secret keys**
   - Copy one of the secret keys (this is your token)

#### Method 2: Azure Bot Service (if using Azure)

1. **Azure Portal**
   - Go to [portal.azure.com](https://portal.azure.com)
   - Find your Bot Service resource

2. **Get Direct Line Channel**
   - Go to **Channels** → **Direct Line**
   - Copy the **Secret key** (this is your token)
   - The endpoint is: `https://directline.botframework.com/v3/directline`

#### Method 3: Power Platform Admin Center

1. **Admin Center**
   - Go to [admin.powerplatform.microsoft.com](https://admin.powerplatform.microsoft.com)
   - Navigate to **Resources** → **Copilot Studio**

2. **Find Your Bot**
   - Click on your character agent
   - Go to **Settings** → **Security**
   - Look for **Web channel security** or **API access**

### 2. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Option 1: Power Platform Copilot Studio (YOUR CASE)
COPILOT_STUDIO_ENDPOINT=https://b6940e95e5b3e37c9953b93697213d.0b.environment.api.powerplatform.com/copilotstudio/dataverse-backed/authenticated/bots/cr0a0_characterAgent/conversations?api-version=2022-03-01-preview
COPILOT_STUDIO_TOKEN=your_access_token_or_api_key

# Option 2: Direct Line API (alternative)
# COPILOT_STUDIO_ENDPOINT=https://directline.botframework.com/v3/directline
# COPILOT_STUDIO_TOKEN=your_direct_line_secret_key

# Option 3: Azure Bot Service endpoint
# COPILOT_STUDIO_ENDPOINT=https://your-bot-name.azurewebsites.net/api/messages
# COPILOT_STUDIO_TOKEN=your_bot_secret
```

**Your Setup** (Power Platform Copilot Studio):
- Endpoint: `https://b6940e95e5b3e37c9953b93697213d.0b.environment.api.powerplatform.com/copilotstudio/dataverse-backed/authenticated/bots/cr0a0_characterAgent/conversations?api-version=2022-03-01-preview`
- Token: You'll need an access token (see authentication section below)

### 3. Copilot Studio API Format

The integration expects your Copilot Studio agent to accept this format:

**Request:**
```json
{
  "message": "Hello, how are you?",
  "systemPrompt": "You are John, a warrior character...",
  "conversationHistory": [
    {"role": "user", "content": "Previous message"},
    {"role": "assistant", "content": "Previous response"}
  ],
  "temperature": 0.8,
  "maxTokens": 200
}
```

**Response:**
```json
{
  "response": "Hello! As a warrior, I'm doing well and ready for any challenge.",
  "status": "success"
}
```

### 4. Customizing for Your Agent

If your Copilot Studio agent has a different API format, modify the `callCopilotStudio` function in `/src/app/api/chat/route.ts`:

```typescript
// Adjust the request body format
body: JSON.stringify({
  // Your agent's expected format
  query: userMessage,
  context: systemPrompt,
  // etc...
}),

// Adjust the response parsing
const aiResponse = data.answer || data.reply || data.message || 'I need a moment to think...';
```

### 5. Testing the Integration

1. Set up your environment variables
2. Restart your development server: `npm run dev`
3. Create a character and go to the Playground
4. Chat with your character - it should now use your Copilot Studio agent!

### 6. Fallback System

The system will try AI providers in this order:
1. **Copilot Studio** (your character agent) - PRIMARY
2. OpenAI (if API key provided)
3. Anthropic (if API key provided)  
4. Local fallback responses (as backup)

### 7. Character Context Sent to Your Agent

Your Copilot Studio agent will receive rich character context:

```
You are John Wick, a warrior. You have a distinct personality and set of abilities...

IDENTITY:
- Name: John Wick
- Role: warrior
- Personality: quite anger and very aggression, highly energy and quite creativity

CURRENT MOOD:
You are in a good mood, optimistic and energetic.
- Mood: happy
- Energy Level: high

ROLE BACKGROUND:
As a warrior, you think in terms of honor, combat, protection, and strength...

AVAILABLE ACTIONS:
- Battle Strike: Perform a powerful combat move against enemies
- Shield Wall: Create a defensive barrier to protect allies

Respond as John Wick would, considering your role, mood, and available actions.
```

This gives your Copilot Studio agent all the context needed to generate appropriate character responses!

## 🔍 Troubleshooting

### Can't find your token?

1. **Check Web Channel Settings**
   - Copilot Studio → Your Agent → Settings → Channels → Custom Website
   - Look for "Secret keys" or "Embed code"

2. **Enable Direct Line Channel**
   - If not enabled, go to Channels and add "Direct Line"
   - This will generate the secret keys you need

3. **Power Platform Admin**
   - Sometimes tokens are in Power Platform Admin Center
   - Check under Resources → Copilot Studio → Your Bot

### Common Endpoint Formats

- **Direct Line**: `https://directline.botframework.com/v3/directline`
- **Bot Framework**: `https://your-bot.azurewebsites.net/api/messages`
- **Custom**: `https://your-environment.api.copilot.com/api/chat`

### Testing Your Setup

1. Check server logs for connection attempts
2. Look for "Copilot Studio API error" messages
3. Verify your token hasn't expired
4. Ensure your bot is published and active

### Still having issues?

- Make sure your Copilot Studio agent is **published**
- Check that the **Web channel** is enabled
- Verify your Microsoft account has proper permissions
- Try regenerating the secret key if it's old
