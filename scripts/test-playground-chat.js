#!/usr/bin/env node

// Simple test script to validate playground chat functionality

const fetch = globalThis.fetch;

const API_BASE = 'http://localhost:3000';

async function testPlaygroundChat() {
    console.log('🧪 Testing Playground Chat Functionality\n');

    try {
        // First, get available characters
        console.log('1. Fetching available characters...');
        const charactersResponse = await fetch(`${API_BASE}/api/characters`);
        if (!charactersResponse.ok) {
            throw new Error(`Failed to fetch characters: ${charactersResponse.status}`);
        }

        const characters = await charactersResponse.json();
        console.log(`   Found ${characters.length} characters:`);

        for (const char of characters) {
            const sociability = char.foxp2Pattern.behavioralTraits.sociability;
            console.log(`   - ${char.name} (${char.role}) - Sociability: ${sociability.toFixed(2)}`);
        }

        // Test with the most social character
        const mostSocialChar = characters.reduce((prev, current) =>
            (prev.foxp2Pattern.behavioralTraits.sociability > current.foxp2Pattern.behavioralTraits.sociability) ? prev : current
        );

        console.log(`\n2. Testing chat with most social character: ${mostSocialChar.name}`);

        const chatPayload = {
            message: "Hello! How are you feeling today? Tell me about yourself.",
            character: mostSocialChar,
            conversationHistory: [],
            worldContext: {
                activeCharacters: [{ name: mostSocialChar.name, role: mostSocialChar.role }],
                isMultiCharacter: false,
                isDirectlyMentioned: true,
                isGeneralQuestion: false
            }
        };

        const chatResponse = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(chatPayload)
        });

        if (!chatResponse.ok) {
            throw new Error(`Chat API failed: ${chatResponse.status}`);
        }

        const chatResult = await chatResponse.json();

        console.log(`\n3. Chat Result:`);
        console.log(`   Should Respond: ${chatResult.shouldRespond}`);
        console.log(`   Response: "${chatResult.response}"`);
        console.log(`   Behavior Changed: ${chatResult.behaviorChanged}`);

        if (chatResult.shouldRespond && chatResult.response) {
            console.log('\n✅ SUCCESS: Character responded in playground mode!');
            console.log('\n🎯 The playground should now work properly.');
            console.log('   Characters will respond to messages in 1-on-1 conversations.');
        } else {
            console.log('\n❌ ISSUE: Character did not respond properly');
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Make sure the dev server is running: npm run dev');
        console.log('2. Check that characters exist in the database');
        console.log('3. Verify AI service configuration in .env.local');
    }
}

testPlaygroundChat();