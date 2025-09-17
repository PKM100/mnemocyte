import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

interface TestResult {
    name: string;
    success: boolean;
    error?: string;
    duration: number;
    details: Record<string, any>;
}

export async function GET(request: NextRequest) {
    try {
        const [conversations, characters, sessions] = await Promise.all([
            prisma.conversation.count(),
            prisma.character.count(),
            prisma.session.count()
        ]);

        const conversationsWithData = await prisma.conversation.findMany({
            include: {
                _count: {
                    select: {
                        messages: true,
                        participants: true
                    }
                }
            },
            take: 5
        });

        return NextResponse.json({
            summary: {
                totalConversations: conversations,
                totalCharacters: characters,
                totalSessions: sessions
            },
            sampleConversations: conversationsWithData.map(conv => ({
                id: conv.id,
                title: conv.title,
                type: conv.type,
                messageCount: conv._count.messages,
                participantCount: conv._count.participants,
                isActive: conv.isActive
            }))
        });
    } catch (error) {
        console.error('Error in test endpoint:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request: NextRequest) {
    try {
        const { baseUrl } = await request.json();
        const apiBaseUrl = baseUrl || 'http://localhost:3000/api';

        const tests: TestResult[] = [];
        let passed = 0;
        let failed = 0;

        // Test function
        const runTest = async (name: string, endpoint: string, method: string = 'GET', body?: any): Promise<TestResult> => {
            const startTime = Date.now();
            try {
                const options: RequestInit = {
                    method,
                    headers: { 'Content-Type': 'application/json' }
                };

                if (body && method !== 'GET') {
                    options.body = JSON.stringify(body);
                }

                const response = await fetch(`${apiBaseUrl}${endpoint}`, options);
                const duration = Date.now() - startTime;

                let responseData: any = null;
                const contentType = response.headers.get('content-type');

                if (contentType && contentType.includes('application/json')) {
                    responseData = await response.json();
                } else {
                    responseData = { status: response.status, statusText: response.statusText };
                }

                if (response.ok) {
                    passed++;
                    return {
                        name,
                        success: true,
                        duration,
                        details: {
                            status: response.status,
                            data: responseData,
                            endpoint: `${method} ${endpoint}`
                        }
                    };
                } else {
                    failed++;
                    return {
                        name,
                        success: false,
                        error: `HTTP ${response.status}: ${response.statusText}`,
                        duration,
                        details: {
                            status: response.status,
                            data: responseData,
                            endpoint: `${method} ${endpoint}`
                        }
                    };
                }
            } catch (error) {
                failed++;
                const duration = Date.now() - startTime;
                return {
                    name,
                    success: false,
                    error: String(error),
                    duration,
                    details: {
                        endpoint: `${method} ${endpoint}`,
                        error: String(error)
                    }
                };
            }
        };

        // Run all tests
        console.log('🚀 Starting API tests...');

        // Characters API tests
        tests.push(await runTest('Get Characters', '/characters'));

        // Conversations API tests
        tests.push(await runTest('Get Conversations', '/conversations'));

        // Sessions API tests
        tests.push(await runTest('Get Sessions', '/sessions'));

        // Character Roles API tests
        tests.push(await runTest('Get Character Roles', '/character-roles'));

        // Memory Templates API tests
        tests.push(await runTest('Get Memory Templates', '/memory-templates'));

        // Status endpoint test
        tests.push(await runTest('Get Status', '/characters/status'));

        // Rooms API tests
        tests.push(await runTest('Get Rooms', '/rooms'));

        const total = tests.length;

        const results = {
            passed,
            failed,
            total,
            tests,
            timestamp: new Date().toISOString(),
            baseUrl: apiBaseUrl
        };

        console.log(`✅ Tests completed: ${passed}/${total} passed`);

        return NextResponse.json({
            success: true,
            results,
            stdout: `🧪 API Testing Complete!\n\n✅ Passed: ${passed}\n❌ Failed: ${failed}\n📊 Total: ${total}\n\nTest Results:\n${tests.map(t => `${t.success ? '✅' : '❌'} ${t.name} (${t.duration}ms)`).join('\n')}`
        });

    } catch (error) {
        console.error('Error running tests:', error);
        return NextResponse.json({
            success: false,
            error: String(error),
            stderr: `Error running tests: ${String(error)}`
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
