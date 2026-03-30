# 🚀 Google Gemini API Setup (FREE!)

## Why Gemini is Perfect for Your Budget

✅ **Completely FREE** - No credit card required  
✅ **60 requests per minute** - More than enough for your app  
✅ **High quality responses** - Comparable to GPT-4  
✅ **Fast responses** - Usually under 2 seconds  
✅ **Great Portuguese support** - Perfect for your Brazilian users  

## Step-by-Step Setup

### 1. Get Your Free API Key (2 minutes)

1. **Go to Google AI Studio**: https://aistudio.google.com/
2. **Sign in** with your Google account
3. **Click "Get API Key"** in the top right
4. **Create a new API key** (or use existing one)
5. **Copy the API key** (starts with `AIza...`)

### 2. Add API Key to Your Project

Create a `.env` file in your project root:

```bash
# Add this to your .env file
VITE_GEMINI_API_KEY=AIzaSyDJjpEUt5gDeJKSRpwPj4MIRiN41wf35I8
```

### 3. Update Your Code (Already Done!)

The code is already configured to use Gemini by default! Just add your API key and you're ready to go.

### 4. Test It Out

1. Start your development server: `npm run dev`
2. Go to the chat page
3. Send a test message
4. You should see real AI responses!

## Cost Breakdown

| Feature | Cost |
|---------|------|
| **API Calls** | FREE |
| **Rate Limit** | 60 requests/minute |
| **Monthly Limit** | 1,500 requests/day |
| **Total Cost** | $0.00 |

## Gemini Models Available

- **gemini-1.5-flash** (Default) - Fast and efficient
- **gemini-1.5-pro** - Higher quality, same free tier
- **gemini-1.0-pro** - Original model

## Troubleshooting

### Common Issues:

1. **"API key not found"**
   - Make sure your `.env` file is in the project root
   - Restart your development server after adding the key

2. **"Quota exceeded"**
   - You've hit the free tier limit (1,500 requests/day)
   - Wait 24 hours or upgrade to paid plan

3. **"Invalid API key"**
   - Double-check you copied the key correctly
   - Make sure there are no extra spaces

### Debug Mode:

Add this to see what's happening:
```typescript
console.log('Gemini API Key:', import.meta.env.VITE_GEMINI_API_KEY ? 'Found' : 'Missing');
```

## Advanced Configuration

### Custom Model Selection:
```typescript
// In src/services/llmService.ts
model: 'gemini-1.5-pro', // For higher quality
// or
model: 'gemini-1.5-flash', // For faster responses
```

### Rate Limiting:
```typescript
// Add delays between requests if needed
await new Promise(resolve => setTimeout(resolve, 1000));
```

## Production Considerations

### For High Traffic:
- **Upgrade to paid plan** when you exceed free limits
- **Implement caching** to reduce API calls
- **Add request queuing** to handle bursts

### Monitoring:
- **Track API usage** in Google AI Studio
- **Set up alerts** for quota limits
- **Monitor response times**

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all secrets
3. **Implement rate limiting** in your app
4. **Add user authentication** before allowing API access
5. **Monitor usage** to prevent abuse

## Next Steps

1. ✅ Get your free API key
2. ✅ Add it to your `.env` file
3. ✅ Test with a few messages
4. ✅ Deploy and start helping entrepreneurs!

Your EffectuationBot is now powered by Google's advanced AI - completely free! 🎉

## Support

- **Google AI Studio**: https://aistudio.google.com/
- **Gemini Documentation**: https://ai.google.dev/docs
- **Community**: Google AI Developer Community

Happy coding! 🚀
