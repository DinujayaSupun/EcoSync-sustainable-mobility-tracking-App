/**
 * Test script to list all available Gemini AI models
 * This helps you find which model versions your API key supports
 * 
 * Run this: node test-gemini-models.js
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listAvailableModels() {
  try {
    console.log('\n🔍 Checking available Gemini models...\n');
    
    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ Error: GEMINI_API_KEY not found in .env file');
      console.log('💡 Please add your API key to server/.env');
      console.log('   Get a free key at: https://aistudio.google.com/app/apikey\n');
      process.exit(1);
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // List all available models
    console.log('📋 Available models for your API key:\n');
    
    const models = await genAI.listModels();
    
    let textGenerationModels = [];
    
    for await (const model of models) {
      const modelInfo = {
        name: model.name,
        displayName: model.displayName,
        description: model.description,
        supportedMethods: model.supportedGenerationMethods || []
      };
      
      // Filter models that support text generation
      if (modelInfo.supportedMethods.includes('generateContent')) {
        textGenerationModels.push(modelInfo);
        
        console.log(`✅ ${modelInfo.name}`);
        console.log(`   Display Name: ${modelInfo.displayName}`);
        console.log(`   Description: ${modelInfo.description}`);
        console.log(`   Methods: ${modelInfo.supportedMethods.join(', ')}`);
        console.log('');
      }
    }
    
    if (textGenerationModels.length === 0) {
      console.log('⚠️  No models found that support generateContent');
      console.log('💡 Your API key might be invalid or restricted\n');
    } else {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n✨ RECOMMENDED MODEL TO USE:\n');
      
      // Recommend the best model
      const recommended = textGenerationModels[0];
      const modelName = recommended.name.replace('models/', '');
      
      console.log(`   Model: ${modelName}`);
      console.log(`   Display: ${recommended.displayName}`);
      console.log('\n📝 Update your code to use this model:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('   In server/controllers/adminController.js (around line 678):\n');
      console.log(`   const model = genAI.getGenerativeModel({ model: "${modelName}" });\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error checking models:', error.message);
    
    if (error.message?.includes('API_KEY_INVALID')) {
      console.log('\n💡 Your API key appears to be invalid.');
      console.log('   Get a new key at: https://aistudio.google.com/app/apikey');
    } else if (error.message?.includes('403')) {
      console.log('\n💡 Access denied. Check your API key permissions.');
    } else {
      console.log('\n💡 Full error details:', error);
    }
    console.log('');
  }
}

// Run the test
listAvailableModels();
