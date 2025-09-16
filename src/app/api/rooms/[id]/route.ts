import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Room update schema
const UpdateRoomSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    isPrivate: z.boolean().optional(),
    isActive: z.boolean().optional(),
    characterIds: z.array(z.string()).max(10).optional()
});

// Message schema for room
const RoomMessageSchema = z.object({
    message: z.string().min(1, 'Message is required'),
    characterId: z.string().optional(), // If character is speaking
    triggerResponses: z.boolean().default(true) // Whether to trigger AI responses
});

// Mock AI response function for characters in room
function generateCharacterResponses(characters: any[], userMessage: string, speakingCharacterId?: string): Array<{ character: any, response: string }> {
    const responses: Array<{ character: any, response: string }> = [];

    // Randomly select 1-3 characters to respond (excluding the speaking character)
    const availableCharacters = characters.filter(c =>
        c.id !== speakingCharacterId &&
        c.isActive &&
        Math.random() > 0.4 // 60% chance each character responds
    );

    // Limit to maximum 3 responses to avoid spam
    const respondingCharacters = availableCharacters.slice(0, 3);

    for (const character of respondingCharacters) {
        const responseTemplates = [
            `*${character.name} nods thoughtfully* That's interesting! As a ${character.role}, I've seen...`,
            `${character.name} here! I have to agree with that perspective...`,
            `*${character.name} chimes in* You know, from my experience...`,
            `That reminds me of something! *${character.name} says excitedly*`,
            `${character.name}: I see what you mean, but have you considered...`
        ];

        let response = responseTemplates[Math.floor(Math.random() * responseTemplates.length)];

        // Mood-based modifications
        if (character.currentMood > 0.7) {
            response += " I'm feeling quite optimistic about this!";
        } else if (character.currentMood < 0.3) {
            response += " Though I'm feeling a bit contemplative today.";
        }

        responses.push({ character, response });
    }

    return responses;
}

// GET - Get specific room details and messages
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const messageLimit = parseInt(searchParams.get('messageLimit') || '50');
        const messageOffset = parseInt(searchParams.get('messageOffset') || '0');

        const room = await prisma.conversation.findUnique({
            where: { id },
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
                                imageUrl: true,
                                personality: true
                            }
                        }
                    }
                },
                messages: {
                    include: {
                        character: {
                            select: { id: true, name: true, role: true }
                        }
                    },
                    orderBy: { messageOrder: 'asc' },
                    skip: messageOffset,
                    take: messageLimit
                },
                _count: {
                    select: { messages: true }
                }
            }
        });

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        const messages = room.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            timestamp: msg.createdAt,
            sender: msg.senderType === 'USER' ? 'user' :
                msg.senderType === 'SYSTEM' ? 'system' :
                    msg.character?.name || 'unknown',
            senderType: msg.senderType,
            characterId: msg.characterId,
            messageOrder: msg.messageOrder
        }));

        return NextResponse.json({
            id: room.id,
            name: room.title,
            description: room.description,
            isActive: room.isActive,
            isPrivate: room.isPrivate || false,
            createdAt: room.createdAt,
            updatedAt: room.updatedAt,
            participants: room.participants.map((p: any) => ({
                id: p.character.id,
                name: p.character.name,
                role: p.character.role,
                mood: p.character.currentMood,
                isActive: p.character.isActive,
                imageUrl: p.character.imageUrl,
                personality: p.character.personality,
                joinedAt: p.joinedAt
            })),
            messages,
            messageCount: room._count.messages,
            hasMoreMessages: room.messages.length === messageLimit
        });

    } catch (error) {
        console.error('Error fetching room:', error);
        return NextResponse.json(
            { error: 'Failed to fetch room' },
            { status: 500 }
        );
    }
}

// PUT - Update room details
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const updateData = UpdateRoomSchema.parse(body);

        // Check if room exists
        const existingRoom = await prisma.conversation.findUnique({
            where: { id },
            include: { participants: true }
        });

        if (!existingRoom) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        // Handle character updates if provided
        if (updateData.characterIds) {
            // Verify all characters exist and are active
            const characters = await prisma.character.findMany({
                where: {
                    id: { in: updateData.characterIds },
                    isActive: true
                }
            });

            if (characters.length !== updateData.characterIds.length) {
                const foundIds = characters.map((c: any) => c.id);
                const missingIds = updateData.characterIds.filter(id => !foundIds.includes(id));
                return NextResponse.json(
                    { error: 'Some characters not found or inactive', missingIds },
                    { status: 400 }
                );
            }

            // Remove existing participants and add new ones
            await prisma.conversationParticipant.deleteMany({
                where: { conversationId: id }
            });

            await prisma.conversationParticipant.createMany({
                data: updateData.characterIds.map(characterId => ({
                    conversationId: id,
                    characterId,
                    joinedAt: new Date()
                }))
            });
        }

        // Update room details
        const updatedRoom = await prisma.conversation.update({
            where: { id },
            data: {
                title: updateData.name,
                description: updateData.description,
                isPrivate: updateData.isPrivate,
                isActive: updateData.isActive,
                updatedAt: new Date()
            },
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
                                imageUrl: true
                            }
                        }
                    }
                },
                _count: {
                    select: { messages: true }
                }
            }
        });

        return NextResponse.json({
            id: updatedRoom.id,
            name: updatedRoom.title,
            description: updatedRoom.description,
            isActive: updatedRoom.isActive,
            isPrivate: updatedRoom.isPrivate || false,
            createdAt: updatedRoom.createdAt,
            updatedAt: updatedRoom.updatedAt,
            participants: updatedRoom.participants.map((p: any) => ({
                id: p.character.id,
                name: p.character.name,
                role: p.character.role,
                mood: p.character.currentMood,
                isActive: p.character.isActive,
                imageUrl: p.character.imageUrl,
                joinedAt: p.joinedAt
            })),
            messageCount: updatedRoom._count.messages
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input data', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error updating room:', error);
        return NextResponse.json(
            { error: 'Failed to update room' },
            { status: 500 }
        );
    }
}

// DELETE - Delete room
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Check if room exists
        const room = await prisma.conversation.findUnique({
            where: { id }
        });

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        // Delete room and all related data (participants, messages)
        // Prisma will handle cascade deletes based on schema
        await prisma.conversation.delete({
            where: { id }
        });

        return NextResponse.json({
            message: 'Room deleted successfully',
            deletedRoomId: id
        });

    } catch (error) {
        console.error('Error deleting room:', error);
        return NextResponse.json(
            { error: 'Failed to delete room' },
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
