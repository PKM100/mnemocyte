import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        await prisma.memoryTemplate.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting memory template:', error);
        return NextResponse.json(
            { error: 'Failed to delete memory template' },
            { status: 500 }
        );
    }
}
