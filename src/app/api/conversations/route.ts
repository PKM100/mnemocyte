import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Fetch conversations with messages
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('id');
        const includeMessages = searchParams.get('includeMessages') === 'true';

        if (conversationId) {
            // Get specific conversation
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: {
                    participants: {
                        include: { character: true }
                    },
                    messages: includeMessages ? {
                        include: { character: true },
                        orderBy: { messageOrder: 'asc' }
                    } : false
                }
            });

            if (!conversation) {
                return NextResponse.json(
                    { error: 'Conversation not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(conversation);
        } else {
            // Get all conversations
            const conversations = await prisma.conversation.findMany({
                where: { isActive: true },
                include: {
                    participants: {
                        include: { character: true }
                    },
                    _count: { select: { messages: true } }
                },
                orderBy: { updatedAt: 'desc' }
            });

            return NextResponse.json(conversations);
        }
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch conversations' },
            { status: 500 }
        );
    }
}

// POST - Create conversation or add message
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('POST /api/conversations - Request:', body);

        if (body.conversationId && body.message) {
            // Add message to existing conversation
            const { conversationId, message, characterId, type = 'chat' } = body;

            // Get the next message order
            const lastMessage = await prisma.message.findFirst({
                where: { conversationId },
                orderBy: { messageOrder: 'desc' }
            });

            const nextOrder = (lastMessage?.messageOrder || 0) + 1;

            const newMessage = await prisma.message.create({
                data: {
                    conversationId,
                    characterId,
                    content: message,
                    type,
                    messageOrder: nextOrder,
                    metadata: body.metadata || {}
                },
                include: { character: true }
            });

            // Update conversation timestamp
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() }
            });

            return NextResponse.json(newMessage, { status: 201 });
        } else {
            // Create new conversation
            const { title, type = 'playground', characterIds = [], sessionData = {} } = body;

            const conversation = await prisma.conversation.create({
                data: {
                    title,
                    type,
                    sessionData,
                    participants: {
                        create: characterIds.map((characterId: string) => ({
                            characterId
                        }))
                    }
                },
                include: {
                    participants: {
                        include: { character: true }
                    }
                }
            });

            console.log(`Created new conversation: ${conversation.id}`);
            return NextResponse.json(conversation, { status: 201 });
        }
    } catch (error) {
        console.error('Error creating conversation/message:', error);
        return NextResponse.json(
            { error: 'Failed to create conversation or message' },
            { status: 500 }
        );
    }
}

// PUT - Update conversation
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, title, sessionData, isActive } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Conversation ID is required' },
                { status: 400 }
            );
        }

        const conversation = await prisma.conversation.update({
            where: { id },
            data: {
                title,
                sessionData,
                isActive,
                updatedAt: new Date()
            }
        });

        return NextResponse.json(conversation);
    } catch (error) {
        console.error('Error updating conversation:', error);
        return NextResponse.json(
            { error: 'Failed to update conversation' },
            { status: 500 }
        );
    }
}

// DELETE - Remove a conversation
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('id');

        if (!conversationId) {
            return NextResponse.json(
                { error: 'Conversation ID is required' },
                { status: 400 }
            );
        }

        // Soft delete - mark as inactive
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { isActive: false, updatedAt: new Date() }
        });

        console.log(`Soft deleted conversation: ${conversationId}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        return NextResponse.json(
            { error: 'Failed to delete conversation' },
            { status: 500 }
        );
    }
}
