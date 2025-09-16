# 🧠 Mnemocyte - Smart NPCs

**AI-powered system for creating intelligent video game characters with emotions, actions, roles, and routines using FOXP2 neural memory systems.**

![Minecraft-style UI](https://via.placeholder.com/800x400/87ceeb/ffffff?text=Mnemocyte+Smart+NPCs)

## 🎮 Features

### 🛠️ Character Creator
- **FOXP2 Neural Patterns**: Advanced AI-driven personality system
- **Emotional Weights**: Customizable emotional responses (happiness, sadness, anger, fear, curiosity, aggression)
- **Behavioral Traits**: Fine-tune sociability, energy, creativity, loyalty, and intelligence
- **Role-Based Templates**: Pre-configured archetypes (Warrior, Merchant, Scholar, Wanderer, Guardian, Artisan)
- **Real-time Preview**: See character changes instantly

### 🎯 Interactive Playground
- Test individual NPCs in controlled environments
- **Copilot Studio Integration**: Uses your custom character agent for AI responses
- Real-time conversation and interaction systems
- Memory persistence across sessions
- Mood tracking and dynamic responses

### 🌍 Multi-Character Game World
- Support for up to 10 parallel NPCs
- Advanced AI coordination between characters
- Persistent world state and character relationships
- WebSocket-powered real-time interactions

## 🎨 Design Philosophy

### Minecraft-Inspired UI
- **Pixelated Aesthetic**: Retro gaming interface with crisp, blocky elements
- **Press Start 2P Font**: Authentic gaming typography
- **Chunky Buttons**: Classic game interface patterns
- **Responsive Design**: Maintains pixel-perfect appearance across devices

### FOXP2 Neural Architecture
Named after the FOXP2 gene associated with language and neural development, our system creates:
- **Memory Banks**: Persistent character experiences and learning
- **Adaptive Behavior**: Characters that evolve based on interactions
- **Contextual Responses**: Intelligent reactions based on situation and history
- **Emotional Intelligence**: Realistic mood systems affecting all interactions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mnemocyte
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## 🤖 AI Configuration

### Copilot Studio Integration (Recommended)

For the best character conversations, integrate your Copilot Studio character agent:

1. **Set up environment variables** in `.env.local`:
   ```bash
   COPILOT_STUDIO_ENDPOINT=https://your-copilot-studio-endpoint.com/api/v1/chat
   COPILOT_STUDIO_TOKEN=your_copilot_studio_bearer_token
   ```

2. **See detailed setup guide**: [COPILOT_STUDIO_SETUP.md](./COPILOT_STUDIO_SETUP.md)

### Alternative AI Providers

```bash
# OpenAI (fallback)
OPENAI_API_KEY=your_openai_api_key

# Anthropic (fallback)  
ANTHROPIC_API_KEY=your_anthropic_api_key
```

**Priority Order**: Copilot Studio → OpenAI → Anthropic → Local Fallbacks

## 🏗️ Project Structure

```
mnemocyte/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Main landing page
│   │   ├── creator/           # Character creation interface
│   │   ├── playground/        # Individual NPC testing
│   │   └── world/            # Multi-character environment
│   ├── components/
│   │   └── ui/               # Minecraft-style UI components
│   └── lib/
│       └── utils.ts          # FOXP2 utilities and types
├── public/                   # Static assets
└── .github/
    └── copilot-instructions.md
```

## 🧬 FOXP2 Neural System

### Core Components

#### Emotional Weights
- **Happiness**: Positive response tendency
- **Sadness**: Melancholic behavior patterns  
- **Anger**: Aggressive reaction probability
- **Fear**: Cautious and defensive responses
- **Curiosity**: Exploration and questioning behavior
- **Aggression**: Confrontational tendencies

#### Behavioral Traits  
- **Sociability**: Interaction preference and social comfort
- **Energy**: Activity level and enthusiasm
- **Creativity**: Problem-solving and unique response generation
- **Loyalty**: Relationship persistence and trustworthiness
- **Intelligence**: Learning speed and complex reasoning

### Character Roles

| Role | Description | Key Traits |
|------|-------------|------------|
| ⚔️ **Warrior** | Combat-focused, protective | High aggression, loyalty |
| 💰 **Merchant** | Trade-oriented, social | High sociability, intelligence |
| 📚 **Scholar** | Knowledge-seeking, analytical | High intelligence, curiosity |
| 🌍 **Wanderer** | Exploration-focused, adaptable | High curiosity, energy |
| 🛡️ **Guardian** | Protective, dutiful | High loyalty, low fear |
| 🔨 **Artisan** | Creative, skilled | High creativity, intelligence |

## 🎯 Roadmap

### Phase 1: Core Foundation ✅
- [x] Minecraft-style UI framework
- [x] FOXP2 neural pattern system
- [x] Character creator interface
- [x] Basic emotional and behavioral systems

### Phase 2: Advanced Features 🚧
- [ ] Interactive playground implementation
- [ ] AI conversation system integration
- [ ] Memory persistence and learning
- [ ] Real-time mood tracking

### Phase 3: Multi-Character World 📅
- [ ] WebSocket real-time communication
- [ ] Multi-NPC coordination
- [ ] Persistent world state
- [ ] Character relationship systems

### Phase 4: AI Integration 🔮
- [ ] OpenAI/Anthropic model integration
- [ ] Context-aware responses
- [ ] Advanced learning algorithms
- [ ] Behavioral evolution system

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Minecraft's iconic UI design
- FOXP2 gene research for neural architecture concepts
- Open source AI libraries and frameworks
- The gaming community for NPC interaction ideas

---

**Made with ❤️ for creating more intelligent and engaging NPCs**
