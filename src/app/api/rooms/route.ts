import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Room creation schema
const CreateRoomSchema = z.object({
    name: z.string().min(1, 'Room name is required').max(100, 'Room name too long'),
    characterIds: z.array(z.string()).min(1, 'At least one character is required').max(10, 'Maximum 10 characters per room'),
    description: z.string().optional(),
    isPrivate: z.boolean().default(false)
});

// Room update schema
const UpdateRoomSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    isPrivate: z.boolean().optional(),
    isActive: z.boolean().optional(),
    characterIds: z.array(z.string()).max(10).optional()
});

// Message schema
const RoomMessageSchema = z.object({
    message: z.string().min(1, 'Message is required'),
    characterId: z.string().optional() // If character is speaking
});

// GET - List all rooms
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const isActive = searchParams.get('active') === 'true' ? true :
            searchParams.get('active') === 'false' ? false : undefined;

        const rooms = await prisma.conversation.findMany({
            where: {
                isActive,
                // Only get rooms with multiple participants
                participants: {
                    some: {}
                }
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
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 1,
                    include: {
                        character: {
                            select: { id: true, name: true }
                        }
                    }
                },
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: { updatedAt: 'desc' },
            skip: offset,
            take: limit
        });

        const formattedRooms = rooms.map((room: any) => ({
            id: room.id,
            name: room.title,
            isActive: room.isActive,
            createdAt: room.createdAt,
            updatedAt: room.updatedAt,
            participants: room.participants.map((p: any) => ({
                id: p.character.id,
                name: p.character.name,
                role: p.character.role,
                mood: p.character.currentMood,
                isActive: p.character.isActive,
                imageUrl: p.character.imageUrl,
                joinedAt: p.joinedAt
            })),
            lastMessage: room.messages[0] ? {
                id: room.messages[0].id,
                content: room.messages[0].content,
                timestamp: room.messages[0].createdAt,
                sender: room.messages[0].senderType === 'USER' ? 'user' : room.messages[0].character?.name
            } : null,
            messageCount: room._count.messages
        }));

        return NextResponse.json({
            rooms: formattedRooms,
            hasMore: rooms.length === limit
        });

    } catch (error) {
        console.error('Error fetching rooms:', error);
        return NextResponse.json(
            { error: 'Failed to fetch rooms' },
            { status: 500 }
        );
    }
}

// POST - Create new room
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, characterIds, description, isPrivate } = CreateRoomSchema.parse(body);

        // Verify all characters exist and are active
        const characters = await prisma.character.findMany({
            where: {
                id: { in: characterIds },
                isActive: true
            }
        });

        if (characters.length !== characterIds.length) {
            const foundIds = characters.map((c: any) => c.id);
            const missingIds = characterIds.filter(id => !foundIds.includes(id));
            return NextResponse.json(
                { error: 'Some characters not found or inactive', missingIds },
                { status: 400 }
            );
        }

        // Create room (conversation)
        const room = await prisma.conversation.create({
            data: {
                title: name,
                participants: {
                    create: characters.map((character: any) => ({
                        characterId: character.id,
                        joinedAt: new Date()
                    }))
                }
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
                }
            }
        });

        // Create welcome message
        await prisma.message.create({
            data: {
                conversationId: room.id,
                content: `Welcome to ${name}! This room includes: ${characters.map((c: any) => c.name).join(', ')}.`,
                type: 'system',
                messageOrder: 1
            }
        });

        return NextResponse.json({
            id: room.id,
            name: room.title,
            description: room.description,
            isActive: room.isActive,
            isPrivate: room.isPrivate,
            createdAt: room.createdAt,
            participants: room.participants.map((p: any) => ({
                id: p.character.id,
                name: p.character.name,
                role: p.character.role,
                mood: p.character.currentMood,
                isActive: p.character.isActive,
                imageUrl: p.character.imageUrl,
                joinedAt: p.joinedAt
            })),
            messageCount: 1
        }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input data', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error creating room:', error);
        return NextResponse.json(
            { error: 'Failed to create room' },
            { status: 500 }
        );
    }
}
