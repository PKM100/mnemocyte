'use client';

import { useState, useEffect } from 'react';
import { MinecraftButton, MinecraftPanel, MinecraftInput } from '@/components/ui/minecraft-ui';

interface ChatMessage {
    id: string;
    timestamp: Date;
    sender: string;
    message: string;
    characterId?: string;
    sessionId: string;
}

interface Session {
    id: string;
    startTime: Date;
    endTime?: Date;
    messages: ChatMessage[];
    activeCharacters: string[];
    userCommands: Array<{
        timestamp: Date;
        command: string;
        target?: string;
        result: string;
    }>;
}

interface Character {
    id: string;
    name: string;
    role: string;
    foxp2Pattern: any;
}

export default function DataExport() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
    const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
    const [exportFormat, setExportFormat] = useState<'jsonl' | 'csv' | 'json'>('jsonl');
    const [exportType, setExportType] = useState<'conversations' | 'characters' | 'both'>('conversations');
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({
        totalSessions: 0,
        totalMessages: 0,
        totalCharacters: 0,
        averageMessagesPerSession: 0,
        characterInteractions: {} as Record<string, number>
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        calculateStats();
    }, [sessions, characters]);

    const loadData = async () => {
        try {
            const [sessionsResponse, charactersResponse] = await Promise.all([
                fetch('/api/sessions'),
                fetch('/api/characters')
            ]);

            const sessionsData = await sessionsResponse.json();
            const charactersData = await charactersResponse.json();

            // Convert date strings back to Date objects
            const parsedSessions = sessionsData.map((session: any) => ({
                ...session,
                startTime: new Date(session.startTime),
                endTime: session.endTime ? new Date(session.endTime) : undefined,
                messages: session.messages.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }))
            }));

            setSessions(parsedSessions);
            setCharacters(charactersData);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const calculateStats = () => {
        let totalMessages = 0;
        let totalConversationMessages = 0; // Exclude system messages
        const characterInteractions: Record<string, number> = {};

        sessions.forEach(session => {
            session.messages.forEach(message => {
                totalMessages++;

                // Count actual conversation messages (exclude system spawn/despawn messages)
                if (message.sender !== 'System' && !(
                    message.message.startsWith('*') && (
                        message.message.includes('joins the conversation') ||
                        message.message.includes('leaves the world') ||
                        message.message.includes('appears in the world') ||
                        message.message.includes('wanders off')
                    )
                )) {
                    totalConversationMessages++;
                }

                if (message.characterId && message.sender !== 'System') {
                    // Only count actual character responses
                    if (!(message.message.startsWith('*') && (
                        message.message.includes('joins the conversation') ||
                        message.message.includes('leaves the world') ||
                        message.message.includes('appears in the world') ||
                        message.message.includes('wanders off')
                    ))) {
                        characterInteractions[message.characterId] = (characterInteractions[message.characterId] || 0) + 1;
                    }
                }
            });
        });

        const averageMessagesPerSession = sessions.length > 0 ? totalConversationMessages / sessions.length : 0;

        setStats({
            totalSessions: sessions.length,
            totalMessages: totalConversationMessages, // Use conversation messages only
            totalCharacters: characters.length,
            averageMessagesPerSession: Math.round(averageMessagesPerSession * 100) / 100,
            characterInteractions
        });
    };

    const toggleSessionSelection = (sessionId: string) => {
        setSelectedSessions(prev =>
            prev.includes(sessionId)
                ? prev.filter(id => id !== sessionId)
                : [...prev, sessionId]
        );
    };

    const toggleCharacterSelection = (characterId: string) => {
        setSelectedCharacters(prev =>
            prev.includes(characterId)
                ? prev.filter(id => id !== characterId)
                : [...prev, characterId]
        );
    };

    const selectAllSessions = () => {
        setSelectedSessions(sessions.map(s => s.id));
    };

    const clearSessionSelection = () => {
        setSelectedSessions([]);
    };

    const selectAllCharacters = () => {
        setSelectedCharacters(characters.map(c => c.id));
    };

    const clearCharacterSelection = () => {
        setSelectedCharacters([]);
    };

    const generateFineTuningData = () => {
        const selectedSessionsData = sessions.filter(session =>
            selectedSessions.length === 0 || selectedSessions.includes(session.id)
        );

        const trainingData: any[] = [];

        selectedSessionsData.forEach(session => {
            // Track the last user message for context
            let lastUserMessage = '';
            let conversationContext: any[] = [];

            session.messages.forEach((message, index) => {
                if (message.sender === 'User') {
                    lastUserMessage = message.message;
                    // Add user message to context
                    conversationContext.push({
                        role: 'user',
                        content: message.message,
                        timestamp: message.timestamp
                    });
                } else if (message.characterId && message.sender !== 'System') {
                    const character = characters.find(c => c.id === message.characterId);
                    if (character && (selectedCharacters.length === 0 || selectedCharacters.includes(character.id))) {
                        // Skip system messages like spawning/despawning
                        if (message.message.startsWith('*') && (
                            message.message.includes('joins the conversation') ||
                            message.message.includes('leaves the world') ||
                            message.message.includes('appears in the world') ||
                            message.message.includes('wanders off')
                        )) {
                            return; // Skip system spawn/despawn messages
                        }

                        // Create system prompt based on character
                        const systemPrompt = `You are ${character.name}, a ${character.role}. Your personality is defined by these traits: 
Emotional Weights - Joy: ${character.foxp2Pattern?.emotionalWeights?.joy || 0.5}, Fear: ${character.foxp2Pattern?.emotionalWeights?.fear || 0.5}, Anger: ${character.foxp2Pattern?.emotionalWeights?.anger || 0.5}, Sadness: ${character.foxp2Pattern?.emotionalWeights?.sadness || 0.5}
Behavioral Traits - Aggression: ${character.foxp2Pattern?.behavioralTraits?.aggression || 0.5}, Sociability: ${character.foxp2Pattern?.behavioralTraits?.sociability || 0.5}, Curiosity: ${character.foxp2Pattern?.behavioralTraits?.curiosity || 0.5}
Respond in character based on these traits.`;

                        // Use the most recent user message if available, otherwise use conversation context
                        const userContent = lastUserMessage || 'Continue the conversation';

                        trainingData.push({
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: userContent },
                                { role: 'assistant', content: message.message }
                            ],
                            character_id: character.id,
                            character_name: character.name,
                            character_role: character.role,
                            session_id: session.id,
                            timestamp: message.timestamp.toISOString(),
                            conversation_context: conversationContext.slice(-5) // Last 5 messages for context
                        });

                        // Add character response to context
                        conversationContext.push({
                            role: 'assistant',
                            content: message.message,
                            character: character.name,
                            timestamp: message.timestamp
                        });
                    }
                } else if (message.sender === 'System') {
                    // Include behavior change messages in training data
                    if (message.message.includes('[Behavior Change]')) {
                        conversationContext.push({
                            role: 'system',
                            content: message.message,
                            timestamp: message.timestamp
                        });
                    }
                }
            });
        });

        return trainingData;
    };

    const exportData = async () => {
        setIsLoading(true);

        try {
            let dataToExport: any = {};

            if (exportType === 'conversations' || exportType === 'both') {
                dataToExport.conversations = generateFineTuningData();
            }

            if (exportType === 'characters' || exportType === 'both') {
                dataToExport.characters = characters.filter(char =>
                    selectedCharacters.length === 0 || selectedCharacters.includes(char.id)
                );
            }

            // Add metadata
            dataToExport.metadata = {
                exportDate: new Date().toISOString(),
                exportType,
                format: exportFormat,
                stats: stats,
                selectedSessions: selectedSessions,
                selectedCharacters: selectedCharacters
            };

            let content: string;
            let filename: string;
            let mimeType: string;

            switch (exportFormat) {
                case 'jsonl':
                    // JSONL format for fine-tuning (one JSON object per line)
                    content = dataToExport.conversations
                        ?.map((item: any) => JSON.stringify(item))
                        .join('\n') || '';
                    filename = `mnemocyte-training-data-${Date.now()}.jsonl`;
                    mimeType = 'application/jsonl';
                    break;

                case 'csv':
                    // CSV format
                    const conversations = dataToExport.conversations || [];
                    const csvHeaders = ['character_name', 'character_role', 'user_message', 'assistant_response', 'timestamp', 'session_id'];
                    const csvRows = conversations.map((conv: any) => [
                        conv.character_name,
                        conv.character_role,
                        conv.messages[1].content.replace(/"/g, '""'), // Escape quotes
                        conv.messages[2].content.replace(/"/g, '""'), // Escape quotes
                        conv.timestamp,
                        conv.session_id
                    ]);

                    content = [
                        csvHeaders.join(','),
                        ...csvRows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
                    ].join('\n');
                    filename = `mnemocyte-data-${Date.now()}.csv`;
                    mimeType = 'text/csv';
                    break;

                case 'json':
                default:
                    content = JSON.stringify(dataToExport, null, 2);
                    filename = `mnemocyte-data-${Date.now()}.json`;
                    mimeType = 'application/json';
                    break;
            }

            // Create download
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-minecraft-dark-sky to-minecraft-dark-grass p-4">
            <div className="container mx-auto max-w-6xl">
                {/* Header with Logo */}
                <div className="minecraft-panel mb-4 text-center">
                    <div className="flex justify-center mb-4">
                        <img
                            src="/mnemocyte.png"
                            alt="Mnemocyte Logo"
                            className="h-16 pixelated"
                            style={{ width: 'auto' }}
                        />
                    </div>
                    <h1 className="text-2xl font-minecraft text-white mb-2">
                        DATA EXPORT
                    </h1>
                    <p className="text-minecraft-sm text-gray-300">
                        Export Training Data for Fine-Tuning
                    </p>
                </div>

                {/* Navigation */}
                <div className="flex justify-between mb-4">
                    <MinecraftButton
                        onClick={() => window.location.href = '/world'}
                        className="text-minecraft-xs"
                    >
                        ← Back to World
                    </MinecraftButton>
                    <MinecraftButton
                        onClick={() => window.location.href = '/'}
                        className="text-minecraft-xs"
                    >
                        Home
                    </MinecraftButton>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Statistics Panel */}
                    <div className="lg:col-span-1">
                        <MinecraftPanel className="mb-4">
                            <h3 className="text-minecraft-sm text-white mb-3">Data Statistics</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-minecraft-xs text-gray-300">Total Sessions:</span>
                                    <span className="text-minecraft-xs text-white font-bold">{stats.totalSessions}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-minecraft-xs text-gray-300">Total Messages:</span>
                                    <span className="text-minecraft-xs text-white font-bold">{stats.totalMessages}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-minecraft-xs text-gray-300">Total Characters:</span>
                                    <span className="text-minecraft-xs text-white font-bold">{stats.totalCharacters}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-minecraft-xs text-gray-300">Avg Messages/Session:</span>
                                    <span className="text-minecraft-xs text-white font-bold">{stats.averageMessagesPerSession}</span>
                                </div>
                            </div>
                        </MinecraftPanel>

                        {/* Export Configuration */}
                        <MinecraftPanel>
                            <h3 className="text-minecraft-sm text-white mb-3">Export Configuration</h3>

                            <div className="mb-3">
                                <label className="text-minecraft-xs text-gray-300 block mb-1">Export Type:</label>
                                <select
                                    value={exportType}
                                    onChange={(e) => setExportType(e.target.value as any)}
                                    className="minecraft-input w-full"
                                >
                                    <option value="conversations">Conversations Only</option>
                                    <option value="characters">Characters Only</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="text-minecraft-xs text-gray-300 block mb-1">Format:</label>
                                <select
                                    value={exportFormat}
                                    onChange={(e) => setExportFormat(e.target.value as any)}
                                    className="minecraft-input w-full"
                                >
                                    <option value="jsonl">JSONL (Fine-tuning)</option>
                                    <option value="json">JSON</option>
                                    <option value="csv">CSV</option>
                                </select>
                            </div>

                            <MinecraftButton
                                onClick={exportData}
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isLoading ? 'Exporting...' : 'Export Data'}
                            </MinecraftButton>

                            {exportFormat === 'jsonl' && (
                                <div className="mt-3 p-2 bg-yellow-900/30 border-minecraft">
                                    <p className="text-minecraft-tiny text-yellow-300">
                                        JSONL format is optimized for fine-tuning language models with OpenAI, Azure OpenAI, or similar services.
                                    </p>
                                </div>
                            )}
                        </MinecraftPanel>
                    </div>

                    {/* Sessions Selection */}
                    <div className="lg:col-span-1">
                        <MinecraftPanel>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-minecraft-sm text-white">Sessions ({selectedSessions.length} selected)</h3>
                                <div className="flex gap-1">
                                    <MinecraftButton onClick={selectAllSessions} className="text-minecraft-tiny">
                                        All
                                    </MinecraftButton>
                                    <MinecraftButton onClick={clearSessionSelection} className="text-minecraft-tiny">
                                        None
                                    </MinecraftButton>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {sessions.map((session) => (
                                    <div key={session.id} className={`p-2 border-minecraft cursor-pointer ${selectedSessions.includes(session.id) ? 'bg-green-900/30' : 'bg-black/20'
                                        }`} onClick={() => toggleSessionSelection(session.id)}>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedSessions.includes(session.id)}
                                                onChange={() => toggleSessionSelection(session.id)}
                                                className="mr-2"
                                            />
                                            <div className="flex-1">
                                                <div className="text-minecraft-xs text-white font-bold">
                                                    {session.startTime.toLocaleDateString()} {session.startTime.toLocaleTimeString()}
                                                </div>
                                                <div className="text-minecraft-tiny text-gray-400">
                                                    {session.messages.length} messages • {session.activeCharacters.length} characters
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {sessions.length === 0 && (
                                    <div className="text-minecraft-xs text-gray-400 text-center py-4">
                                        No sessions available
                                    </div>
                                )}
                            </div>
                        </MinecraftPanel>
                    </div>

                    {/* Characters Selection */}
                    <div className="lg:col-span-1">
                        <MinecraftPanel>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-minecraft-sm text-white">Characters ({selectedCharacters.length} selected)</h3>
                                <div className="flex gap-1">
                                    <MinecraftButton onClick={selectAllCharacters} className="text-minecraft-tiny">
                                        All
                                    </MinecraftButton>
                                    <MinecraftButton onClick={clearCharacterSelection} className="text-minecraft-tiny">
                                        None
                                    </MinecraftButton>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {characters.map((character) => (
                                    <div key={character.id} className={`p-2 border-minecraft cursor-pointer ${selectedCharacters.includes(character.id) ? 'bg-green-900/30' : 'bg-black/20'
                                        }`} onClick={() => toggleCharacterSelection(character.id)}>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedCharacters.includes(character.id)}
                                                onChange={() => toggleCharacterSelection(character.id)}
                                                className="mr-2"
                                            />
                                            <div className="flex-1">
                                                <div className="text-minecraft-xs text-white font-bold">
                                                    {character.name}
                                                </div>
                                                <div className="text-minecraft-tiny text-gray-400">
                                                    {character.role} • {stats.characterInteractions[character.id] || 0} interactions
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {characters.length === 0 && (
                                    <div className="text-minecraft-xs text-gray-400 text-center py-4">
                                        No characters available
                                    </div>
                                )}
                            </div>
                        </MinecraftPanel>
                    </div>
                </div>
            </div>
        </main>
    );
}
