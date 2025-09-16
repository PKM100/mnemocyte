export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-minecraft-sky to-minecraft-grass p-8">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="minecraft-panel mb-8 text-center">
                    <div className="flex justify-center mb-4">
                        <img
                            src="/mnemocyte.png"
                            alt="Mnemocyte Logo"
                            className="h-24 pixelated"
                            style={{ width: 'auto' }}
                        />
                    </div>
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
                    <div className="minecraft-panel relative">
                        <img
                            src="/mnemocyte.png"
                            alt=""
                            className="absolute top-2 right-2 w-4 h-4 pixelated opacity-30"
                        />
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
                    <div className="minecraft-panel relative">
                        <img
                            src="/mnemocyte.png"
                            alt=""
                            className="absolute top-2 right-2 w-4 h-4 pixelated opacity-30"
                        />
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 mx-auto mb-3 relative overflow-hidden">
                                {/* Enhanced Soccer field background */}
                                <div className="w-full h-full bg-gradient-to-b from-green-400 to-green-600 border-minecraft-thick border-green-700 pixelated relative">
                                    {/* Field texture pattern */}
                                    <div className="absolute inset-0 opacity-30">
                                        <div className="absolute top-1 left-1 w-1 h-1 bg-green-300 pixelated"></div>
                                        <div className="absolute top-3 left-5 w-1 h-1 bg-green-300 pixelated"></div>
                                        <div className="absolute top-5 left-2 w-1 h-1 bg-green-300 pixelated"></div>
                                        <div className="absolute bottom-2 right-3 w-1 h-1 bg-green-300 pixelated"></div>
                                        <div className="absolute bottom-4 right-1 w-1 h-1 bg-green-300 pixelated"></div>
                                    </div>

                                    {/* Enhanced field lines */}
                                    <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white pixelated transform -translate-x-0.5 shadow-sm"></div>
                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white pixelated transform -translate-y-0.5 shadow-sm"></div>

                                    {/* Center circle with better styling */}
                                    <div className="absolute top-1/2 left-1/2 w-6 h-6 border-2 border-white rounded-full pixelated transform -translate-x-1/2 -translate-y-1/2 opacity-90"></div>
                                    <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full pixelated transform -translate-x-1/2 -translate-y-1/2"></div>

                                    {/* Enhanced goal areas */}
                                    <div className="absolute top-2 left-0 w-0.5 h-8 bg-white pixelated"></div>
                                    <div className="absolute top-2 right-0 w-0.5 h-8 bg-white pixelated"></div>
                                    <div className="absolute top-2 left-0 w-3 h-0.5 bg-white pixelated"></div>
                                    <div className="absolute top-2 right-0 w-3 h-0.5 bg-white pixelated transform -translate-x-full"></div>
                                    <div className="absolute bottom-2 left-0 w-3 h-0.5 bg-white pixelated"></div>
                                    <div className="absolute bottom-2 right-0 w-3 h-0.5 bg-white pixelated transform -translate-x-full"></div>

                                    {/* Dynamic soccer ball with trail */}
                                    <div className="absolute top-6 left-1 w-2.5 h-2.5 animate-enhanced-ball-movement">
                                        {/* Ball shadow */}
                                        <div className="absolute top-2 left-0 w-2.5 h-1 bg-black/20 rounded-full pixelated animate-shadow-follow"></div>
                                        {/* Main ball */}
                                        <div className="absolute top-0 left-0 w-2.5 h-2.5 bg-white rounded-full pixelated border border-black/30 animate-ball-spin">
                                            {/* Ball pattern */}
                                            <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border border-black/50 rounded-full pixelated"></div>
                                            <div className="absolute top-1 left-1 w-0.5 h-0.5 bg-black/60 rounded-full pixelated"></div>
                                        </div>
                                        {/* Ball trail effect */}
                                        <div className="absolute top-0.5 left-0 w-1 h-1.5 bg-white/40 rounded-full pixelated animate-ball-trail"></div>
                                    </div>

                                    {/* Enhanced player figures with more detail */}
                                    {/* Blue team player 1 - chasing ball */}
                                    <div className="absolute top-4 left-5 animate-player-chase">
                                        <div className="w-2 h-3.5 bg-blue-500 pixelated relative">
                                            {/* Head */}
                                            <div className="absolute -top-1 left-0.5 w-1 h-1 bg-yellow-200 pixelated rounded-sm"></div>
                                            {/* Jersey number */}
                                            <div className="absolute top-0.5 left-0.5 w-1 h-0.5 bg-white pixelated text-xs"></div>
                                            {/* Arms */}
                                            <div className="absolute top-1 -left-0.5 w-0.5 h-1.5 bg-yellow-200 pixelated animate-arm-swing"></div>
                                            <div className="absolute top-1 -right-0.5 w-0.5 h-1.5 bg-yellow-200 pixelated animate-arm-swing delay-300"></div>
                                            {/* Legs */}
                                            <div className="absolute -bottom-1 left-0 w-0.5 h-1 bg-blue-600 pixelated animate-leg-run"></div>
                                            <div className="absolute -bottom-1 right-0 w-0.5 h-1 bg-blue-600 pixelated animate-leg-run delay-150"></div>
                                        </div>
                                    </div>

                                    {/* Red team player 1 - defending */}
                                    <div className="absolute bottom-4 right-4 animate-player-defend">
                                        <div className="w-2 h-3.5 bg-red-500 pixelated relative">
                                            {/* Head */}
                                            <div className="absolute -top-1 left-0.5 w-1 h-1 bg-yellow-200 pixelated rounded-sm"></div>
                                            {/* Jersey */}
                                            <div className="absolute top-0.5 left-0.5 w-1 h-0.5 bg-white pixelated"></div>
                                            {/* Arms */}
                                            <div className="absolute top-1 -left-0.5 w-0.5 h-1.5 bg-yellow-200 pixelated animate-arm-swing delay-100"></div>
                                            <div className="absolute top-1 -right-0.5 w-0.5 h-1.5 bg-yellow-200 pixelated animate-arm-swing delay-400"></div>
                                            {/* Legs */}
                                            <div className="absolute -bottom-1 left-0 w-0.5 h-1 bg-red-600 pixelated animate-leg-run delay-75"></div>
                                            <div className="absolute -bottom-1 right-0 w-0.5 h-1 bg-red-600 pixelated animate-leg-run delay-225"></div>
                                        </div>
                                    </div>

                                    {/* Blue team player 2 - supporting */}
                                    <div className="absolute top-2 right-6 animate-player-support">
                                        <div className="w-1.5 h-3 bg-blue-400 pixelated relative">
                                            <div className="absolute -top-0.5 left-0.5 w-0.5 h-0.5 bg-yellow-200 pixelated rounded-sm"></div>
                                            <div className="absolute -bottom-0.5 left-0 w-0.5 h-0.5 bg-blue-600 pixelated"></div>
                                            <div className="absolute -bottom-0.5 right-0 w-0.5 h-0.5 bg-blue-600 pixelated"></div>
                                        </div>
                                    </div>

                                    {/* Animated grass wind effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-green-300/10 to-green-700/10 animate-grass-wave"></div>

                                    {/* Stadium atmosphere particles */}
                                    <div className="absolute top-1 left-3 w-0.5 h-0.5 bg-yellow-200/60 pixelated animate-cheer-particle"></div>
                                    <div className="absolute top-2 right-2 w-0.5 h-0.5 bg-blue-200/60 pixelated animate-cheer-particle delay-500"></div>
                                    <div className="absolute bottom-1 left-1 w-0.5 h-0.5 bg-red-200/60 pixelated animate-cheer-particle delay-1000"></div>
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
                    <div className="minecraft-panel relative">
                        <img
                            src="/mnemocyte.png"
                            alt=""
                            className="absolute top-2 right-2 w-4 h-4 pixelated opacity-30"
                        />
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 mx-auto mb-3 relative overflow-hidden">
                                {/* Space background */}
                                <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-black border-minecraft-thick border-gray-700 pixelated relative">
                                    {/* Stars */}
                                    <div className="absolute top-1 left-2 w-0.5 h-0.5 bg-white pixelated animate-twinkle"></div>
                                    <div className="absolute top-3 right-3 w-0.5 h-0.5 bg-white pixelated animate-twinkle delay-500"></div>
                                    <div className="absolute top-2 right-6 w-0.5 h-0.5 bg-white pixelated animate-twinkle delay-1000"></div>
                                    <div className="absolute bottom-2 left-4 w-0.5 h-0.5 bg-white pixelated animate-twinkle delay-1500"></div>
                                    <div className="absolute bottom-4 right-2 w-0.5 h-0.5 bg-white pixelated animate-twinkle delay-300"></div>

                                    {/* Fast Spinning 3D Earth Globe */}
                                    <div className="absolute top-1/2 left-1/2 w-12 h-12 transform -translate-x-1/2 -translate-y-1/2">
                                        {/* Earth base - blue ocean sphere */}
                                        <div className="w-full h-full bg-gradient-radial from-blue-400 via-blue-500 to-blue-600 rounded-full pixelated relative overflow-hidden border border-blue-700/50">
                                            {/* 3D Globe surface with moving continents */}

                                            {/* Northern hemisphere continents - scrolling horizontally */}
                                            <div className="absolute top-1 left-0 w-full h-2 overflow-hidden">
                                                <div className="animate-continent-scroll-north">
                                                    <div className="flex absolute top-0 left-0 w-96">
                                                        <div className="w-4 h-2 bg-green-600 pixelated rounded-sm mr-2 flex-shrink-0"></div>
                                                        <div className="w-3 h-1.5 bg-green-500 pixelated rounded-sm mr-3 flex-shrink-0"></div>
                                                        <div className="w-2 h-2 bg-green-700 pixelated rounded-sm mr-4 flex-shrink-0"></div>
                                                        <div className="w-5 h-1.5 bg-green-600 pixelated rounded-sm mr-2 flex-shrink-0"></div>
                                                        <div className="w-3 h-2 bg-green-500 pixelated rounded-sm mr-3 flex-shrink-0"></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Equatorial continents - scrolling faster */}
                                            <div className="absolute top-4 left-0 w-full h-3 overflow-hidden">
                                                <div className="animate-continent-scroll-equator">
                                                    <div className="flex absolute top-0 left-0 w-96">
                                                        <div className="w-6 h-3 bg-green-600 pixelated rounded-sm mr-1 flex-shrink-0"></div>
                                                        <div className="w-2 h-2.5 bg-green-700 pixelated rounded-sm mr-2 flex-shrink-0"></div>
                                                        <div className="w-4 h-3 bg-green-500 pixelated rounded-sm mr-3 flex-shrink-0"></div>
                                                        <div className="w-7 h-2.5 bg-green-600 pixelated rounded-sm mr-1 flex-shrink-0"></div>
                                                        <div className="w-3 h-3 bg-green-700 pixelated rounded-sm mr-2 flex-shrink-0"></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Southern hemisphere continents - scrolling reverse */}
                                            <div className="absolute bottom-1 left-0 w-full h-2.5 overflow-hidden">
                                                <div className="animate-continent-scroll-south">
                                                    <div className="flex absolute top-0 left-0 w-96">
                                                        <div className="w-3 h-2.5 bg-green-700 pixelated rounded-sm mr-3 flex-shrink-0"></div>
                                                        <div className="w-5 h-2 bg-green-600 pixelated rounded-sm mr-2 flex-shrink-0"></div>
                                                        <div className="w-2 h-2.5 bg-green-500 pixelated rounded-sm mr-4 flex-shrink-0"></div>
                                                        <div className="w-4 h-2 bg-green-700 pixelated rounded-sm mr-2 flex-shrink-0"></div>
                                                        <div className="w-6 h-2.5 bg-green-600 pixelated rounded-sm mr-1 flex-shrink-0"></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 3D Globe lighting effect - simulates sphere curvature */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/20 rounded-full pointer-events-none"></div>
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 rounded-full pointer-events-none"></div>

                                            {/* Moving highlight - sun reflection */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-globe-shine-fast rounded-full pointer-events-none"></div>

                                            {/* Atmosphere glow */}
                                            <div className="absolute -inset-0.5 bg-blue-300/20 rounded-full animate-pulse duration-3000 pointer-events-none"></div>

                                            {/* Dynamic cloud layer */}
                                            <div className="absolute top-2 left-0 w-full h-8 overflow-hidden opacity-60">
                                                <div className="animate-cloud-scroll">
                                                    <div className="flex absolute top-0 left-0 w-96">
                                                        <div className="w-3 h-1 bg-white/80 pixelated rounded-full mr-4 flex-shrink-0"></div>
                                                        <div className="w-2 h-0.5 bg-white/60 pixelated rounded-full mr-6 flex-shrink-0"></div>
                                                        <div className="w-4 h-1 bg-white/70 pixelated rounded-full mr-3 flex-shrink-0"></div>
                                                        <div className="w-2.5 h-0.5 bg-white/80 pixelated rounded-full mr-5 flex-shrink-0"></div>
                                                        <div className="w-3.5 h-1 bg-white/60 pixelated rounded-full mr-3 flex-shrink-0"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Orbital ring */}
                                    <div className="absolute top-1/2 left-1/2 w-14 h-14 border border-gray-400/30 rounded-full pixelated transform -translate-x-1/2 -translate-y-1/2 animate-spin-slow"></div>

                                    {/* Distant planets */}
                                    <div className="absolute top-2 left-12 w-1 h-1 bg-red-400 rounded-full pixelated"></div>
                                    <div className="absolute bottom-3 right-1 w-0.5 h-0.5 bg-orange-400 rounded-full pixelated"></div>
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
                    <div className="minecraft-panel relative">
                        <img
                            src="/mnemocyte.png"
                            alt=""
                            className="absolute top-2 right-2 w-4 h-4 pixelated opacity-30"
                        />
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
