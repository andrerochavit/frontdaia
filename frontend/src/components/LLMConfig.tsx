import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface LLMConfigProps {
  currentProvider: string;
  onProviderChange: (provider: string) => void;
}

export function LLMConfig({ currentProvider, onProviderChange }: LLMConfigProps) {
  const [testing, setTesting] = useState<string | null>(null);

  const providers = [
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Free, fast, and high-quality responses',
      cost: 'FREE (60 requests/minute)',
      status: 'recommended',
      icon: '🚀'
    },
    {
      id: 'openai',
      name: 'OpenAI GPT-4',
      description: 'Best quality responses, excellent for mentoring',
      cost: '$0.03/1K tokens',
      status: 'premium',
      icon: '🤖'
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      description: 'Great for educational content and reasoning',
      cost: '$0.015/1K tokens',
      status: 'premium',
      icon: '🧠'
    },
    {
      id: 'local',
      name: 'Local LLM',
      description: 'Complete privacy, no API costs',
      cost: 'Free (requires hardware)',
      status: 'privacy',
      icon: '🏠'
    },
    {
      id: 'mock',
      name: 'Mock Responses',
      description: 'For development and testing',
      cost: 'Free',
      status: 'dev',
      icon: '🔧'
    }
  ];

  const testProvider = async (providerId: string) => {
    setTesting(providerId);
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTesting(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recommended':
        return <Badge className="bg-green-100 text-green-800">Recommended</Badge>;
      case 'premium':
        return <Badge className="bg-blue-100 text-blue-800">Premium</Badge>;
      case 'privacy':
        return <Badge className="bg-purple-100 text-purple-800">Privacy</Badge>;
      case 'dev':
        return <Badge className="bg-gray-100 text-gray-800">Development</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">LLM Provider Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Choose your AI provider for the Effie. Each has different strengths and costs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {providers.map((provider) => (
          <Card
            key={provider.id}
            className={`cursor-pointer transition-all ${currentProvider === provider.id
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:shadow-md'
              }`}
            onClick={() => onProviderChange(provider.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{provider.icon}</span>
                  <CardTitle className="text-base">{provider.name}</CardTitle>
                </div>
                {currentProvider === provider.id && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
              {getStatusBadge(provider.status)}
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="mb-3">
                {provider.description}
              </CardDescription>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {provider.cost}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    testProvider(provider.id);
                  }}
                  disabled={testing === provider.id}
                >
                  {testing === provider.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Setup Required</h4>
            <p className="text-sm text-blue-700 mt-1">
              To use OpenAI or Anthropic, add your API key to the environment variables.
              See the LLM_SETUP.md file for detailed instructions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
