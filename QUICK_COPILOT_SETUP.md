# Quick Setup Guide: Getting Your Copilot Studio Token

## 🚀 Fastest Method (Direct Line)

### Step 1: Open Copilot Studio
1. Go to [copilotstudio.microsoft.com](https://copilotstudio.microsoft.com)
2. Sign in with your Microsoft account
3. Click on your **character agent** copilot

### Step 2: Enable Web Channel
1. Go to **Settings** (gear icon) on the left sidebar
2. Click **Channels**
3. Click **Custom Website** 
4. If not enabled, click **Turn on** to enable it

### Step 3: Copy Your Credentials
1. You'll see **Endpoint** and **Secret keys**
2. Copy the **Secret key** (this is your token)
3. The endpoint is always: `https://directline.botframework.com/v3/directline`

### Step 4: Create .env.local File
Create a file called `.env.local` in your FOXP2 project root:

```bash
COPILOT_STUDIO_ENDPOINT=https://directline.botframework.com/v3/directline
COPILOT_STUDIO_TOKEN=your_secret_key_here
```

### Step 5: Test It
1. Save the file
2. Restart your development server: `npm run dev`
3. Go to http://localhost:3000/playground
4. Create/select a character and start chatting!

---

## 🔍 Can't Find the Settings?

### Alternative Path 1:
1. In Copilot Studio, click your agent
2. Click **Settings** → **Security** → **Web channel security**
3. Look for Direct Line settings

### Alternative Path 2:
1. Go to **Publish** tab
2. Click **Channels**
3. Find **Custom Website** or **Direct Line**

### Alternative Path 3:
1. Power Platform Admin Center: [admin.powerplatform.microsoft.com](https://admin.powerplatform.microsoft.com)
2. **Resources** → **Copilot Studio** → Your Bot
3. **Settings** → **Channels**

---

## ✅ That's It!

Your characters will now use your Copilot Studio agent for responses instead of the fallback system. The integration will automatically:

- Send character context (role, personality, mood)
- Include conversation history
- Return natural responses from your trained agent

**Need help?** Check the full setup guide in `COPILOT_STUDIO_SETUP.md`
