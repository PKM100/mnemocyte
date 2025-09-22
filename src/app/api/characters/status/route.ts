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

    let possibleActivities: ActivityType[] = [];
    let status: StatusType = 'active';

    if (currentMood > 0.7) {
        possibleActivities = ['socializing', 'creating', 'exploring', 'working'];
        status = Math.random() > 0.5 ? 'available' : 'active';
    } else if (currentMood > 0.4) {
        possibleActivities = ['working', 'thinking', 'learning', 'planning'];
        status = Math.random() > 0.3 ? 'busy' : 'available';
    } else {
        possibleActivities = ['reflecting', 'resting', 'thinking', 'idle'];
        status = Math.random() > 0.7 ? 'away' : 'active';
    }

    const activity = possibleActivities[Math.floor(Math.random() * possibleActivities.length)];

    // Generate role-specific descriptions
    const descriptions: Record<ActivityType, string[]> = {
        idle: [`${character.name} is taking a moment to observe their surroundings.`],
        thinking: [`${character.name} is deep in thought about their work as a ${role}.`],
        working: [`${character.name} is actively engaged in their duties as a ${role}.`],
        socializing: [`${character.name} is enjoying interactions with others.`],
        learning: [`${character.name} is expanding their knowledge in their field.`],
        creating: [`${character.name} is working on something new and innovative.`],
        exploring: [`${character.name} is discovering new aspects of their environment.`],
        resting: [`${character.name} is taking some well-deserved rest.`],
        planning: [`${character.name} is strategizing their next moves as a ${role}.`],
        reflecting: [`${character.name} is reflecting on their recent experiences.`]
    };

    const activityDescriptions = descriptions[activity];
    const description = activityDescriptions[0]; // Use first description for simplicity

    return { activity, description, status };
}

// GET - Get status of all characters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get('includeInactive') === 'true';
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const characters = await prisma.character.findMany({
            where: includeInactive ? {} : { isActive: true },
            include: {
                participants: {
                    where: {
                        conversation: { isActive: true }
                    },
                    include: {
                        conversation: {
                            include: {
                                messages: {
                                    where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
                                    orderBy: { timestamp: 'desc' },
                                    take: 1
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            skip: offset,
            take: limit
        });

        const characterStatuses = characters.map((character: any) => {
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

            const totalConversations = character.conversations.length;
            const recentMessages = character.conversations.reduce((total: number, cp: any) =>
                total + cp.conversation.messages.length, 0
            );

            return {
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
                        character.currentMood > 0.4 ? 'medium' : 'low'
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
                imageUrl: character.imageUrl
            };
        });

        // Calculate summary statistics
        const summary = {
            totalCharacters: characterStatuses.length,
            activeCharacters: characterStatuses.filter((c: any) => c.availability.isActive).length,
            charactersInConversation: characterStatuses.filter((c: any) => c.availability.isInConversation).length,
            statusBreakdown: characterStatuses.reduce((acc: any, char: any) => {
                acc[char.status] = (acc[char.status] || 0) + 1;
                return acc;
            }, {}),
            moodBreakdown: characterStatuses.reduce((acc: any, char: any) => {
                acc[char.mood.level] = (acc[char.mood.level] || 0) + 1;
                return acc;
            }, {}),
            averageMood: characterStatuses.reduce((sum: number, char: any) => sum + char.mood.current, 0) / characterStatuses.length || 0
        };

        return NextResponse.json({
            characters: characterStatuses,
            summary,
            timestamp: new Date().toISOString(),
            hasMore: characters.length === limit
        });

    } catch (error) {
        console.error('Error fetching character statuses:', error);
        return NextResponse.json(
            { error: 'Failed to fetch character statuses' },
            { status: 500 }
        );
    }
}
