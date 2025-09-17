const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedMetaConfig() {
    try {
        console.log('🌱 Seeding Meta Configuration data...');

        // Read existing characters to extract actions and roles
        const charactersPath = path.join(process.cwd(), 'characters.json');
        const charactersData = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));

        // Extract unique actions
        const actionSet = new Set();
        const roleSet = new Set();

        charactersData.forEach((character) => {
            // Extract actions
            if (character.actions && Array.isArray(character.actions)) {
                character.actions.forEach((action) => {
                    // Handle both string actions and action objects
                    const actionName = typeof action === 'string' ? action : action.name;
                    if (actionName) actionSet.add(actionName);
                });
            }

            // Extract roles  
            if (character.role) {
                roleSet.add(character.role);
            }
        });

        // Seed Actions
        console.log('📋 Seeding Actions...');
        const actionDescriptions = {
            'Battle Cry': 'Lets out a fierce war cry to intimidate enemies and rally allies',
            'Shield Bash': 'Uses shield as a weapon to stun and disorient opponents',
            'Battle Strike': 'Delivers a powerful melee attack with enhanced damage',
            'Protective Ward': 'Creates a defensive barrier to protect allies from harm',
            'Vigilant Watch': 'Maintains constant awareness of surroundings for threats',
            'Research': 'Conducts scholarly investigation into various topics',
            'Ancient Knowledge': 'Recalls information from historical texts and lore',
            'Knowledge Inquiry': 'Asks probing questions to uncover hidden information',
            'Track': 'Follows trails and signs to locate targets or paths',
            'Survival Instinct': 'Uses natural survival skills in wilderness situations',
            'Path Finding': 'Navigates through unknown terrain using wayfinding skills'
        };

        console.log('Found actions:', Array.from(actionSet));
        console.log('Found roles:', Array.from(roleSet));

        for (const actionName of actionSet) {
            const nameStr = String(actionName);
            await prisma.action.upsert({
                where: { name: nameStr },
                update: {},
                create: {
                    name: nameStr,
                    description: actionDescriptions[nameStr] || `Performs ${nameStr.toLowerCase()} action`,
                    effects: JSON.stringify([])
                }
            });
        }

        console.log(`✅ Seeded ${actionSet.size} actions`);

        // Seed Character Roles
        console.log('👥 Seeding Character Roles...');
        const roleDescriptions = {
            'warrior': 'A fierce combatant skilled in battle and warfare tactics',
            'guardian': 'A protective defender who shields others from harm',
            'scholar': 'A learned individual devoted to knowledge and research',
            'wanderer': 'A traveling explorer with survival and navigation skills',
            'mage': 'A practitioner of magical arts and arcane knowledge',
            'rogue': 'A stealthy individual skilled in infiltration and cunning',
            'healer': 'A supportive character focused on restoration and aid',
            'merchant': 'A trader skilled in commerce and negotiation'
        };

        for (const roleName of roleSet) {
            const nameStr = String(roleName);
            await prisma.characterRole.upsert({
                where: { name: nameStr },
                update: {},
                create: {
                    name: nameStr,
                    description: roleDescriptions[nameStr] || `A character with the ${nameStr} role`
                }
            });
        }

        console.log(`✅ Seeded ${roleSet.size} character roles`);

        // Seed some default memory templates
        console.log('🧠 Seeding Memory Templates...');
        const defaultMemories = [
            {
                heading: 'Childhood Memory',
                content: 'A formative experience from the character\'s early years that shaped their personality and worldview.'
            },
            {
                heading: 'Greatest Achievement',
                content: 'The character\'s most proud accomplishment that defines their sense of self-worth and purpose.'
            },
            {
                heading: 'Deepest Fear',
                content: 'A profound fear that influences the character\'s decisions and behaviors in stressful situations.'
            },
            {
                heading: 'Lost Love',
                content: 'A romantic relationship or deep friendship that was lost, creating lasting emotional impact.'
            },
            {
                heading: 'Mentor\'s Wisdom',
                content: 'Important teachings or advice from a mentor figure that guides the character\'s actions.'
            },
            {
                heading: 'Tragic Loss',
                content: 'A significant loss that created trauma and changed the character\'s perspective on life.'
            }
        ];

        for (const memory of defaultMemories) {
            await prisma.memoryTemplate.upsert({
                where: { heading: memory.heading },
                update: {},
                create: {
                    heading: memory.heading,
                    content: memory.content
                }
            });
        }

        console.log(`✅ Seeded ${defaultMemories.length} memory templates`);

        console.log('🎉 Meta Configuration seeding completed successfully!');

    } catch (error) {
        console.error('❌ Error seeding Meta Configuration data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedMetaConfig().catch((error) => {
    console.error(error);
    process.exit(1);
});
