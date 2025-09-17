#!/usr/bin/env node

const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

async function cleanupTestData() {
    console.log('🧹 Starting cleanup of test data...');

    try {
        // Delete in order due to foreign key constraints

        // 1. Delete all room messages
        const roomMessages = await prisma.roomMessage.deleteMany({});
        console.log(`   Deleted ${roomMessages.count} room messages`);

        // 2. Delete all room members
        const roomMembers = await prisma.roomMember.deleteMany({});
        console.log(`   Deleted ${roomMembers.count} room members`);

        // 3. Delete all rooms
        const rooms = await prisma.room.deleteMany({});
        console.log(`   Deleted ${rooms.count} rooms`);

        // 4. Delete all conversation participants
        const participants = await prisma.conversationParticipant.deleteMany({});
        console.log(`   Deleted ${participants.count} conversation participants`);

        // 5. Delete all messages
        const messages = await prisma.message.deleteMany({});
        console.log(`   Deleted ${messages.count} messages`);

        // 6. Delete all conversations
        const conversations = await prisma.conversation.deleteMany({});
        console.log(`   Deleted ${conversations.count} conversations`);

        // 7. Delete all sessions
        const sessions = await prisma.session.deleteMany({});
        console.log(`   Deleted ${sessions.count} sessions`);

        // 8. Delete all character actions
        const actions = await prisma.action.deleteMany({});
        console.log(`   Deleted ${actions.count} character actions`);

        // 9. Delete all character memories
        const memories = await prisma.characterMemory.deleteMany({});
        console.log(`   Deleted ${memories.count} character memories`);

        // 10. Delete all characters
        const characters = await prisma.character.deleteMany({});
        console.log(`   Deleted ${characters.count} characters`);

        console.log('✅ Cleanup completed successfully!');

        // Verify cleanup
        const [
            remainingConversations,
            remainingCharacters,
            remainingSessions,
            remainingRooms
        ] = await Promise.all([
            prisma.conversation.count(),
            prisma.character.count(),
            prisma.session.count(),
            prisma.room.count()
        ]);

        console.log('\n📊 Database is now clean:');
        console.log(`   Characters: ${remainingCharacters}`);
        console.log(`   Conversations: ${remainingConversations}`);
        console.log(`   Sessions: ${remainingSessions}`);
        console.log(`   Rooms: ${remainingRooms}`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    cleanupTestData().catch((error) => {
        console.error('Failed to cleanup test data:', error);
        process.exit(1);
    });
}

module.exports = { cleanupTestData };