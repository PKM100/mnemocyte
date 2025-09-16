import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Character update schema
const UpdateCharacterSchema = z.object({
    name: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
    imageUrl: z.string().optional(),
    foxp2Pattern: z.object({
        emotionalWeights: z.object({
            happiness: z.number().min(0).max(1),
            sadness: z.number().min(0).max(1),
            anger: z.number().min(0).max(1),
            fear: z.number().min(0).max(1),
            curiosity: z.number().min(0).max(1),
            aggression: z.number().min(0).max(1)
        }).optional(),
        behavioralTraits: z.object({
            sociability: z.number().min(0).max(1),
            energy: z.number().min(0).max(1),
            creativity: z.number().min(0).max(1),
            loyalty: z.number().min(0).max(1),
            intelligence: z.number().min(0).max(1)
        }).optional()
    }).optional(),
    currentMood: z.number().min(0).max(1).optional(),
    isActive: z.boolean().optional()
});

// GET - Get individual character details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;

        const character = await prisma.character.findUnique({
            where: { id },
            include: {
                conversations: {
                    include: {
                        conversation: {
                            include: {
                                messages: {
                                    take: 5,
                                    orderBy: { timestamp: 'desc' }
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

        // Convert database format to API format
        const apiCharacter = {
            id: character.id,
            name: character.name,
            role: character.role,
            imageUrl: character.imageUrl,
            foxp2Pattern: typeof character.foxp2Pattern === 'string'
                ? JSON.parse(character.foxp2Pattern)
                : character.foxp2Pattern,
            currentMood: character.currentMood,
            memoryBank: typeof character.memoryBank === 'string'
                ? JSON.parse(character.memoryBank)
                : character.memoryBank,
            routines: typeof character.routines === 'string'
                ? JSON.parse(character.routines)
                : character.routines,
            actions: typeof character.actions === 'string'
                ? JSON.parse(character.actions)
                : character.actions,
            isActive: character.isActive,
            lastActivity: character.updatedAt,
            conversationCount: character.conversations.length,
            recentConversations: character.conversations.slice(0, 3)
        };

        return NextResponse.json(apiCharacter);
    } catch (error) {
        console.error('Error fetching character:', error);
        return NextResponse.json(
            { error: 'Failed to fetch character' },
            { status: 500 }
        );
    }
}

// PUT - Update character
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate input
        const validatedData = UpdateCharacterSchema.parse(body);

        // Check if character exists
        const existingCharacter = await prisma.character.findUnique({
            where: { id }
        });

        if (!existingCharacter) {
            return NextResponse.json(
                { error: 'Character not found' },
                { status: 404 }
            );
        }

        // Prepare update data
        const updateData: any = {};

        if (validatedData.name) updateData.name = validatedData.name;
        if (validatedData.role) updateData.role = validatedData.role;
        if (validatedData.imageUrl !== undefined) updateData.imageUrl = validatedData.imageUrl;
        if (validatedData.currentMood !== undefined) updateData.currentMood = validatedData.currentMood;
        if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

        // Handle complex fields
        if (validatedData.foxp2Pattern) {
            const currentPattern = typeof existingCharacter.foxp2Pattern === 'string'
                ? JSON.parse(existingCharacter.foxp2Pattern)
                : existingCharacter.foxp2Pattern;

            updateData.foxp2Pattern = JSON.stringify({
                ...currentPattern,
                ...validatedData.foxp2Pattern
            });
        }

        // Update character
        const updatedCharacter = await prisma.character.update({
            where: { id },
            data: updateData
        });

        // Convert to API format
        const apiCharacter = {
            id: updatedCharacter.id,
            name: updatedCharacter.name,
            role: updatedCharacter.role,
            imageUrl: updatedCharacter.imageUrl,
            foxp2Pattern: typeof updatedCharacter.foxp2Pattern === 'string'
                ? JSON.parse(updatedCharacter.foxp2Pattern)
                : updatedCharacter.foxp2Pattern,
            currentMood: updatedCharacter.currentMood,
            memoryBank: typeof updatedCharacter.memoryBank === 'string'
                ? JSON.parse(updatedCharacter.memoryBank)
                : updatedCharacter.memoryBank,
            routines: typeof updatedCharacter.routines === 'string'
                ? JSON.parse(updatedCharacter.routines)
                : updatedCharacter.routines,
            actions: typeof updatedCharacter.actions === 'string'
                ? JSON.parse(updatedCharacter.actions)
                : updatedCharacter.actions,
            isActive: updatedCharacter.isActive,
            lastActivity: updatedCharacter.updatedAt
        };

        return NextResponse.json(apiCharacter);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input data', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error updating character:', error);
        return NextResponse.json(
            { error: 'Failed to update character' },
            { status: 500 }
        );
    }
}

// DELETE - Delete character
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;

        // Check if character exists
        const existingCharacter = await prisma.character.findUnique({
            where: { id }
        });

        if (!existingCharacter) {
            return NextResponse.json(
                { error: 'Character not found' },
                { status: 404 }
            );
        }

        // Delete character (this will cascade to related records)
        await prisma.character.delete({
            where: { id }
        });

        return NextResponse.json(
            { message: 'Character deleted successfully', id },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting character:', error);
        return NextResponse.json(
            { error: 'Failed to delete character' },
            { status: 500 }
        );
    }
}
