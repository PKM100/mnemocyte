import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateUUID } from '@/lib/utils';

export async function GET() {
    try {
        const actions = await prisma.action.findMany({
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(actions);
    } catch (error) {
        console.error('Error fetching actions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch actions' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        const action = await prisma.action.create({
            data: {
                id: generateUUID(),
                name,
                description: description || ''
            }
        });

        return NextResponse.json(action);
    } catch (error) {
        console.error('Error creating action:', error);
        return NextResponse.json(
            { error: 'Failed to create action' },
            { status: 500 }
        );
    }
}
