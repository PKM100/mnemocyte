const { PrismaClient } = require('../generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function migrateSessions() {
    try {
        console.log('Starting migration of sessions.json to database...');

        // Read sessions.json
        const sessionsFilePath = path.join(__dirname, '..', 'sessions.json');
        if (!fs.existsSync(sessionsFilePath)) {
            console.log('sessions.json not found, skipping migration');
            return;
        }

        const sessionsData = JSON.parse(fs.readFileSync(sessionsFilePath, 'utf8'));
        console.log(`Found ${sessionsData.length} sessions to migrate`);

        // Read characters for reference
        const charactersFilePath = path.join(__dirname, '..', 'characters.json');
        let characters = [];
        if (fs.existsSync(charactersFilePath)) {
            characters = JSON.parse(fs.readFileSync(charactersFilePath, 'utf8'));
            console.log(`Found ${characters.length} characters for reference`);
        }

        for (const sessionData of sessionsData) {
            // Skip empty sessions
            if (!sessionData.messages || sessionData.messages.length === 0) {
                console.log(`Skipping empty session: ${sessionData.id}`);
                continue;
            }

            console.log(`Migrating session: ${sessionData.id}`);

            // Create or update session
            await prisma.session.upsert({
                where: { id: sessionData.id },
                update: {
                    sessionData: JSON.stringify({
                        activeCharacters: sessionData.activeCharacters || [],
                        userCommands: sessionData.userCommands || []
                    }),
                    lastActivity: new Date(sessionData.startTime),
                    updatedAt: new Date()
                },
                create: {
                    id: sessionData.id,
                    sessionData: JSON.stringify({
                        activeCharacters: sessionData.activeCharacters || [],
                        userCommands: sessionData.userCommands || []
                    }),
                    createdAt: new Date(sessionData.startTime),
                    lastActivity: new Date(sessionData.startTime),
                    isActive: false // Old sessions are inactive
                }
            });

            // Create conversation for this session
            const conversationId = `conv_${sessionData.id.replace('session-', '')}`;

            // Get unique character participants
            const characterIds = [...new Set(
                sessionData.messages
                    .filter(msg => msg.characterId)
                    .map(msg => msg.characterId)
            )];

            // Generate conversation title
            const participantNames = characterIds
                .map(id => {
                    const character = characters.find(c => c.id === id);
                    return character ? character.name : 'Unknown';
                })
                .filter(name => name !== 'Unknown')
                .slice(0, 3);

            const title = participantNames.length > 0
                ? `Conversation with ${participantNames.join(', ')}`
                : `Session ${sessionData.id}`;

            // Create conversation
            await prisma.conversation.upsert({
                where: { id: conversationId },
                update: {
                    title,
                    updatedAt: new Date(sessionData.messages[sessionData.messages.length - 1]?.timestamp || sessionData.startTime),
                    isActive: false
                },
                create: {
                    id: conversationId,
                    title,
                    type: 'session',
                    createdAt: new Date(sessionData.startTime),
                    isActive: false,
                    sessionData: JSON.stringify({
                        originalSessionId: sessionData.id
                    })
                }
            });

            // Add participants
            for (const characterId of characterIds) {
                await prisma.conversationParticipant.upsert({
                    where: {
                        conversationId_characterId: {
                            conversationId,
                            characterId
                        }
                    },
                    update: {
                        isActive: false,
                        lastSeen: new Date(sessionData.messages[sessionData.messages.length - 1]?.timestamp || sessionData.startTime)
                    },
                    create: {
                        id: `${conversationId}_${characterId}`,
                        conversationId,
                        characterId,
                        joinedAt: new Date(sessionData.startTime),
                        isActive: false,
                        lastSeen: new Date(sessionData.messages[sessionData.messages.length - 1]?.timestamp || sessionData.startTime)
                    }
                });
            }

            // Add messages
            for (let i = 0; i < sessionData.messages.length; i++) {
                const message = sessionData.messages[i];
                await prisma.message.upsert({
                    where: { id: message.id },
                    update: {
                        content: message.message,
                        timestamp: new Date(message.timestamp),
                        messageOrder: i
                    },
                    create: {
                        id: message.id,
                        conversationId,
                        characterId: message.characterId || null,
                        content: message.message,
                        type: 'chat',
                        messageOrder: i,
                        timestamp: new Date(message.timestamp),
                        metadata: JSON.stringify({
                            sender: message.sender,
                            originalSessionId: message.sessionId
                        })
                    }
                });
            }

            // Update session with current conversation
            await prisma.session.update({
                where: { id: sessionData.id },
                data: {
                    currentConversationId: conversationId
                }
            });

            console.log(`✓ Migrated session ${sessionData.id} with ${sessionData.messages.length} messages`);
        }

        console.log('Migration completed successfully!');

        // Print summary
        const totalConversations = await prisma.conversation.count();
        const totalMessages = await prisma.message.count();
        const totalSessions = await prisma.session.count();

        console.log(`\nSummary:`);
        console.log(`Total conversations: ${totalConversations}`);
        console.log(`Total messages: ${totalMessages}`);
        console.log(`Total sessions: ${totalSessions}`);

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    migrateSessions().catch(console.error);
}

module.exports = { migrateSessions };