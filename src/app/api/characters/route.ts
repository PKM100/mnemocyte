import { NextRequest, NextResponse } from 'next/server';
import { NPCCharacter } from '@/lib/utils';
import fs from 'fs';
import path from 'path';

// File-based storage for development persistence
const CHARACTERS_FILE = path.join(process.cwd(), 'characters.json');

// Load characters from file on startup
let savedCharacters: NPCCharacter[] = [];

function loadCharactersFromFile() {
    try {
        if (fs.existsSync(CHARACTERS_FILE)) {
            const data = fs.readFileSync(CHARACTERS_FILE, 'utf8');
            savedCharacters = JSON.parse(data);
            console.log('Loaded', savedCharacters.length, 'characters from file');
        }
    } catch (error) {
        console.error('Error loading characters from file:', error);
        savedCharacters = [];
    }
}

function saveCharactersToFile() {
    try {
        fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(savedCharacters, null, 2));
        console.log('Saved', savedCharacters.length, 'characters to file');
    } catch (error) {
        console.error('Error saving characters to file:', error);
    }
}

// Load characters on module initialization
loadCharactersFromFile();

export async function GET() {
    console.log('GET /api/characters called, current characters:', savedCharacters.length);
    console.log('Characters:', savedCharacters.map(c => ({ id: c.id, name: c.name })));
    return NextResponse.json(savedCharacters);
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

        // Check if character already exists (update vs create)
        const existingIndex = savedCharacters.findIndex(c => c.id === character.id);

        if (existingIndex >= 0) {
            // Update existing character
            savedCharacters[existingIndex] = character;
        } else {
            // Add new character
            savedCharacters.push(character);
        }

        // Save to file after adding/updating character
        saveCharactersToFile();

        console.log('POST /api/characters - Character saved:', character.name);
        console.log('Total characters now:', savedCharacters.length);

        return NextResponse.json({
            success: true,
            character,
            message: `Character "${character.name}" ${existingIndex >= 0 ? 'updated' : 'saved'} successfully!`
        });
    } catch (error) {
        console.error('Error saving character:', error);
        return NextResponse.json(
            { error: 'Failed to save character' },
            { status: 500 }
        );
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

        savedCharacters = savedCharacters.filter(c => c.id !== characterId);

        // Save to file after deletion
        saveCharactersToFile();

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
    }
}
