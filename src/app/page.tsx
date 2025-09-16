export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-minecraft-sky to-minecraft-grass p-8">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="minecraft-panel mb-8 text-center">
                    <h1 className="text-4xl font-minecraft text-white mb-2">
                        MNEMOCYTE
                    </h1>
                    <p className="text-minecraft-sm text-gray-300 mb-4">
                        Smart NPCs with FOXP2 Neural Memory Systems
                    </p>
                    <p className="text-minecraft-xs text-gray-400">
                        Create intelligent video game characters with emotions, actions, roles, and routines
                    </p>
                </div>

                {/* Main Menu Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Character Creator */}
                    <div className="minecraft-panel">
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 mx-auto mb-3 relative overflow-hidden">
                                {/* Base character silhouette */}
                                <div className="w-full h-full bg-gray-800 border-minecraft-thick border-minecraft-wood pixelated relative">
                                    {/* Character face formation - head shape */}
                                    <div className="absolute top-1 left-3 w-6 h-5 bg-yellow-600 pixelated animate-build rounded-sm" style={{ animationDelay: '0ms' }}></div>

                                    {/* Eyes */}
                                    <div className="absolute top-2 left-4 w-1 h-1 bg-black pixelated animate-build" style={{ animationDelay: '400ms' }}></div>
                                    <div className="absolute top-2 right-4 w-1 h-1 bg-black pixelated animate-build" style={{ animationDelay: '500ms' }}></div>

                                    {/* Nose */}
                                    <div className="absolute top-3 left-1/2 w-0.5 h-1 bg-yellow-500 pixelated animate-build transform -translate-x-0.5" style={{ animationDelay: '600ms' }}></div>

                                    {/* Mouth */}
                                    <div className="absolute top-4 left-1/2 w-2 h-0.5 bg-red-600 pixelated animate-build transform -translate-x-1/2" style={{ animationDelay: '700ms' }}></div>

                                    {/* Hair */}
                                    <div className="absolute top-0 left-4 w-4 h-1 bg-amber-800 pixelated animate-build" style={{ animationDelay: '300ms' }}></div>

                                    {/* Body - shirt */}
                                    <div className="absolute top-6 left-3 w-6 h-4 bg-blue-500 pixelated animate-build" style={{ animationDelay: '800ms' }}></div>

                                    {/* Arms */}
                                    <div className="absolute top-7 left-1 w-2 h-2 bg-yellow-600 pixelated animate-build" style={{ animationDelay: '900ms' }}></div>
                                    <div className="absolute top-7 right-1 w-2 h-2 bg-yellow-600 pixelated animate-build" style={{ animationDelay: '1000ms' }}></div>

                                    {/* Pants */}
                                    <div className="absolute top-10 left-3 w-6 h-3 bg-green-700 pixelated animate-build" style={{ animationDelay: '1100ms' }}></div>

                                    {/* Feet */}
                                    <div className="absolute bottom-1 left-4 w-2 h-2 bg-amber-900 pixelated animate-build" style={{ animationDelay: '1200ms' }}></div>
                                    <div className="absolute bottom-1 right-4 w-2 h-2 bg-amber-900 pixelated animate-build" style={{ animationDelay: '1300ms' }}></div>

                                    {/* Sparkle effect when character forms */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-transparent animate-pulse duration-2000" style={{ animationDelay: '1500ms' }}></div>
                                    <div className="absolute top-2 right-2 w-1 h-1 bg-white pixelated animate-ping" style={{ animationDelay: '1600ms' }}></div>
                                    <div className="absolute top-5 left-2 w-0.5 h-0.5 bg-white pixelated animate-ping" style={{ animationDelay: '1700ms' }}></div>
                                </div>
                            </div>
                            <h2 className="text-minecraft-lg font-minecraft text-white mb-2">
                                Character Creator
                            </h2>
                            <p className="text-minecraft-xs text-gray-300 mb-4">
                                Design NPCs with custom FOXP2 neural patterns, emotions, and behavioral routines
                            </p>
                            <a href="/creator">
                                <button className="minecraft-button w-full">
                                    Create Character
                                </button>
                            </a>
                        </div>
                    </div>

                    {/* Interactive Playground */}
                    <div className="minecraft-panel">
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 mx-auto mb-3 relative overflow-hidden">
                                {/* Soccer field background */}
                                <div className="w-full h-full bg-green-500 border-minecraft-thick border-green-600 pixelated relative">
                                    {/* Field lines */}
                                    <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white pixelated transform -translate-x-0.5"></div>
                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white pixelated transform -translate-y-0.5"></div>
                                    {/* Center circle */}
                                    <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-white rounded-full pixelated transform -translate-x-1/2 -translate-y-1/2"></div>
                                    {/* Goal posts */}
                                    <div className="absolute top-4 left-0 w-1 h-4 bg-white pixelated"></div>
                                    <div className="absolute top-4 right-0 w-1 h-4 bg-white pixelated"></div>
                                    {/* Moving soccer ball */}
                                    <div className="absolute top-7 left-2 w-2 h-2 bg-black rounded-full pixelated animate-roll"></div>
                                    <div className="absolute top-7 left-2 w-2 h-2 bg-white rounded-full pixelated animate-roll" style={{ clipPath: 'polygon(30% 30%, 70% 30%, 70% 70%, 30% 70%)' }}></div>
                                    {/* Player figures moving */}
                                    <div className="absolute top-3 left-6 w-1.5 h-3 bg-blue-400 pixelated animate-bounce duration-1500"></div>
                                    <div className="absolute top-3 left-5 w-0.5 h-0.5 bg-blue-200 pixelated animate-bounce duration-1500"></div>
                                    <div className="absolute bottom-3 right-6 w-1.5 h-3 bg-red-400 pixelated animate-bounce duration-1800 delay-500"></div>
                                    <div className="absolute bottom-3 right-5 w-0.5 h-0.5 bg-red-200 pixelated animate-bounce duration-1800 delay-500"></div>
                                    {/* Grass animation */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-green-600/20 animate-pulse duration-3000"></div>
                                </div>
                            </div>
                            <h2 className="text-minecraft-lg font-minecraft text-white mb-2">
                                Playground
                            </h2>
                            <p className="text-minecraft-xs text-gray-300 mb-4">
                                Test and interact with individual NPCs in a controlled environment
                            </p>
                            <a href="/playground">
                                <button className="minecraft-button w-full">
                                    Enter Playground
                                </button>
                            </a>
                        </div>
                    </div>

                    {/* Game Environment */}
                    <div className="minecraft-panel">
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 mx-auto mb-3 relative overflow-hidden">
                                {/* FPS Cave/Dungeon view background */}
                                <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 border-minecraft-thick border-minecraft-cobblestone pixelated relative">
                                    {/* Cave walls perspective */}
                                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-r from-gray-700 to-gray-600 pixelated"></div>
                                    <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-l from-gray-700 to-gray-600 pixelated"></div>
                                    {/* Floor perspective */}
                                    <div className="absolute bottom-0 left-2 right-2 h-4 bg-gradient-to-t from-gray-600 to-gray-500 pixelated"></div>
                                    {/* Distant light/exit */}
                                    <div className="absolute top-6 left-1/2 w-4 h-2 bg-yellow-300 pixelated transform -translate-x-1/2 animate-pulse duration-2000"></div>
                                    {/* Crosshair - more prominent and realistic */}
                                    <div className="absolute top-1/2 left-1/2 w-6 h-px bg-red-500 pixelated transform -translate-x-1/2 -translate-y-0.5 animate-crosshair"></div>
                                    <div className="absolute top-1/2 left-1/2 w-px h-6 bg-red-500 pixelated transform -translate-x-0.5 -translate-y-1/2 animate-crosshair"></div>
                                    {/* Crosshair center dot */}
                                    <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-red-600 pixelated transform -translate-x-0.5 -translate-y-0.5 animate-pulse"></div>
                                    {/* Crosshair outer ring */}
                                    <div className="absolute top-1/2 left-1/2 w-8 h-px bg-red-400/50 pixelated transform -translate-x-1/2 -translate-y-0.5"></div>
                                    <div className="absolute top-1/2 left-1/2 w-px h-8 bg-red-400/50 pixelated transform -translate-x-0.5 -translate-y-1/2"></div>
                                    {/* Moving enemies/NPCs in distance */}
                                    <div className="absolute top-8 left-7 w-1 h-2 bg-red-500 pixelated animate-fps-sway"></div>
                                    <div className="absolute top-9 right-8 w-1 h-1.5 bg-green-500 pixelated animate-fps-sway delay-1000"></div>
                                    <div className="absolute top-7 left-9 w-0.5 h-1 bg-purple-500 pixelated animate-fps-sway delay-500"></div>
                                    {/* Muzzle flash effect */}
                                    <div className="absolute bottom-4 right-3 w-2 h-1 bg-yellow-400 pixelated animate-ping duration-4000"></div>
                                    {/* Walking/breathing effect for entire view */}
                                    <div className="absolute inset-0 animate-fps-sway duration-2000"></div>
                                    {/* Health/UI elements */}
                                    <div className="absolute bottom-1 left-1 w-6 h-1 bg-red-600 pixelated"></div>
                                    <div className="absolute bottom-1 right-1 w-4 h-1 bg-blue-500 pixelated"></div>
                                </div>
                            </div>
                            <h2 className="text-minecraft-lg font-minecraft text-white mb-2">
                                Game World
                            </h2>
                            <p className="text-minecraft-xs text-gray-300 mb-4">
                                Multi-character environment with up to 10 parallel NPCs with advanced AI behaviors
                            </p>
                            <a href="/world">
                                <button className="minecraft-button w-full">
                                    Enter World
                                </button>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Character Library Section */}
                <div className="mt-6">
                    <div className="minecraft-panel">
                        <div className="text-center">
                            <h3 className="text-minecraft font-minecraft text-white mb-3">
                                📚 Character Library
                            </h3>
                            <p className="text-minecraft-xs text-gray-300 mb-4">
                                View and manage your saved FOXP2 NPCs
                            </p>
                            <a href="/characters">
                                <button className="minecraft-button">
                                    View Saved Characters
                                </button>
                            </a>
                        </div>
                    </div>
                </div>

                {/* FOXP2 Info Panel */}
                <div className="minecraft-panel mt-8">
                    <h3 className="text-minecraft font-minecraft text-white mb-3">
                        🧠 FOXP2 Neural Memory System
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-minecraft-xs text-gray-300">
                        <div>
                            <strong className="text-foxp2-primary">Emotions:</strong> Dynamic mood tracking and emotional responses
                        </div>
                        <div>
                            <strong className="text-neural-blue">Actions:</strong> Context-aware behavioral patterns and reactions
                        </div>
                        <div>
                            <strong className="text-memory-purple">Roles:</strong> Specialized character archetypes and personalities
                        </div>
                        <div>
                            <strong className="text-foxp2-secondary">Routines:</strong> Daily schedules and recurring behaviors
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-minecraft-xs text-gray-500">
                        Powered by AI • Neural Memory Architecture • Real-time Character Interactions
                    </p>
                </div>
            </div>
        </main>
    );
}
