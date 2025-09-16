import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { NPCCharacter } from '@/lib/utils';
import { z } from 'zod';

// Character validation schema
const CharacterSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    role: z.string().min(1, 'Role is required'),
    imageUrl: z.string().optional(),
    foxp2Pattern: z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        emotionalWeights: z.object({
            happiness: z.number().min(0).max(1),
            sadness: z.number().min(0).max(1),
            anger: z.number().min(0).max(1),
            fear: z.number().min(0).max(1),
            curiosity: z.number().min(0).max(1),
            aggression: z.number().min(0).max(1)
        }),
        behavioralTraits: z.object({
            sociability: z.number().min(0).max(1),
            energy: z.number().min(0).max(1),
            creativity: z.number().min(0).max(1),
            loyalty: z.number().min(0).max(1),
            intelligence: z.number().min(0).max(1)
        })
    }),
    currentMood: z.number().min(0).max(1).default(0.5),
    memoryBank: z.array(z.any()).default([]),
    routines: z.array(z.any()).default([]),
    actions: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string()
    })).default([])
});

// Helper function to convert database character to NPCCharacter format
function dbCharacterToNPC(dbChar: any): NPCCharacter {
    return {
        id: dbChar.id,
        name: dbChar.name,
        role: dbChar.role,
        imageUrl: dbChar.imageUrl,
        foxp2Pattern: typeof dbChar.foxp2Pattern === 'string'
            ? JSON.parse(dbChar.foxp2Pattern)
            : dbChar.foxp2Pattern,
        currentMood: dbChar.currentMood,
        memoryBank: typeof dbChar.memoryBank === 'string'
            ? JSON.parse(dbChar.memoryBank)
            : Array.isArray(dbChar.memoryBank) ? dbChar.memoryBank : [],
        routines: typeof dbChar.routines === 'string'
            ? JSON.parse(dbChar.routines)
            : Array.isArray(dbChar.routines) ? dbChar.routines : [],
        actions: typeof dbChar.actions === 'string'
            ? JSON.parse(dbChar.actions)
            : Array.isArray(dbChar.actions) ? dbChar.actions : []
    };
}

// GET - Fetch all characters
export async function GET() {
    try {
        console.log('GET /api/characters - Fetching characters from database');

        const characters = await prisma.character.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        const npcCharacters = characters.map(dbCharacterToNPC);

        console.log(`Found ${npcCharacters.length} active characters`);
        return NextResponse.json(npcCharacters);
    } catch (error) {
        console.error('Error fetching characters:', error);
        return NextResponse.json(
            { error: 'Failed to fetch characters' },
            { status: 500 }
        );
    }
}

// POST - Create or update a character
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('POST /api/characters - Received character data:', body);

        // Validate the input
        const validatedData = CharacterSchema.parse(body);

        let character;

        if (body.id) {
            // Update existing character
            character = await prisma.character.update({
                where: { id: body.id },
                data: {
                    name: validatedData.name,
                    role: validatedData.role,
                    imageUrl: validatedData.imageUrl,
                    foxp2Pattern: JSON.stringify(validatedData.foxp2Pattern),
                    currentMood: validatedData.currentMood,
                    memoryBank: JSON.stringify(validatedData.memoryBank),
                    routines: JSON.stringify(validatedData.routines),
                    actions: JSON.stringify(validatedData.actions),
                    updatedAt: new Date()
                }
            });
            console.log(`Updated character: ${character.name} (${character.id})`);
        } else {
            // Create new character
            character = await prisma.character.create({
                data: {
                    name: validatedData.name,
                    role: validatedData.role,
                    imageUrl: validatedData.imageUrl,
                    foxp2Pattern: JSON.stringify(validatedData.foxp2Pattern),
                    currentMood: validatedData.currentMood,
                    memoryBank: JSON.stringify(validatedData.memoryBank),
                    routines: JSON.stringify(validatedData.routines),
                    actions: JSON.stringify(validatedData.actions)
                }
            });
            console.log(`Created new character: ${character.name} (${character.id})`);
        }

        return NextResponse.json({
            character: dbCharacterToNPC(character),
            message: `Character ${character.name} saved successfully!`
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating/updating character:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to save character' },
            { status: 500 }
        );
    }
}

// DELETE - Remove a character
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

        // Soft delete - mark as inactive
        await prisma.character.update({
            where: { id: characterId },
            data: { isActive: false, updatedAt: new Date() }
        });

        console.log(`Soft deleted character: ${characterId}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting character:', error);
        return NextResponse.json(
            { error: 'Failed to delete character' },
            { status: 500 }
        );
    }
}
