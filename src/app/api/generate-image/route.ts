import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { characterName, role, emotionalWeights, behavioralTraits } = body;

        console.log('Image generation request:', { characterName, role });

        // Validate required fields
        if (!characterName || !role) {
            return NextResponse.json(
                { success: false, error: 'Character name and role are required' },
                { status: 400 }
            );
        }

        // Generate a unique seed based on character attributes
        const seed = generateSeed(characterName, role, emotionalWeights || {}, behavioralTraits || {});

        // Create a Minecraft-style avatar URL using enhanced trait-based generation
        const avatarUrl = generateMinecraftAvatar(seed, role, characterName, emotionalWeights || {}, behavioralTraits || {});

        console.log('Generated image URL:', avatarUrl);

        return NextResponse.json({
            success: true,
            imageUrl: avatarUrl,
            seed: seed
        });

    } catch (error) {
        console.error('Image generation failed:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate image', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

function generateSeed(name: string, role: string, emotions: any, behaviors: any): string {
    // Create a deterministic seed from character attributes including all traits
    const allEmotions = Object.entries(emotions || {}).map(([key, value]: [string, any]) =>
        `${key}:${Math.round((value as number) * 100)}`
    );

    const allBehaviors = Object.entries(behaviors || {}).map(([key, value]: [string, any]) =>
        `${key}:${Math.round((value as number) * 100)}`
    );

    const attributes = [
        name.toLowerCase(),
        role,
        ...allEmotions,
        ...allBehaviors
    ].join('|');

    // Enhanced hash function for better distribution
    let hash = 0;
    for (let i = 0; i < attributes.length; i++) {
        const char = attributes.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Create a more unique seed by incorporating name length and character count
    const nameHash = name.length * 31 + name.charCodeAt(0);
    const finalHash = Math.abs(hash ^ nameHash);

    return finalHash.toString(16);
}

function generateMinecraftAvatar(seed: string, role: string, name: string, emotions: any, behaviors: any): string {
    // Use a more reliable avatar service
    const baseUrl = 'https://api.dicebear.com/8.x/pixel-art/svg';

    // Generate personality-based visual traits
    const visualTraits = generateVisualTraits(emotions, behaviors);

    // Map roles to different avatar characteristics
    const roleColors = {
        warrior: ['b91c1c', 'dc2626', 'ef4444'], // Red variants
        merchant: ['d97706', 'f59e0b', 'fbbf24'], // Orange/yellow variants  
        scholar: ['7c3aed', '8b5cf6', '9333ea'], // Purple variants
        wanderer: ['92400e', 'a16207', 'ca8a04'], // Brown variants
        guardian: ['374151', '4b5563', '6b7280'], // Gray variants
        artisan: ['047857', '059669', '10b981']  // Green variants
    };

    const colors = roleColors[role as keyof typeof roleColors] || roleColors.wanderer;
    const bgColor = selectColorByPersonality(colors, emotions, behaviors);

    // Create a simple, reliable URL
    const params = new URLSearchParams({
        seed: `${name}-${role}-${seed}`,
        backgroundColor: bgColor,
        size: '128'
    });

    const avatarUrl = `${baseUrl}?${params.toString()}`;

    // Log for debugging
    console.log('Generated avatar URL:', avatarUrl);

    return avatarUrl;
}

// Fallback function to create a simple data URI image
function createFallbackAvatar(name: string, role: string): string {
    // Create a simple SVG avatar as fallback
    const colors = {
        warrior: '#dc2626',
        merchant: '#f59e0b',
        scholar: '#8b5cf6',
        wanderer: '#a16207',
        guardian: '#4b5563',
        artisan: '#10b981'
    };

    const color = colors[role as keyof typeof colors] || colors.wanderer;
    const initial = name.charAt(0).toUpperCase();

    const svg = `
        <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
            <rect width="128" height="128" fill="${color}" />
            <text x="64" y="80" font-family="monospace" font-size="48" fill="white" text-anchor="middle" font-weight="bold">
                ${initial}
            </text>
        </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function generateVisualTraits(emotions: any, behaviors: any) {
    return {
        aggressive: emotions.aggression > 0.6,
        intelligent: behaviors.intelligence > 0.7,
        creative: behaviors.creativity > 0.6,
        loyal: behaviors.loyalty > 0.7,
        social: behaviors.sociability > 0.6,
        energetic: behaviors.energy > 0.7,
        fearful: emotions.fear > 0.6,
        joyful: emotions.happiness > 0.7 || emotions.joy > 0.7
    };
}

function selectColorByPersonality(colors: string[], emotions: any, behaviors: any): string {
    // Use personality to influence color selection
    let index = 0;

    // High joy/happiness tends toward brighter colors
    if (emotions.happiness > 0.7) {
        index = colors.length - 1; // Brightest color
    }
    // High fear/sadness tends toward darker colors  
    else if (emotions.fear > 0.6 || emotions.sadness > 0.6) {
        index = 0; // Darkest color
    }
    // Default to middle ground
    else {
        index = Math.floor(colors.length / 2);
    }

    return colors[index];
}

function generateNameInfluence(name: string): { [key: string]: string } {
    const influence: { [key: string]: string } = {};

    // Use first letter of name to influence hair style
    const firstLetter = name.charAt(0).toLowerCase();
    const letterCode = firstLetter.charCodeAt(0);

    // Map name characteristics to visual features
    if (letterCode % 3 === 0) {
        influence.hair = 'short';
    } else if (letterCode % 3 === 1) {
        influence.hair = 'long';
    } else {
        influence.hair = 'medium';
    }

    // Use name length to influence facial features
    if (name.length > 7) {
        influence.mouth = 'smile';
    } else if (name.length < 4) {
        influence.mouth = 'serious';
    }

    // Use vowel/consonant ratio for additional uniqueness
    const vowels = (name.match(/[aeiou]/gi) || []).length;
    const consonants = name.length - vowels;
    if (vowels > consonants) {
        influence.eyes = 'happy';
    } else if (consonants > vowels * 2) {
        influence.eyes = 'serious';
    }

    return influence;
}
