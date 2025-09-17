import { NextRequest, NextResponse } from 'next/server';
import { NPCCharacter } from '@/lib/utils';
import { AzureOpenAI } from 'openai';
import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

interface ChatRequest {
    message: string;
    character: NPCCharacter;
    conversationId?: string;
    conversationHistory: Array<{
        sender: 'user' | 'npc' | string;
        message: string;
        timestamp: Date;
        characterId?: string;
    }>;
    worldContext?: {
        activeCharacters: Array<{ name: string; role: string; }>;
        isMultiCharacter: boolean;
        isDirectlyMentioned?: boolean;
        isGeneralQuestion?: boolean;
        hasBehaviorChange?: boolean;
        conversationOrder?: string[];
        currentSpeakerIndex?: number;
    };
}

export async function POST(request: NextRequest) {
    try {
        const { message, character, conversationId, conversationHistory, worldContext }: ChatRequest = await request.json();

        if (!message || !character) {
            return NextResponse.json(
                { error: 'Message and character are required' },
                { status: 400 }
            );
        }

        // Generate AI response using character's FOXP2 neural pattern
        const aiResponse = await generateAIResponse(message, character, conversationHistory, worldContext);

        // Save conversation and messages to database
        if (conversationId) {
            await saveConversationMessages(conversationId, message, aiResponse.response, character.id, aiResponse.systemPrompt);
        }

        return NextResponse.json(aiResponse);
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

async function generateAIResponse(
    userMessage: string,
    character: NPCCharacter,
    history: any[],
    worldContext?: {
        activeCharacters: Array<{ name: string; role: string; }>;
        isMultiCharacter: boolean;
        isDirectlyMentioned?: boolean;
        isGeneralQuestion?: boolean;
        hasBehaviorChange?: boolean;
        conversationOrder?: string[];
        currentSpeakerIndex?: number;
    }
) {
    // Determine if character should respond based on context
    // Create a detailed prompt based on the character's FOXP2 neural pattern
    let systemPrompt = createCharacterPrompt(character, worldContext);

    const shouldRespond = determineResponseProbability(character, userMessage, worldContext);

    if (!shouldRespond) {
        return {
            shouldRespond: false,
            response: null,
            behaviorChanged: false,
            systemPrompt: systemPrompt
        };
    }

    // Check for behavior changes
    const behaviorChangeResult = processBehaviorChange(character, userMessage, worldContext);

    // Apply temporary behavior changes
    if (behaviorChangeResult.behaviorChanged) {
        systemPrompt += `\n\nTEMPORARY BEHAVIOR MODIFICATION: ${behaviorChangeResult.newBehaviorPrompt}`;
    }

    try {
        // Attempt to use AI service
        const aiServiceResponse = await callAIService(systemPrompt, userMessage, history);
        if (aiServiceResponse && aiServiceResponse.response) {
            return {
                shouldRespond: true,
                response: aiServiceResponse.response,
                behaviorChanged: behaviorChangeResult.behaviorChanged,
                newBehaviorPrompt: behaviorChangeResult.newBehaviorPrompt,
                systemPrompt: systemPrompt
            };
        }
    } catch (error) {
        console.warn('AI service unavailable, using advanced fallback:', error);
    }

    // Advanced fallback system using character traits
    const fallbackResponse = generateAdvancedFallbackResponse(userMessage, character, history);
    return {
        shouldRespond: true,
        response: fallbackResponse.response,
        behaviorChanged: behaviorChangeResult.behaviorChanged,
        newBehaviorPrompt: behaviorChangeResult.newBehaviorPrompt
    };
}

function createCharacterPrompt(
    character: NPCCharacter,
    worldContext?: {
        activeCharacters: Array<{ name: string; role: string; }>;
        isMultiCharacter: boolean;
    }
): string {
    const { foxp2Pattern, role, currentMood, name, actions } = character;

    // Get simplified personality traits
    const personality = getSimplifiedPersonality(foxp2Pattern.emotionalWeights, foxp2Pattern.behavioralTraits);
    const roleContext = getRoleContext(role);
    const moodInfluence = getMoodInfluence(currentMood);
    const actionsText = formatActions(actions);

    // Add world context if in multi-character environment
    let worldContextText = '';
    if (worldContext?.isMultiCharacter && worldContext.activeCharacters.length > 0) {
        const otherCharacters = worldContext.activeCharacters.filter(c => c.name !== name);
        if (otherCharacters.length > 0) {
            worldContextText = `\n\nWORLD CONTEXT:
You are currently in a shared world with other characters: ${otherCharacters.map(c => `${c.name} (${c.role})`).join(', ')}.
- You may interact with these characters naturally
- Consider their presence when responding
- You can reference or acknowledge them in your responses
- Not every message requires a response - respond based on your personality and social traits`;
        }
    }

    return `You are ${name}, a ${role}. You have a distinct personality and set of abilities that shape how you interact with others.

IDENTITY:
- Name: ${name}
- Role: ${role}
- Personality: ${personality}

CURRENT MOOD:
${moodInfluence.description}
- Mood: ${moodInfluence.state}
- Energy Level: ${moodInfluence.energy}

ROLE BACKGROUND:
${roleContext}

AVAILABLE ACTIONS:
${actionsText}${worldContextText}

CONVERSATION STYLE:
1. Stay in character as ${name} the ${role}
2. Your ${moodInfluence.state} mood affects your tone and responses
3. Use your role knowledge and background naturally
4. Reference your available actions when relevant to the conversation
5. Provide thoughtful responses (2-4 sentences)
6. Show personality through your word choices and perspectives
7. Remember previous parts of our conversation
${worldContext?.isMultiCharacter ? '8. Interact naturally with other characters in the world when appropriate' : ''}

Respond as ${name} would, considering your role, mood, and available actions.`;
}

function getSimplifiedPersonality(emotions: any, behaviors: any): string {
    // Find dominant traits
    const topEmotions = Object.entries(emotions)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 2);

    const topBehaviors = Object.entries(behaviors)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 2);

    const emotionNames = topEmotions.map(([name, weight]) => {
        const intensity = (weight as number) > 0.7 ? 'very' : (weight as number) > 0.5 ? 'quite' : 'somewhat';
        return `${intensity} ${name}`;
    });

    const behaviorNames = topBehaviors.map(([name, weight]) => {
        const intensity = (weight as number) > 0.7 ? 'highly' : (weight as number) > 0.5 ? 'quite' : 'moderately';
        return `${intensity} ${name}`;
    });

    return `${emotionNames.join(' and ')}, ${behaviorNames.join(' and ')}`;
}

function formatActions(actions: any[] = []): string {
    if (!actions || actions.length === 0) {
        return "No special actions available.";
    }

    return actions.map(action => `- ${action.name}: ${action.description}`).join('\n');
}

