'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MinecraftButton, MinecraftPanel, MinecraftInput, MinecraftSelect, PixelAvatar } from '@/components/ui/minecraft-ui';
import { generateRandomFOXP2Pattern, generateDefaultActions, NPCCharacter, FOXP2NeuralPattern, CharacterAction } from '@/lib/utils';

export default function CharacterCreator() {
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const [character, setCharacter] = useState<Partial<NPCCharacter>>({
        name: '',
        role: 'wanderer',
        foxp2Pattern: generateRandomFOXP2Pattern(),
        currentMood: 0.5,
        memoryBank: [],
        routines: [],
        actions: generateDefaultActions('wanderer')
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string>('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Load character for editing
    useEffect(() => {
        if (editId) {
            loadCharacterForEdit(editId);
        }
    }, [editId]);

    const loadCharacterForEdit = async (characterId: string) => {
        setIsLoading(true);
        try {
            // Try to load from API first
            const response = await fetch('/api/characters');
            if (response.ok) {
                const characters = await response.json();
                const characterToEdit = characters.find((c: NPCCharacter) => c.id === characterId);

                if (characterToEdit) {
                    setCharacter(characterToEdit);
                    setIsEditing(true);
                    setSaveMessage('📝 Editing existing character');
                    setTimeout(() => setSaveMessage(''), 3000);
                } else {
                    setSaveMessage('❌ Character not found');
                    setTimeout(() => setSaveMessage(''), 3000);
                }
            } else {
                // Fallback to localStorage
                const localChars = JSON.parse(localStorage.getItem('mnemocyte-characters') || '[]');
                const characterToEdit = localChars.find((c: NPCCharacter) => c.id === characterId);

                if (characterToEdit) {
                    setCharacter(characterToEdit);
                    setIsEditing(true);
                    setSaveMessage('📝 Editing existing character');
                    setTimeout(() => setSaveMessage(''), 3000);
                } else {
                    setSaveMessage('❌ Character not found');
                    setTimeout(() => setSaveMessage(''), 3000);
                }
            }
        } catch (error) {
            console.error('Error loading character for edit:', error);
            setSaveMessage('❌ Failed to load character');
            setTimeout(() => setSaveMessage(''), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateNewPattern = () => {
        setCharacter(prev => ({
            ...prev,
            foxp2Pattern: generateRandomFOXP2Pattern()
        }));
    };

    const getRoleBasedAction = (role: string): string => {
        const actions = {
            warrior: 'Battle Strike',
            merchant: 'Trade Negotiation',
            scholar: 'Knowledge Inquiry',
            wanderer: 'Path Finding',
            guardian: 'Protective Shield',
            artisan: 'Craft Creation'
        };
        return actions[role as keyof typeof actions] || 'Basic Action';
    };

    const getRoleBasedActionDescription = (role: string): string => {
        const descriptions = {
            warrior: 'Perform a powerful combat move against enemies',
            merchant: 'Negotiate better prices or trade terms',
            scholar: 'Research and provide detailed knowledge on topics',
            wanderer: 'Guide others through unknown territories',
            guardian: 'Protect allies from harm or danger',
            artisan: 'Create useful items or repair equipment'
        };
        return descriptions[role as keyof typeof descriptions] || 'Perform a basic action';
    };

    const handleGenerateImage = async () => {
        if (!character.name?.trim() || !character.foxp2Pattern) {
            setSaveMessage('⚠️ Please enter a name and generate FOXP2 pattern first!');
            setTimeout(() => setSaveMessage(''), 3000);
            return;
        }

        setIsGeneratingImage(true);

        try {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    characterName: character.name,
                    role: character.role,
                    emotionalWeights: character.foxp2Pattern.emotionalWeights,
                    behavioralTraits: character.foxp2Pattern.behavioralTraits
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('Image generation successful:', result.imageUrl);
                setCharacter(prev => ({
                    ...prev,
                    imageUrl: result.imageUrl
                }));
                setSaveMessage('✨ Character image generated!');
                setTimeout(() => setSaveMessage(''), 3000);
            } else {
                console.error('Image generation failed:', result);
                setSaveMessage(`❌ Failed to generate image: ${result.error || 'Unknown error'}`);
                setTimeout(() => setSaveMessage(''), 3000);
            }
        } catch (error) {
            console.error('Image generation error:', error);
            setSaveMessage('❌ Error generating image');
            setTimeout(() => setSaveMessage(''), 3000);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleSaveCharacter = async () => {
        if (!character.name?.trim()) {
            setSaveMessage('❌ Please enter a character name!');
            setTimeout(() => setSaveMessage(''), 3000);
            return;
        }

        if (!character.foxp2Pattern) {
            setSaveMessage('❌ Invalid FOXP2 pattern!');
            setTimeout(() => setSaveMessage(''), 3000);
            return;
        }

        setIsSaving(true);
        setSaveMessage('');

        try {
            const fullCharacter: NPCCharacter = {
                id: character.id || `npc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                name: character.name.trim(),
                role: character.role || 'wanderer',
                foxp2Pattern: character.foxp2Pattern,
                currentMood: character.currentMood || 0.5,
                memoryBank: character.memoryBank || [],
                routines: character.routines || [],
                actions: character.actions || [],
                imageUrl: character.imageUrl
            };

            const response = await fetch('/api/characters', {
                method: 'POST', // API handles both create and update in POST
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(fullCharacter),
            });

            const result = await response.json();

            if (response.ok) {
                setSaveMessage(`✅ ${result.message}`);
                setCharacter(prev => ({ ...prev, id: result.character.id }));

                // Also save to localStorage as backup
                const savedChars = JSON.parse(localStorage.getItem('mnemocyte-characters') || '[]');
                const existingIndex = savedChars.findIndex((c: NPCCharacter) => c.id === result.character.id);
                if (existingIndex >= 0) {
                    savedChars[existingIndex] = result.character;
                } else {
                    savedChars.push(result.character);
                }
                localStorage.setItem('mnemocyte-characters', JSON.stringify(savedChars));
            } else {
                setSaveMessage(`❌ ${result.error}`);
            }
        } catch (error) {
            console.error('Save error:', error);
            setSaveMessage('❌ Failed to save character. Check your connection.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 5000);
        }
    };

    const handleResetCharacter = () => {
        if (confirm('Are you sure you want to reset this character? All changes will be lost.')) {
            setCharacter({
                name: '',
                role: 'wanderer',
                foxp2Pattern: generateRandomFOXP2Pattern(),
                currentMood: 0.5,
                memoryBank: [],
                routines: []
            });
            setSaveMessage('🔄 Character reset!');
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    const handleEmotionalWeightChange = (emotion: keyof FOXP2NeuralPattern['emotionalWeights'], value: number) => {
        if (!character.foxp2Pattern) return;

        setCharacter(prev => ({
            ...prev,
            foxp2Pattern: {
                ...prev.foxp2Pattern!,
                emotionalWeights: {
                    ...prev.foxp2Pattern!.emotionalWeights,
                    [emotion]: value
                }
            }
        }));
    };

    const handleBehavioralTraitChange = (trait: keyof FOXP2NeuralPattern['behavioralTraits'], value: number) => {
        if (!character.foxp2Pattern) return;

        setCharacter(prev => ({
            ...prev,
            foxp2Pattern: {
                ...prev.foxp2Pattern!,
                behavioralTraits: {
                    ...prev.foxp2Pattern!.behavioralTraits,
                    [trait]: value
                }
            }
        }));
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-minecraft-sky to-minecraft-grass p-4">
                <div className="container mx-auto max-w-6xl">
                    <MinecraftPanel className="text-center">
                        <p className="font-minecraft text-white">⏳ Loading Character...</p>
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
                    <div className="flex justify-between items-center mb-4">
                        <a href="/">
                            <MinecraftButton variant="secondary" size="sm">
                                ← Back to Home
                            </MinecraftButton>
                        </a>
                        <div></div> {/* Spacer for center alignment */}
                    </div>
                    <h1 className="text-2xl font-minecraft text-white mb-2">
                        {isEditing ? '✏️ Edit Character' : '🧠 FOXP2 Character Creator'}
                    </h1>
                    <p className="text-minecraft-xs text-gray-300">
                        {isEditing ? `Editing: ${character.name || 'Unnamed Character'}` : 'Design NPCs with advanced neural memory systems'}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Character Preview */}
                    <div className="lg:col-span-1">
                        <MinecraftPanel title="Character Preview">
                            <div className="text-center">
                                <PixelAvatar
                                    size={128}
                                    className="mx-auto mb-4"
                                    imageUrl={character.imageUrl}
                                    alt={character.name || 'Character Avatar'}
                                />
                                <MinecraftButton
                                    size="sm"
                                    variant="secondary"
                                    onClick={handleGenerateImage}
                                    disabled={isGeneratingImage || !character.name?.trim()}
                                    className="mb-4"
                                >
                                    {isGeneratingImage ? '⏳ Generating...' : '🎨 Generate Image'}
                                </MinecraftButton>
                                <h3 className="font-minecraft text-minecraft text-white mb-2">
                                    {character.name || 'Unnamed NPC'}
                                </h3>
                                <p className="text-minecraft-xs text-gray-300 mb-2">
                                    Role: {character.role}
                                </p>
                                <p className="text-minecraft-xs text-gray-300">
                                    FOXP2 Pattern: {character.foxp2Pattern?.name}
                                </p>

                                {/* Mood Indicator */}
                                <div className="mt-4">
                                    <p className="text-minecraft-xs text-gray-300 mb-2">Current Mood</p>
                                    <div className="w-full bg-gray-700 h-4 border-2 border-gray-500">
                                        <div
                                            className="h-full bg-minecraft-green transition-all duration-300"
                                            style={{ width: `${(character.currentMood || 0) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </MinecraftPanel>
                    </div>

                    {/* Configuration */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <MinecraftPanel title="Basic Information">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-minecraft-xs text-gray-300 mb-2">
                                        Character Name
                                    </label>
                                    <MinecraftInput
                                        value={character.name}
                                        onChange={(e) => setCharacter(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter character name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-minecraft-xs text-gray-300 mb-2">
                                        Role
                                    </label>
                                    <MinecraftSelect
                                        value={character.role}
                                        onChange={(e) => {
                                            const newRole = e.target.value as any;
                                            setCharacter(prev => ({
                                                ...prev,
                                                role: newRole,
                                                actions: generateDefaultActions(newRole)
                                            }));
                                        }}
                                    >
                                        <option value="warrior">⚔️ Warrior</option>
                                        <option value="merchant">💰 Merchant</option>
                                        <option value="scholar">📚 Scholar</option>
                                        <option value="wanderer">🌍 Wanderer</option>
                                        <option value="guardian">🛡️ Guardian</option>
                                        <option value="artisan">🔨 Artisan</option>
                                    </MinecraftSelect>
                                </div>
                            </div>
                        </MinecraftPanel>

                        {/* FOXP2 Neural Pattern */}
                        <MinecraftPanel title="🧠 FOXP2 Neural Pattern">
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-minecraft-xs text-gray-300">
                                        Pattern ID: {character.foxp2Pattern?.name}
                                    </p>
                                    <MinecraftButton size="sm" onClick={handleGenerateNewPattern}>
                                        Generate New
                                    </MinecraftButton>
                                </div>
                            </div>

                            {/* Emotional Weights */}
                            <div className="mb-6">
                                <h4 className="text-minecraft-sm font-minecraft text-white mb-3">
                                    Emotional Weights
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {character.foxp2Pattern && Object.entries(character.foxp2Pattern.emotionalWeights).map(([emotion, value]) => (
                                        <div key={emotion}>
                                            <label className="block text-minecraft-xs text-gray-300 mb-1 capitalize">
                                                {emotion}: {(value * 100).toFixed(0)}%
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={value}
                                                onChange={(e) => handleEmotionalWeightChange(emotion as any, parseFloat(e.target.value))}
                                                className="w-full h-2 bg-gray-700 rounded-none appearance-none cursor-pointer pixelated"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Behavioral Traits */}
                            <div>
                                <h4 className="text-minecraft-sm font-minecraft text-white mb-3">
                                    Behavioral Traits
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {character.foxp2Pattern && Object.entries(character.foxp2Pattern.behavioralTraits).map(([trait, value]) => (
                                        <div key={trait}>
                                            <label className="block text-minecraft-xs text-gray-300 mb-1 capitalize">
                                                {trait}: {(value * 100).toFixed(0)}%
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={value}
                                                onChange={(e) => handleBehavioralTraitChange(trait as any, parseFloat(e.target.value))}
                                                className="w-full h-2 bg-gray-700 rounded-none appearance-none cursor-pointer pixelated"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </MinecraftPanel>

                        {/* Character Actions */}
                        <MinecraftPanel title="Character Actions">
                            <div className="space-y-4">
                                <p className="text-minecraft-xs text-gray-300">
                                    Define special actions your character can perform
                                </p>

                                {character.actions && character.actions.length > 0 && (
                                    <div className="space-y-3">
                                        {character.actions.map((action, index) => (
                                            <div key={action.id} className="border border-gray-500 p-3 bg-gray-700">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-minecraft-xs font-minecraft text-white">
                                                        {action.name}
                                                    </span>
                                                    <MinecraftButton
                                                        size="sm"
                                                        variant="danger"
                                                        onClick={() => {
                                                            const newActions = character.actions?.filter((_, i) => i !== index);
                                                            setCharacter(prev => ({ ...prev, actions: newActions }));
                                                        }}
                                                    >
                                                        ❌
                                                    </MinecraftButton>
                                                </div>
                                                <p className="text-minecraft-xs text-gray-300">
                                                    {action.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <MinecraftButton
                                    variant="secondary"
                                    onClick={() => {
                                        const newAction: CharacterAction = {
                                            id: `action_${Date.now()}`,
                                            name: getRoleBasedAction(character.role || 'wanderer'),
                                            description: getRoleBasedActionDescription(character.role || 'wanderer')
                                        };
                                        setCharacter(prev => ({
                                            ...prev,
                                            actions: [...(prev.actions || []), newAction]
                                        }));
                                    }}
                                >
                                    ➕ Add Role Action
                                </MinecraftButton>
                            </div>
                        </MinecraftPanel>

                        {/* Save Status Message */}
                        {saveMessage && (
                            <MinecraftPanel className="mb-4">
                                <p className="text-minecraft-sm font-minecraft text-center text-white">
                                    {saveMessage}
                                </p>
                            </MinecraftPanel>
                        )}

                        {/* Actions */}
                        <div className="flex gap-4">
                            <MinecraftButton
                                className="flex-1"
                                onClick={handleSaveCharacter}
                                disabled={isSaving || !character.name?.trim()}
                            >
                                {isSaving ? '⏳ Saving...' : (isEditing ? '💾 Update Character' : '💾 Save Character')}
                            </MinecraftButton>
                            <a href="/playground">
                                <MinecraftButton variant="secondary" className="flex-1">
                                    🎮 Test in Playground
                                </MinecraftButton>
                            </a>
                            <MinecraftButton
                                variant="danger"
                                onClick={handleResetCharacter}
                            >
                                🗑️ Reset
                            </MinecraftButton>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
