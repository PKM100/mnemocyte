'use client';

import { useState, useEffect } from 'react';
import { MinecraftButton, MinecraftCard, MinecraftContainer } from '@/components/ui/minecraft-ui';

interface TestResult {
    name: string;
    success: boolean;
    error?: string;
    duration: number;
    details: Record<string, any>;
}

interface TestResults {
    passed: number;
    failed: number;
    total: number;
    tests: TestResult[];
    timestamp: string;
    baseUrl: string;
}

interface ApiEndpoint {
    method: string;
    path: string;
    description: string;
    parameters?: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
    }>;
    example?: {
        request?: any;
        response?: any;
    };
}

export default function ApiDocumentationPage() {
    const [testResults, setTestResults] = useState<TestResults | null>(null);
    const [isRunningTests, setIsRunningTests] = useState(false);
    const [testOutput, setTestOutput] = useState<string>('');
    const [activeSection, setActiveSection] = useState('overview');

    // Load existing test results on component mount
    useEffect(() => {
        loadTestResults();
    }, []);

    const loadTestResults = async () => {
        try {
            const response = await fetch('/api/test');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setTestResults(data.results);
                }
            }
        } catch (error) {
            console.error('Failed to load test results:', error);
        }
    };

    const runTests = async () => {
        setIsRunningTests(true);
        setTestOutput('🚀 Starting API tests...\n');

        try {
            const response = await fetch('/api/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baseUrl: 'http://localhost:3000/api' })
            });

            const data = await response.json();

            if (data.success && data.results) {
                setTestResults(data.results);
                setTestOutput(data.stdout || 'Tests completed successfully!');
            } else {
                setTestOutput(`Tests failed:\n${data.stderr || data.error || 'Unknown error'}`);
            }
        } catch (error) {
            setTestOutput(`Error running tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsRunningTests(false);
        }
    };

    const apiEndpoints: Record<string, ApiEndpoint[]> = {
        characters: [
            {
                method: 'GET',
                path: '/api/characters',
                description: 'Get list of all characters',
                parameters: [
                    { name: 'limit', type: 'number', required: false, description: 'Number of characters to return (default: 20)' },
                    { name: 'offset', type: 'number', required: false, description: 'Number of characters to skip (default: 0)' },
                    { name: 'active', type: 'boolean', required: false, description: 'Filter by active status' }
                ]
            },
            {
                method: 'POST',
                path: '/api/characters',
                description: 'Create a new character',
                example: {
                    request: {
                        name: "Alice",
                        role: "Researcher",
                        personality: "Curious and analytical scientist",
                        imageUrl: "https://example.com/alice.jpg"
                    }
                }
            },
            {
                method: 'GET',
                path: '/api/characters/{id}',
                description: 'Get detailed information about a specific character'
            },
            {
                method: 'PUT',
                path: '/api/characters/{id}',
                description: 'Update character information'
            },
            {
                method: 'DELETE',
                path: '/api/characters/{id}',
                description: 'Delete a character'
            }
        ],
        chat: [
            {
                method: 'POST',
                path: '/api/characters/{id}/chat',
                description: 'Send a message to a character and get AI response',
                example: {
                    request: { message: "Hello, how are you today?" },
                    response: {
                        conversationId: "conv-123",
                        userMessage: { content: "Hello, how are you today!", sender: "user" },
                        characterResponse: { content: "As Alice, I find your message quite intriguing...", sender: "Alice" }
                    }
                }
            },
            {
                method: 'GET',
                path: '/api/characters/{id}/chat',
                description: 'Get chat history with a character'
            }
        ],
        rooms: [
            {
                method: 'GET',
                path: '/api/rooms',
                description: 'Get list of all conversation rooms'
            },
            {
                method: 'POST',
                path: '/api/rooms',
                description: 'Create a new conversation room with selected characters',
                example: {
                    request: {
                        name: "Research Discussion",
                        characterIds: ["char-1", "char-2"],
                        description: "A room for researchers to collaborate"
                    }
                }
            },
            {
                method: 'GET',
                path: '/api/rooms/{id}',
                description: 'Get room details and message history'
            },
            {
                method: 'POST',
                path: '/api/rooms/{id}/chat',
                description: 'Send message to room and trigger character responses'
            }
        ],
        status: [
            {
                method: 'GET',
                path: '/api/characters/{id}/status',
                description: 'Get current status and activity of a character'
            },
            {
                method: 'GET',
                path: '/api/characters/status',
                description: 'Get status overview of all characters'
            },
            {
                method: 'PUT',
                path: '/api/characters/{id}/status',
                description: 'Update character status manually'
            }
        ]
    };

    const renderTestResults = () => {
        if (!testResults) return null;

        const successRate = (testResults.passed / testResults.total) * 100;

        return (
            <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MinecraftCard className="text-center">
                        <div className="text-minecraft-lg font-minecraft text-green-400 mb-2">{testResults.passed}</div>
                        <div className="text-minecraft-sm text-gray-200 font-minecraft">Passed</div>
                    </MinecraftCard>
                    <MinecraftCard className="text-center">
                        <div className="text-minecraft-lg font-minecraft text-red-400 mb-2">{testResults.failed}</div>
                        <div className="text-minecraft-sm text-gray-200 font-minecraft">Failed</div>
                    </MinecraftCard>
                    <MinecraftCard className="text-center">
                        <div className="text-minecraft-lg font-minecraft text-blue-400 mb-2">{testResults.total}</div>
                        <div className="text-minecraft-sm text-gray-200 font-minecraft">Total</div>
                    </MinecraftCard>
                    <MinecraftCard className="text-center">
                        <div className={`text-minecraft-lg font-minecraft mb-2 ${successRate === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {successRate.toFixed(1)}%
                        </div>
                        <div className="text-minecraft-sm text-gray-200 font-minecraft">Success Rate</div>
                    </MinecraftCard>
                </div>

                {/* Individual Test Results */}
                <MinecraftCard>
                    <h3 className="text-minecraft-lg font-minecraft text-white mb-6">Test Details</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {testResults.tests.map((test, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded border-2 ${test.success
                                        ? 'border-green-500 bg-green-900/30'
                                        : 'border-red-500 bg-red-900/30'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-lg ${test.success ? 'text-green-400' : 'text-red-400'}`}>
                                                {test.success ? '✅' : '❌'}
                                            </span>
                                            <span className="font-minecraft text-minecraft-md text-white">{test.name}</span>
                                            <span className="text-minecraft-sm text-gray-400">({test.duration}ms)</span>
                                        </div>
                                        {test.error && (
                                            <div className="text-red-300 text-minecraft-sm mt-2 font-mono bg-red-900/20 p-2 rounded">
                                                Error: {test.error}
                                            </div>
                                        )}
                                        {Object.keys(test.details).length > 0 && (
                                            <div className="text-minecraft-sm text-gray-200 mt-2 bg-gray-800/50 p-2 rounded">
                                                {Object.entries(test.details).map(([key, value]) => (
                                                    <span key={key} className="mr-4 font-mono">
                                                        <span className="text-blue-300">{key}:</span> <span className="text-green-300">{JSON.stringify(value)}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </MinecraftCard>

                <div className="text-minecraft-sm text-gray-300 text-center font-minecraft">
                    Last run: {new Date(testResults.timestamp).toLocaleString()}
                </div>
            </div>
        );
    };

    const renderEndpoints = (endpoints: ApiEndpoint[]) => {
        return (
            <div className="space-y-6">
                {endpoints.map((endpoint, index) => (
                    <MinecraftCard key={index}>
                        <div className="flex items-center gap-4 mb-4">
                            <span className={`px-3 py-2 rounded font-minecraft text-minecraft-sm font-bold border-2 ${endpoint.method === 'GET' ? 'bg-blue-600 border-blue-400 text-white' :
                                    endpoint.method === 'POST' ? 'bg-green-600 border-green-400 text-white' :
                                        endpoint.method === 'PUT' ? 'bg-yellow-600 border-yellow-400 text-black' :
                                            endpoint.method === 'DELETE' ? 'bg-red-600 border-red-400 text-white' : 'bg-gray-600 border-gray-400 text-white'
                                }`}>
                                {endpoint.method}
                            </span>
                            <code className="text-blue-300 font-mono text-minecraft-md">{endpoint.path}</code>
                        </div>

                        <p className="text-gray-200 mb-4 text-minecraft-md leading-relaxed">{endpoint.description}</p>

                        {endpoint.parameters && (
                            <div className="mb-4">
                                <h4 className="font-minecraft text-minecraft-md text-white mb-3">Parameters:</h4>
                                <div className="space-y-2 bg-gray-900 border-2 border-gray-600 p-4 rounded">
                                    {endpoint.parameters.map((param, pidx) => (
                                        <div key={pidx} className="text-minecraft-sm">
                                            <code className="text-green-300 font-mono">{param.name}</code>
                                            <span className="text-gray-400"> ({param.type})</span>
                                            {param.required && <span className="text-red-400 font-bold"> *required</span>}
                                            <span className="text-gray-200 ml-3">{param.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {endpoint.example && (
                            <div className="space-y-4">
                                {endpoint.example.request && (
                                    <div>
                                        <h4 className="font-minecraft text-minecraft-md text-white mb-2">Example Request:</h4>
                                        <pre className="bg-gray-900 border-2 border-gray-600 p-4 rounded text-minecraft-sm overflow-x-auto text-green-300 font-mono">
                                            {JSON.stringify(endpoint.example.request, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                {endpoint.example.response && (
                                    <div>
                                        <h4 className="font-minecraft text-minecraft-md text-white mb-2">Example Response:</h4>
                                        <pre className="bg-gray-900 border-2 border-gray-600 p-4 rounded text-minecraft-sm overflow-x-auto text-blue-300 font-mono">
                                            {JSON.stringify(endpoint.example.response, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </MinecraftCard>
                ))}
            </div>
        );
    };

    return (
        <MinecraftContainer>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="minecraft-panel mb-8 text-center">
                    <h1 className="text-minecraft-xl font-minecraft text-white mb-4">🚀 FOXP2 API Documentation</h1>
                    <p className="text-minecraft-sm text-gray-200 mb-6">
                        Complete REST API for Mnemocyte Smart NPCs
                    </p>

                    {/* Test Controls */}
                    <div className="flex justify-center gap-4">
                        <MinecraftButton
                            onClick={runTests}
                            disabled={isRunningTests}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isRunningTests ? '🧪 Running Tests...' : '🧪 Run API Tests'}
                        </MinecraftButton>
                        <MinecraftButton
                            onClick={loadTestResults}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            📊 Load Results
                        </MinecraftButton>
                    </div>
                </div>

                {/* Navigation */}
                <div className="minecraft-panel mb-8">
                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            { id: 'overview', label: '📋 Overview' },
                            { id: 'tests', label: '🧪 Test Results' },
                            { id: 'characters', label: '👥 Characters' },
                            { id: 'chat', label: '💬 Chat' },
                            { id: 'rooms', label: '🏠 Rooms' },
                            { id: 'status', label: '📊 Status' }
                        ].map((section) => (
                            <MinecraftButton
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                size="md"
                                className={`font-minecraft ${activeSection === section.id
                                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                        : 'bg-gray-400 hover:bg-gray-500 text-black'
                                    }`}
                            >
                                {section.label}
                            </MinecraftButton>
                        ))}
                    </div>
                </div>

                {/* Content Sections */}
                {activeSection === 'overview' && (
                    <div className="space-y-6">
                        <MinecraftCard>
                            <h2 className="text-minecraft-lg font-minecraft text-white mb-6">🌟 API Overview</h2>
                            <div className="space-y-6 text-gray-200">
                                <p className="text-minecraft-md leading-relaxed">
                                    The FOXP2 API provides comprehensive REST endpoints for managing intelligent NPCs
                                    with emotions, actions, roles, and routines in the Mnemocyte world.
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-minecraft text-minecraft-md text-white mb-3">🔑 Key Features</h3>
                                        <ul className="list-disc list-inside space-y-2 text-minecraft-sm text-gray-200">
                                            <li>Character CRUD operations</li>
                                            <li>One-on-one character conversations</li>
                                            <li>Multi-character room discussions</li>
                                            <li>AI-powered character responses</li>
                                            <li>Real-time status and activity simulation</li>
                                            <li>Mood and personality-based interactions</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="font-minecraft text-minecraft-md text-white mb-3">📡 Base URL</h3>
                                        <code className="block bg-gray-800 border-2 border-gray-600 p-3 rounded text-minecraft-sm text-green-300 font-mono">
                                            http://localhost:3000/api
                                        </code>

                                        <h3 className="font-minecraft text-minecraft-md text-white mb-3 mt-6">🔧 Content Type</h3>
                                        <code className="block bg-gray-800 border-2 border-gray-600 p-3 rounded text-minecraft-sm text-green-300 font-mono">
                                            application/json
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </MinecraftCard>
                    </div>
                )}

                {activeSection === 'tests' && (
                    <div className="space-y-6">
                        <MinecraftCard>
                            <h2 className="text-minecraft-lg font-minecraft text-white mb-6">🧪 API Test Results</h2>
                            {isRunningTests && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                                        <span className="text-minecraft-md text-blue-300 font-minecraft">Running tests...</span>
                                    </div>
                                    <pre className="bg-gray-900 border-2 border-gray-600 p-4 rounded text-minecraft-sm h-36 overflow-y-auto text-green-300 font-mono">
                                        {testOutput}
                                    </pre>
                                </div>
                            )}
                            {renderTestResults()}
                            {!testResults && !isRunningTests && (
                                <div className="text-center text-gray-300 py-12">
                                    <p className="text-minecraft-md font-minecraft">No test results available. Click "Run API Tests" to start testing.</p>
                                </div>
                            )}
                        </MinecraftCard>
                    </div>
                )}

                {activeSection === 'characters' && (
                    <div className="space-y-6">
                        <MinecraftCard>
                            <h2 className="text-minecraft-lg font-minecraft text-white mb-6">👥 Character Management</h2>
                            <p className="text-minecraft-md text-gray-200 mb-6 leading-relaxed">
                                Endpoints for creating, reading, updating, and deleting characters in the Mnemocyte world.
                            </p>
                        </MinecraftCard>
                        {renderEndpoints(apiEndpoints.characters)}
                    </div>
                )}

                {activeSection === 'chat' && (
                    <div className="space-y-6">
                        <MinecraftCard>
                            <h2 className="text-minecraft-lg font-minecraft text-white mb-6">💬 Character Chat</h2>
                            <p className="text-minecraft-md text-gray-200 mb-6 leading-relaxed">
                                Endpoints for one-on-one conversations with individual characters, featuring AI-powered responses.
                            </p>
                        </MinecraftCard>
                        {renderEndpoints(apiEndpoints.chat)}
                    </div>
                )}

                {activeSection === 'rooms' && (
                    <div className="space-y-6">
                        <MinecraftCard>
                            <h2 className="text-minecraft-lg font-minecraft text-white mb-6">🏠 Room Management</h2>
                            <p className="text-minecraft-md text-gray-200 mb-6 leading-relaxed">
                                Endpoints for creating and managing conversation rooms with multiple characters.
                            </p>
                        </MinecraftCard>
                        {renderEndpoints(apiEndpoints.rooms)}
                    </div>
                )}

                {activeSection === 'status' && (
                    <div className="space-y-6">
                        <MinecraftCard>
                            <h2 className="text-minecraft-lg font-minecraft text-white mb-6">📊 Character Status</h2>
                            <p className="text-minecraft-md text-gray-200 mb-6 leading-relaxed">
                                Endpoints for monitoring character activity, mood, and availability in real-time.
                            </p>
                        </MinecraftCard>
                        {renderEndpoints(apiEndpoints.status)}
                    </div>
                )}
            </div>
        </MinecraftContainer>
    );
}
