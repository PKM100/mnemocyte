import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.action.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting action:', error);
        return NextResponse.json(
            { error: 'Failed to delete action' },
            { status: 500 }
        );
    }
}
