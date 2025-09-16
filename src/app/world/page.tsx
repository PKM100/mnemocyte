'use client';

import { useState, useEffect, useRef } from 'react';
import { MinecraftButton, MinecraftPanel, MinecraftInput } from '@/components/ui/minecraft-ui';

interface Character {
    id: string;
    name: string;
    role: string;
    foxp2Pattern: {
        emotionalWeights: {
            joy: number;
            fear: number;
            anger: number;
            sadness: number;
        };
        behavioralTraits: {
            aggression: number;
            sociability: number;
            curiosity: number;
        };
    };
    currentMood: number;
    memoryBank: string[];
    routines: string[];
    actions: string[];
    isActive?: boolean;
    lastActivity?: Date;
    position?: { x: number; y: number };
    temporaryBehaviorPrompt?: string;
}

interface ChatMessage {
    id: string;
    timestamp: Date;
    sender: string; // 'user' or character name
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

export default function GameWorld() {
    const [activeCharacters, setActiveCharacters] = useState<Character[]>([]);
    const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [currentSession, setCurrentSession] = useState<Session | null>(null);
    const [selectedCharacter, setSelectedCharacter] = useState<string>('');
    const [userCommand, setUserCommand] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize session and load characters
    useEffect(() => {
        initializeSession();
        loadAvailableCharacters();

        // Random character spawning/despawning
        const spawnInterval = setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance every 30 seconds
                handleRandomCharacterActivity();
            }
        }, 30000);