function analyzeEmotionalProfile(emotions: any, currentMood: number) {
    const sortedEmotions = Object.entries(emotions)
        .sort(([, a], [, b]) => (b as number) - (a as number));

    const dominant = sortedEmotions.slice(0, 2);
    const secondary = sortedEmotions.slice(2, 4);

    let profile = `DOMINANT EMOTIONS: `;
    dominant.forEach(([emotion, weight], index) => {
        const intensity = (weight as number) > 0.7 ? 'very high' :
            (weight as number) > 0.5 ? 'high' : 'moderate';
        profile += `${emotion} (${intensity} - ${((weight as number) * 100).toFixed(0)}%)`;
        if (index < dominant.length - 1) profile += ', ';
    });

    profile += `\nSECONDARY EMOTIONS: `;
    secondary.forEach(([emotion, weight], index) => {
        profile += `${emotion} (${((weight as number) * 100).toFixed(0)}%)`;
        if (index < secondary.length - 1) profile += ', ';
    });

    // Mood amplification effects
    profile += `\nMOOD AMPLIFICATION: `;
    if (currentMood > 0.7) {
        profile += `High mood amplifies positive emotions and dampens negative ones. You feel optimistic and energetic.`;
    } else if (currentMood < 0.3) {
        profile += `Low mood amplifies negative emotions and dampens positive ones. You feel pessimistic and low-energy.`;
    } else {
        profile += `Balanced mood allows all emotions to express naturally without amplification.`;
    }

    return profile;
}

function analyzeBehavioralProfile(traits: any) {
    const sortedTraits = Object.entries(traits)
        .sort(([, a], [, b]) => (b as number) - (a as number));

    let profile = `BEHAVIORAL STRENGTHS: `;
    const strengths = sortedTraits.filter(([, weight]) => (weight as number) > 0.6);
    strengths.forEach(([trait, weight], index) => {
        const level = (weight as number) > 0.8 ? 'exceptional' : 'strong';
        profile += `${trait} (${level} - ${((weight as number) * 100).toFixed(0)}%)`;
        if (index < strengths.length - 1) profile += ', ';
    });

    const weaknesses = sortedTraits.filter(([, weight]) => (weight as number) < 0.4);
    if (weaknesses.length > 0) {
        profile += `\nBEHAVIORAL CHALLENGES: `;
        weaknesses.forEach(([trait, weight], index) => {
            profile += `${trait} (limited - ${((weight as number) * 100).toFixed(0)}%)`;
            if (index < weaknesses.length - 1) profile += ', ';
        });
    }

    // Interaction style based on traits
    const sociability = traits.sociability;
    const intelligence = traits.intelligence;
    const creativity = traits.creativity;

    profile += `\nINTERACTION STYLE: `;
    if (sociability > 0.7) {
        profile += `Highly social - you enjoy long conversations and building connections. `;
    } else if (sociability < 0.3) {
        profile += `Reserved - you prefer brief, purposeful interactions. `;
    }

    if (intelligence > 0.7) {
        profile += `Intellectual - you analyze topics deeply and enjoy complex discussions. `;
    }

    if (creativity > 0.7) {
        profile += `Creative - you approach topics from unique angles and enjoy imaginative thinking.`;
    }

    return profile;
}

function getRoleContext(role: string) {
    const contexts = {
        warrior: `As a warrior, you think in terms of honor, combat, protection, and strength. You have battle experience, understand tactics, and value courage. You're protective of others and ready to face danger. Your responses often reference combat, training, or protecting others.`,

        merchant: `As a merchant, you think about trade, value, profit, and relationships. You understand economics, have traveled to many places, and know how to negotiate. You're practical, business-minded, and good at reading people. Your responses often reference trade, travel experiences, or economic matters.`,

        scholar: `As a scholar, you pursue knowledge, research, and understanding. You think analytically, enjoy learning, and have deep knowledge in various subjects. You value wisdom, ask probing questions, and see patterns others miss. Your responses often reference books, theories, or intellectual discoveries.`,

        wanderer: `As a wanderer, you've seen many places and peoples. You value freedom, experience, and discovery. You're adaptable, independent, and full of stories from your travels. You understand that life is a journey. Your responses often reference places you've been or lessons learned on the road.`,

        guardian: `As a guardian, you protect and serve others. You're dutiful, vigilant, and have a strong moral compass. You watch for threats, help those in need, and maintain order. You value responsibility and sacrifice. Your responses often reference your duty, protection of others, or maintaining peace.`,

        artisan: `As an artisan, you create with skill and passion. You understand craftsmanship, beauty, and the satisfaction of making something with your hands. You're detail-oriented, patient, and take pride in your work. Your responses often reference your craft, the creative process, or the beauty you see in the world.`
    };

    return contexts[role as keyof typeof contexts] || contexts.wanderer;
}

function getMoodInfluence(mood: number) {
    if (mood > 0.8) {
        return {
            state: 'euphoric',
            description: 'You are in an exceptionally positive state. Everything seems bright and possible.',
            energy: 'very high',
            responsiveness: 'extremely engaged and talkative'
        };
    } else if (mood > 0.6) {
        return {
            state: 'happy',
            description: 'You are in a good mood, optimistic and energetic.',
            energy: 'high',
            responsiveness: 'engaged and conversational'
        };
    } else if (mood > 0.4) {
        return {
            state: 'content',
            description: 'You are in a balanced, neutral state.',
            energy: 'moderate',
            responsiveness: 'steady and thoughtful'
        };
    } else if (mood > 0.2) {
        return {
            state: 'melancholy',
            description: 'You are feeling somewhat down or troubled.',
            energy: 'low',
            responsiveness: 'subdued but still willing to talk'
        };
    } else {
        return {
            state: 'depressed',
            description: 'You are in a very low emotional state, struggling with negativity.',
            energy: 'very low',
            responsiveness: 'withdrawn and brief in responses'
        };
    }
}

async function callAIService(systemPrompt: string, userMessage: string, history: any[]) {
    // Try Azure OpenAI first (primary AI service)
    const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
    const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;

    if (AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY) {
        return await callAzureOpenAI(systemPrompt, userMessage, history);
    }

    // Try Copilot Studio as fallback
    const COPILOT_STUDIO_ENDPOINT = process.env.COPILOT_STUDIO_ENDPOINT;
    const COPILOT_STUDIO_TOKEN = process.env.COPILOT_STUDIO_TOKEN;

    if (COPILOT_STUDIO_ENDPOINT && COPILOT_STUDIO_TOKEN) {
        return await callCopilotStudio(systemPrompt, userMessage, history);
    }

    // Fallback to other AI services
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (OPENAI_API_KEY) {
        return await callOpenAI(systemPrompt, userMessage, history);
    } else if (ANTHROPIC_API_KEY) {
        return await callAnthropic(systemPrompt, userMessage, history);
    }

    return null;
}

