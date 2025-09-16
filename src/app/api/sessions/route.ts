import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Fetch all sessions
export async function GET() {
    try {
        console.log('GET /api/sessions - Fetching sessions from database');

        const sessions = await prisma.session.findMany({
            where: { isActive: true },
            orderBy: { lastActivity: 'desc' }
        });

        // Parse JSON strings back to objects
        const parsedSessions = sessions.map((session: any) => ({
            ...session,
            sessionData: typeof session.sessionData === 'string'
                ? JSON.parse(session.sessionData)
                : session.sessionData
        }));

        console.log(`Found ${sessions.length} active sessions`);
        return NextResponse.json(parsedSessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sessions' },
            { status: 500 }
        );
    }
}

// POST - Create or update a session
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('POST /api/sessions - Session data:', body);

        let session;

        if (body.id) {
            // Update existing session
            session = await prisma.session.update({
                where: { id: body.id },
                data: {
                    sessionData: JSON.stringify(body.sessionData || {}),
                    currentConversationId: body.currentConversationId,
                    lastActivity: new Date(),
                    updatedAt: new Date()
                }
            });
            console.log(`Updated session: ${session.id}`);
        } else {
            // Create new session
            session = await prisma.session.create({
                data: {
                    sessionData: JSON.stringify(body.sessionData || {}),
                    currentConversationId: body.currentConversationId,
                    lastActivity: new Date()
                }
            });
            console.log(`Created new session: ${session.id}`);
        }

        return NextResponse.json(session, { status: 201 });
    } catch (error) {
        console.error('Error creating/updating session:', error);
        return NextResponse.json(
            { error: 'Failed to save session' },
            { status: 500 }
        );
    }
}

// DELETE - Remove a session
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('id');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        // Soft delete - mark as inactive
        await prisma.session.update({
            where: { id: sessionId },
            data: { isActive: false, updatedAt: new Date() }
        });

        console.log(`Soft deleted session: ${sessionId}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting session:', error);
        return NextResponse.json(
            { error: 'Failed to delete session' },
            { status: 500 }
        );
    }
}
