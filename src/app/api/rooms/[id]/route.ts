import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma';

const prisma = new PrismaClient();

type Params = Promise<{
    id: string;
}>;

// GET /api/rooms/[id] - Get room details
export async function GET(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const includeMembers = searchParams.get('includeMembers') !== 'false'; // Default to true
        const includeMessages = searchParams.get('includeMessages') === 'true';
        const messageLimit = parseInt(searchParams.get('messageLimit') || '50');

        const room = await prisma.room.findUnique({
            where: { id },
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
                    take: messageLimit
                } : false,
                _count: {
                    select: {
                        members: true,
                        messages: true
                    }
                }
            }
        });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        const transformedRoom = {
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
                    role: (member as any).character.role,
                    species: (member as any).character.species,
                    isActive: (member as any).character.isActive
                } : null,
                joinedAt: member.joinedAt.toISOString(),
                isActive: member.isActive,
                role: member.role,
                lastSeen: member.lastSeen.toISOString()
            })) : undefined,
            messages: includeMessages && room.messages ? room.messages.reverse().map(message => ({
                id: message.id,
                content: message.content,
                characterId: message.characterId,
                character: (message as any).character ? {
                    id: (message as any).character.id,
                    name: (message as any).character.name,
                    role: (message as any).character.role
                } : null,
                type: message.type,
                metadata: JSON.parse(message.metadata),
                timestamp: message.timestamp.toISOString(),
                messageOrder: message.messageOrder
            })) : undefined
        };

        return NextResponse.json(transformedRoom);
    } catch (error) {
        console.error('Error loading room:', error);
        return NextResponse.json({ error: 'Failed to load room' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// PUT /api/rooms/[id] - Update room
export async function PUT(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { id } = await params;
        const data = await request.json();

        const existingRoom = await prisma.room.findUnique({
            where: { id }
        });

        if (!existingRoom) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        const updateData: any = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.maxMembers !== undefined) updateData.maxMembers = data.maxMembers;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.metadata !== undefined) updateData.metadata = JSON.stringify(data.metadata);

        const room = await prisma.room.update({
            where: { id },
            data: updateData,
            include: {
                _count: {
                    select: {
                        members: true,
                        messages: true
                    }
                }
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
                updatedAt: room.updatedAt.toISOString(),
                memberCount: room._count.members,
                messageCount: room._count.messages
            }
        });
    } catch (error) {
        console.error('Error updating room:', error);
        return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// DELETE /api/rooms/[id] - Delete room
export async function DELETE(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { id } = await params;
        const existingRoom = await prisma.room.findUnique({
            where: { id }
        });

        if (!existingRoom) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // Delete in order due to foreign key constraints
        await prisma.roomMessage.deleteMany({
            where: { roomId: id }
        });

        await prisma.roomMember.deleteMany({
            where: { roomId: id }
        });

        await prisma.room.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting room:', error);
        return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
