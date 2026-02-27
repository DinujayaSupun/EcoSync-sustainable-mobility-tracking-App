/**
 * Test script to find which Gemini AI model works with your API key
 * This helps you find the correct model version to use
 * 
 * Run this: node test-gemini-models.js
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// List of common Gemini model names to test
const MODELS_TO_TEST = [
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-pro',
  'gemini-1.0-pro',
  'gemini-1.0-pro-latest',
  'models/gemini-pro',
  'models/gemini-1.5-flash',
  'models/gemini-1.5-pro'
];

async function testModel(genAI, modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say "Hello" if you can read this.');
    const response = await result.response;
    const text = response.text();
    
    return { success: true, response: text };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function findWorkingModel() {
  try {
    console.log('\n🔍 Testing Gemini AI models with your API key...\n');
    
    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ Error: GEMINI_API_KEY not found in .env file');
      console.log('💡 Please add your API key to server/.env');
      console.log('   Get a free key at: https://aistudio.google.com/app/apikey\n');
      process.exit(1);
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    console.log('Testing models (this may take a minute)...\n');
    
    let workingModels = [];
    let failedModels = [];
    
    for (const modelName of MODELS_TO_TEST) {
      process.stdout.write(`Testing: ${modelName.padEnd(30)} ... `);
      
      const result = await testModel(genAI, modelName);
      
      if (result.success) {
        console.log('✅ WORKS!');
        workingModels.push({ name: modelName, response: result.response });
      } else {
        console.log(`❌ Failed`);
        failedModels.push({ name: modelName, error: result.error });
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📊 RESULTS:\n');
    
    if (workingModels.length > 0) {
      console.log('✅ WORKING MODELS (use any of these):\n');
      
      workingModels.forEach((model, index) => {
        console.log(`   ${index + 1}. ${model.name}`);
        console.log(`      Response: "${model.response.substring(0, 50)}..."\n`);
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n🎯 RECOMMENDED: Use this model\n');
      console.log(`   ${workingModels[0].name}\n`);
      console.log('📝 Update your code:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('   In server/controllers/adminController.js (line ~678):\n');
      console.log(`   const model = genAI.getGenerativeModel({ model: "${workingModels[0].name}" });\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
    } else {
      console.log('❌ NO WORKING MODELS FOUND\n');
      console.log('This could mean:');
      console.log('   1. Your API key is invalid');
      console.log('   2. Your API key doesn\'t have access to Gemini models');
      console.log('   3. You need to enable the API in Google Cloud Console\n');
      console.log('💡 Try:');
      console.log('   - Get a new API key: https://aistudio.google.com/app/apikey');
      console.log('   - Make sure you\'re signed in with the right Google account');
      console.log('   - Check your API key hasn\'t expired\n');
      
      console.log('Failed models with errors:\n');
      failedModels.slice(0, 3).forEach(model => {
        console.log(`   ${model.name}`);
        console.log(`   Error: ${model.error.substring(0, 100)}...\n`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.log('\n💡 Full error:', error);
  }
}

// Run the test
findWorkingModel();
