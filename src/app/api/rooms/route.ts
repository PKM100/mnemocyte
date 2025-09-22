import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/db";


// GET /api/rooms - List all rooms
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const includeMembers = searchParams.get('includeMembers') === 'true';
        const includeMessages = searchParams.get('includeMessages') === 'true';
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        const rooms = await prisma.room.findMany({
            include: {
                members: includeMembers ? {
                    include: {
                        character: true
                    }
                } : false,
                messages: includeMessages ? {
                    include: {
                        character: true
                    },
                    orderBy: {
                        timestamp: 'desc'
                    },
                    take: 10 // Last 10 messages per room
                } : false,
                _count: {
                    select: {
                        members: true,
                        messages: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: limit,
            skip: offset
        });

        const transformedRooms = rooms.map(room => ({
            id: room.id,
            name: room.name,
            description: room.description,
            maxMembers: room.maxMembers,
            isActive: room.isActive,
            createdBy: room.createdBy,
            metadata: JSON.parse(room.metadata),
            createdAt: room.createdAt.toISOString(),
            updatedAt: room.updatedAt.toISOString(),
            memberCount: room._count.members,
            messageCount: room._count.messages,
            members: includeMembers && room.members ? room.members.map(member => ({
                id: member.id,
                characterId: member.characterId,
                character: (member as any).character ? {
                    id: (member as any).character.id,
                    name: (member as any).character.name,
                    role: (member as any).character.role
                } : null,
                joinedAt: member.joinedAt.toISOString(),
                isActive: member.isActive,
                role: member.role,
                lastSeen: member.lastSeen.toISOString()
            })) : undefined,
            recentMessages: includeMessages && room.messages ? room.messages.map(message => ({
                id: message.id,
                content: message.content,
                characterId: message.characterId,
                character: (message as any).character ? {
                    id: (message as any).character.id,
                    name: (message as any).character.name,
                    role: (message as any).character.role
                } : null,
                type: message.type,
                timestamp: message.timestamp.toISOString()
            })) : undefined
        }));

        return NextResponse.json(transformedRooms);
    } catch (error) {
        console.error('Error loading rooms:', error);
        return NextResponse.json({ error: 'Failed to load rooms' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// POST /api/rooms - Create a new room
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        if (!data.name) {
            return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
        }

        const room = await prisma.room.create({
            data: {
                id: data.id || `room_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                name: data.name,
                description: data.description || null,
                maxMembers: data.maxMembers || 10,
                createdBy: data.createdBy || null,
                metadata: JSON.stringify(data.metadata || {}),
                isActive: data.isActive !== undefined ? data.isActive : true
            }
        });

        return NextResponse.json({
            success: true,
            room: {
                id: room.id,
                name: room.name,
                description: room.description,
                maxMembers: room.maxMembers,
                isActive: room.isActive,
                createdBy: room.createdBy,
                metadata: JSON.parse(room.metadata),
                createdAt: room.createdAt.toISOString(),
                updatedAt: room.updatedAt.toISOString()
            }
        });
    } catch (error) {
        console.error('Error creating room:', error);
        return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
