import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// POST - Run API tests
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const baseUrl = body.baseUrl || 'http://localhost:3000/api';

        return new Promise((resolve) => {
            const scriptPath = path.join(process.cwd(), 'scripts', 'test-api.js');
            const testProcess = spawn('node', [scriptPath, baseUrl], {
                cwd: process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            testProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            testProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            testProcess.on('close', (code) => {
                try {
                    // Try to read the test results file
                    const resultsPath = path.join(process.cwd(), 'test-results.json');
                    let results = null;

                    if (fs.existsSync(resultsPath)) {
                        const resultsData = fs.readFileSync(resultsPath, 'utf8');
                        results = JSON.parse(resultsData);
                    }

                    resolve(NextResponse.json({
                        success: code === 0,
                        exitCode: code,
                        stdout,
                        stderr,
                        results,
                        timestamp: new Date().toISOString()
                    }));
                } catch (error) {
                    resolve(NextResponse.json({
                        success: false,
                        error: 'Failed to parse test results',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        exitCode: code,
                        stdout,
                        stderr
                    }, { status: 500 }));
                }
            });

            testProcess.on('error', (error) => {
                resolve(NextResponse.json({
                    success: false,
                    error: 'Failed to start test process',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }, { status: 500 }));
            });
        });

    } catch (error) {
        console.error('Error running API tests:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to run API tests',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// GET - Get latest test results
export async function GET() {
    try {
        const resultsPath = path.join(process.cwd(), 'test-results.json');

        if (!fs.existsSync(resultsPath)) {
            return NextResponse.json({
                success: false,
                error: 'No test results found',
                message: 'Run tests first to generate results'
            }, { status: 404 });
        }

        const resultsData = fs.readFileSync(resultsPath, 'utf8');
        const results = JSON.parse(resultsData);

        return NextResponse.json({
            success: true,
            results,
            lastUpdated: results.timestamp
        });

    } catch (error) {
        console.error('Error reading test results:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to read test results',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