        return () => clearInterval(spawnInterval);
    }, []);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const initializeSession = async () => {
        const session: Session = {
            id: `session-${Date.now()}`,
            startTime: new Date(),
            messages: [],
            activeCharacters: [],
            userCommands: []
        };
        setCurrentSession(session);

        // Save session to backend
        try {
            await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(session)
            });
        } catch (error) {
            console.error('Failed to initialize session:', error);
        }
    };

    const loadAvailableCharacters = async () => {
        try {
            const response = await fetch('/api/characters');
            const characters = await response.json();
            setAvailableCharacters(characters);
        } catch (error) {
            console.error('Failed to load characters:', error);
        }
    };

    const handleRandomCharacterActivity = () => {
        if (availableCharacters.length === 0) return;

        const shouldSpawn = activeCharacters.length < 3 && Math.random() < 0.6;
        const shouldDespawn = activeCharacters.length > 0 && Math.random() < 0.4;

        if (shouldSpawn) {
            const inactiveCharacters = availableCharacters.filter(
                char => !activeCharacters.find(active => active.id === char.id)
            );
            if (inactiveCharacters.length > 0) {
                const randomChar = inactiveCharacters[Math.floor(Math.random() * inactiveCharacters.length)];
                spawnCharacter(randomChar.id, true);
            }
        } else if (shouldDespawn) {
            const randomActive = activeCharacters[Math.floor(Math.random() * activeCharacters.length)];
            despawnCharacter(randomActive.id, true);
        }
    };

    const spawnCharacter = async (characterId: string, isRandom = false) => {
        const character = availableCharacters.find(char => char.id === characterId);
        if (!character || activeCharacters.find(active => active.id === characterId)) {
            return;
        }

        const activeCharacter = {
            ...character,
            isActive: true,
            lastActivity: new Date(),
            position: {
                x: Math.floor(Math.random() * 300) + 50,
                y: Math.floor(Math.random() * 200) + 50
            }
        };

        setActiveCharacters(prev => [...prev, activeCharacter]);

        // Add spawn message
        const spawnMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            timestamp: new Date(),
            sender: character.name,
            message: isRandom
                ? `*${character.name} appears in the world*`
                : `*${character.name} joins the conversation*`,
            characterId: character.id,
            sessionId: currentSession?.id || 'unknown'
        };

        setMessages(prev => [...prev, spawnMessage]);
        updateSession(spawnMessage);
    };

    const despawnCharacter = async (characterId: string, isRandom = false) => {
        const character = activeCharacters.find(char => char.id === characterId);
        if (!character) return;

        setActiveCharacters(prev => prev.filter(char => char.id !== characterId));

        // Add despawn message
        const despawnMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            timestamp: new Date(),
            sender: character.name,
            message: isRandom
                ? `*${character.name} wanders off*`
                : `*${character.name} leaves the world*`,
            characterId: character.id,
            sessionId: currentSession?.id || 'unknown'
        };

        setMessages(prev => [...prev, despawnMessage]);
        updateSession(despawnMessage);
    };

    const determineConversationOrder = (characters: Character[], userMessage: string, messageText: string): Character[] => {
        // Parse message to find character mentions and conversation context
        const mentionedCharacters = characters.filter(char =>
            messageText.includes(char.name.toLowerCase()) ||
            messageText.includes(char.role.toLowerCase())
        );

        // Detect conversation patterns
        const isAddressingMultiple = mentionedCharacters.length > 1;
        const hasConnectorWords = /\band\b|\bboth\b|\ball\b/.test(messageText);

        // Special handling for mediation/conflict scenarios
        const isMediationScenario = /talk.*out|stop.*fight|peace|calm|resolve|mediat/i.test(userMessage);
        const isConflictScenario = /fight|battle|conflict|argue|clash/i.test(userMessage);

        if (isAddressingMultiple && (isMediationScenario || isConflictScenario)) {
            // For mediation scenarios, order by role priority and sociability
            const orderedCharacters = [...characters].sort((a, b) => {
                // Mediator types (scholars, healers) speak first in conflicts
                const mediatorRoles = ['scholar', 'healer', 'sage', 'diplomat'];
                const aIsMediator = mediatorRoles.includes(a.role.toLowerCase());
                const bIsMediator = mediatorRoles.includes(b.role.toLowerCase());

                if (aIsMediator && !bIsMediator) return -1;
                if (!aIsMediator && bIsMediator) return 1;

                // Then by sociability (more social speaks first)
                const aSociability = a.foxp2Pattern.behavioralTraits.sociability;
                const bSociability = b.foxp2Pattern.behavioralTraits.sociability;

                return bSociability - aSociability;
            });

            return orderedCharacters;
        }

        if (mentionedCharacters.length > 0) {
            // Order mentioned characters by their position in the message
            const mentionOrder = mentionedCharacters.sort((a, b) => {
                const aIndex = messageText.indexOf(a.name.toLowerCase());
                const bIndex = messageText.indexOf(b.name.toLowerCase());
                return aIndex - bIndex;
            });

            // Add non-mentioned characters based on their personality traits
            const nonMentioned = characters.filter(char => !mentionedCharacters.includes(char))
                .filter(char => {
                    // Only include highly social characters or those with relevant keywords
                    const sociability = char.foxp2Pattern.behavioralTraits.sociability;
                    const curiosity = char.foxp2Pattern.behavioralTraits.curiosity;
                    return sociability > 0.7 || curiosity > 0.7;
                })
                .sort((a, b) => b.foxp2Pattern.behavioralTraits.sociability - a.foxp2Pattern.behavioralTraits.sociability);

            return [...mentionOrder, ...nonMentioned];
        }

        // For general messages, order by personality traits
        return [...characters].sort((a, b) => {
            const aSociability = a.foxp2Pattern.behavioralTraits.sociability;
            const bSociability = b.foxp2Pattern.behavioralTraits.sociability;
            const aCuriosity = a.foxp2Pattern.behavioralTraits.curiosity;
            const bCuriosity = b.foxp2Pattern.behavioralTraits.curiosity;

            // Combined social score
            const aScore = (aSociability + aCuriosity) / 2;
            const bScore = (bSociability + bCuriosity) / 2;

            return bScore - aScore;
        });
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || !currentSession) return;

        setIsLoading(true);

        // Add user message
        const userMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            timestamp: new Date(),
            sender: 'User',
            message: inputMessage,
            sessionId: currentSession.id
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');

        // Update session
        updateSession(userMessage);

        // Check for character-specific mentions and behavior changes
        const messageText = inputMessage.toLowerCase();
        const behaviorChangeCommands = ['be more', 'act like', 'become', 'change your', 'you should'];
        const hasBehaviorChange = behaviorChangeCommands.some(cmd => messageText.includes(cmd));

        // Determine conversation order and process responses sequentially
        const conversationOrder = determineConversationOrder(activeCharacters, inputMessage, messageText);

        // Process characters in proper order
        for (const character of conversationOrder) {
            try {
                // Check if character is directly mentioned
                const isDirectlyMentioned = messageText.includes(character.name.toLowerCase()) ||
                    messageText.includes(character.role.toLowerCase());

                // Check if it's a general question that might interest this character
                const isGeneralQuestion = messageText.includes('?') ||
                    messageText.startsWith('who') ||
                    messageText.startsWith('what') ||
                    messageText.startsWith('how') ||
                    messageText.startsWith('tell me');

                // Get current conversation context (messages up to this point in this response cycle)
                const currentConversationContext = messages.slice(-10);

                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: inputMessage,
                        character: character,
                        conversationHistory: currentConversationContext,
                        worldContext: {
                            activeCharacters: activeCharacters.map(c => ({ name: c.name, role: c.role })),
                            isMultiCharacter: true,
                            isDirectlyMentioned,
                            isGeneralQuestion,
                            hasBehaviorChange,
                            conversationOrder: conversationOrder.map(c => c.name),
                            currentSpeakerIndex: conversationOrder.findIndex(c => c.id === character.id)
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();

                    if (data.shouldRespond && data.response) {
                        const characterMessage: ChatMessage = {
                            id: `msg-${Date.now()}-${character.id}`,
                            timestamp: new Date(),
                            sender: character.name,
                            message: data.response,
                            characterId: character.id,
                            sessionId: currentSession.id
                        };

                        // Add message immediately to maintain conversation flow
                        setMessages(prev => [...prev, characterMessage]);
                        updateSession(characterMessage);

                        // Handle behavior changes
                        if (data.behaviorChanged && data.newBehaviorPrompt) {
                            // Update character's behavior temporarily
                            setActiveCharacters(prev =>
                                prev.map(char =>
                                    char.id === character.id
                                        ? { ...char, temporaryBehaviorPrompt: data.newBehaviorPrompt }
                                        : char
                                )
                            );

                            // Log behavior change for export data
                            const behaviorChangeMessage: ChatMessage = {
                                id: `msg-${Date.now()}-behavior-${character.id}`,
                                timestamp: new Date(),
                                sender: 'System',
                                message: `[Behavior Change] ${character.name}'s behavior modified: ${data.newBehaviorPrompt}`,
                                characterId: character.id,
                                sessionId: currentSession.id
                            };

                            setMessages(prev => [...prev, behaviorChangeMessage]);
                            updateSession(behaviorChangeMessage);
                        }

                        // Small delay between responses to maintain natural flow
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            } catch (error) {
                console.error(`Failed to get response from ${character.name}:`, error);
            }
        }

        setIsLoading(false);
    };

    const executeUserCommand = async () => {
        if (!userCommand.trim() || !currentSession) return;

        const command = {
            timestamp: new Date(),
            command: userCommand,
            target: selectedCharacter,
            result: ''
        };

        // Parse and execute command
        const parts = userCommand.toLowerCase().split(' ');
        const action = parts[0];

        let result = '';

        switch (action) {
            case 'spawn':
                if (parts[1]) {
                    const charName = parts.slice(1).join(' ');
                    const char = availableCharacters.find(c =>
                        c.name.toLowerCase().includes(charName) || c.id.includes(charName)
                    );
                    if (char) {
                        await spawnCharacter(char.id);
                        result = `Spawned ${char.name}`;
                    } else {
                        result = `Character "${charName}" not found`;
                    }
                }
                break;

            case 'despawn':
                if (parts[1]) {
                    const charName = parts.slice(1).join(' ');
                    const char = activeCharacters.find(c =>
                        c.name.toLowerCase().includes(charName) || c.id.includes(charName)
                    );
                    if (char) {
                        await despawnCharacter(char.id);
                        result = `Despawned ${char.name}`;
                    } else {
                        result = `Active character "${charName}" not found`;
                    }
                }
                break;

            case 'modify':
                if (selectedCharacter && parts[1]) {
                    const char = activeCharacters.find(c => c.id === selectedCharacter);
                    if (char) {
                        // Modify behavior based on command
                        const modification = parts.slice(1).join(' ');
                        // This would update the character's behavior temporarily
                        result = `Modified ${char.name}: ${modification}`;

                        // Add system message about the modification
                        const modMessage: ChatMessage = {
                            id: `msg-${Date.now()}-mod`,
                            timestamp: new Date(),
                            sender: 'System',
                            message: `${char.name}'s behavior has been modified: ${modification}`,
                            sessionId: currentSession.id
                        };
                        setMessages(prev => [...prev, modMessage]);
                        updateSession(modMessage);
                    }
                }
                break;

            default:
                result = `Unknown command: ${action}. Available: spawn, despawn, modify`;
        }

        command.result = result;

        // Update session with command
        if (currentSession) {
            const updatedSession = {
                ...currentSession,
                userCommands: [...currentSession.userCommands, command]
            };
            setCurrentSession(updatedSession);
        }

        setUserCommand('');

        // Show result message
        const resultMessage: ChatMessage = {
            id: `msg-${Date.now()}-cmd`,
            timestamp: new Date(),
            sender: 'System',
            message: result,
            sessionId: currentSession.id
        };
        setMessages(prev => [...prev, resultMessage]);
        updateSession(resultMessage);
    };

    const updateSession = (message: ChatMessage) => {
        if (!currentSession) return;

        const updatedSession = {
            ...currentSession,
            messages: [...currentSession.messages, message],
            activeCharacters: activeCharacters.map(c => c.id)
        };

        setCurrentSession(updatedSession);

        // Save to backend
        fetch('/api/sessions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedSession)
        }).catch(error => console.error('Failed to update session:', error));
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-minecraft-dark-sky to-minecraft-dark-grass p-4">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="minecraft-panel mb-4 text-center">
                    <div className="flex items-center justify-between">
                        <MinecraftButton
                            onClick={() => window.location.href = '/'}
                            className="text-minecraft-xs"
                        >
                            ← Back to Home
                        </MinecraftButton>
                        <div>
                            <h1 className="text-3xl font-minecraft text-white mb-1">
                                GAME WORLD
                            </h1>
                            <p className="text-minecraft-sm text-gray-300">
                                Multi-Character Interactive Environment
                            </p>
                        </div>
                        <MinecraftButton
                            onClick={() => window.location.href = '/data'}
                            className="text-minecraft-xs"
                        >
                            Export Data →
                        </MinecraftButton>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Main Chat Area */}
                    <div className="lg:col-span-2">
                        <MinecraftPanel className="h-96 mb-4">
                            <div className="h-full flex flex-col">
                                <h3 className="text-minecraft-sm text-white mb-2">World Chat</h3>
                                <div className="flex-1 overflow-y-auto mb-4 p-2 bg-black/30 border-minecraft">
                                    {messages.map((message) => (
                                        <div key={message.id} className="mb-2">
                                            <span className={`text-minecraft-xs font-bold ${message.sender === 'User'
                                                ? 'text-blue-400'
                                                : message.sender === 'System'
                                                    ? 'text-yellow-400'
                                                    : 'text-green-400'
                                                }`}>
                                                [{message.timestamp.toLocaleTimeString()}] {message.sender}:
                                            </span>
                                            <span className="text-minecraft-xs text-white ml-2">
                                                {message.message}
                                            </span>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="flex gap-2">
                                    <MinecraftInput
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        className="flex-1"
                                    />
                                    <MinecraftButton
                                        onClick={sendMessage}
                                        disabled={isLoading || !inputMessage.trim()}
                                    >
                                        Send
                                    </MinecraftButton>
                                </div>
                            </div>
                        </MinecraftPanel>

                        {/* Command Panel */}
                        <MinecraftPanel>
                            <h3 className="text-minecraft-sm text-white mb-2">Command Center</h3>
                            <div className="flex gap-2 mb-2">
                                <select
                                    value={selectedCharacter}
                                    onChange={(e) => setSelectedCharacter(e.target.value)}
                                    className="minecraft-input flex-1"
                                >
                                    <option value="">Select Target Character</option>
                                    {activeCharacters.map(char => (
                                        <option key={char.id} value={char.id}>{char.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <MinecraftInput
                                    value={userCommand}
                                    onChange={(e) => setUserCommand(e.target.value)}
                                    placeholder="Commands: spawn [name], despawn [name], modify [instruction]"
                                    onKeyPress={(e) => e.key === 'Enter' && executeUserCommand()}
                                    className="flex-1"
                                />
                                <MinecraftButton onClick={executeUserCommand}>
                                    Execute
                                </MinecraftButton>
                            </div>
                        </MinecraftPanel>
                    </div>

                    {/* Character Management Sidebar */}
                    <div>
                        {/* Active Characters */}
                        <MinecraftPanel className="mb-4">
                            <h3 className="text-minecraft-sm text-white mb-2">
                                Active Characters ({activeCharacters.length}/10)
                            </h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {activeCharacters.map((character) => (
                                    <div key={character.id} className="flex items-center justify-between p-2 bg-black/20 border-minecraft">
                                        <div>
                                            <div className="text-minecraft-xs text-white font-bold">
                                                {character.name}
                                            </div>
                                            <div className="text-minecraft-tiny text-gray-400">
                                                {character.role} • Mood: {Math.round(character.currentMood * 100)}%
                                            </div>
                                        </div>
                                        <MinecraftButton
                                            onClick={() => despawnCharacter(character.id)}
                                            className="text-minecraft-tiny"
                                        >
                                            Remove
                                        </MinecraftButton>
                                    </div>
                                ))}
                                {activeCharacters.length === 0 && (
                                    <div className="text-minecraft-xs text-gray-400 text-center py-4">
                                        No active characters
                                    </div>
                                )}
                            </div>
                        </MinecraftPanel>

                        {/* Available Characters */}
                        <MinecraftPanel>
                            <h3 className="text-minecraft-sm text-white mb-2">Available Characters</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {availableCharacters
                                    .filter(char => !activeCharacters.find(active => active.id === char.id))
                                    .map((character) => (
                                        <div key={character.id} className="flex items-center justify-between p-2 bg-black/20 border-minecraft">
                                            <div>
                                                <div className="text-minecraft-xs text-white font-bold">
                                                    {character.name}
                                                </div>
                                                <div className="text-minecraft-tiny text-gray-400">
                                                    {character.role}
                                                </div>
                                            </div>
                                            <MinecraftButton
                                                onClick={() => spawnCharacter(character.id)}
                                                className="text-minecraft-tiny"
                                            >
                                                Spawn
                                            </MinecraftButton>
                                        </div>
                                    ))}
                                {availableCharacters.length === 0 && (
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