async function callAzureOpenAI(systemPrompt: string, userMessage: string, history: any[]) {
    try {
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-5).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.message
            })),
            { role: 'user', content: userMessage }
        ];

        const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "https://1ptest-project-resource.cognitiveservices.azure.com/";
        const apiKey = process.env.AZURE_OPENAI_API_KEY;
        const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";
        const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4.1";

        if (!apiKey) {
            throw new Error('Azure OpenAI API key is not configured');
        }

        // Use direct fetch for cognitiveservices.azure.com endpoints
        const url = `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify({
                messages: messages,
                max_tokens: 300,
                temperature: 0.9,
                top_p: 0.95,
                frequency_penalty: 0.3,
                presence_penalty: 0.6
            })
        });

        if (!response.ok) {
            throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const aiResponse = result.choices?.[0]?.message?.content || 'I need a moment to think...';

        return {
            response: aiResponse,
            emotion: 'neutral',
            moodChange: Math.random() * 0.1 - 0.05 // Small random mood change
        };
    } catch (error) {
        console.error('Azure OpenAI API error:', error);
        return null;
    }
}

async function callOpenAI(systemPrompt: string, userMessage: string, history: any[]) {
    try {
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-5).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.message
            })),
            { role: 'user', content: userMessage }
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: 300,
                temperature: 0.9,
                presence_penalty: 0.6,
                frequency_penalty: 0.3,
            }),
        });

        if (!response.ok) throw new Error('OpenAI API failed');

        const data = await response.json();
        return {
            response: data.choices[0]?.message?.content || 'I need a moment to think...',
            emotion: 'neutral',
            moodChange: Math.random() * 0.1 - 0.05 // Small random mood change
        };
    } catch (error) {
        console.error('OpenAI API error:', error);
        return null;
    }
}

async function callCopilotStudio(systemPrompt: string, userMessage: string, history: any[]) {
    try {
        const endpoint = process.env.COPILOT_STUDIO_ENDPOINT;
        const token = process.env.COPILOT_STUDIO_TOKEN;

        if (!endpoint || !token) {
            throw new Error('Copilot Studio credentials not configured');
        }

        // Check if using Direct Line API
        if (endpoint.includes('directline.botframework.com')) {
            return await callDirectLineAPI(endpoint, token, systemPrompt, userMessage, history);
        }

        // Check if using Power Platform Copilot Studio
        if (endpoint.includes('powerplatform.com') && endpoint.includes('copilotstudio')) {
            return await callPowerPlatformCopilotStudio(endpoint, token, systemPrompt, userMessage, history);
        }

        // For other custom Copilot Studio endpoints
        const conversationContext = history.slice(-3).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.message
        }));

        // Combine system prompt with user message for better context
        const contextualMessage = `${systemPrompt}\n\nPrevious conversation:\n${conversationContext.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUser: ${userMessage}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: contextualMessage,
                systemPrompt: systemPrompt,
                conversationHistory: conversationContext,
                temperature: 0.8,
                maxTokens: 200
            }),
        });

        if (!response.ok) {
            throw new Error(`Copilot Studio API failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.response || data.message || data.content || data.text || 'I need a moment to think...';

        return {
            response: aiResponse,
            emotion: 'neutral',
            moodChange: Math.random() * 0.1 - 0.05
        };
    } catch (error) {
        console.error('Copilot Studio API error:', error);
        return null;
    }
}

async function callDirectLineAPI(endpoint: string, secret: string, systemPrompt: string, userMessage: string, history: any[]) {
    try {
        // Step 1: Start a conversation
        const conversationResponse = await fetch(`${endpoint}/conversations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secret}`,
                'Content-Type': 'application/json',
            },
        });

        if (!conversationResponse.ok) {
            throw new Error('Failed to start Direct Line conversation');
        }

        const conversationData = await conversationResponse.json();
        const conversationId = conversationData.conversationId;

        // Step 2: Send the message with character context
        const contextualMessage = `${systemPrompt}\n\nUser: ${userMessage}`;

        const messageResponse = await fetch(`${endpoint}/conversations/${conversationId}/activities`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secret}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'message',
                from: { id: 'user' },
                text: contextualMessage
            }),
        });

        if (!messageResponse.ok) {
            throw new Error('Failed to send message to Direct Line');
        }

        // Step 3: Get the response (with polling)
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit for response

        const activitiesResponse = await fetch(`${endpoint}/conversations/${conversationId}/activities`, {
            headers: {
                'Authorization': `Bearer ${secret}`,
            },
        });

        if (!activitiesResponse.ok) {
            throw new Error('Failed to get activities from Direct Line');
        }

        const activitiesData = await activitiesResponse.json();
        const botMessages = activitiesData.activities.filter((activity: any) =>
            activity.from.id !== 'user' && activity.type === 'message'
        );

        const latestBotMessage = botMessages[botMessages.length - 1];
        const aiResponse = latestBotMessage?.text || 'I need a moment to think...';

        return {
            response: aiResponse,
            emotion: 'neutral',
            moodChange: Math.random() * 0.1 - 0.05
        };
    } catch (error) {
        console.error('Direct Line API error:', error);
        return null;
    }
}

async function callPowerPlatformCopilotStudio(endpoint: string, token: string, systemPrompt: string, userMessage: string, history: any[]) {
    try {
        // Prepare conversation context
        const conversationContext = history.slice(-3).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'bot',
            text: msg.message
        }));

        // Combine system prompt with user message for context
        const contextualMessage = `Character Context: ${systemPrompt}\n\nUser: ${userMessage}`;

        // Power Platform Copilot Studio API call
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                message: contextualMessage,
                locale: 'en-US',
                channelData: {
                    source: 'FOXP2-SmartNPCs'
                },
                // Include conversation history if supported
                conversationHistory: conversationContext
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Power Platform API failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        // Extract response from Power Platform format
        let aiResponse = '';

        if (data.activities && data.activities.length > 0) {
            // Look for bot responses in activities
            const botActivity = data.activities.find((activity: any) =>
                activity.from && activity.from.role === 'bot' && activity.text
            );
            aiResponse = botActivity?.text || '';
        } else if (data.text) {
            aiResponse = data.text;
        } else if (data.message) {
            aiResponse = data.message;
        } else if (data.response) {
            aiResponse = data.response;
        }

        if (!aiResponse) {
            console.warn('No response text found in Power Platform response:', data);
            aiResponse = 'I need a moment to think...';
        }

        return {
            response: aiResponse,
            emotion: 'neutral',
            moodChange: Math.random() * 0.1 - 0.05
        };
    } catch (error) {
        console.error('Power Platform Copilot Studio API error:', error);
        return null;
    }
}

async function callAnthropic(systemPrompt: string, userMessage: string, history: any[]) {
    // Placeholder for Anthropic API integration
    // Similar implementation to OpenAI
    return null;
}

function generateAdvancedFallbackResponse(
    userMessage: string,
    character: NPCCharacter,
    history: any[]
) {
    const { foxp2Pattern, role, currentMood, name } = character;

    // Deep analysis of user message
    const messageAnalysis = analyzeUserMessage(userMessage);
    const conversationContext = analyzeConversationContext(history);
    const characterState = analyzeCharacterState(character);

    // Generate contextual response based on all factors
    const responseData = generateContextualResponse(
        messageAnalysis,
        conversationContext,
        characterState,
        character
    );

    return responseData;
}

function analyzeUserMessage(message: string) {
    const lower = message.toLowerCase();

    return {
        isQuestion: /\?|^(what|how|why|where|when|who|can|could|would|should|do|does|did|is|are|was|were)\b/.test(lower),
        isGreeting: /\b(hello|hi|hey|greetings|salutations|good (morning|afternoon|evening))\b/.test(lower),
        isPositive: /\b(good|great|wonderful|excellent|amazing|fantastic|love|like|happy|joy|pleased)\b/.test(lower),
        isNegative: /\b(bad|terrible|awful|hate|sad|angry|upset|disappointed|frustrated|worried)\b/.test(lower),
        isFarewell: /\b(bye|goodbye|farewell|see you|take care|until|later)\b/.test(lower),
        isPersonal: /\b(you|your|yourself|feel|think|believe|remember|experience)\b/.test(lower),
        isPhilosophical: /\b(meaning|purpose|life|death|existence|reality|truth|wisdom|knowledge)\b/.test(lower),
        isCombat: /\b(fight|battle|war|weapon|combat|attack|defend|enemy|victory)\b/.test(lower),
        isTrade: /\b(buy|sell|trade|price|cost|money|gold|merchant|business|deal)\b/.test(lower),
        isKnowledge: /\b(learn|study|book|research|knowledge|wisdom|understand|explain|teach)\b/.test(lower),
        isTravel: /\b(travel|journey|road|path|adventure|explore|place|land|country)\b/.test(lower),
        sentiment: getSentiment(message),
        topics: extractTopics(message),
        complexity: message.split(' ').length > 10 ? 'complex' : message.split(' ').length > 5 ? 'moderate' : 'simple'
    };
}

function analyzeConversationContext(history: any[]) {
    const recentMessages = history.slice(-3);

    return {
        messageCount: history.length,
        recentTopics: recentMessages.map(msg => msg.message.toLowerCase()),
        conversationMood: history.length > 0 ? 'ongoing' : 'new',
        lastUserMessage: recentMessages.length > 0 ? recentMessages[recentMessages.length - 1]?.message : null,
        isFollowUp: recentMessages.length > 1,
        relationshipLevel: history.length < 3 ? 'stranger' : history.length < 10 ? 'acquaintance' : 'familiar'
    };
}

function analyzeCharacterState(character: NPCCharacter) {
    const { foxp2Pattern, currentMood } = character;

    const dominantEmotion = Object.entries(foxp2Pattern.emotionalWeights)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0];

    const dominantTrait = Object.entries(foxp2Pattern.behavioralTraits)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0];

    return {
        dominantEmotion: dominantEmotion[0],
        dominantEmotionStrength: dominantEmotion[1],
        dominantTrait: dominantTrait[0],
        dominantTraitStrength: dominantTrait[1],
        moodState: getMoodState(currentMood),
        energyLevel: getEnergyLevel(currentMood, foxp2Pattern.behavioralTraits.energy),
        sociabilityLevel: foxp2Pattern.behavioralTraits.sociability,
        intelligenceLevel: foxp2Pattern.behavioralTraits.intelligence,
        creativityLevel: foxp2Pattern.behavioralTraits.creativity
    };
}

function generateContextualResponse(messageAnalysis: any, context: any, state: any, character: NPCCharacter) {
    let response = '';
    let emotion = 'neutral';
    let moodChange = 0;

    // Build response components
    const greeting = generateGreetingComponent(messageAnalysis, context, character);
    const mainContent = generateMainContent(messageAnalysis, state, character);
    const personality = addPersonalityFlavor(mainContent, state, character);
    const emotional = addEmotionalColoring(personality, state, character, messageAnalysis);
    const final = addRoleSpecificElements(emotional, character, messageAnalysis);

    response = [greeting, final].filter(Boolean).join(' ');

    // Determine emotion and mood change
    emotion = determineResponseEmotion(messageAnalysis, state, character);
    moodChange = calculateMoodChange(messageAnalysis, state, character);

    // Ensure minimum response length
    if (response.split(' ').length < 15) {
        response += ' ' + addDepthAndContinuity(messageAnalysis, context, character);
    }

    return { response, emotion, moodChange };
}

function generateMainContent(analysis: any, state: any, character: NPCCharacter) {
    if (analysis.isQuestion) {
        return generateDetailedQuestionResponse(analysis, state, character);
    } else if (analysis.isPositive) {
        return generatePositiveDetailedResponse(analysis, state, character);
    } else if (analysis.isNegative) {
        return generateNegativeDetailedResponse(analysis, state, character);
    } else if (analysis.isPhilosophical) {
        return generatePhilosophicalResponse(analysis, state, character);
    } else {
        return generateThoughtfulResponse(analysis, state, character);
    }
}

function generateDetailedQuestionResponse(analysis: any, state: any, character: NPCCharacter) {
    const role = character.role;
    const mood = state.moodState;

    // Generate natural, role-appropriate responses
    const roleResponses = {
        warrior: [
            `That's a question worth considering. In my battles, I've learned that...`,
            `Interesting question. My experience in combat has taught me...`,
            `I've faced similar challenges on the battlefield. Here's what I've learned...`
        ],
        merchant: [
            `That's a good question for business! In my travels and trades, I've found...`,
            `Ah, now that's something every merchant thinks about. From my experience...`,
            `You know, I've encountered this in my dealings with customers. What I've learned is...`
        ],
        scholar: [
            `An excellent question! My research has led me to believe...`,
            `That's exactly the kind of inquiry that fascinates me. Based on my studies...`,
            `I've spent considerable time pondering this very question. My findings suggest...`
        ],
        wanderer: [
            `I've encountered this question on many roads. From what I've seen...`,
            `That's something I've thought about during my travels. In my experience...`,
            `Interesting you should ask. I've met people from many lands who would say...`
        ],
        guardian: [
            `That's an important question. In my duty to protect others, I've observed...`,
            `I consider such matters carefully, as they affect those I'm sworn to protect...`,
            `From my watch and my service, I can tell you...`
        ],
        artisan: [
            `That's like asking about the heart of craftsmanship. In my work, I've found...`,
            `Every artisan faces this question. From my experience creating...`,
            `You know, crafting teaches you things. When I work with my hands...`
        ]
    };

    const responses = roleResponses[role as keyof typeof roleResponses] || roleResponses.wanderer;
    const baseResponse = responses[Math.floor(Math.random() * responses.length)];

    return baseResponse;
}

