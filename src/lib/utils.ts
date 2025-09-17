import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// FOXP2 Neural Network Utilities
export interface FOXP2NeuralPattern {
    id: string;
    name: string;
    emotionalWeights: {
        happiness: number;
        sadness: number;
        anger: number;
        fear: number;
        curiosity: number;
        aggression: number;
    };
    behavioralTraits: {
        sociability: number;
        energy: number;
        creativity: number;
        loyalty: number;
        intelligence: number;
    };
}

export interface NPCCharacter {
    id: string;
    name: string;
    foxp2Pattern: FOXP2NeuralPattern;
    role: 'warrior' | 'merchant' | 'scholar' | 'wanderer' | 'guardian' | 'artisan';
    currentMood: number; // -1 to 1 scale
    memoryBank: string[]; // Recent interactions and experiences
    routines: DailyRoutine[];
    actions: CharacterAction[]; // Available actions for the character
    imageUrl?: string; // Generated character image
}

export interface DailyRoutine {
    id: string;
    name: string;
    timeSlot: string; // e.g., "morning", "afternoon", "evening", "night"
    action: string;
    priority: number;
}

export interface CharacterAction {
    id: string;
    name: string;
    description: string;
}

export function generateDefaultActions(role: string): CharacterAction[] {
    const roleActions = {
        warrior: [
            { id: 'w1', name: 'Battle Cry', description: 'Boost morale and intimidate enemies' },
            { id: 'w2', name: 'Shield Bash', description: 'Stun an opponent with your shield' }
        ],
        merchant: [
            { id: 'm1', name: 'Price Check', description: 'Evaluate the true value of items' },
            { id: 'm2', name: 'Trade Network', description: 'Connect with other merchants for deals' }
        ],
        scholar: [
            { id: 's1', name: 'Research', description: 'Gather detailed information on any topic' },
            { id: 's2', name: 'Ancient Knowledge', description: 'Recall historical facts and lore' }
        ],
        wanderer: [
            { id: 'wan1', name: 'Track', description: 'Follow trails and find hidden paths' },
            { id: 'wan2', name: 'Survival Instinct', description: 'Find food, water, and shelter' }
        ],
        guardian: [
            { id: 'g1', name: 'Protective Ward', description: 'Create a barrier to protect allies' },
            { id: 'g2', name: 'Vigilant Watch', description: 'Detect threats and dangers early' }
        ],
        artisan: [
            { id: 'a1', name: 'Craft Item', description: 'Create useful tools or decorative items' },
            { id: 'a2', name: 'Repair', description: 'Fix broken items and equipment' }
        ]
    };

    return roleActions[role as keyof typeof roleActions] || [
        { id: 'default1', name: 'Observe', description: 'Carefully watch the surroundings' }
    ];
}

// Helper function to generate UUID that works in all environments
export function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    
    // Fallback for environments where crypto.randomUUID is not available
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function generateRandomFOXP2Pattern(): FOXP2NeuralPattern {
    return {
        id: generateUUID(),
        name: `FOXP2-${Math.random().toString(36).substring(7).toUpperCase()}`,
        emotionalWeights: {
            happiness: Math.random(),
            sadness: Math.random(),
            anger: Math.random(),
            fear: Math.random(),
            curiosity: Math.random(),
            aggression: Math.random(),
        },
        behavioralTraits: {
            sociability: Math.random(),
            energy: Math.random(),
            creativity: Math.random(),
            loyalty: Math.random(),
            intelligence: Math.random(),
        }
    };
}
