#!/usr/bin/env node

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY || process.argv[2];

  if (!apiKey) {
    console.error('Error: Gemini API key required.');
    console.error('Usage: node scripts/list-gemini-models.js <api-key>');
    console.error('Or: export GEMINI_API_KEY=your-key && node scripts/list-gemini-models.js');
    process.exit(1);
  }

  try {
    console.log('\n🔍 Fetching available Gemini models...\n');

    // Use the REST API directly to list models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();

    console.log('📋 Available Models:\n');
    console.log('─'.repeat(80));

    if (!data.models || data.models.length === 0) {
      console.log('No models found.');
      return;
    }

    for (const model of data.models) {
      const supportsGenerate = model.supportedGenerationMethods?.includes('generateContent');
      const icon = supportsGenerate ? '✅' : '❌';

      console.log(`${icon} ${model.name}`);
      if (model.displayName) console.log(`   Display Name: ${model.displayName}`);
      if (model.description) console.log(`   Description: ${model.description}`);
      if (model.supportedGenerationMethods) {
        console.log(`   Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
      }
      console.log('─'.repeat(80));
    }

    console.log('\n💡 Models marked with ✅ support generateContent and can be used for analysis');
    console.log('💡 Use the model name WITHOUT "models/" prefix (e.g., "gemini-pro")\n');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

listModels();