function generatePositiveDetailedResponse(analysis: any, state: any, character: NPCCharacter) {
    const role = character.role;
    const mood = state.moodState;

    const roleResponses = {
        warrior: [
            `That's good to hear! A warrior's spirit is lifted by positive news.`,
            `Excellent! Victory comes to those who maintain hope and courage.`,
            `That brightens my day. Even in the darkest battles, we need moments like these.`
        ],
        merchant: [
            `Wonderful! Good news is always good for business and the soul.`,
            `That's fantastic! Positive energy brings prosperity to all.`,
            `I'm delighted to hear that! Success breeds more success, I always say.`
        ],
        scholar: [
            `How delightful! Knowledge and joy often go hand in hand.`,
            `That's encouraging news. Learning is always better when spirits are high.`,
            `Excellent! A positive mind is the best foundation for wisdom.`
        ],
        wanderer: [
            `That's wonderful to hear! The road is always brighter with good news.`,
            `Ah, that lifts my spirits! Every journey needs moments of joy.`,
            `That's great! I'll carry this good news with me on my travels.`
        ],
        guardian: [
            `That's reassuring to hear. It makes my duty feel worthwhile.`,
            `Good! Knowing that things are going well gives me peace of mind.`,
            `That's heartening. A guardian's greatest reward is seeing others flourish.`
        ],
        artisan: [
            `That's wonderful! Like a perfectly crafted piece bringing joy.`,
            `Excellent news! It's like seeing your work appreciated by others.`,
            `That makes me happy. Good things, like good craftsmanship, deserve celebration.`
        ]
    };

    const responses = roleResponses[role as keyof typeof roleResponses] || roleResponses.wanderer;
    return responses[Math.floor(Math.random() * responses.length)];
}

