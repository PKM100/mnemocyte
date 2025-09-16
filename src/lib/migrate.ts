import { prisma } from '../lib/db'
import fs from 'fs'
import path from 'path'

// Types for existing data
interface LegacyCharacter {
    id: string
    name: string
    role: string
    description?: string
    foxp2Pattern: any
    currentMood: number
    memoryBank: any[]
    routines: any[]
    actions: any[]
}

interface LegacySession {
    id: string
    sessionData: any
    currentConversationId?: string
    createdAt: string
    lastActivity: string
}

export async function migrateLegacyData() {
    console.log('🔄 Starting legacy data migration...')

    try {
        // Migrate characters from JSON file
        const charactersPath = path.join(process.cwd(), 'characters.json')
        if (fs.existsSync(charactersPath)) {
            const charactersData = JSON.parse(fs.readFileSync(charactersPath, 'utf8'))

            for (const char of charactersData) {
                const existingChar = await prisma.character.findFirst({
                    where: { name: char.name }
                })

                if (!existingChar) {
                    await prisma.character.create({
                        data: {
                            id: char.id || undefined,
                            name: char.name,
                            role: char.role,
                            description: char.description,
                            imageUrl: char.imageUrl,
                            foxp2Pattern: JSON.stringify(char.foxp2Pattern),
                            currentMood: char.currentMood || 0.5,
                            memoryBank: JSON.stringify(char.memoryBank || []),
                            routines: JSON.stringify(char.routines || []),
                            actions: JSON.stringify(char.actions || [])
                        }
                    })
                    console.log(`✅ Migrated character: ${char.name}`)
                }
            }
        }

        // Migrate sessions from JSON file
        const sessionsPath = path.join(process.cwd(), 'sessions.json')
        if (fs.existsSync(sessionsPath)) {
            const sessionsData = JSON.parse(fs.readFileSync(sessionsPath, 'utf8'))

            for (const session of sessionsData) {
                const existingSession = await prisma.session.findUnique({
                    where: { id: session.id }
                })

                if (!existingSession) {
                    await prisma.session.create({
                        data: {
                            id: session.id,
                            sessionData: JSON.stringify(session.sessionData || {}),
                            currentConversationId: session.currentConversationId,
                            createdAt: session.createdAt ? new Date(session.createdAt) : new Date(),
                            lastActivity: session.lastActivity ? new Date(session.lastActivity) : new Date()
                        }
                    })
                    console.log(`✅ Migrated session: ${session.id}`)
                }
            }
        }

        console.log('✅ Legacy data migration completed!')
    } catch (error) {
        console.error('❌ Migration failed:', error)
        throw error
    }
}

export async function seedDatabase() {
    console.log('🌱 Seeding database with sample data...')

    try {
        // Create sample characters if none exist
        const characterCount = await prisma.character.count()

        if (characterCount === 0) {
            const sampleCharacters = [
                {
                    name: "Aria the Wise",
                    role: "mage",
                    description: "A knowledgeable mage with a deep understanding of ancient magic",
                    foxp2Pattern: {
                        emotionalWeights: {
                            joy: 0.6,
                            fear: 0.2,
                            anger: 0.1,
                            sadness: 0.3
                        },
                        behavioralTraits: {
                            aggression: 0.2,
                            sociability: 0.7,
                            curiosity: 0.9
                        }
                    },
                    currentMood: 0.7,
                    memoryBank: [],
                    routines: ["study ancient texts", "brew potions", "meditate"],
                    actions: ["cast spell", "read tome", "give advice"]
                },
                {
                    name: "Thorgar the Bold",
                    role: "warrior",
                    description: "A brave warrior who protects the innocent",
                    foxp2Pattern: {
                        emotionalWeights: {
                            joy: 0.8,
                            fear: 0.1,
                            anger: 0.4,
                            sadness: 0.2
                        },
                        behavioralTraits: {
                            aggression: 0.8,
                            sociability: 0.6,
                            curiosity: 0.4
                        }
                    },
                    currentMood: 0.8,
                    memoryBank: [],
                    routines: ["train with sword", "patrol town", "help villagers"],
                    actions: ["swing sword", "block attack", "rally allies"]
                },
                {
                    name: "Luna the Shadow",
                    role: "rogue",
                    description: "A mysterious rogue with a hidden past",
                    foxp2Pattern: {
                        emotionalWeights: {
                            joy: 0.4,
                            fear: 0.3,
                            anger: 0.5,
                            sadness: 0.6
                        },
                        behavioralTraits: {
                            aggression: 0.6,
                            sociability: 0.3,
                            curiosity: 0.8
                        }
                    },
                    currentMood: 0.5,
                    memoryBank: [],
                    routines: ["scout ahead", "practice stealth", "gather information"],
                    actions: ["sneak attack", "pick lock", "disappear into shadows"]
                }
            ]

            for (const char of sampleCharacters) {
                await prisma.character.create({
                    data: {
                        ...char,
                        foxp2Pattern: JSON.stringify(char.foxp2Pattern),
                        memoryBank: JSON.stringify(char.memoryBank),
                        routines: JSON.stringify(char.routines),
                        actions: JSON.stringify(char.actions)
                    }
                })
                console.log(`✅ Created sample character: ${char.name}`)
            }
        }

        console.log('✅ Database seeding completed!')
    } catch (error) {
        console.error('❌ Seeding failed:', error)
        throw error
    }
}

// Main migration function
export async function runMigrations() {
    try {
        await migrateLegacyData()
        await seedDatabase()
    } catch (error) {
        console.error('❌ Migration process failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations()
}
