import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/db";


type Params = {
    id: string;
};

// GET /api/rooms/[id]/members - Get room members
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const resolvedParams = await params;
    try {
        const room = await prisma.room.findUnique({
            where: { id: resolvedParams.id }
        });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        const members = await prisma.roomMember.findMany({
            where: { roomId: resolvedParams.id },
            include: {
                character: true
            },
            orderBy: {
                joinedAt: 'asc'
            }
        });

        const transformedMembers = members.map(member => ({
            id: member.id,
            characterId: member.characterId,
            character: (member as any).character ? {
                id: (member as any).character.id,
                name: (member as any).character.name,
                role: (member as any).character.role,
                species: (member as any).character.species,
                description: (member as any).character.description,
                isActive: (member as any).character.isActive
            } : null,
            joinedAt: member.joinedAt.toISOString(),
            lastSeen: member.lastSeen.toISOString(),
            isActive: member.isActive,
            role: member.role
        }));

        return NextResponse.json({
            roomId: resolvedParams.id,
            members: transformedMembers,
            totalMembers: transformedMembers.length
        });
    } catch (error) {
        console.error('Error loading room members:', error);
        return NextResponse.json({ error: 'Failed to load room members' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// POST /api/rooms/[id]/members - Add character to room
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const resolvedParams = await params;
    try {
        const data = await request.json();

        if (!data.characterId) {
            return NextResponse.json({ error: 'Character ID is required' }, { status: 400 });
        }

        // Check if room exists
        const room = await prisma.room.findUnique({
            where: { id: resolvedParams.id },
            include: {
                _count: {
                    select: { members: true }
                }
            }
        });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        if (!room.isActive) {
            return NextResponse.json({ error: 'Room is not active' }, { status: 400 });
        }

        // Check if room is full
        if (room._count.members >= room.maxMembers) {
            return NextResponse.json({
                error: `Room is full (max ${room.maxMembers} members)`
            }, { status: 400 });
        }

        // Check if character exists
        const character = await prisma.character.findUnique({
            where: { id: data.characterId }
        });

        if (!character) {
            return NextResponse.json({ error: 'Character not found' }, { status: 404 });
        }

        if (!character.isActive) {
            return NextResponse.json({ error: 'Character is not active' }, { status: 400 });
        }

        // Check if character is already in room
        const existingMember = await prisma.roomMember.findFirst({
            where: {
                roomId: resolvedParams.id,
                characterId: data.characterId
            }
        });

        if (existingMember) {
            return NextResponse.json({ error: 'Character is already in this room' }, { status: 400 });
        }

        // Add character to room
        const member = await prisma.roomMember.create({
            data: {
                id: `member_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                roomId: resolvedParams.id,
                characterId: data.characterId,
                role: data.role || 'member',
                isActive: true,
                joinedAt: new Date(),
                lastSeen: new Date()
            },
            include: {
                character: true
            }
        });

        return NextResponse.json({
            success: true,
            member: {
                id: member.id,
                characterId: member.characterId,
                character: {
                    id: (member as any).character.id,
                    name: (member as any).character.name,
                    role: (member as any).character.role,
                    species: (member as any).character.species
                },
                joinedAt: member.joinedAt.toISOString(),
                lastSeen: member.lastSeen.toISOString(),
                isActive: member.isActive,
                role: member.role
            }
        });
    } catch (error) {
        console.error('Error adding member to room:', error);
        return NextResponse.json({ error: 'Failed to add member to room' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// DELETE /api/rooms/[id]/members - Remove character from room
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const resolvedParams = await params;
    try {
        const { searchParams } = new URL(request.url);
        const characterId = searchParams.get('characterId');
        const memberId = searchParams.get('memberId');

        if (!characterId && !memberId) {
            return NextResponse.json({
                error: 'Either characterId or memberId is required'
            }, { status: 400 });
        }

        // Check if room exists
        const room = await prisma.room.findUnique({
            where: { id: resolvedParams.id }
        });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // Find member to remove
        const whereClause: any = { roomId: resolvedParams.id };
        if (memberId) {
            whereClause.id = memberId;
        } else if (characterId) {
            whereClause.characterId = characterId;
        }

        const member = await prisma.roomMember.findFirst({
            where: whereClause
        });

        if (!member) {
            return NextResponse.json({ error: 'Member not found in room' }, { status: 404 });
        }

        // Remove member from room
        await prisma.roomMember.delete({
            where: { id: member.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing member from room:', error);
        return NextResponse.json({ error: 'Failed to remove member from room' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}