import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        await prisma.characterRole.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting character role:', error);
        return NextResponse.json(
            { error: 'Failed to delete character role' },
            { status: 500 }
        );
    }
}