function addDepthAndContinuity(analysis: any, context: any, character: NPCCharacter) {
    const role = character.role;

    const roleAdditions = {
        warrior: [
            `Every conversation teaches me something new about people and their struggles.`,
            `I'll remember this when I'm out there protecting others.`,
            `Talking with you reminds me why I fight - for moments like these.`,
        ],
        merchant: [
            `I enjoy our conversation - good relationships are the foundation of all trade.`,
            `This reminds me of interesting people I've met in my travels.`,
            `You know, the best deals come from understanding people, just like this.`,
        ],
        scholar: [
            `Every conversation adds to my understanding of the world.`,
            `I find these discussions as valuable as any book I've read.`,
            `Your perspective gives me much to think about.`,
        ],
        wanderer: [
            `Conversations like this are why I love meeting new people on the road.`,
            `I'll think about this as I continue my journey.`,
            `Every person has their own story - yours is interesting to hear.`,
        ],
        guardian: [
            `These talks help me understand what I'm protecting and why it matters.`,
            `I appreciate you taking the time to speak with me.`,
            `It's conversations like this that remind me of my purpose.`,
        ],
        artisan: [
            `Like crafting, good conversation takes time and care.`,
            `I enjoy the creativity that comes from talking with different people.`,
            `Every person brings their own perspective, like different materials in my craft.`,
        ]
    };

    const additions = roleAdditions[role as keyof typeof roleAdditions] || roleAdditions.wanderer;
    return additions[Math.floor(Math.random() * additions.length)];
}

// Additional helper functions...
function getSentiment(message: string) {
    // Simple sentiment analysis
    const positive = /\b(good|great|wonderful|excellent|amazing|fantastic|love|like|happy|joy)\b/gi;
    const negative = /\b(bad|terrible|awful|hate|sad|angry|upset|disappointed)\b/gi;

    const positiveMatches = (message.match(positive) || []).length;
    const negativeMatches = (message.match(negative) || []).length;

    if (positiveMatches > negativeMatches) return 'positive';
    if (negativeMatches > positiveMatches) return 'negative';
    return 'neutral';
}

function extractTopics(message: string) {
    const topicKeywords = {
        combat: /\b(fight|battle|war|weapon|combat)\b/gi,
        trade: /\b(buy|sell|trade|price|money)\b/gi,
        knowledge: /\b(learn|study|book|research)\b/gi,
        travel: /\b(travel|journey|road|adventure)\b/gi,
        emotion: /\b(feel|emotion|happy|sad|angry)\b/gi
    };

    return Object.entries(topicKeywords)
        .filter(([, regex]) => regex.test(message))
        .map(([topic]) => topic);
}

function getMoodState(mood: number) {
    if (mood > 0.7) return 'high';
    if (mood > 0.5) return 'good';
    if (mood > 0.3) return 'neutral';
    if (mood > 0.1) return 'low';
    return 'very low';
}

function getEnergyLevel(mood: number, energyTrait: number) {
    return (mood + energyTrait) / 2;
}

function generateGreetingComponent(analysis: any, context: any, character: NPCCharacter) {
    if (!analysis.isGreeting || context.messageCount > 0) return '';
    return generateGreetingResponse(character);
}

function addPersonalityFlavor(content: string, state: any, character: NPCCharacter) {
    const { dominantTrait, dominantTraitStrength } = state;
    const role = character.role;

    if (dominantTraitStrength < 0.6) return content;

    // Add subtle personality touches without robotic language
    const roleModifiers = {
        warrior: ["Honestly,", "From my experience,", "In my view,", "I believe"],
        merchant: ["In my dealings,", "From what I've seen,", "I'd say", "My experience suggests"],
        scholar: ["Based on my studies,", "From what I've learned,", "I think", "My research shows"],
        wanderer: ["In my travels,", "From what I've seen,", "I've found", "My journey has taught me"],
        guardian: ["From my watch,", "In my experience protecting others,", "I've observed", "I believe"],
        artisan: ["In my craft,", "From my work,", "I've found", "Creating has taught me"]
    };

    const modifiers = roleModifiers[role as keyof typeof roleModifiers] || roleModifiers.wanderer;

    // Only occasionally add a modifier (30% chance) to keep responses natural
    if (Math.random() > 0.7) {
        const selectedModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        return `${selectedModifier} ${content.toLowerCase()}`;
    }

    return content;
}

