'use client';

import { useState, useEffect } from 'react';
import { MinecraftButton, MinecraftPanel, PixelAvatar } from '@/components/ui/minecraft-ui';
import { NPCCharacter } from '@/lib/utils';
import Link from 'next/link';

export default function CharactersList() {
    const [characters, setCharacters] = useState<NPCCharacter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        loadCharacters();
    }, []);

    const loadCharacters = async () => {
        try {
            setLoading(true);

            // Try to load from API first
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
            setError('Failed to load characters');

            // Fallback to localStorage
            try {
                const localChars = JSON.parse(localStorage.getItem('mnemocyte-characters') || '[]');
                setCharacters(localChars);
            } catch (localErr) {
                console.error('Error loading from localStorage:', localErr);
            }
        } finally {
            setLoading(false);
        }
    };

    const deleteCharacter = async (characterId: string) => {
        if (!confirm('Are you sure you want to delete this character?')) {
            return;
        }

        try {
            const response = await fetch(`/api/characters?id=${characterId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setCharacters(prev => prev.filter(c => c.id !== characterId));

                // Also remove from localStorage
                const localChars = JSON.parse(localStorage.getItem('mnemocyte-characters') || '[]');
                const updatedLocal = localChars.filter((c: NPCCharacter) => c.id !== characterId);
                localStorage.setItem('mnemocyte-characters', JSON.stringify(updatedLocal));
            } else {
                setError('Failed to delete character');
            }
        } catch (err) {
            console.error('Error deleting character:', err);
            setError('Failed to delete character');
        }
    };

    const getRoleEmoji = (role: string) => {
        const roleEmojis: Record<string, string> = {
            warrior: '⚔️',
            merchant: '💰',
            scholar: '📚',
            wanderer: '🌍',
            guardian: '🛡️',
            artisan: '🔨'
        };
        return roleEmojis[role] || '🤖';
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-minecraft-sky to-minecraft-grass p-4">
                <div className="container mx-auto max-w-6xl">
                    <MinecraftPanel className="text-center">
                        <p className="font-minecraft text-white">⏳ Loading Characters...</p>
                    </MinecraftPanel>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-minecraft-sky to-minecraft-grass p-4">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="minecraft-panel mb-6 text-center">
                    <h1 className="text-2xl font-minecraft text-white mb-2">
                        📚 FOXP2 Character Library
                    </h1>
                    <p className="text-minecraft-sm text-gray-300 mb-4">
                        Manage your saved NPCs with neural memory systems
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/creator">
                            <MinecraftButton>
                                ➕ Create New Character
                            </MinecraftButton>
                        </Link>
                        <Link href="/">
                            <MinecraftButton variant="secondary">
                                🏠 Home
                            </MinecraftButton>
                        </Link>
                    </div>
                </div>

                {error && (
                    <MinecraftPanel className="mb-6 text-center">
                        <p className="font-minecraft text-red-400">❌ {error}</p>
                    </MinecraftPanel>
                )}

                {characters.length === 0 ? (
                    <MinecraftPanel className="text-center">
                        <h3 className="font-minecraft text-white mb-4">
                            No Characters Created Yet
                        </h3>
                        <p className="text-minecraft-sm text-gray-300 mb-6">
                            Start building your FOXP2 neural NPCs!
                        </p>
                        <Link href="/creator">
                            <MinecraftButton>
                                🧠 Create Your First Character
                            </MinecraftButton>
                        </Link>
                    </MinecraftPanel>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {characters.map((character) => (
                            <MinecraftPanel key={character.id}>
                                <div className="text-center mb-4">
                                    <PixelAvatar
                                        size={96}
                                        className="mx-auto mb-3"
                                        imageUrl={character.imageUrl}
                                        alt={character.name}
                                    />
                                    <h3 className="font-minecraft text-minecraft text-white mb-2">
                                        {character.name}
                                    </h3>
                                    <p className="text-minecraft-sm text-gray-300 mb-2">
                                        {getRoleEmoji(character.role)} {character.role}
                                    </p>
                                    <p className="text-minecraft-sm text-gray-400 mb-3">
                                        FOXP2: {character.foxp2Pattern.name}
                                    </p>

                                    {/* Mood Indicator */}
                                    <div className="mb-4">
                                        <p className="text-minecraft-sm text-gray-300 mb-1">Mood</p>
                                        <div className="w-full bg-gray-700 h-3 border-2 border-gray-500">
                                            <div
                                                className="h-full bg-minecraft-green transition-all duration-300"
                                                style={{ width: `${character.currentMood * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Top Traits */}
                                    <div className="mb-4">
                                        <p className="text-minecraft-sm text-gray-300 mb-2">Key Traits</p>
                                        <div className="grid grid-cols-2 gap-1 text-minecraft-sm">
                                            {Object.entries(character.foxp2Pattern.behavioralTraits)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 4)
                                                .map(([trait, value]) => (
                                                    <div key={trait} className="text-gray-400">
                                                        {trait}: {(value * 100).toFixed(0)}%
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <MinecraftButton size="sm" className="flex-1">
                                        ✏️ Edit
                                    </MinecraftButton>
                                    <a href="/playground">
                                        <MinecraftButton size="sm" variant="secondary" className="flex-1">
                                            🎮 Play
                                        </MinecraftButton>
                                    </a>
                                    <MinecraftButton
                                        size="sm"
                                        variant="danger"
                                        onClick={() => deleteCharacter(character.id)}
                                    >
                                        🗑️
                                    </MinecraftButton>
                                </div>
                            </MinecraftPanel>
                        ))}
                    </div>
                )}

                {/* Stats */}
                {characters.length > 0 && (
                    <MinecraftPanel className="mt-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-minecraft font-minecraft text-white">
                                    {characters.length}
                                </p>
                                <p className="text-minecraft-sm text-gray-300">Total NPCs</p>
                            </div>
                            <div>
                                <p className="text-minecraft font-minecraft text-white">
                                    {new Set(characters.map(c => c.role)).size}
                                </p>
                                <p className="text-minecraft-sm text-gray-300">Unique Roles</p>
                            </div>
                            <div>
                                <p className="text-minecraft font-minecraft text-white">
                                    {(characters.reduce((sum, c) => sum + c.currentMood, 0) / characters.length * 100).toFixed(0)}%
                                </p>
                                <p className="text-minecraft-sm text-gray-300">Avg Mood</p>
                            </div>
                            <div>
                                <p className="text-minecraft font-minecraft text-white">
                                    {characters.reduce((sum, c) => sum + c.memoryBank.length, 0)}
                                </p>
                                <p className="text-minecraft-sm text-gray-300">Total Memories</p>
                            </div>
                        </div>
                    </MinecraftPanel>
                )}
            </div>
        </main>
    );
}
