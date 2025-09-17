'use client';

import { useState, useEffect } from 'react';
import { MinecraftButton, MinecraftPanel, MinecraftInput } from '@/components/ui/minecraft-ui';

interface Action {
    id: string;
    name: string;
    description: string;
}

interface CharacterRole {
    id: string;
    name: string;
    description: string;
}

interface MemoryTemplate {
    id: string;
    heading: string;
    content: string;
}

export default function MetaConfigPage() {
    const [activeTab, setActiveTab] = useState<'actions' | 'characters'>('actions');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Actions state
    const [actions, setActions] = useState<Action[]>([]);
    const [newAction, setNewAction] = useState<Partial<Action>>({});

    // Character roles state
    const [characterRoles, setCharacterRoles] = useState<CharacterRole[]>([]);
    const [newRole, setNewRole] = useState<Partial<CharacterRole>>({});

    // Memory templates state
    const [memories, setMemories] = useState<MemoryTemplate[]>([]);
    const [newMemory, setNewMemory] = useState<Partial<MemoryTemplate>>({});

    // Fetch data on mount
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [actionsRes, rolesRes, memoriesRes] = await Promise.all([
                fetch('/api/actions'),
                fetch('/api/character-roles'),
                fetch('/api/memory-templates')
            ]);

            if (actionsRes.ok) {
                const actionsData = await actionsRes.json();
                setActions(actionsData);
            } else {
                console.error('Failed to fetch actions');
            }

            if (rolesRes.ok) {
                const rolesData = await rolesRes.json();
                setCharacterRoles(rolesData);
            } else {
                console.error('Failed to fetch character roles');
            }

            if (memoriesRes.ok) {
                const memoriesData = await memoriesRes.json();
                setMemories(memoriesData);
            } else {
                console.error('Failed to fetch memory templates');
            }

        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load configuration data');
        } finally {
            setLoading(false);
        }
    };

    // Action functions
    const addAction = async () => {
        if (!newAction.name?.trim()) return;

        try {
            const response = await fetch('/api/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAction)
            });

            if (response.ok) {
                const action = await response.json();
                setActions([...actions, action]);
                setNewAction({});
            } else {
                setError('Failed to add action');
            }
        } catch (err) {
            console.error('Error adding action:', err);
            setError('Failed to add action');
        }
    };

    const deleteAction = async (id: string) => {
        try {
            const response = await fetch(`/api/actions/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setActions(actions.filter(action => action.id !== id));
            } else {
                setError('Failed to delete action');
            }
        } catch (err) {
            console.error('Error deleting action:', err);
            setError('Failed to delete action');
        }
    };

    // Character role functions
    const addRole = async () => {
        if (!newRole.name?.trim()) return;

        try {
            const response = await fetch('/api/character-roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRole)
            });

            if (response.ok) {
                const role = await response.json();
                setCharacterRoles([...characterRoles, role]);
                setNewRole({});
            } else {
                setError('Failed to add character role');
            }
        } catch (err) {
            console.error('Error adding character role:', err);
            setError('Failed to add character role');
        }
    };

    const deleteRole = async (id: string) => {
        try {
            const response = await fetch(`/api/character-roles/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setCharacterRoles(characterRoles.filter(role => role.id !== id));
            } else {
                setError('Failed to delete character role');
            }
        } catch (err) {
            console.error('Error deleting character role:', err);
            setError('Failed to delete character role');
        }
    };

    // Memory template functions
    const addMemory = async () => {
        if (!newMemory.heading?.trim()) return;

        try {
            const response = await fetch('/api/memory-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMemory)
            });

            if (response.ok) {
                const memory = await response.json();
                setMemories([...memories, memory]);
                setNewMemory({});
            } else {
                setError('Failed to add memory template');
            }
        } catch (err) {
            console.error('Error adding memory template:', err);
            setError('Failed to add memory template');
        }
    };

    const deleteMemory = async (id: string) => {
        try {
            const response = await fetch(`/api/memory-templates/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setMemories(memories.filter(memory => memory.id !== id));
            } else {
                setError('Failed to delete memory template');
            }
        } catch (err) {
            console.error('Error deleting memory template:', err);
            setError('Failed to delete memory template');
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-minecraft-sky to-minecraft-grass p-4">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-minecraft-xl text-white mb-6">Loading...</h1>
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-minecraft-sky to-minecraft-grass p-4">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-minecraft-xl text-red-400 mb-6">Error</h1>
                        <p className="text-white mb-4">{error}</p>
                        <MinecraftButton onClick={() => window.location.reload()}>
                            🔄 Retry
                        </MinecraftButton>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-minecraft-sky to-minecraft-grass p-4">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="minecraft-panel mb-6 text-center">
                    <div className="flex justify-center mb-4">
                        <img
                            src="/mnemocyte.png"
                            alt="Mnemocyte Logo"
                            className="h-16 pixelated"
                            style={{ width: 'auto' }}
                        />
                    </div>
                    <h1 className="text-2xl font-minecraft text-white mb-2">
                        META CONFIGURATION
                    </h1>
                    <p className="text-minecraft-sm text-gray-300">
                        Configure actions and character settings for the character creator
                    </p>
                </div>

                {/* Navigation */}
                <div className="flex justify-center mb-4">
                    <MinecraftButton
                        onClick={() => window.location.href = '/'}
                        className="text-minecraft-sm"
                    >
                        ← Back to Home
                    </MinecraftButton>
                </div>

                {/* Navigation Tabs */}
                <div className="minecraft-panel mb-6">
                    <div className="flex flex-wrap gap-2">
                        <MinecraftButton
                            variant={activeTab === 'actions' ? 'primary' : 'secondary'}
                            onClick={() => setActiveTab('actions')}
                        >
                            ⚔️ Action Config ({actions.length})
                        </MinecraftButton>
                        <MinecraftButton
                            variant={activeTab === 'characters' ? 'primary' : 'secondary'}
                            onClick={() => setActiveTab('characters')}
                        >
                            👤 Character Config ({characterRoles.length} roles, {memories.length} memories)
                        </MinecraftButton>
                    </div>
                </div>

                {/* Action Config Tab */}
                {activeTab === 'actions' && (
                    <div className="space-y-6">
                        {/* Add New Action */}
                        <MinecraftPanel title="Add New Action">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-minecraft-sm text-white mb-2">Action Name</label>
                                    <MinecraftInput
                                        value={newAction.name || ''}
                                        onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
                                        placeholder="e.g., Cast Spell"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-minecraft-sm text-white mb-2">Description</label>
                                    <textarea
                                        className="minecraft-input w-full h-20 resize-none"
                                        value={newAction.description || ''}
                                        onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                                        placeholder="Describe what this action does..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <MinecraftButton onClick={addAction}>
                                        ➕ Add Action
                                    </MinecraftButton>
                                </div>
                            </div>
                        </MinecraftPanel>

                        {/* Actions List */}
                        <MinecraftPanel title="Available Actions for Character Creator">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {actions.map((action) => (
                                    <div key={action.id} className="minecraft-panel bg-gray-800 p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-minecraft-sm text-white font-bold">{action.name}</h3>
                                            <button
                                                onClick={() => deleteAction(action.id)}
                                                className="text-red-400 hover:text-red-300 text-xs"
                                            >
                                                ❌
                                            </button>
                                        </div>
                                        <p className="text-minecraft-sm text-gray-300">{action.description}</p>
                                    </div>
                                ))}
                                {actions.length === 0 && (
                                    <div className="md:col-span-3 text-center text-gray-400 py-8">
                                        No actions configured yet. Add your first action above!
                                    </div>
                                )}
                            </div>
                        </MinecraftPanel>
                    </div>
                )}

                {/* Character Config Tab */}
                {activeTab === 'characters' && (
                    <div className="space-y-6">
                        {/* Character Roles Section */}
                        <MinecraftPanel title="Character Roles">
                            {/* Add New Role */}
                            <div className="mb-6">
                                <h3 className="text-minecraft-sm text-white mb-4">Add New Role</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-minecraft-sm text-white mb-2">Role Name</label>
                                        <MinecraftInput
                                            value={newRole.name || ''}
                                            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                            placeholder="e.g., merchant"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-minecraft-sm text-white mb-2">Description</label>
                                        <textarea
                                            className="minecraft-input w-full h-20 resize-none"
                                            value={newRole.description || ''}
                                            onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                            placeholder="Describe this character role..."
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <MinecraftButton onClick={addRole}>
                                            ➕ Add Role
                                        </MinecraftButton>
                                    </div>
                                </div>
                            </div>

                            {/* Roles List */}
                            <div>
                                <h3 className="text-minecraft-sm text-white mb-4">Available Roles for Character Creator</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {characterRoles.map((role) => (
                                        <div key={role.id} className="minecraft-panel bg-gray-800 p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-minecraft-sm text-white font-bold capitalize">{role.name}</h4>
                                                <button
                                                    onClick={() => deleteRole(role.id)}
                                                    className="text-red-400 hover:text-red-300 text-xs"
                                                >
                                                    ❌
                                                </button>
                                            </div>
                                            <p className="text-minecraft-sm text-gray-300">{role.description}</p>
                                        </div>
                                    ))}
                                    {characterRoles.length === 0 && (
                                        <div className="md:col-span-3 text-center text-gray-400 py-8">
                                            No roles configured yet. Add your first role above!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </MinecraftPanel>

                        {/* Memories Section */}
                        <MinecraftPanel title="Character Memories">
                            {/* Add New Memory */}
                            <div className="mb-6">
                                <h3 className="text-minecraft-sm text-white mb-4">Add New Memory</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-minecraft-sm text-white mb-2">Memory Heading</label>
                                        <MinecraftInput
                                            value={newMemory.heading || ''}
                                            onChange={(e) => setNewMemory({ ...newMemory, heading: e.target.value })}
                                            placeholder="e.g., The Great Battle"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-minecraft-sm text-white mb-2">Memory Text</label>
                                        <textarea
                                            className="minecraft-input w-full h-32 resize-none"
                                            value={newMemory.content || ''}
                                            onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                                            placeholder="Describe the memory in detail..."
                                        />
                                    </div>
                                    <div>
                                        <MinecraftButton onClick={addMemory}>
                                            ➕ Add Memory
                                        </MinecraftButton>
                                    </div>
                                </div>
                            </div>

                            {/* Memories List */}
                            <div>
                                <h3 className="text-minecraft-sm text-white mb-4">Available Memories for Character Creator</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {memories.map((memory) => (
                                        <div key={memory.id} className="minecraft-panel bg-gray-800 p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-minecraft-sm text-white font-bold">{memory.heading}</h4>
                                                <button
                                                    onClick={() => deleteMemory(memory.id)}
                                                    className="text-red-400 hover:text-red-300 text-xs"
                                                >
                                                    ❌
                                                </button>
                                            </div>
                                            <p className="text-minecraft-sm text-gray-300 leading-relaxed">{memory.content}</p>
                                        </div>
                                    ))}
                                    {memories.length === 0 && (
                                        <div className="md:col-span-2 text-center text-gray-400 py-8">
                                            No memories configured yet. Add your first memory above!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </MinecraftPanel>
                    </div>
                )}
            </div>
        </main>
    );
}