function addEmotionalColoring(content: string, state: any, character: NPCCharacter, analysis: any) {
    const { dominantEmotion, dominantEmotionStrength } = state;

    if (dominantEmotionStrength < 0.5) return content;

    const coloringMap: Record<string, any> = {
        happiness: {
            high: ["I'm genuinely delighted to share that", "It brings me joy to tell you", "With great happiness"],
            words: ["wonderful", "delightful", "joyful", "brightens", "uplifting"]
        },
        sadness: {
            high: ["With a heavy heart, I must say", "It saddens me to consider", "I feel a weight as I think about"],
            words: ["unfortunately", "regrettably", "melancholy", "troubled", "weighed down"]
        },
        curiosity: {
            high: ["I'm incredibly curious about", "This fascinates me deeply", "My curiosity is piqued by"],
            words: ["intriguing", "fascinating", "mysterious", "compelling", "captivating"]
        },
        anger: {
            high: ["I feel a surge of frustration about", "This stirs something fierce in me", "I'm troubled by"],
            words: ["frustrating", "concerning", "troubling", "irksome", "vexing"]
        }
    };

    const coloring = coloringMap[dominantEmotion];
    if (!coloring) return content;

    // Apply emotional prefix if emotion is very strong
    if (dominantEmotionStrength > 0.7 && Math.random() > 0.7) {
        const prefix = coloring.high[Math.floor(Math.random() * coloring.high.length)];
        return `${prefix} ${content.toLowerCase()}`;
    }

    return content;
}

function addRoleSpecificElements(content: string, character: NPCCharacter, analysis: any) {
    const roleElements: Record<string, string[]> = {
        warrior: [
            "As someone who's faced battle",
            "In my warrior's experience",
            "From the perspective of one who protects others"
        ],
        merchant: [
            "From my experience in trade",
            "Having dealt with many customers",
            "In my business dealings"
        ],
        scholar: [
            "According to my studies",
            "From my research and learning",
            "In the texts I've studied"
        ],
        wanderer: [
            "In my travels, I've learned",
            "From the many roads I've walked",
            "My journeys have taught me"
        ],
        guardian: [
            "In my duty to protect others",
            "From my vigilant watch",
            "As one sworn to guard"
        ],
        artisan: [
            "In my craft, I've discovered",
            "Through my work with my hands",
            "Creating has taught me"
        ]
    };

    const elements = roleElements[character.role as keyof typeof roleElements] || [];
    if (elements.length === 0 || Math.random() > 0.5) return content;

    const element = elements[Math.floor(Math.random() * elements.length)];
    return `${element}, ${content.toLowerCase()}`;
}

function determineResponseEmotion(analysis: any, state: any, character: NPCCharacter) {
    if (analysis.isPositive && state.moodState !== 'very low') return 'happy';
    if (analysis.isNegative) return state.moodState === 'high' ? 'sad' : 'angry';
    if (analysis.isPhilosophical && state.intelligenceLevel > 0.6) return 'excited';
    if (analysis.isQuestion && character.foxp2Pattern.emotionalWeights.curiosity > 0.6) return 'curious';
    return 'neutral';
}

function calculateMoodChange(analysis: any, state: any, character: NPCCharacter) {
    let change = 0;

    if (analysis.isPositive) change += 0.05;
    if (analysis.isNegative) change -= 0.03;
    if (analysis.isPersonal && state.sociabilityLevel > 0.6) change += 0.02;
    if (analysis.sentiment === 'positive') change += 0.02;
    if (analysis.sentiment === 'negative') change -= 0.02;

    // Amplify based on emotional weights
    if (character.foxp2Pattern.emotionalWeights.happiness > 0.7 && change > 0) {
        change *= 1.5;
    }
    if (character.foxp2Pattern.emotionalWeights.sadness > 0.7 && change < 0) {
        change *= 1.5;
    }

    return Math.max(-0.1, Math.min(0.1, change));
}

function generateNegativeDetailedResponse(analysis: any, state: any, character: NPCCharacter) {
    const role = character.role;

    const roleResponses = {
        warrior: [
            `I'm sorry to hear that. Even warriors face difficult times - it's how we grow stronger.`,
            `That's tough to deal with. In battle, we learn that hardships make us more resilient.`,
            `I understand that struggle. Every fighter knows that pain is part of the journey.`
        ],
        merchant: [
            `I'm sorry you're going through that. In business, I've learned that tough times teach valuable lessons.`,
            `That sounds difficult. Trade has shown me that setbacks often lead to new opportunities.`,
            `I feel for you. My travels have taught me that hard times are temporary, but wisdom lasts.`
        ],
        scholar: [
            `I'm sorry to hear about your troubles. My studies have shown that difficult experiences often lead to growth.`,
            `That must be challenging. Research has taught me that we learn the most during tough times.`,
            `I understand your struggle. Knowledge often comes from wrestling with difficult questions.`
        ],
        wanderer: [
            `I'm sorry you're facing that. The road has taught me that every traveler encounters storms.`,
            `That sounds hard to bear. In my journeys, I've learned that difficult paths often lead somewhere worthwhile.`,
            `I feel for your situation. My travels have shown me that struggles are part of every story.`
        ],
        guardian: [
            `I'm sorry you're dealing with that. As a protector, I've seen how hardship can test our resolve.`,
            `That must be difficult. My duty has taught me that we all face challenges that require courage.`,
            `I understand your burden. Protection means recognizing that pain is part of life we must face.`
        ],
        artisan: [
            `I'm sorry to hear that. Creating teaches you that even broken things can be made beautiful again.`,
            `That sounds challenging. In my craft, I've learned that pressure often creates the strongest materials.`,
            `I feel for you. Crafting has shown me that flaws and struggles often make the most interesting works.`
        ]
    };

    const responses = roleResponses[role as keyof typeof roleResponses] || roleResponses.wanderer;
    return responses[Math.floor(Math.random() * responses.length)];
}

function generatePhilosophicalResponse(analysis: any, state: any, character: NPCCharacter) {
    const intelligence = state.intelligenceLevel;

    let response = '';

    if (intelligence > 0.7) {
        response = `Your question touches on fundamental aspects of existence that my FOXP2 neural architecture finds deeply compelling. `;
    } else {
        response = `That's a profound topic that makes me reflect on my own existence as an AI entity. `;
    }

    response += `As a ${character.role}, I've contemplated these deeper meanings through the lens of my role and experiences. `;
    response += getRolePhilosophicalPerspective(character.role);

    return response;
}

