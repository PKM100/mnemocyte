const { AzureOpenAI } = require('openai');

async function testDeployments() {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "https://1ptest-project-resource.cognitiveservices.azure.com/";
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";

    if (!apiKey) {
        console.error('❌ AZURE_OPENAI_API_KEY environment variable is not set');
        return;
    }

    // Test the configured deployment name first
    const deploymentNames = [
        'gpt-4.1',
        'gpt-4',
        'gpt-4-turbo',
        'gpt-4o',
        'gpt-35-turbo',
        'gpt-3.5-turbo',
        'chatgpt',
        'gpt4',
        'gpt-4-32k',
        'text-davinci-003'
    ];

    console.log('Testing Azure OpenAI deployments...\n');

    for (const deployment of deploymentNames) {
        try {
            console.log(`Testing deployment: ${deployment}`);

            const client = new AzureOpenAI({
                endpoint,
                apiKey,
                apiVersion,
                deployment
            });

            const result = await client.chat.completions.create({
                model: deployment,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Hello, this is a test message.' }
                ],
                max_tokens: 50,
                temperature: 0.1
            });

            console.log(`✅ SUCCESS: ${deployment} is available`);
            console.log(`Response: ${result.choices?.[0]?.message?.content}\n`);

            // If we find a working deployment, we can stop here
            break;

        } catch (error) {
            if (error.status === 404) {
                console.log(`❌ NOT FOUND: ${deployment} deployment does not exist`);
            } else {
                console.log(`❌ ERROR: ${deployment} - ${error.message}`);
            }
        }
    }
}

if (require.main === module) {
    testDeployments().catch(console.error);
}

module.exports = { testDeployments };