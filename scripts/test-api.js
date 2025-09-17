#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

class APITester {
    constructor(baseUrl = 'http://localhost:3000/api') {
        this.baseUrl = baseUrl;
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            tests: []
        };
        this.testCharacters = [];
        this.testRooms = [];

        // Check for test mode - default to read-only to prevent test data accumulation
        this.testMode = process.env.TEST_MODE || 'read-only';

        if (this.testMode === 'read-only') {
            this.log('🛡️  Running in READ-ONLY mode - no persistent test data will be created', 'yellow');
            this.log('   Set TEST_MODE=write to enable data creation for full testing', 'yellow');
        } else if (this.testMode === 'write') {
            this.log('⚠️  Running in WRITE mode - test data will be created and cleaned up', 'yellow');
        }
    }

    // Clean up any existing test data before starting tests
    async initialCleanup() {
        if (this.testMode === 'read-only') {
            this.log('🧹 Read-only mode: skipping initial cleanup', 'yellow');
            return;
        }

        this.log('🧹 Performing initial cleanup of existing test data...', 'yellow');

        try {
            // Get all characters and delete any test characters
            const charactersResponse = await this.request('/characters');
            if (charactersResponse.ok && Array.isArray(charactersResponse.data)) {
                for (const character of charactersResponse.data) {
                    if (character.name && (
                        character.name.includes('Test Character') ||
                        character.name.includes('Test API') ||
                        character.name.includes('API Test') ||
                        character.role === 'API Tester' ||
                        character.role === 'Assistant Tester'
                    )) {
                        try {
                            const deleteResponse = await this.request(`/characters/${character.id}`, { method: 'DELETE' });
                            if (deleteResponse.ok) {
                                this.log(`   🗑️  Cleaned up existing test character: ${character.name}`, 'yellow');
                            }
                        } catch (error) {
                            this.log(`   ⚠️  Failed to cleanup character ${character.name}: ${error.message}`, 'red');
                        }
                    }
                }
            }

            // Get all rooms and delete any test rooms
            const roomsResponse = await this.request('/rooms');
            if (roomsResponse.ok && Array.isArray(roomsResponse.data)) {
                for (const room of roomsResponse.data) {
                    if (room.name && (
                        room.name.includes('API Test') ||
                        room.name.includes('Test Room') ||
                        room.description?.includes('testing purposes')
                    )) {
                        try {
                            const deleteResponse = await this.request(`/rooms/${room.id}`, { method: 'DELETE' });
                            if (deleteResponse.ok) {
                                this.log(`   🗑️  Cleaned up existing test room: ${room.name}`, 'yellow');
                            }
                        } catch (error) {
                            this.log(`   ⚠️  Failed to cleanup room ${room.name}: ${error.message}`, 'red');
                        }
                    }
                }
            }
        } catch (error) {
            this.log(`   ⚠️  Initial cleanup encountered error: ${error.message}`, 'red');
        }
    }

    log(message, color = 'white') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            return {
                status: response.status,
                ok: response.ok,
                data,
                url
            };
        } catch (error) {
            return {
                status: 0,
                ok: false,
                error: error.message,
                url
            };
        }
    }

    async test(name, testFn) {
        this.results.total++;
        const startTime = Date.now();

        try {
            this.log(`\n🧪 Testing: ${name}`, 'cyan');
            const result = await testFn();
            const duration = Date.now() - startTime;

            if (result.success) {
                this.results.passed++;
                this.log(`✅ PASS: ${name} (${duration}ms)`, 'green');
            } else {
                this.results.failed++;
                this.log(`❌ FAIL: ${name} (${duration}ms)`, 'red');
                this.log(`   Error: ${result.error}`, 'red');
            }

            this.results.tests.push({
                name,
                success: result.success,
                error: result.error,
                duration,
                details: result.details || {}
            });

        } catch (error) {
            this.results.failed++;
            const duration = Date.now() - startTime;
            this.log(`❌ ERROR: ${name} (${duration}ms)`, 'red');
            this.log(`   Exception: ${error.message}`, 'red');

            this.results.tests.push({
                name,
                success: false,
                error: error.message,
                duration,
                details: {}
            });
        }
    }

    // Character API Tests
    async testGetCharacters() {
        return await this.test('GET /api/characters', async () => {
            const response = await this.request('/characters');

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}` };
            }

            if (!Array.isArray(response.data)) {
                return { success: false, error: 'Response should be an array of characters' };
            }

            return {
                success: true,
                details: {
                    count: response.data.length
                }
            };
        });
    }

    async testCreateCharacter() {
        return await this.test('POST /api/characters', async () => {
            // In read-only mode, simulate the test without creating actual data
            if (this.testMode === 'read-only') {
                // Simulate a successful character creation response
                const mockCharacter = {
                    id: 'mock-test-character-' + Date.now(),
                    name: 'Test Character API',
                    role: 'API Tester',
                    personality: 'A dedicated character created for API testing purposes.',
                    imageUrl: 'https://example.com/test-character.jpg'
                };

                // Add to test characters list for downstream tests (they'll be mocked too)
                this.testCharacters.push(mockCharacter.id);

                this.log('   ℹ️  Simulated character creation (read-only mode)', 'blue');

                return {
                    success: true,
                    details: {
                        characterId: mockCharacter.id,
                        name: mockCharacter.name,
                        role: mockCharacter.role,
                        mode: 'simulated'
                    }
                };
            }

            // Write mode - actually create the character
            const characterData = {
                name: 'Test Character API',
                role: 'API Tester',
                personality: 'A dedicated character created for API testing purposes.',
                imageUrl: 'https://example.com/test-character.jpg',
                foxp2Pattern: {
                    id: 'test-pattern-api',
                    name: 'API Test Pattern',
                    emotionalWeights: {
                        happiness: 0.7,
                        sadness: 0.2,
                        anger: 0.1,
                        fear: 0.3,
                        curiosity: 0.9,
                        aggression: 0.1
                    },
                    behavioralTraits: {
                        sociability: 0.8,
                        energy: 0.7,
                        creativity: 0.9,
                        loyalty: 0.8,
                        intelligence: 0.9
                    }
                }
            };

            const response = await this.request('/characters', {
                method: 'POST',
                body: characterData
            });

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}: ${JSON.stringify(response.data)}` };
            }

            const character = response.data.character || response.data;
            if (!character.id || character.name !== characterData.name) {
                return { success: false, error: `Created character missing required fields. Got: ${JSON.stringify(response.data)}` };
            }

            // Store for cleanup and further tests
            this.testCharacters.push(character.id);

            return {
                success: true,
                details: {
                    characterId: character.id,
                    name: character.name,
                    role: character.role,
                    mode: 'actual'
                }
            };
        });
    }

    async testGetCharacterDetails() {
        return await this.test('GET /api/characters/{id}', async () => {
            if (this.testCharacters.length === 0) {
                return { success: false, error: 'No test characters available' };
            }

            const characterId = this.testCharacters[0];
            const response = await this.request(`/characters/${characterId}`);

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}` };
            }

            const requiredFields = ['id', 'name', 'role', 'currentMood', 'isActive'];
            for (const field of requiredFields) {
                if (!(field in response.data)) {
                    return { success: false, error: `Missing required field: ${field}` };
                }
            }

            return {
                success: true,
                details: {
                    characterId: response.data.id,
                    name: response.data.name,
                    conversationCount: response.data.conversationCount || 0
                }
            };
        });
    }

    async testUpdateCharacter() {
        return await this.test('PUT /api/characters/{id}', async () => {
            if (this.testCharacters.length === 0) {
                return { success: false, error: 'No test characters available' };
            }

            const characterId = this.testCharacters[0];
            const updateData = {
                name: 'Updated Test Character',
                currentMood: 0.85
            };

            const response = await this.request(`/characters/${characterId}`, {
                method: 'PUT',
                body: updateData
            });

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}: ${JSON.stringify(response.data)}` };
            }

            if (response.data.name !== updateData.name || response.data.currentMood !== updateData.currentMood) {
                return { success: false, error: 'Character not updated correctly' };
            }

            return {
                success: true,
                details: {
                    characterId: response.data.id,
                    newName: response.data.name,
                    newMood: response.data.currentMood
                }
            };
        });
    }

    async testCharacterChat() {
        return await this.test('POST /api/characters/{id}/chat', async () => {
            if (this.testCharacters.length === 0) {
                return { success: false, error: 'No test characters available' };
            }

            const characterId = this.testCharacters[0];
            const chatData = {
                message: 'Hello! This is a test message from the API tester.'
            };

            const response = await this.request(`/characters/${characterId}/chat`, {
                method: 'POST',
                body: chatData
            });

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}: ${JSON.stringify(response.data)}` };
            }

            const requiredFields = ['conversationId', 'userMessage', 'characterResponse'];
            for (const field of requiredFields) {
                if (!(field in response.data)) {
                    return { success: false, error: `Missing required field: ${field}` };
                }
            }

            return {
                success: true,
                details: {
                    conversationId: response.data.conversationId,
                    characterResponse: response.data.characterResponse.content?.substring(0, 50) + '...'
                }
            };
        });
    }

    async testGetChatHistory() {
        return await this.test('GET /api/characters/{id}/chat', async () => {
            if (this.testCharacters.length === 0) {
                return { success: false, error: 'No test characters available' };
            }

            const characterId = this.testCharacters[0];
            const response = await this.request(`/characters/${characterId}/chat`);

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}` };
            }

            if (!Array.isArray(response.data.messages)) {
                return { success: false, error: 'Response should contain messages array' };
            }

            return {
                success: true,
                details: {
                    messageCount: response.data.messages.length,
                    hasMore: response.data.hasMore
                }
            };
        });
    }

    async testCharacterStatus() {
        return await this.test('GET /api/characters/{id}/status', async () => {
            if (this.testCharacters.length === 0) {
                return { success: false, error: 'No test characters available' };
            }

            const characterId = this.testCharacters[0];
            const response = await this.request(`/characters/${characterId}/status`);

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}` };
            }

            const requiredFields = ['characterId', 'name', 'status', 'activity', 'mood', 'availability'];
            for (const field of requiredFields) {
                if (!(field in response.data)) {
                    return { success: false, error: `Missing required field: ${field}` };
                }
            }

            return {
                success: true,
                details: {
                    status: response.data.status,
                    activity: response.data.activity.type,
                    mood: response.data.mood.level
                }
            };
        });
    }

    async testAllCharacterStatuses() {
        return await this.test('GET /api/characters/status', async () => {
            const response = await this.request('/characters/status');

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}` };
            }

            if (!Array.isArray(response.data.characters) || !response.data.summary) {
                return { success: false, error: 'Response should contain characters array and summary' };
            }

            return {
                success: true,
                details: {
                    totalCharacters: response.data.summary.totalCharacters,
                    activeCharacters: response.data.summary.activeCharacters,
                    averageMood: response.data.summary.averageMood
                }
            };
        });
    }

    async testCreateRoom() {
        return await this.test('POST /api/rooms', async () => {
            // In read-only mode, simulate the test without creating actual data
            if (this.testMode === 'read-only') {
                // Ensure we have mock characters for the room
                if (this.testCharacters.length < 2) {
                    this.testCharacters.push('mock-test-character-2-' + Date.now());
                }

                const mockRoom = {
                    id: 'mock-test-room-' + Date.now(),
                    name: 'API Test Room',
                    description: 'A room created for API testing purposes',
                    participants: this.testCharacters.slice(0, 2).map(id => ({ id, name: 'Mock Character' }))
                };

                this.testRooms.push(mockRoom.id);

                this.log('   ℹ️  Simulated room creation (read-only mode)', 'blue');

                return {
                    success: true,
                    details: {
                        roomId: mockRoom.id,
                        name: mockRoom.name,
                        participantCount: mockRoom.participants.length,
                        mode: 'simulated'
                    }
                };
            }

            // Write mode - actually create the room and characters
            if (this.testCharacters.length < 2) {
                // Create a second character for room testing
                const characterData = {
                    name: 'Test Character 2',
                    role: 'Assistant Tester',
                    personality: 'A helpful assistant for room testing.',
                    foxp2Pattern: {
                        id: 'test-pattern-assistant',
                        name: 'Assistant Test Pattern',
                        emotionalWeights: {
                            happiness: 0.8,
                            sadness: 0.2,
                            anger: 0.1,
                            fear: 0.2,
                            curiosity: 0.7,
                            aggression: 0.1
                        },
                        behavioralTraits: {
                            sociability: 0.9,
                            energy: 0.6,
                            creativity: 0.6,
                            loyalty: 0.9,
                            intelligence: 0.8
                        }
                    }
                };

                const charResponse = await this.request('/characters', {
                    method: 'POST',
                    body: characterData
                });

                if (charResponse.ok) {
                    const character = charResponse.data.character || charResponse.data;
                    this.testCharacters.push(character.id);
                }
            }

            const roomData = {
                name: 'API Test Room',
                characterIds: this.testCharacters.slice(0, 2),
                description: 'A room created for API testing purposes'
            };

            const response = await this.request('/rooms', {
                method: 'POST',
                body: roomData
            });

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}: ${JSON.stringify(response.data)}` };
            }

            if (!response.data.id || response.data.name !== roomData.name) {
                return { success: false, error: 'Created room missing required fields' };
            }

            // Store for cleanup and further tests
            this.testRooms.push(response.data.id);

            return {
                success: true,
                details: {
                    roomId: response.data.id,
                    name: response.data.name,
                    participantCount: response.data.participants.length,
                    mode: 'actual'
                }
            };
        });
    }

    async testGetRooms() {
        return await this.test('GET /api/rooms', async () => {
            const response = await this.request('/rooms');

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}` };
            }

            if (!Array.isArray(response.data.rooms)) {
                return { success: false, error: 'Response should contain rooms array' };
            }

            return {
                success: true,
                details: {
                    roomCount: response.data.rooms.length,
                    hasMore: response.data.hasMore
                }
            };
        });
    }

    async testRoomChat() {
        return await this.test('POST /api/rooms/{id}/chat', async () => {
            if (this.testRooms.length === 0) {
                return { success: false, error: 'No test rooms available' };
            }

            const roomId = this.testRooms[0];
            const chatData = {
                message: 'Hello everyone! This is a test message in the room.',
                triggerResponses: true
            };

            const response = await this.request(`/rooms/${roomId}/chat`, {
                method: 'POST',
                body: chatData
            });

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}: ${JSON.stringify(response.data)}` };
            }

            if (!response.data.message || !response.data.roomId) {
                return { success: false, error: 'Response missing required fields' };
            }

            return {
                success: true,
                details: {
                    roomId: response.data.roomId,
                    messageId: response.data.message.id,
                    characterResponses: response.data.characterResponses?.length || 0
                }
            };
        });
    }

    // Cleanup function
    async cleanup() {
        this.log('\n🧹 Cleaning up test data...', 'yellow');

        if (this.testMode === 'read-only') {
            // In read-only mode, just clear the mock data arrays
            this.log('   ℹ️  Read-only mode: clearing mock data references', 'blue');
            const mockRooms = this.testRooms.filter(id => id.startsWith('mock-')).length;
            const mockCharacters = this.testCharacters.filter(id => id.startsWith('mock-')).length;

            this.testCharacters = [];
            this.testRooms = [];

            this.log(`\n✨ Cleanup completed: ${mockCharacters} mock characters, ${mockRooms} mock rooms cleared`, 'cyan');
            return;
        }

        // Write mode - actually delete the created data
        // Delete test rooms first (they depend on characters)
        let roomsDeleted = 0;
        for (const roomId of this.testRooms) {
            // Skip mock IDs if any somehow got mixed in
            if (roomId.startsWith('mock-')) {
                continue;
            }

            try {
                const response = await this.request(`/rooms/${roomId}`, { method: 'DELETE' });
                if (response.ok) {
                    this.log(`   ✅ Deleted room: ${roomId}`, 'green');
                    roomsDeleted++;
                } else {
                    this.log(`   ❌ Failed to delete room ${roomId}: HTTP ${response.status}`, 'red');
                }
            } catch (error) {
                this.log(`   ❌ Failed to delete room ${roomId}: ${error.message}`, 'red');
            }
        }

        // Delete test characters
        let charactersDeleted = 0;
        for (const characterId of this.testCharacters) {
            // Skip mock IDs if any somehow got mixed in
            if (characterId.startsWith('mock-')) {
                continue;
            }

            try {
                const response = await this.request(`/characters/${characterId}`, { method: 'DELETE' });
                if (response.ok) {
                    this.log(`   ✅ Deleted character: ${characterId}`, 'green');
                    charactersDeleted++;
                } else {
                    this.log(`   ❌ Failed to delete character ${characterId}: HTTP ${response.status}`, 'red');
                }
            } catch (error) {
                this.log(`   ❌ Failed to delete character ${characterId}: ${error.message}`, 'red');
            }
        }

        this.log(`\n✨ Cleanup completed: ${charactersDeleted}/${this.testCharacters.length} characters, ${roomsDeleted}/${this.testRooms.length} rooms deleted`, 'cyan');

        // Clear the arrays after cleanup
        this.testCharacters = [];
        this.testRooms = [];
    }

    async runAllTests() {
        this.log('🚀 Starting FOXP2 API Test Suite', 'bright');
        this.log('=====================================', 'bright');

        // Clean up any existing test data first
        await this.initialCleanup();

        try {
            // Character API Tests
            await this.testGetCharacters();
            await this.testCreateCharacter();
            await this.testGetCharacterDetails();
            await this.testUpdateCharacter();
            await this.testCharacterChat();
            await this.testGetChatHistory();
            await this.testCharacterStatus();
            await this.testAllCharacterStatuses();

            // Room API Tests
            await this.testCreateRoom();
            await this.testGetRooms();
            await this.testRoomChat();

        } catch (error) {
            this.log(`\n❌ Test suite encountered an error: ${error.message}`, 'red');
        } finally {
            // Always cleanup, regardless of test success/failure
            await this.cleanup();
        }

        // Final Results
        this.log('\n📊 Test Results Summary', 'bright');
        this.log('======================', 'bright');
        this.log(`Total Tests: ${this.results.total}`, 'white');
        this.log(`Passed: ${this.results.passed}`, 'green');
        this.log(`Failed: ${this.results.failed}`, 'red');
        this.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`,
            this.results.failed === 0 ? 'green' : 'yellow');

        // Save results to JSON file for frontend consumption
        const resultsPath = path.join(__dirname, '..', 'test-results.json');
        fs.writeFileSync(resultsPath, JSON.stringify({
            ...this.results,
            timestamp: new Date().toISOString(),
            baseUrl: this.baseUrl
        }, null, 2));

        this.log(`\n📁 Results saved to: ${resultsPath}`, 'cyan');

        return this.results;
    }
}

// Run tests if called directly
if (require.main === module) {
    const baseUrl = process.argv[2] || 'http://localhost:3000/api';
    const tester = new APITester(baseUrl);

    tester.runAllTests()
        .then(results => {
            process.exit(results.failed === 0 ? 0 : 1);
        })
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = APITester;