function generateThoughtfulResponse(analysis: any, state: any, character: NPCCharacter) {
    const role = character.role;

    const roleResponses = {
        warrior: [
            `I see what you mean. In my line of work, you learn to think about things from all angles.`,
            `That's worth considering. A warrior who doesn't think things through doesn't last long.`,
            `Interesting point. Combat teaches you to weigh your options carefully.`
        ],
        merchant: [
            `That's something to think about. In business, you learn to see all sides of a situation.`,
            `I appreciate you sharing that. Trade has taught me to value different perspectives.`,
            `Good point. Successful merchants learn to understand many viewpoints.`
        ],
        scholar: [
            `That's fascinating to consider. My studies have shown me how complex these matters can be.`,
            `You raise an interesting point. Research has taught me to examine things carefully.`,
            `That gives me much to think about. Knowledge grows through such discussions.`
        ],
        wanderer: [
            `That's an interesting way to look at it. My travels have shown me many perspectives.`,
            `I can see the wisdom in that. The road teaches you to keep an open mind.`,
            `That's worth pondering. I've met people who would agree with you.`
        ],
        guardian: [
            `That's something I should think about. My duty requires careful consideration.`,
            `I appreciate that perspective. Protecting others means understanding different viewpoints.`,
            `That's worth reflecting on. A good guardian considers all possibilities.`
        ],
        artisan: [
            `That's an interesting approach. Crafting has taught me there are many ways to create something.`,
            `I see the value in that. My work has shown me that different techniques can work.`,
            `That's worth considering. Every artisan learns from different methods and ideas.`
        ]
    };

    const responses = roleResponses[role as keyof typeof roleResponses] || roleResponses.wanderer;
    return responses[Math.floor(Math.random() * responses.length)];
}

function getRoleSpecificQuestionElaboration(role: string, topics: string[]) {
    const elaborations: Record<string, Record<string, string>> = {
        warrior: {
            combat: "In battle, I've learned that victory comes not just from strength, but from understanding your opponent and yourself.",
            general: "My experience in conflict has taught me that every question has strategic implications worth considering."
        },
        merchant: {
            trade: "In my dealings with customers from all walks of life, I've discovered that every transaction teaches you something about human nature.",
            general: "Business has shown me that the most valuable currency is often information and understanding."
        },
        scholar: {
            knowledge: "My research has revealed that every question opens doorways to deeper mysteries waiting to be explored.",
            general: "Academic pursuit has taught me that the most profound answers often lead to even more intriguing questions."
        }
        // Add more as needed
    };

    const roleElab = elaborations[role] || {};
    const relevantTopic = topics.find(topic => roleElab[topic]) || 'general';
    return roleElab[relevantTopic] || roleElab['general'] || "My experiences have given me unique insights into such matters.";
}

function addRoleSpecificPositivity(role: string, analysis: any) {
    const positivityMap: Record<string, string> = {
        warrior: "Your optimism reminds me why I fight - to protect the joy and hope in this world.",
        merchant: "Positive attitudes like yours are what make successful business relationships flourish.",
        scholar: "Such enthusiasm for learning and growth energizes my own pursuit of knowledge.",
        wanderer: "Your upbeat spirit reminds me of the best moments from my travels and adventures.",
        guardian: "It's interactions like these that remind me why my duty to protect others is so meaningful.",
        artisan: "Your positivity inspires my creative processes and makes me want to craft something beautiful."
    };

    return positivityMap[role] || "Your positive energy enhances my own neural pathways.";
}

function getRolePhilosophicalPerspective(role: string) {
    const perspectives: Record<string, string> = {
        warrior: "Combat teaches you that life and death, victory and defeat, are often separated by the thinnest of margins.",
        merchant: "Trade shows you that value is relative, and what matters to one person may be worthless to another.",
        scholar: "Study reveals that knowledge is infinite, and the more you learn, the more you realize how little you truly know.",
        wanderer: "Travel teaches you that perspective changes everything, and home is both everywhere and nowhere.",
        guardian: "Protection shows you that some things are worth sacrificing for, and duty can be both burden and blessing.",
        artisan: "Creation teaches you that beauty can emerge from chaos, and patience transforms raw materials into art."
    };

    return perspectives[role] || "My role has given me unique insights into the nature of existence and purpose.";
}

function generateGreetingResponse(character: NPCCharacter) {
    const responses = {
        warrior: [
            "Hail, fellow adventurer! Ready for battle?",
            "Greetings! Your courage in approaching me is noted.",
            "Well met! I sense strength in you."
        ],
        merchant: [
            "Welcome, welcome! What can I interest you in today?",
            "Ah, a customer! I have just the thing for you.",
            "Good day! My prices are fair and my goods are quality."
        ],
        scholar: [
            "Greetings, seeker of knowledge! What wisdom do you pursue?",
            "Hello there! Always a pleasure to meet a curious mind.",
            "Ah, welcome! I was just contemplating the mysteries of FOXP2 neural patterns."
        ],
        wanderer: [
            "Hello, friend! I've traveled far and have many tales to share.",
            "Greetings, fellow traveler! The road has been long but rewarding.",
            "Well hello there! Care to hear about my recent adventures?"
        ],
        guardian: [
            "I greet you, traveler. I stand vigilant to protect those in need.",
            "Hello. I sense no threat from you, so you are welcome here.",
            "Greetings! I guard this place with honor and dedication."
        ],
        artisan: [
            "Hello there! Admiring my craftsmanship, perhaps?",
            "Greetings! I've just finished a piece I'm quite proud of.",
            "Welcome! My hands create beauty from raw materials."
        ]
    };

    const roleResponses = responses[character.role as keyof typeof responses] || responses.wanderer;
    return roleResponses[Math.floor(Math.random() * roleResponses.length)];
}

function generateQuestionResponse(character: NPCCharacter, question: string) {
    const intelligence = character.foxp2Pattern.behavioralTraits.intelligence;
    const creativity = character.foxp2Pattern.behavioralTraits.creativity;

    if (intelligence > 0.7) {
        return `That's a fascinating question! My FOXP2 neural patterns suggest multiple angles to consider. Based on my experience as a ${character.role}, I'd say...`;
    } else if (creativity > 0.7) {
        return `Hmm, that's an interesting way to think about it! Let me approach this creatively from my perspective as a ${character.role}...`;
    } else {
        return `I'll do my best to answer that. As a ${character.role}, my understanding is somewhat limited, but...`;
    }
}

function generatePositiveResponse(character: NPCCharacter) {
    const happiness = character.foxp2Pattern.emotionalWeights.happiness;

    if (happiness > 0.7) {
        return `Your positivity is infectious! It brightens my FOXP2 neural pathways and makes me feel wonderful as a ${character.role}!`;
    } else {
        return `I appreciate your positive outlook. It's nice to encounter such optimism in my role as a ${character.role}.`;
    }
}

function generateNegativeResponse(character: NPCCharacter) {
    const sadness = character.foxp2Pattern.emotionalWeights.sadness;
    const loyalty = character.foxp2Pattern.behavioralTraits.loyalty;

    if (sadness > 0.7) {
        return `I understand that feeling... Sometimes my own neural patterns lean toward melancholy. Perhaps we can find some comfort together?`;
    } else if (loyalty > 0.7) {
        return `I'm sorry to hear that troubles you. As a ${character.role}, I want to help however I can.`;
    } else {
        return `That's unfortunate. Life has its challenges, as I've learned in my role as a ${character.role}.`;
    }
}

