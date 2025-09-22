import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../../generated/prisma';

const prisma = new PrismaClient();

type Params = {
    id: string;
};

// GET /api/rooms/[id]/chat - Get room messages
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const resolvedParams = await params;
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const before = searchParams.get('before'); // ISO timestamp
        const after = searchParams.get('after'); // ISO timestamp

        // Check if room exists
        const room = await prisma.room.findUnique({
            where: { id: resolvedParams.id }
        });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // Build where clause for timestamp filtering
        const whereClause: any = { roomId: resolvedParams.id };
        if (before) {
            whereClause.timestamp = { ...whereClause.timestamp, lt: new Date(before) };
        }
        if (after) {
            whereClause.timestamp = { ...whereClause.timestamp, gt: new Date(after) };
        }

        const messages = await prisma.roomMessage.findMany({
            where: whereClause,
            include: {
                character: true
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: limit,
            skip: offset
        });

        const transformedMessages = messages.reverse().map(message => ({
            id: message.id,
            content: message.content,
            characterId: message.characterId,
            character: (message as any).character ? {
                id: (message as any).character.id,
                name: (message as any).character.name,
                role: (message as any).character.role,
                species: (message as any).character.species
            } : null,
            type: message.type,
            metadata: JSON.parse(message.metadata),
            timestamp: message.timestamp.toISOString(),
            messageOrder: message.messageOrder
        }));

        return NextResponse.json({
            roomId: resolvedParams.id,
            messages: transformedMessages,
            hasMore: messages.length === limit
        });
    } catch (error) {
        console.error('Error loading room messages:', error);
        return NextResponse.json({ error: 'Failed to load room messages' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// POST /api/rooms/[id]/chat - Send message to room
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const resolvedParams = await params;
    try {
        const data = await request.json();

        if (!data.content) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
        }

        // Check if room exists and is active
        const room = await prisma.room.findUnique({
            where: { id: resolvedParams.id },
            include: {
                members: {
                    include: {
                        character: true
                    }
                }
            }
        });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        if (!room.isActive) {
            return NextResponse.json({ error: 'Room is not active' }, { status: 400 });
        }

        // If characterId is provided, verify the character is in the room
        if (data.characterId) {
            const member = room.members.find(m => m.characterId === data.characterId);
            if (!member) {
                return NextResponse.json({
                    error: 'Character is not a member of this room'
                }, { status: 400 });
            }

            if (!member.isActive) {
                return NextResponse.json({
                    error: 'Character membership is not active'
                }, { status: 400 });
            }
        }

        // Get the next message order number
        const lastMessage = await prisma.roomMessage.findFirst({
            where: { roomId: resolvedParams.id },
            orderBy: { messageOrder: 'desc' }
        });

        const nextOrder = (lastMessage?.messageOrder || 0) + 1;

        // Create the room message
        const message = await prisma.roomMessage.create({
            data: {
                id: `roommsg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                roomId: resolvedParams.id,
                characterId: data.characterId || null,
                content: data.content,
                type: data.type || 'text',
                metadata: JSON.stringify(data.metadata || {}),
                timestamp: new Date(),
                messageOrder: nextOrder
            },
            include: {
                character: true
            }
        });

        // Update last seen for the character member if applicable
        if (data.characterId) {
            await prisma.roomMember.updateMany({
                where: {
                    roomId: resolvedParams.id,
                    characterId: data.characterId
                },
                data: {
                    lastSeen: new Date()
                }
            });
        }

        // Update room's updatedAt timestamp
        await prisma.room.update({
            where: { id: resolvedParams.id },
            data: { updatedAt: new Date() }
        });

        const transformedMessage = {
            id: message.id,
            content: message.content,
            characterId: message.characterId,
            character: (message as any).character ? {
                id: (message as any).character.id,
                name: (message as any).character.name,
                role: (message as any).character.role,
                species: (message as any).character.species
            } : null,
            type: message.type,
            metadata: JSON.parse(message.metadata),
            timestamp: message.timestamp.toISOString(),
            messageOrder: message.messageOrder
        };

        return NextResponse.json({
            success: true,
            message: transformedMessage,
            roomMembers: room.members.map(member => ({
                characterId: member.characterId,
                character: {
                    id: (member as any).character.id,
                    name: (member as any).character.name,
                    role: (member as any).character.role
                },
                isActive: member.isActive
            }))
        });
    } catch (error) {
        console.error('Error sending room message:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
