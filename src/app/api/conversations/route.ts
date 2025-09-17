import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const conversations = await prisma.conversation.findMany({
            include: {
                messages: {
                    include: {
                        character: true
                    },
                    orderBy: {
                        messageOrder: 'asc'
                    }
                },
                participants: {
                    include: {
                        character: true
                    }
                },
                _count: {
                    select: {
                        messages: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Transform to match expected format
        const transformedConversations = conversations.map(conversation => ({
            id: conversation.id,
            title: conversation.title,
            type: conversation.type,
            createdAt: conversation.createdAt.toISOString(),
            updatedAt: conversation.updatedAt.toISOString(),
            isActive: conversation.isActive,
            messages: conversation.messages.map(message => ({
                id: message.id,
                content: message.content,
                characterId: message.characterId,
                timestamp: message.timestamp.toISOString(),
                character: message.character ? {
                    id: message.character.id,
                    name: message.character.name,
                    role: message.character.role,
                    foxp2Pattern: JSON.parse(message.character.foxp2Pattern)
                } : null,
                messageOrder: message.messageOrder
            })),
            participants: conversation.participants.map(participant => ({
                characterId: participant.characterId,
                character: {
                    id: participant.character.id,
                    name: participant.character.name,
                    role: participant.character.role,
                    foxp2Pattern: JSON.parse(participant.character.foxp2Pattern)
                }
            })),
            _count: conversation._count
        }));

        return NextResponse.json(transformedConversations);
    } catch (error) {
        console.error('Error loading conversations:', error);
        return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        if (data.action === 'create_conversation') {
            // Create a new conversation
            const conversation = await prisma.conversation.create({
                data: {
                    id: data.id || `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    title: data.title || 'New Conversation',
                    type: data.type || 'playground',
                    isActive: data.isActive !== undefined ? data.isActive : true,
                    sessionData: JSON.stringify(data.sessionData || {})
                }
            });

            return NextResponse.json({
                success: true,
                conversation: {
                    id: conversation.id,
                    title: conversation.title,
                    type: conversation.type,
                    createdAt: conversation.createdAt.toISOString(),
                    updatedAt: conversation.updatedAt.toISOString(),
                    isActive: conversation.isActive
                }
            });
        } else if (data.action === 'add_message') {
            // Add a message to existing conversation
            const messageCount = await prisma.message.count({
                where: { conversationId: data.conversationId }
            });

            const message = await prisma.message.create({
                data: {
                    id: data.messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    conversationId: data.conversationId,
                    characterId: data.characterId || null,
                    content: data.content,
                    type: data.type || 'chat',
                    messageOrder: messageCount,
                    timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
                    metadata: JSON.stringify(data.metadata || {})
                }
            });

            // Update conversation timestamp
            await prisma.conversation.update({
                where: { id: data.conversationId },
                data: { updatedAt: new Date() }
            });

            return NextResponse.json({
                success: true,
                message: {
                    id: message.id,
                    conversationId: message.conversationId,
                    characterId: message.characterId,
                    content: message.content,
                    timestamp: message.timestamp.toISOString(),
                    messageOrder: message.messageOrder
                }
            });
        } else if (data.action === 'add_participant') {
            // Add a participant to conversation
            await prisma.conversationParticipant.upsert({
                where: {
                    conversationId_characterId: {
                        conversationId: data.conversationId,
                        characterId: data.characterId
                    }
                },
                update: {
                    isActive: true,
                    lastSeen: new Date()
                },
                create: {
                    id: `${data.conversationId}_${data.characterId}`,
                    conversationId: data.conversationId,
                    characterId: data.characterId,
                    joinedAt: new Date(),
                    isActive: true,
                    lastSeen: new Date()
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Participant added successfully'
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error in conversations POST:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
