import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Activity types for character status simulation
const ACTIVITY_TYPES = [
    'idle',
    'thinking',
    'working',
    'socializing',
    'learning',
    'creating',
    'exploring',
    'resting',
    'planning',
    'reflecting'
] as const;

type ActivityType = typeof ACTIVITY_TYPES[number];

// Status types
const STATUS_TYPES = [
    'active',
    'busy',
    'available',
    'away',
    'in_conversation',
    'offline'
] as const;

type StatusType = typeof STATUS_TYPES[number];

// Generate random activity based on character role and mood
function generateActivity(character: any): { activity: ActivityType; description: string; status: StatusType } {
    const { role, currentMood } = character;

    // Higher mood = more active/social activities
    // Lower mood = more contemplative/solitary activities

    let possibleActivities: ActivityType[] = [];
    let status: StatusType = 'active';

    if (currentMood > 0.7) {
        // High mood - social and active
        possibleActivities = ['socializing', 'creating', 'exploring', 'working'];
        status = Math.random() > 0.5 ? 'available' : 'active';
    } else if (currentMood > 0.4) {
        // Medium mood - balanced activities
        possibleActivities = ['working', 'thinking', 'learning', 'planning'];
        status = Math.random() > 0.3 ? 'busy' : 'available';
    } else {
        // Low mood - introspective activities
        possibleActivities = ['reflecting', 'resting', 'thinking', 'idle'];
        status = Math.random() > 0.7 ? 'away' : 'active';
    }

    const activity = possibleActivities[Math.floor(Math.random() * possibleActivities.length)];

    // Generate role-specific descriptions
    const descriptions: Record<ActivityType, string[]> = {
        idle: [
            `${character.name} is taking a moment to observe their surroundings.`,
            `${character.name} appears to be in a peaceful state, simply being present.`,
            `${character.name} is quietly contemplating the moment.`
        ],
        thinking: [
            `${character.name} is deep in thought about their work as a ${role}.`,
            `${character.name} appears to be pondering something important.`,
            `${character.name} is working through some complex ideas.`
        ],
        working: [
            `${character.name} is actively engaged in their duties as a ${role}.`,
            `${character.name} is focused on their professional responsibilities.`,
            `${character.name} is making progress on their current projects.`
        ],
        socializing: [
            `${character.name} is enjoying interactions with others.`,
            `${character.name} is engaged in lively conversation.`,
            `${character.name} is connecting with fellow characters.`
        ],
        learning: [
            `${character.name} is expanding their knowledge in their field.`,
            `${character.name} is studying something relevant to their role as a ${role}.`,
            `${character.name} is researching new approaches to their work.`
        ],
        creating: [
            `${character.name} is working on something new and innovative.`,
            `${character.name} is channeling their creativity into their work.`,
            `${character.name} is bringing new ideas to life.`
        ],
        exploring: [
            `${character.name} is discovering new aspects of their environment.`,
            `${character.name} is investigating something intriguing.`,
            `${character.name} is on a journey of discovery.`
        ],
        resting: [
            `${character.name} is taking some well-deserved rest.`,
            `${character.name} is recharging their energy.`,
            `${character.name} is in a peaceful, restorative state.`
        ],
        planning: [
            `${character.name} is strategizing their next moves as a ${role}.`,
            `${character.name} is organizing their upcoming activities.`,
            `${character.name} is mapping out future projects.`
        ],
        reflecting: [
            `${character.name} is reflecting on their recent experiences.`,
            `${character.name} is contemplating their journey as a ${role}.`,
            `${character.name} is processing their thoughts and feelings.`
        ]
    };

    const activityDescriptions = descriptions[activity];
    const description = activityDescriptions[Math.floor(Math.random() * activityDescriptions.length)];

    return { activity, description, status };
}

// GET - Get status of specific character
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
                    where: {
                        conversation: { isActive: true }
                    },
                    include: {
                        conversation: {
                            include: {
                                messages: {
                                    where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Last 24 hours
                                    orderBy: { timestamp: 'desc' },
                                    take: 1
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

        // Generate current activity
        const { activity, description, status } = generateActivity(character);

        // Check if character is currently in active conversations
        const activeConversations = character.conversations.filter((cp: any) =>
            cp.conversation.isActive && cp.conversation.messages.length > 0
        );

        const isInConversation = activeConversations.length > 0;
        const finalStatus = isInConversation ? 'in_conversation' : status;

        // Calculate activity metrics
        const lastActivity = character.updatedAt;
        const minutesSinceLastActivity = Math.floor(
            (new Date().getTime() - lastActivity.getTime()) / (1000 * 60)
        );

        // Simulated conversation statistics
        const totalConversations = character.conversations.length;
        const recentMessages = character.conversations.reduce((total: number, cp: any) =>
            total + cp.conversation.messages.length, 0
        );

        return NextResponse.json({
            characterId: character.id,
            name: character.name,
            role: character.role,
            status: finalStatus,
            activity: {
                type: activity,
                description: description,
                timestamp: new Date().toISOString()
            },
            mood: {
                current: character.currentMood,
                level: character.currentMood > 0.7 ? 'high' :
                    character.currentMood > 0.4 ? 'medium' : 'low',
                description: character.currentMood > 0.7 ? 'Feeling quite positive' :
                    character.currentMood > 0.4 ? 'In a balanced state' : 'Feeling contemplative'
            },
            availability: {
                isActive: character.isActive,
                isInConversation,
                activeConversations: activeConversations.length,
                status: finalStatus
            },
            metrics: {
                lastActivityMinutesAgo: minutesSinceLastActivity,
                totalConversations,
                recentMessages,
                lastSeen: lastActivity.toISOString()
            },
            location: {
                environment: 'Mnemocyte World',
                area: `${character.role} Sector`,
                coordinates: {
                    x: Math.floor(Math.random() * 1000),
                    y: Math.floor(Math.random() * 1000),
                    z: Math.floor(Math.random() * 100)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching character status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch character status' },
            { status: 500 }
        );
    }
}

// PUT - Update character status/activity (for manual control)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();

        const character = await prisma.character.findUnique({
            where: { id }
        });

        if (!character) {
            return NextResponse.json(
                { error: 'Character not found' },
                { status: 404 }
            );
        }

        // Update character mood if provided
        let updateData: any = {
            updatedAt: new Date()
        };

        if (typeof body.mood === 'number' && body.mood >= 0 && body.mood <= 1) {
            updateData.currentMood = body.mood;
        }

        if (typeof body.isActive === 'boolean') {
            updateData.isActive = body.isActive;
        }

        const updatedCharacter = await prisma.character.update({
            where: { id },
            data: updateData
        });

        // Generate new activity based on updated state
        const { activity, description, status } = generateActivity(updatedCharacter);

        return NextResponse.json({
            characterId: updatedCharacter.id,
            name: updatedCharacter.name,
            role: updatedCharacter.role,
            status: status,
            activity: {
                type: activity,
                description: description,
                timestamp: new Date().toISOString()
            },
            mood: {
                current: updatedCharacter.currentMood,
                level: updatedCharacter.currentMood > 0.7 ? 'high' :
                    updatedCharacter.currentMood > 0.4 ? 'medium' : 'low'
            },
            updated: true,
            updateTimestamp: updatedCharacter.updatedAt.toISOString()
        });

    } catch (error) {
        console.error('Error updating character status:', error);
        return NextResponse.json(
            { error: 'Failed to update character status' },
            { status: 500 }
        );
    }
}
