import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const sessions = await prisma.session.findMany({
            orderBy: {
                lastActivity: 'desc'
            }
        });

        // Transform sessions to include parsed sessionData
        const transformedSessions = sessions.map(session => ({
            id: session.id,
            startTime: session.createdAt.toISOString(),
            sessionData: JSON.parse(session.sessionData),
            currentConversationId: session.currentConversationId,
            lastActivity: session.lastActivity.toISOString(),
            isActive: session.isActive,
            createdAt: session.createdAt.toISOString(),
            updatedAt: session.updatedAt.toISOString()
        }));

        return NextResponse.json(transformedSessions);
    } catch (error) {
        console.error('Error loading sessions:', error);
        return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request: NextRequest) {
    try {
        const sessionData = await request.json();

        // Validate required fields
        if (!sessionData.id) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        const session = await prisma.session.upsert({
            where: { id: sessionData.id },
            update: {
                sessionData: JSON.stringify({
                    activeCharacters: sessionData.activeCharacters || [],
                    userCommands: sessionData.userCommands || []
                }),
                lastActivity: new Date(),
                isActive: sessionData.isActive !== undefined ? sessionData.isActive : true
            },
            create: {
                id: sessionData.id,
                sessionData: JSON.stringify({
                    activeCharacters: sessionData.activeCharacters || [],
                    userCommands: sessionData.userCommands || []
                }),
                createdAt: sessionData.startTime ? new Date(sessionData.startTime) : new Date(),
                lastActivity: new Date(),
                isActive: sessionData.isActive !== undefined ? sessionData.isActive : true
            }
        });

        return NextResponse.json({
            success: true,
            session: {
                id: session.id,
                startTime: session.createdAt.toISOString(),
                sessionData: JSON.parse(session.sessionData),
                lastActivity: session.lastActivity.toISOString(),
                isActive: session.isActive
            }
        });
    } catch (error) {
        console.error('Error saving session:', error);
        return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
