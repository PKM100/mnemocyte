import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Message schema for room chat
const RoomChatSchema = z.object({
    message: z.string().min(1, 'Message is required'),
    characterId: z.string().optional(), // If a character is speaking
    triggerResponses: z.boolean().default(true) // Whether to trigger AI responses
});

// Mock AI response function for characters in room
function generateCharacterResponses(characters: any[], userMessage: string, speakingCharacterId?: string): Array<{ character: any, response: string, delay: number }> {
    const responses: Array<{ character: any, response: string, delay: number }> = [];

    // Filter available characters (excluding the speaking character)
    const availableCharacters = characters.filter(c =>
        c.id !== speakingCharacterId &&
        c.isActive
    );

    // Randomly select 1-3 characters to respond based on their mood and personality
    const respondingCharacters = availableCharacters.filter(c => {
        // Higher mood = more likely to respond
        const responseChance = 0.3 + (c.currentMood * 0.4); // 30-70% chance
        return Math.random() < responseChance;
    }).slice(0, 3); // Limit to 3 responses

    for (let i = 0; i < respondingCharacters.length; i++) {
        const character = respondingCharacters[i];

        const responseTemplates = [
            `*${character.name} nods thoughtfully* That's quite interesting! As a ${character.role}, I've encountered...`,
            `${character.name}: I find that perspective fascinating. From my experience...`,
            `*${character.name} leans forward* You know, that reminds me of when I was working as a ${character.role}...`,
            `${character.name} chimes in: "I have to say, that's a unique way of looking at it..."`,
            `*${character.name} smiles* That's exactly what I was thinking! In my role as a ${character.role}...`,
            `${character.name}: "Interesting point! I've been pondering something similar myself..."`
        ];

        let response = responseTemplates[Math.floor(Math.random() * responseTemplates.length)];

        // Mood-based response modifications
        if (character.currentMood > 0.8) {
            response += " I'm feeling incredibly optimistic about this direction!";
        } else if (character.currentMood > 0.6) {
            response += " This has me feeling quite positive!";
        } else if (character.currentMood < 0.3) {
            response += " Though I must admit, I'm feeling rather contemplative today.";
        } else if (character.currentMood < 0.5) {
            response += " I'm approaching this with some caution, but it's intriguing.";
        }

        // Add personality-based elements if available
        if (character.personality) {
            try {
                const personality = typeof character.personality === 'string'
                    ? JSON.parse(character.personality)
                    : character.personality;

                if (personality.traits?.includes('curious')) {
                    response += " This raises so many questions for me!";
                } else if (personality.traits?.includes('analytical')) {
                    response += " Let me think through the implications of this...";
                }
            } catch (e) {
                // Ignore personality parsing errors
            }
        }

        // Stagger responses to feel more natural (0-10 seconds delay)
        const delay = i * 2000 + Math.random() * 3000; // 0-5s, 2-7s, 4-9s

        responses.push({ character, response, delay });
    }

    return responses;
}

// POST - Send message to room
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id: roomId } = await params;
        const body = await request.json();
        const { message, characterId, triggerResponses } = RoomChatSchema.parse(body);

        // Get room with participants
        const room = await prisma.conversation.findUnique({
            where: { id: roomId },
            include: {
                participants: {
                    include: {
                        character: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                                currentMood: true,
                                isActive: true,
                                description: true,
                                imageUrl: true
                            }
                        }
                    }
                }
            }
        });

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        if (!room.isActive) {
            return NextResponse.json(
                { error: 'Room is not active' },
                { status: 400 }
            );
        }

        // If characterId is provided, verify the character is in the room
        if (characterId) {
            const characterInRoom = room.participants.find((p: any) => p.character.id === characterId);
            if (!characterInRoom) {
                return NextResponse.json(
                    { error: 'Character not found in this room' },
                    { status: 400 }
                );
            }
            if (!characterInRoom.character.isActive) {
                return NextResponse.json(
                    { error: 'Character is not active' },
                    { status: 400 }
                );
            }
        }

        // Get next message order
        const messageOrder = await getNextMessageOrder(roomId);

        // Create the message
        const newMessage = await prisma.message.create({
            data: {
                conversationId: roomId,
                characterId: characterId || null,
                content: message,
                type: 'chat',
                messageOrder
            },
            include: {
                character: {
                    select: { id: true, name: true, role: true }
                }
            }
        });

        // Update room timestamp
        await prisma.conversation.update({
            where: { id: roomId },
            data: { updatedAt: new Date() }
        });

        const response: any = {
            message: {
                id: newMessage.id,
                content: newMessage.content,
                timestamp: newMessage.timestamp,
                sender: characterId ? newMessage.character?.name : 'user',
                type: newMessage.type,
                characterId: newMessage.characterId,
                messageOrder: newMessage.messageOrder
            },
            roomId: roomId
        };

        // Generate AI responses if requested and not from a character
        if (triggerResponses && !characterId) {
            const characters = room.participants.map((p: any) => p.character);
            const aiResponses = generateCharacterResponses(characters, message);

            if (aiResponses.length > 0) {
                const characterResponses = [];

                for (const aiResponse of aiResponses) {
                    // Create character response with slight delay
                    const characterMessage = await prisma.message.create({
                        data: {
                            conversationId: roomId,
                            characterId: aiResponse.character.id,
                            content: aiResponse.response,
                            type: 'chat',
                            messageOrder: await getNextMessageOrder(roomId)
                        },
                        include: {
                            character: {
                                select: { id: true, name: true, role: true }
                            }
                        }
                    });

                    // Update character mood slightly
                    const moodChange = (Math.random() - 0.5) * 0.1; // Small fluctuation
                    const newMood = Math.max(0, Math.min(1, aiResponse.character.currentMood + moodChange));

                    await prisma.character.update({
                        where: { id: aiResponse.character.id },
                        data: {
                            currentMood: newMood,
                            updatedAt: new Date()
                        }
                    });

                    characterResponses.push({
                        id: characterMessage.id,
                        content: characterMessage.content,
                        timestamp: characterMessage.createdAt,
                        sender: characterMessage.character?.name,
                        senderType: 'CHARACTER',
                        characterId: characterMessage.characterId,
                        messageOrder: characterMessage.messageOrder,
                        delay: aiResponse.delay,
                        mood: newMood
                    });
                }

                response.characterResponses = characterResponses;
            }
        }

        return NextResponse.json(response);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input data', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error sending room message:', error);
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        );
    }
}

// GET - Get room chat history
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id: roomId } = params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const since = searchParams.get('since'); // ISO timestamp for real-time updates

        let whereClause: any = { conversationId: roomId };

        if (since) {
            whereClause.createdAt = {
                gt: new Date(since)
            };
        }

        const messages = await prisma.message.findMany({
            where: whereClause,
            include: {
                character: {
                    select: { id: true, name: true, role: true, imageUrl: true }
                }
            },
            orderBy: { messageOrder: 'asc' },
            skip: offset,
            take: limit
        });

        const formattedMessages = messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            timestamp: msg.createdAt,
            sender: msg.senderType === 'USER' ? 'user' :
                msg.senderType === 'SYSTEM' ? 'system' :
                    msg.character?.name || 'unknown',
            senderType: msg.senderType,
            characterId: msg.characterId,
            characterImageUrl: msg.character?.imageUrl,
            messageOrder: msg.messageOrder
        }));

        return NextResponse.json({
            messages: formattedMessages,
            hasMore: messages.length === limit,
            roomId: roomId
        });

    } catch (error) {
        console.error('Error fetching room chat history:', error);
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
