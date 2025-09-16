import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Chat message schema
const ChatMessageSchema = z.object({
    message: z.string().min(1, 'Message is required'),
    contextId: z.string().optional(), // For conversation continuity
});

// Mock AI response function (replace with actual AI integration)
function generateAIResponse(character: any, userMessage: string, context?: any): string {
    const responses = [
        `As ${character.name}, I find your message quite intriguing. Let me think about this...`,
        `${character.name} here! That's an interesting perspective. In my role as a ${character.role}, I'd say...`,
        `*${character.name} adjusts thoughtfully* You know, from my experience as a ${character.role}...`,
        `That reminds me of something! As ${character.name}, I've encountered similar situations...`,
        `*${character.name} nods with understanding* I can relate to that, especially in my work as a ${character.role}...`
    ];

    // Simple mood-based response modification
    const moodLevel = character.currentMood;
    let selectedResponse = responses[Math.floor(Math.random() * responses.length)];

    if (moodLevel > 0.7) {
        selectedResponse += " I'm feeling particularly positive about this!";
    } else if (moodLevel < 0.3) {
        selectedResponse += " Though I must admit, I'm feeling a bit contemplative today.";
    }

    return selectedResponse;
}

// POST - Send message to specific character
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate input
        const { message, contextId } = ChatMessageSchema.parse(body);

        // Get character
        const character = await prisma.character.findUnique({
            where: { id },
            include: {
                conversations: {
                    where: { conversation: { isActive: true } },
                    include: {
                        conversation: {
                            include: {
                                messages: {
                                    orderBy: { timestamp: 'desc' },
                                    take: 10
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!character) {
            return NextResponse.json(
                { error: 'Character not found' },
                { status: 404 }
            );
        }

        if (!character.isActive) {
            return NextResponse.json(
                { error: 'Character is currently inactive' },
                { status: 400 }
            );
        }

        // Find or create individual conversation
        let conversation = await prisma.conversation.findFirst({
            where: {
                isActive: true,
                participants: {
                    some: { characterId: id }
                }
            },
            include: {
                participants: true
            }
        });

        // Check if it's actually an individual conversation (only this character)
        if (conversation && conversation.participants.length > 1) {
            conversation = null; // Look for a different conversation or create new one
        }

        if (!conversation) {
            // Create new individual conversation
            conversation = await prisma.conversation.create({
                data: {
                    title: `Chat with ${character.name}`,
                    participants: {
                        create: {
                            characterId: id,
                            joinedAt: new Date()
                        }
                    }
                }
            });
        }

        // Create user message
        const userMessageRecord = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                content: message,
                type: 'chat',
                messageOrder: await getNextMessageOrder(conversation.id)
            }
        });

        // Generate AI response
        const characterData = {
            ...character,
            foxp2Pattern: typeof character.foxp2Pattern === 'string'
                ? JSON.parse(character.foxp2Pattern)
                : character.foxp2Pattern
        };

        const aiResponse = generateAIResponse(characterData, message);

        // Create character response
        const characterMessageRecord = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                characterId: id,
                content: aiResponse,
                type: 'chat',
                messageOrder: await getNextMessageOrder(conversation.id)
            }
        });

        // Update character's last activity and mood (simulate activity)
        const moodChange = (Math.random() - 0.5) * 0.1; // Small mood fluctuation
        const newMood = Math.max(0, Math.min(1, character.currentMood + moodChange));

        await prisma.character.update({
            where: { id },
            data: {
                currentMood: newMood,
                updatedAt: new Date()
            }
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({
            conversationId: conversation.id,
            userMessage: {
                id: userMessageRecord.id,
                content: userMessageRecord.content,
                timestamp: userMessageRecord.createdAt,
                sender: 'user'
            },
            characterResponse: {
                id: characterMessageRecord.id,
                content: characterMessageRecord.content,
                timestamp: characterMessageRecord.createdAt,
                sender: character.name,
                characterId: id,
                mood: newMood
            },
            character: {
                id: character.id,
                name: character.name,
                role: character.role,
                currentMood: newMood,
                status: 'active'
            }
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input data', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error in character chat:', error);
        return NextResponse.json(
            { error: 'Failed to process chat message' },
            { status: 500 }
        );
    }
}

// GET - Get chat history with specific character
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Get character
        const character = await prisma.character.findUnique({
            where: { id }
        });

        if (!character) {
            return NextResponse.json(
                { error: 'Character not found' },
                { status: 404 }
            );
        }

        // Find individual conversation with character
        const conversation = await prisma.conversation.findFirst({
            where: {
                participants: {
                    some: { characterId: id }
                },
                isActive: true
            },
            include: {
                messages: {
                    include: {
                        character: {
                            select: { id: true, name: true, role: true }
                        }
                    },
                    orderBy: { messageOrder: 'asc' },
                    skip: offset,
                    take: limit
                }
            }
        });

        if (!conversation) {
            return NextResponse.json({
                conversationId: null,
                messages: [],
                character: {
                    id: character.id,
                    name: character.name,
                    role: character.role,
                    currentMood: character.currentMood,
                    status: character.isActive ? 'active' : 'inactive'
                },
                hasMore: false
            });
        }

        const messages = conversation.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            timestamp: msg.timestamp,
            sender: msg.senderType === 'USER' ? 'user' : msg.character?.name || 'unknown',
            senderType: msg.senderType,
            characterId: msg.characterId
        }));

        return NextResponse.json({
            conversationId: conversation.id,
            messages,
            character: {
                id: character.id,
                name: character.name,
                role: character.role,
                currentMood: character.currentMood,
                status: character.isActive ? 'active' : 'inactive'
            },
            hasMore: conversation.messages.length === limit
        });

    } catch (error) {
        console.error('Error fetching chat history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chat history' },
            { status: 500 }
        );
    }
}

// Helper function to get next message order
async function getNextMessageOrder(conversationId: string): Promise<number> {
    const lastMessage = await prisma.message.findFirst({
        where: { conversationId },
        orderBy: { messageOrder: 'desc' }
    });

    return (lastMessage?.messageOrder || 0) + 1;
}
