'use client';

import { useState, useEffect, useRef } from 'react';
import { MinecraftButton, MinecraftPanel, MinecraftInput, PixelAvatar } from '@/components/ui/minecraft-ui';
import { NPCCharacter } from '@/lib/utils';
import Link from 'next/link';

interface ChatMessage {
    id: string;
    sender: 'user' | 'npc';
    message: string;
    timestamp: Date;
    emotion?: string;
}

export default function Playground() {
    const [selectedCharacter, setSelectedCharacter] = useState<NPCCharacter | null>(null);
    const [characters, setCharacters] = useState<NPCCharacter[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadCharacters();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadCharacters = async () => {
        try {
            const response = await fetch('/api/characters');
            if (response.ok) {
                const apiCharacters = await response.json();
                setCharacters(apiCharacters);
            } else {
                // Fallback to localStorage
                const localChars = JSON.parse(localStorage.getItem('mnemocyte-characters') || '[]');
                setCharacters(localChars);
            }
        } catch (err) {
            console.error('Error loading characters:', err);
            const localChars = JSON.parse(localStorage.getItem('mnemocyte-characters') || '[]');
            setCharacters(localChars);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const selectCharacter = (character: NPCCharacter) => {
        setSelectedCharacter(character);
        setMessages([
            {
                id: 'welcome',
                sender: 'npc',
                message: generateWelcomeMessage(character),
                timestamp: new Date(),
                emotion: 'neutral'
            }
        ]);
    };

    const generateWelcomeMessage = (character: NPCCharacter) => {
        const roleGreetings = {
            warrior: "⚔️ Greetings! I am a warrior, ready for battle and adventure.",
            merchant: "💰 Welcome to my shop! I have the finest goods and fair prices.",
            scholar: "📚 Ah, a fellow seeker of knowledge! What wisdom do you seek?",
            wanderer: "🌍 Hello there, traveler! I've seen many lands and have tales to tell.",
            guardian: "🛡️ I stand watch and protect those in need. How may I assist you?",
            artisan: "🔨 Greetings! I craft with passion and precision. What brings you here?"
        };

        const mood = character.currentMood;
        const moodModifier = mood > 0.7 ? " I'm feeling quite cheerful today!" :
            mood < 0.3 ? " I'm feeling a bit melancholy..." :
                " I'm in a balanced mood today.";

        return roleGreetings[character.role] + moodModifier;
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || !selectedCharacter || isLoading) return;

        const userMessage: ChatMessage = {
            id: `user_${Date.now()}`,
            sender: 'user',
            message: inputMessage.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setIsTyping(true);

        try {
            // Send to AI API with character context
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: inputMessage.trim(),
                    character: selectedCharacter,
                    conversationHistory: messages.slice(-5) // Last 5 messages for context
                }),
            });

            const result = await response.json();

            if (response.ok) {
                const npcMessage: ChatMessage = {
                    id: `npc_${Date.now()}`,
                    sender: 'npc',
                    message: result.response,
                    timestamp: new Date(),
                    emotion: result.emotion || 'neutral'
                };

                setMessages(prev => [...prev, npcMessage]);

                // Update character mood based on interaction
                if (result.moodChange) {
                    const newMood = Math.max(0, Math.min(1, selectedCharacter.currentMood + result.moodChange));
                    setSelectedCharacter(prev => prev ? {
                        ...prev,
                        currentMood: newMood
                    } : null);

                    // Also update in storage
                    try {
                        const updatedCharacter = { ...selectedCharacter, currentMood: newMood };

                        // Update in API
                        await fetch('/api/characters', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updatedCharacter),
                        });

                        // Update in localStorage
                        const savedChars = JSON.parse(localStorage.getItem('mnemocyte-characters') || '[]');
                        const charIndex = savedChars.findIndex((c: NPCCharacter) => c.id === selectedCharacter.id);
                        if (charIndex >= 0) {
                            savedChars[charIndex] = updatedCharacter;
                            localStorage.setItem('mnemocyte-characters', JSON.stringify(savedChars));
                        }
                    } catch (error) {
                        console.error('Failed to update character mood:', error);
                    }
                }
            } else {
                // Fallback response if AI fails
                const fallbackMessage: ChatMessage = {
                    id: `npc_${Date.now()}`,
                    sender: 'npc',
                    message: generateFallbackResponse(selectedCharacter, inputMessage),
                    timestamp: new Date(),
                    emotion: 'neutral'
                };
                setMessages(prev => [...prev, fallbackMessage]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: ChatMessage = {
                id: `npc_${Date.now()}`,
                sender: 'npc',
                message: "I seem to be having trouble understanding right now. Could you try again?",
                timestamp: new Date(),
                emotion: 'confused'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    const generateFallbackResponse = (character: NPCCharacter, userInput: string) => {
        const responses = [
            `As a ${character.role}, I find that interesting.`,
            `My FOXP2 neural pattern suggests I should consider that carefully.`,
            `That reminds me of something from my experiences...`,
            `I need to think about that with my current mood level.`
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    };

    const getRoleEmoji = (role: string) => {
        const roleEmojis: Record<string, string> = {
            warrior: '⚔️', merchant: '💰', scholar: '📚',
            wanderer: '🌍', guardian: '🛡️', artisan: '🔨'
        };
        return roleEmojis[role] || '🤖';
    };

    const getEmotionColor = (emotion?: string) => {
        const colors: Record<string, string> = {
            happy: 'text-yellow-400',
            sad: 'text-blue-400',
            angry: 'text-red-400',
            excited: 'text-green-400',
            confused: 'text-purple-400',
            neutral: 'text-gray-300'
        };
        return colors[emotion || 'neutral'] || 'text-gray-300';
    };

    const updateCharacterMood = async (newMood: number) => {
        if (!selectedCharacter) return;

        const updatedCharacter = { ...selectedCharacter, currentMood: newMood };
        setSelectedCharacter(updatedCharacter);

        // Save to storage
        try {
            // Update in API
            await fetch('/api/characters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCharacter),
            });

            // Update in localStorage
            const savedChars = JSON.parse(localStorage.getItem('mnemocyte-characters') || '[]');
            const charIndex = savedChars.findIndex((c: NPCCharacter) => c.id === selectedCharacter.id);
            if (charIndex >= 0) {
                savedChars[charIndex] = updatedCharacter;
                localStorage.setItem('mnemocyte-characters', JSON.stringify(savedChars));
            }
        } catch (error) {
            console.error('Failed to update character mood:', error);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-minecraft-sky to-minecraft-grass p-4">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="minecraft-panel mb-6 text-center">
                    <h1 className="text-2xl font-minecraft text-white mb-2">
                        🎮 FOXP2 Neural Playground
                    </h1>
                    <p className="text-minecraft-sm text-gray-300 mb-4">
                        Interactive AI conversations with your NPCs
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link href="/creator">
                            <MinecraftButton size="sm">➕ Create Character</MinecraftButton>
                        </Link>
                        <Link href="/characters">
                            <MinecraftButton size="sm" variant="secondary">📚 Character Library</MinecraftButton>
                        </Link>
                        {selectedCharacter && (
                            <MinecraftButton
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                    setMessages([{
                                        id: 'welcome',
                                        sender: 'npc',
                                        message: generateWelcomeMessage(selectedCharacter),
                                        timestamp: new Date(),
                                        emotion: 'neutral'
                                    }]);
                                }}
                            >
                                🔄 Reset Chat
                            </MinecraftButton>
                        )}
                        <Link href="/">
                            <MinecraftButton size="sm" variant="secondary">🏠 Home</MinecraftButton>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Character Selection */}
                    <div className="lg:col-span-1">
                        <MinecraftPanel title="Select Character">
                            {characters.length === 0 ? (
                                <div className="text-center">
                                    <p className="text-minecraft-sm text-gray-300 mb-4">
                                        No characters found!
                                    </p>
                                    <Link href="/creator">
                                        <MinecraftButton size="sm">
                                            Create First Character
                                        </MinecraftButton>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {characters.map((character) => (
                                        <div
                                            key={character.id}
                                            className={`p-3 border-2 cursor-pointer transition-colors pixelated ${selectedCharacter?.id === character.id
                                                ? 'border-minecraft-green bg-minecraft-green bg-opacity-20'
                                                : 'border-gray-600 hover:border-gray-400'
                                                }`}
                                            onClick={() => selectCharacter(character)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <PixelAvatar
                                                    size={32}
                                                    imageUrl={character.imageUrl}
                                                    alt={character.name}
                                                />
                                                <div>
                                                    <p className="text-minecraft-sm font-minecraft text-white">
                                                        {character.name}
                                                    </p>
                                                    <p className="text-minecraft-sm text-gray-400">
                                                        {getRoleEmoji(character.role)} {character.role}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Mood indicator */}
                                            <div className="mt-2">
                                                <div className="w-full bg-gray-700 h-2 border border-gray-600">
                                                    <div
                                                        className="h-full bg-minecraft-green transition-all duration-300"
                                                        style={{ width: `${character.currentMood * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </MinecraftPanel>
                    </div>

                    {/* Chat Interface */}
                    <div className="lg:col-span-3">
                        {selectedCharacter ? (
                            <div className="space-y-4">
                                {/* Character Info */}
                                <MinecraftPanel>
                                    <div className="flex items-center gap-4 mb-4">
                                        <PixelAvatar
                                            size={64}
                                            imageUrl={selectedCharacter.imageUrl}
                                            alt={selectedCharacter.name}
                                        />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-minecraft text-minecraft text-white">
                                                        {selectedCharacter.name}
                                                    </h3>
                                                    <p className="text-minecraft-sm text-gray-300">
                                                        {getRoleEmoji(selectedCharacter.role)} {selectedCharacter.role} •
                                                        FOXP2: {selectedCharacter.foxp2Pattern.name}
                                                    </p>
                                                </div>
                                                <div className="text-minecraft-sm text-green-300 text-right">
                                                    <div>Messages: {messages.length - 1}</div>
                                                    <div>Mood: {selectedCharacter.currentMood}</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-2 text-minecraft-sm text-gray-400">
                                                <span>Sociability: {(selectedCharacter.foxp2Pattern.behavioralTraits.sociability * 100).toFixed(0)}%</span>
                                                <span>Intelligence: {(selectedCharacter.foxp2Pattern.behavioralTraits.intelligence * 100).toFixed(0)}%</span>
                                                <span>Creativity: {(selectedCharacter.foxp2Pattern.behavioralTraits.creativity * 100).toFixed(0)}%</span>
                                                <span>Energy: {(selectedCharacter.foxp2Pattern.behavioralTraits.energy * 100).toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mood Control */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-minecraft-sm text-gray-300 font-minecraft">
                                                Current Mood: {(selectedCharacter.currentMood * 100).toFixed(0)}%
                                                {selectedCharacter.currentMood > 0.8 ? ' 😄' :
                                                    selectedCharacter.currentMood > 0.6 ? ' 😊' :
                                                        selectedCharacter.currentMood > 0.4 ? ' 😐' :
                                                            selectedCharacter.currentMood > 0.2 ? ' 😔' : ' 😢'}
                                            </label>
                                            <div className="flex gap-1">
                                                <MinecraftButton
                                                    size="sm"
                                                    onClick={() => updateCharacterMood(Math.min(1, selectedCharacter.currentMood + 0.1))}
                                                >
                                                    +
                                                </MinecraftButton>
                                                <MinecraftButton
                                                    size="sm"
                                                    onClick={() => updateCharacterMood(Math.max(0, selectedCharacter.currentMood - 0.1))}
                                                >
                                                    -
                                                </MinecraftButton>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-700 h-4 border-2 border-gray-500">
                                            <div
                                                className={`h-full transition-all duration-300 ${selectedCharacter.currentMood > 0.7 ? 'bg-green-500' :
                                                    selectedCharacter.currentMood > 0.5 ? 'bg-minecraft-green' :
                                                        selectedCharacter.currentMood > 0.3 ? 'bg-yellow-500' :
                                                            selectedCharacter.currentMood > 0.1 ? 'bg-orange-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${selectedCharacter.currentMood * 100}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-minecraft-sm text-gray-500 mt-1">
                                            <span>Depressed</span>
                                            <span>Neutral</span>
                                            <span>Euphoric</span>
                                        </div>
                                    </div>

                                    {/* Top Emotional Weights */}
                                    <div className="mb-4">
                                        <h4 className="text-minecraft-sm font-minecraft text-gray-300 mb-2">Dominant Emotions</h4>
                                        <div className="grid grid-cols-3 gap-2 text-minecraft-sm">
                                            {Object.entries(selectedCharacter.foxp2Pattern.emotionalWeights)
                                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                                .slice(0, 3)
                                                .map(([emotion, weight]) => (
                                                    <div key={emotion} className="text-center">
                                                        <div className="text-gray-400 capitalize">{emotion}</div>
                                                        <div className="text-foxp2-primary font-bold">{((weight as number) * 100).toFixed(0)}%</div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </MinecraftPanel>

                                {/* Chat Messages */}
                                <MinecraftPanel title="Conversation">
                                    <div className="h-96 overflow-y-auto mb-4 space-y-3">
                                        {messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-xs p-3 border-2 pixelated ${msg.sender === 'user'
                                                        ? 'bg-minecraft-dirt border-minecraft-brown text-white'
                                                        : 'bg-gray-700 border-gray-600 text-gray-200'
                                                        }`}
                                                >
                                                    <p className={`text-minecraft-sm font-minecraft ${getEmotionColor(msg.emotion)}`}>
                                                        {msg.message}
                                                    </p>
                                                    <p className="text-minecraft-sm text-gray-500 mt-1">
                                                        {msg.timestamp.toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {isTyping && (
                                            <div className="flex justify-start">
                                                <div className="max-w-xs p-3 border-2 bg-gray-700 border-gray-600 pixelated">
                                                    <p className="text-minecraft-sm font-minecraft text-gray-300">
                                                        {selectedCharacter.name} is thinking...
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input */}
                                    <div className="flex gap-2">
                                        <MinecraftInput
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="flex-1"
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                            disabled={isLoading}
                                        />
                                        <MinecraftButton
                                            onClick={sendMessage}
                                            disabled={!inputMessage.trim() || isLoading}
                                        >
                                            {isLoading ? '⏳' : '💬'}
                                        </MinecraftButton>
                                    </div>
                                </MinecraftPanel>
                            </div>
                        ) : (
                            <MinecraftPanel className="text-center">
                                <h3 className="font-minecraft text-white mb-4">
                                    Select a Character to Start
                                </h3>
                                <p className="text-minecraft-sm text-gray-300">
                                    Choose an NPC from the left panel to begin your conversation
                                </p>
                            </MinecraftPanel>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
