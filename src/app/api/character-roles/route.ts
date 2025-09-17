import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const roles = await prisma.characterRole.findMany({
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(roles);
    } catch (error) {
        console.error('Error fetching character roles:', error);
        return NextResponse.json(
            { error: 'Failed to fetch character roles' },
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

        const role = await prisma.characterRole.create({
            data: {
                name,
                description: description || ''
            }
        });

        return NextResponse.json(role);
    } catch (error) {
        console.error('Error creating character role:', error);
        return NextResponse.json(
            { error: 'Failed to create character role' },
            { status: 500 }
        );
    }
}