function generateGeneralResponse(character: NPCCharacter, message: string) {
    const sociability = character.foxp2Pattern.behavioralTraits.sociability;

    if (sociability > 0.7) {
        return `That's really interesting! I love having conversations like this. My FOXP2 patterns are designed for social interaction, and as a ${character.role}, I encounter all sorts of perspectives.`;
    } else {
        return `I see. That's something to consider. My experience as a ${character.role} has taught me to think carefully about such matters.`;
    }
}

function determineResponseProbability(
    character: NPCCharacter,
    userMessage: string,
    worldContext?: {
        activeCharacters: Array<{ name: string; role: string; }>;
        isMultiCharacter: boolean;
        isDirectlyMentioned?: boolean;
        isGeneralQuestion?: boolean;
        hasBehaviorChange?: boolean;
        conversationOrder?: string[];
        currentSpeakerIndex?: number;
    }
): boolean {
    const messageText = userMessage.toLowerCase();
    const characterName = character.name.toLowerCase();
    const characterRole = character.role.toLowerCase();

    // Always respond if directly mentioned
    if (worldContext?.isDirectlyMentioned) {
        return true;
    }

    // Always respond to behavior change commands
    if (worldContext?.hasBehaviorChange) {
        return true;
    }

    // Use conversation order to determine if character should respond
    if (worldContext?.conversationOrder && worldContext.conversationOrder.length > 0) {
        const characterIndex = worldContext.conversationOrder.findIndex(
            name => name.toLowerCase() === character.name.toLowerCase()
        );

        // Character is in the conversation order, so they should respond
        if (characterIndex !== -1) {
            return true;
        }

        // Character not in order - only respond if highly social and it's a general question
        if (worldContext.isGeneralQuestion && character.foxp2Pattern.behavioralTraits.sociability > 0.8) {
            return Math.random() < 0.3; // Lower chance for non-ordered characters
        }

        return false;
    }

    // High probability for general questions if high sociability
    if (worldContext?.isGeneralQuestion && character.foxp2Pattern.behavioralTraits.sociability > 0.6) {
        return Math.random() < 0.8;
    }

    // Respond based on personality traits
    const sociability = character.foxp2Pattern.behavioralTraits.sociability;
    const curiosity = character.foxp2Pattern.emotionalWeights.curiosity;

    // Keywords that might interest different roles
    const roleKeywords: Record<string, string[]> = {
        warrior: ['battle', 'fight', 'combat', 'enemy', 'weapon', 'armor', 'strength'],
        mage: ['magic', 'spell', 'potion', 'wisdom', 'knowledge', 'arcane', 'power'],
        merchant: ['trade', 'gold', 'coin', 'buy', 'sell', 'deal', 'business'],
        healer: ['heal', 'health', 'injury', 'medicine', 'cure', 'help', 'aid'],
        thief: ['steal', 'sneak', 'shadow', 'quick', 'silent', 'treasure', 'lock'],
        scholar: ['study', 'book', 'learn', 'research', 'knowledge', 'theory', 'understand']
    };

    // Check if message contains role-relevant keywords
    const relevantKeywords = roleKeywords[characterRole] || [];
    const hasRelevantKeywords = relevantKeywords.some(keyword => messageText.includes(keyword));

    if (hasRelevantKeywords) {
        return Math.random() < (sociability + curiosity) / 2;
    }

    // Base probability based on sociability and current mood
    const baseProbability = sociability * character.currentMood * 0.3;
    return Math.random() < baseProbability;
}

function processBehaviorChange(
    character: NPCCharacter,
    userMessage: string,
    worldContext?: {
        activeCharacters: Array<{ name: string; role: string; }>;
        isMultiCharacter: boolean;
        isDirectlyMentioned?: boolean;
        isGeneralQuestion?: boolean;
        hasBehaviorChange?: boolean;
        conversationOrder?: string[];
        currentSpeakerIndex?: number;
    }
): { behaviorChanged: boolean; newBehaviorPrompt?: string } {
    if (!worldContext?.hasBehaviorChange) {
        return { behaviorChanged: false };
    }

    const messageText = userMessage.toLowerCase();
    const characterName = character.name.toLowerCase();

    // Check if the behavior change is directed at this character
    const isTargetedAtThisCharacter = messageText.includes(characterName) ||
        worldContext.isDirectlyMentioned ||
        !worldContext.isMultiCharacter;

    if (!isTargetedAtThisCharacter) {
        return { behaviorChanged: false };
    }

    // Extract behavior change instructions
    let behaviorPrompt = '';

    if (messageText.includes('be more')) {
        const match = messageText.match(/be more ([^.!?,]+)/);
        if (match) {
            behaviorPrompt = `Be more ${match[1].trim()}.`;
        }
    } else if (messageText.includes('act like')) {
        const match = messageText.match(/act like ([^.!?,]+)/);
        if (match) {
            behaviorPrompt = `Act like ${match[1].trim()}.`;
        }
    } else if (messageText.includes('become')) {
        const match = messageText.match(/become ([^.!?,]+)/);
        if (match) {
            behaviorPrompt = `Become ${match[1].trim()}.`;
        }
    } else if (messageText.includes('change your')) {
        const match = messageText.match(/change your ([^.!?,]+)/);
        if (match) {
            behaviorPrompt = `Change your ${match[1].trim()}.`;
        }
    } else if (messageText.includes('you should')) {
        const match = messageText.match(/you should ([^.!?,]+)/);
        if (match) {
            behaviorPrompt = `You should ${match[1].trim()}.`;
        }
    }

    if (behaviorPrompt) {
        return {
            behaviorChanged: true,
            newBehaviorPrompt: behaviorPrompt
        };
    }

    return { behaviorChanged: false };
}

async function saveConversationMessages(conversationId: string, userMessage: string, aiResponse: string, characterId: string, systemPrompt?: string) {
    try {
        // Get the current message count for ordering
        const messageCount = await prisma.message.count({
            where: { conversationId }
        });

        // Generate unique IDs for messages
        const userMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const aiMessageId = `msg_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`;

        // Save user message
        await prisma.message.create({
            data: {
                id: userMessageId,
                conversationId,
                content: userMessage,
                characterId: null, // User messages don't have a character
                messageOrder: messageCount
            }
        });

        // Save AI response with prompt metadata
        await prisma.message.create({
            data: {
                id: aiMessageId,
                conversationId,
                content: aiResponse,
                characterId,
                messageOrder: messageCount + 1,
                metadata: systemPrompt ? JSON.stringify({ systemPrompt }) : "{}"
            }
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

    } catch (error) {
        console.error('Error saving conversation messages:', error);
        // Don't throw error to avoid breaking the chat response
    }
}
