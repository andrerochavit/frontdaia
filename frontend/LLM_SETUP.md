# 🤖 LLM Integration Setup Guide

## Quick Start Options

### 1. **OpenAI GPT-4 (Recommended)**
```bash
# Add to your .env file
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Pros:**
- Best quality responses
- Excellent for mentoring conversations
- Reliable and fast
- Great Portuguese language support

**Cost:** ~$0.03 per 1K tokens (very affordable)

### 2. **Anthropic Claude (Excellent for Mentoring)**
```bash
# Add to your .env file
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

**Pros:**
- Excellent for educational/mentoring content
- Great at following complex instructions
- Strong reasoning capabilities
- Good Portuguese support

**Cost:** ~$0.015 per 1K tokens (very affordable)

### 3. **Local LLM (Privacy-Focused)**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Download a model
ollama pull llama2:7b
# or
ollama pull mistral:7b

# Start the service
ollama serve
```

**Pros:**
- Complete privacy
- No API costs
- Works offline

**Cons:**
- Requires powerful hardware
- Slower responses
- Lower quality than cloud models

## Configuration Steps

### Step 1: Choose Your Provider
Edit `src/components/EffectuationChatbot.tsx` line 95:

```typescript
// For OpenAI
provider: 'openai',

// For Anthropic
provider: 'anthropic',

// For Local LLM
provider: 'local',

// For testing (no API needed)
provider: 'mock',
```

### Step 2: Add API Key
Create a `.env` file in your project root:

```bash
# For OpenAI
VITE_OPENAI_API_KEY=sk-your-key-here

# For Anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Step 3: Test the Integration
1. Start your development server: `npm run dev`
2. Navigate to the chat page
3. Send a test message
4. Check the browser console for any errors

## Cost Estimation

For a typical user session (10 messages):
- **OpenAI GPT-4**: ~$0.10
- **Anthropic Claude**: ~$0.05
- **Local LLM**: $0 (but requires good hardware)

## Advanced Configuration

### Custom System Prompts
Edit `src/services/llmService.ts` to customize the AI's behavior:

```typescript
// Add your custom instructions here
const prompt = `You are EffectuationBot, specialized in...`;
```

### Model Selection
```typescript
// OpenAI models
model: 'gpt-4'        // Best quality
model: 'gpt-3.5-turbo' // Faster, cheaper

// Anthropic models
model: 'claude-3-sonnet-20240229'  // Best quality
model: 'claude-3-haiku-20240307'   // Faster, cheaper
```

## Troubleshooting

### Common Issues:
1. **API Key not working**: Check your .env file is in the project root
2. **CORS errors**: Make sure you're using the correct API endpoints
3. **Rate limits**: Consider implementing request queuing
4. **High costs**: Switch to a cheaper model or implement usage limits

### Debug Mode:
Add this to see detailed logs:
```typescript
console.log('LLM Request:', { userMessage, selectedPrinciple, onboardingData });
```

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all secrets
3. **Implement rate limiting** to prevent abuse
4. **Add user authentication** before allowing LLM access
5. **Monitor usage** to prevent unexpected costs

## Next Steps

1. Choose your preferred LLM provider
2. Get an API key from their website
3. Update the configuration in the code
4. Test with a few messages
5. Deploy and monitor usage

Your EffectuationBot will now have real AI capabilities! 🚀
