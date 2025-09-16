import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface ChatMessage {
    id: string;
    timestamp: Date;
    sender: string;
    message: string;
    characterId?: string;
    sessionId: string;
}

interface Session {
    id: string;
    startTime: Date;
    endTime?: Date;
    messages: ChatMessage[];
    activeCharacters: string[];
    userCommands: Array<{
        timestamp: Date;
        command: string;
        target?: string;
        result: string;
    }>;
}

const sessionsFilePath = path.join(process.cwd(), 'sessions.json');

async function loadSessionsFromFile(): Promise<Session[]> {
    try {
        const fileContent = await fs.readFile(sessionsFilePath, 'utf-8');
        const sessions = JSON.parse(fileContent);

        // Convert date strings back to Date objects
        return sessions.map((session: any) => ({
            ...session,
            startTime: new Date(session.startTime),
            endTime: session.endTime ? new Date(session.endTime) : undefined,
            messages: session.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            })),
            userCommands: session.userCommands.map((cmd: any) => ({
                ...cmd,
                timestamp: new Date(cmd.timestamp)
            }))
        }));
    } catch (error) {
        console.log('No sessions file found, starting with empty array');
        return [];
    }
}

async function saveSessionsToFile(sessions: Session[]): Promise<void> {
    try {
        await fs.writeFile(sessionsFilePath, JSON.stringify(sessions, null, 2));
    } catch (error) {
        console.error('Error saving sessions:', error);
        throw error;
    }
}

export async function GET() {
    try {
        const sessions = await loadSessionsFromFile();
        return NextResponse.json(sessions);
    } catch (error) {
        console.error('Error loading sessions:', error);
        return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const newSession: Session = await request.json();
        const sessions = await loadSessionsFromFile();

        sessions.push(newSession);
        await saveSessionsToFile(sessions);

        return NextResponse.json(newSession, { status: 201 });
    } catch (error) {
        console.error('Error creating session:', error);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const updatedSession: Session = await request.json();
        const sessions = await loadSessionsFromFile();

        const sessionIndex = sessions.findIndex(session => session.id === updatedSession.id);
        if (sessionIndex === -1) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        sessions[sessionIndex] = updatedSession;
        await saveSessionsToFile(sessions);

        return NextResponse.json(updatedSession);
    } catch (error) {
        console.error('Error updating session:', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('id');

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        const sessions = await loadSessionsFromFile();
        const filteredSessions = sessions.filter(session => session.id !== sessionId);

        if (filteredSessions.length === sessions.length) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        await saveSessionsToFile(filteredSessions);

        return NextResponse.json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error('Error deleting session:', error);
        return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }
}
