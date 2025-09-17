import { NextRequest, NextResponse } from 'next/server';
import { NPCCharacter } from '@/lib/utils';
import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
    try {
        console.log('GET /api/characters called');

        const characters = await prisma.character.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform database characters to NPCCharacter format
        const transformedCharacters: NPCCharacter[] = characters.map(character => ({
            id: character.id,
            name: character.name,
            role: character.role as NPCCharacter['role'], // Type assertion for role
            foxp2Pattern: JSON.parse(character.foxp2Pattern),
            currentMood: character.currentMood,
            memoryBank: JSON.parse(character.memoryBank),
            routines: JSON.parse(character.routines),
            actions: JSON.parse(character.actions),
            imageUrl: character.imageUrl || undefined
        }));

        console.log('Loaded', transformedCharacters.length, 'characters from database');
        console.log('Characters:', transformedCharacters.map(c => ({ id: c.id, name: c.name })));

        return NextResponse.json(transformedCharacters);
    } catch (error) {
        console.error('Error loading characters from database:', error);
        return NextResponse.json({ error: 'Failed to load characters' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request: NextRequest) {
    try {
        const character: NPCCharacter = await request.json();

        // Validate required fields
        if (!character.name || !character.foxp2Pattern || !character.role) {
            return NextResponse.json(
                { error: 'Missing required character fields' },
                { status: 400 }
            );
        }

        // Generate ID if not provided
        if (!character.id) {
            character.id = `npc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        }

        // Upsert character in database
        const savedCharacter = await prisma.character.upsert({
            where: { id: character.id },
            update: {
                name: character.name,
                role: character.role,
                foxp2Pattern: JSON.stringify(character.foxp2Pattern),
                currentMood: character.currentMood,
                memoryBank: JSON.stringify(character.memoryBank || []),
                routines: JSON.stringify(character.routines || []),
                actions: JSON.stringify(character.actions || []),
                imageUrl: character.imageUrl
            },
            create: {
                id: character.id,
                name: character.name,
                role: character.role,
                foxp2Pattern: JSON.stringify(character.foxp2Pattern),
                currentMood: character.currentMood,
                memoryBank: JSON.stringify(character.memoryBank || []),
                routines: JSON.stringify(character.routines || []),
                actions: JSON.stringify(character.actions || []),
                imageUrl: character.imageUrl
            }
        });

        console.log('POST /api/characters - Character saved:', character.name);

        return NextResponse.json({
            success: true,
            character,
            message: `Character "${character.name}" saved successfully!`
        });
    } catch (error) {
        console.error('Error saving character:', error);
        return NextResponse.json(
            { error: 'Failed to save character' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const characterId = searchParams.get('id');

        if (!characterId) {
            return NextResponse.json(
                { error: 'Character ID is required' },
                { status: 400 }
            );
        }

        await prisma.character.delete({
            where: { id: characterId }
        });

        return NextResponse.json({
            success: true,
            message: 'Character deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting character:', error);
        return NextResponse.json(
            { error: 'Failed to delete character' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
