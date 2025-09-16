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

interface Conversation {
    id: string;
    title: string;
    type: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    messages: Array<{
        id: string;
        content: string;
        characterId: string | null;
        timestamp: string;
        character: Character | null;
        messageOrder: number;
    }>;
    participants: Array<{
        characterId: string;
        character: Character;
    }>;
    _count: {
        messages: number;
    };
}

interface Character {
    id: string;
    name: string;
    role: string;
    foxp2Pattern: any;
}

export default function DataExport() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
    const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
    const [exportFormat, setExportFormat] = useState<'jsonl' | 'csv' | 'json'>('jsonl');
    const [exportType, setExportType] = useState<'conversations' | 'characters' | 'both'>('conversations');
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({
        totalConversations: 0,
        totalMessages: 0,
        totalCharacters: 0,
        averageMessagesPerConversation: 0,
        characterInteractions: {} as Record<string, number>
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        calculateStats();
    }, [conversations, characters]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [conversationsResponse, charactersResponse] = await Promise.all([
                fetch('/api/conversations'),
                fetch('/api/characters')
            ]);

            if (!conversationsResponse.ok || !charactersResponse.ok) {
                throw new Error('Failed to fetch data');
            }

            const conversationsData = await conversationsResponse.json();
            const charactersData = await charactersResponse.json();

            setConversations(conversationsData);
            setCharacters(charactersData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = () => {
        let totalMessages = 0;
        const characterInteractions: Record<string, number> = {};

        conversations.forEach(conversation => {
            // Use the message count from the API response
            const messageCount = conversation._count?.messages || 0;
            totalMessages += messageCount;

            // For character interactions, we'll need to fetch full message data
            // For now, estimate based on participants
            conversation.participants?.forEach(participant => {
                if (participant.characterId) {
                    const estimatedInteractions = Math.floor(messageCount / (conversation.participants?.length || 1));
                    characterInteractions[participant.characterId] =
                        (characterInteractions[participant.characterId] || 0) + estimatedInteractions;
                }
            });
        });

        const averageMessagesPerConversation = conversations.length > 0 ? totalMessages / conversations.length : 0;

        setStats({
            totalConversations: conversations.length,
            totalMessages,
            totalCharacters: characters.length,
            averageMessagesPerConversation,
            characterInteractions
        });
    }; const toggleConversationSelection = (conversationId: string) => {
        setSelectedConversations(prev =>
            prev.includes(conversationId)
                ? prev.filter(id => id !== conversationId)
                : [...prev, conversationId]
        );
    };

    const toggleCharacterSelection = (characterId: string) => {
        setSelectedCharacters(prev =>
            prev.includes(characterId)
                ? prev.filter(id => id !== characterId)
                : [...prev, characterId]
        );
    };

    const selectAllConversations = () => {
        setSelectedConversations(conversations.map(c => c.id));
    };

    const clearConversationSelection = () => {
        setSelectedConversations([]);
    };

    const selectAllCharacters = () => {
        setSelectedCharacters(characters.map(c => c.id));
    };

    const clearCharacterSelection = () => {
        setSelectedCharacters([]);
    };

    const generateFineTuningData = async () => {
        const selectedConversationsData = conversations.filter(conversation =>
            selectedConversations.length === 0 || selectedConversations.includes(conversation.id)
        );

        const trainingData: any[] = [];

        // For each selected conversation, fetch the full message data
        for (const conversation of selectedConversationsData) {
            try {
                const messagesResponse = await fetch(`/api/conversations?id=${conversation.id}&includeMessages=true`);
                if (!messagesResponse.ok) continue;

                const conversationWithMessages = await messagesResponse.json();
                const messages = conversationWithMessages.messages || [];

                // Track the last user message for context
                let lastUserMessage = '';
                let conversationContext: any[] = [];

                messages.forEach((message: any) => {
                    if (message.content && message.characterId) {
                        const character = characters.find(c => c.id === message.characterId);
                        if (character && (selectedCharacters.length === 0 || selectedCharacters.includes(character.id))) {
                            // Create system prompt based on character
                            const systemPrompt = `You are ${character.name}, a ${character.role}. Your personality is defined by these traits: 
Emotional Weights - Joy: ${character.foxp2Pattern?.emotionalWeights?.joy || 0.5}, Fear: ${character.foxp2Pattern?.emotionalWeights?.fear || 0.5}, Anger: ${character.foxp2Pattern?.emotionalWeights?.anger || 0.5}, Sadness: ${character.foxp2Pattern?.emotionalWeights?.sadness || 0.5}
Behavioral Traits - Aggression: ${character.foxp2Pattern?.behavioralTraits?.aggression || 0.5}, Sociability: ${character.foxp2Pattern?.behavioralTraits?.sociability || 0.5}, Curiosity: ${character.foxp2Pattern?.behavioralTraits?.curiosity || 0.5}
Respond in character based on these traits.`;

                            // Use conversation context or a generic prompt
                            const userContent = lastUserMessage || 'Continue the conversation';

                            trainingData.push({
                                messages: [
                                    { role: 'system', content: systemPrompt },
                                    { role: 'user', content: userContent },
                                    { role: 'assistant', content: message.content }
                                ],
                                character_id: character.id,
                                character_name: character.name,
                                character_role: character.role,
                                conversation_id: conversation.id,
                                timestamp: message.timestamp,
                                conversation_context: conversationContext.slice(-5) // Last 5 messages for context
                            });

                            // Add character response to context
                            conversationContext.push({
                                role: 'assistant',
                                content: message.content,
                                character: character.name,
                                timestamp: message.timestamp
                            });
                        }
                    }
                });
            } catch (error) {
                console.error(`Error fetching messages for conversation ${conversation.id}:`, error);
            }
        }

        return trainingData;
    };

    const exportData = async () => {
        setIsLoading(true);

        try {
            let dataToExport: any = {};

            if (exportType === 'conversations' || exportType === 'both') {
                dataToExport.conversations = await generateFineTuningData();
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
                selectedConversations: selectedConversations,
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
        <main className="min-h-screen bg-gradient-to-b from-minecraft-sky to-minecraft-grass p-4">
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
                <div className="flex justify-center mb-4">
                    <MinecraftButton
                        onClick={() => window.location.href = '/'}
                        className="text-minecraft-xs"
                    >
                        ← Back to Home
                    </MinecraftButton>
                </div>

                {/* Fine-tuning Instructions */}
                <MinecraftPanel className="mb-6">
                    <h3 className="text-minecraft-md font-minecraft text-white mb-4">🤖 AI Model Fine-tuning Instructions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-minecraft-sm text-orange-400 mb-3 font-minecraft">📊 Data Format</h4>
                            <ul className="text-minecraft-xs text-gray-300 space-y-2">
                                <li><strong className="text-white">JSONL:</strong> OpenAI GPT fine-tuning format - each line contains a training example with system, user, and assistant messages</li>
                                <li><strong className="text-white">JSON:</strong> Complete structured data with metadata, character profiles, and conversation context</li>
                                <li><strong className="text-white">CSV:</strong> Simplified tabular format for analysis and custom training pipelines</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-minecraft-sm text-blue-400 mb-3 font-minecraft">⚙️ Fine-tuning Platforms</h4>
                            <ul className="text-minecraft-xs text-gray-300 space-y-2">
                                <li><strong className="text-white">OpenAI:</strong> Use JSONL format with their fine-tuning API for GPT models</li>
                                <li><strong className="text-white">Hugging Face:</strong> Convert JSON to their dataset format for open-source models</li>
                                <li><strong className="text-white">Local Training:</strong> Use CSV/JSON for custom training scripts with frameworks like transformers</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 bg-gray-900/50 border-2 border-gray-600 rounded p-4">
                        <h4 className="text-minecraft-sm text-green-400 mb-3 font-minecraft">💡 Training Tips</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-minecraft-xs text-gray-300">
                            <div>
                                <strong className="text-white block mb-1">Data Quality:</strong>
                                Select sessions with meaningful character interactions and diverse conversation patterns
                            </div>
                            <div>
                                <strong className="text-white block mb-1">Character Consistency:</strong>
                                Include FOXP2 personality traits in system prompts to maintain character authenticity
                            </div>
                            <div>
                                <strong className="text-white block mb-1">Training Size:</strong>
                                Aim for 50-200 quality examples per character for effective fine-tuning results
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 bg-blue-900/30 border-2 border-blue-600 rounded p-4">
                        <h4 className="text-minecraft-sm text-cyan-400 mb-2 font-minecraft">🔧 Quick Start Commands</h4>
                        <div className="space-y-3">
                            <div>
                                <strong className="text-white text-minecraft-xs">OpenAI Fine-tuning:</strong>
                                <code className="block bg-gray-800 text-green-300 p-2 rounded mt-1 text-minecraft-tiny font-mono">
                                    openai api fine_tunes.create -t mnemocyte-training-data.jsonl -m gpt-3.5-turbo
                                </code>
                            </div>
                            <div>
                                <strong className="text-white text-minecraft-xs">Hugging Face Dataset:</strong>
                                <code className="block bg-gray-800 text-green-300 p-2 rounded mt-1 text-minecraft-tiny font-mono">
                                    from datasets import Dataset; Dataset.from_json("mnemocyte-data.json")
                                </code>
                            </div>
                        </div>
                    </div>
                </MinecraftPanel>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Statistics Panel */}
                    <div className="lg:col-span-1">
                        <MinecraftPanel className="mb-4">
                            <h3 className="text-minecraft-sm text-white mb-3">Data Statistics</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-minecraft-xs text-gray-300">Total Sessions:</span>
                                    <span className="text-minecraft-xs text-white font-bold">{stats.totalConversations}</span>
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
                                    <span className="text-minecraft-xs text-white font-bold">{stats.averageMessagesPerConversation}</span>
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

                    {/* Conversations Selection */}
                    <div className="lg:col-span-1">
                        <MinecraftPanel>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-minecraft-sm text-white">Conversations ({selectedConversations.length} selected)</h3>
                                <div className="flex gap-1">
                                    <MinecraftButton onClick={selectAllConversations} className="text-minecraft-tiny">
                                        All
                                    </MinecraftButton>
                                    <MinecraftButton onClick={clearConversationSelection} className="text-minecraft-tiny">
                                        None
                                    </MinecraftButton>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {conversations.map((conversation) => (
                                    <div key={conversation.id} className={`p-2 border-minecraft cursor-pointer ${selectedConversations.includes(conversation.id) ? 'bg-green-900/30' : 'bg-black/20'
                                        }`} onClick={() => toggleConversationSelection(conversation.id)}>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedConversations.includes(conversation.id)}
                                                onChange={() => toggleConversationSelection(conversation.id)}
                                                className="mr-2"
                                            />
                                            <div className="flex-1">
                                                <div className="text-minecraft-xs text-white font-bold">
                                                    {conversation.title || `Conversation ${conversation.id.slice(-8)}`}
                                                </div>
                                                <div className="text-minecraft-tiny text-gray-400">
                                                    {conversation._count?.messages || 0} messages • {conversation.participants?.length || 0} participants
                                                </div>
                                                <div className="text-minecraft-tiny text-gray-500">
                                                    {new Date(conversation.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {conversations.length === 0 && (
                                    <div className="text-minecraft-xs text-gray-400 text-center py-4">
                                        No conversations available
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
