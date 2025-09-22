import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateUUID } from '@/lib/utils';

export async function GET() {
    try {
        const memories = await prisma.memoryTemplate.findMany({
            orderBy: { heading: 'asc' }
        });

        return NextResponse.json(memories);
    } catch (error) {
        console.error('Error fetching memory templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch memory templates' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { heading, content } = body;

        if (!heading) {
            return NextResponse.json(
                { error: 'Heading is required' },
                { status: 400 }
            );
        }

        const memory = await prisma.memoryTemplate.create({
            data: {
                id: generateUUID(),
                heading,
                content: content || ''
            }
        });

        return NextResponse.json(memory);
    } catch (error) {
        console.error('Error creating memory template:', error);
        return NextResponse.json(
            { error: 'Failed to create memory template' },
            { status: 500 }
        );
    }
}
