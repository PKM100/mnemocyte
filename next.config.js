/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable standalone output for Docker containers
    output: 'standalone',

    // Experimental features
    experimental: {
        // Enable server components
        serverComponentsExternalPackages: ['@prisma/client', 'prisma']
    },

    // Environment variables that should be available at build time
    env: {
        DATABASE_URL: process.env.DATABASE_URL,
    },

    // Image optimization configuration
    images: {
        domains: ['localhost'],
    },
}
