/**
 * Direct REST API test to check Gemini models
 * This bypasses the SDK to see what's really available
 */

require('dotenv').config();
const axios = require('axios');

async function testDirectAPI() {
  const API_KEY = process.env.GEMINI_API_KEY;
  
  if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in .env');
    process.exit(1);
  }
  
  console.log('\n🔍 Testing Gemini API directly...\n');
  console.log(`API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 5)}\n`);
  
  // Test 1: List models using v1 API
  console.log('📋 Attempting to list models (v1 API)...\n');
  
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`
    );
    
    console.log('✅ API Key is VALID!\n');
    console.log('Available models:\n');
    
    const models = response.data.models || [];
    
    if (models.length === 0) {
      console.log('⚠️  No models found\n');
    } else {
      models.forEach((model, index) => {
        if (model.supportedGenerationMethods?.includes('generateContent')) {
          console.log(`${index + 1}. ✅ ${model.name}`);
          console.log(`   Display: ${model.displayName}`);
          console.log(`   Methods: ${model.supportedGenerationMethods.join(', ')}`);
          console.log('');
        }
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n🎯 RECOMMENDED MODEL:\n');
      
      // Find the best model
      const bestModel = models.find(m => 
        m.name.includes('gemini-1.5-pro') || 
        m.name.includes('gemini-pro')
      ) || models[0];
      
      if (bestModel) {
        const modelName = bestModel.name.replace('models/', '');
        console.log(`   ${modelName}\n`);
        console.log('📝 Update adminController.js line ~678 to:\n');
        console.log(`   const model = genAI.getGenerativeModel({ model: "${modelName}" });\n`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Test the model
        console.log('🧪 Testing the model with a simple request...\n');
        await testModelGeneration(modelName, API_KEY);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.log('\n💡 403 Error - Your API key might be restricted or invalid');
      console.log('   Get a new key: https://aistudio.google.com/app/apikey\n');
    } else if (error.response?.status === 401) {
      console.log('\n💡 401 Error - Invalid API key');
      console.log('   Double-check your API key in .env file\n');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Network error - Check your internet connection\n');
    }
  }
}

async function testModelGeneration(modelName, apiKey) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: "Say 'Hello! I am working correctly.' if you can read this."
          }]
        }]
      }
    );
    
    const generatedText = response.data.candidates[0].content.parts[0].text;
    console.log(`✅ Model Test Result: "${generatedText}"\n`);
    console.log('🎉 SUCCESS! This model works perfectly!\n');
    
  } catch (error) {
    console.error(`❌ Model test failed: ${error.response?.data?.error?.message || error.message}\n`);
  }
}

testDirectAPI();
