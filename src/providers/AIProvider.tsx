import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AIService,
  AIConfig,
  AIProvider as AIProviderType,
} from '@/services/ai';

interface AIContextType {
  isConfigured: boolean;
  provider: AIProviderType;
  initializeAI: (config: AIConfig) => Promise<void>;
  getStatus: () => { provider: AIProviderType; configured: boolean };
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

interface AIProviderProps {
  children: React.ReactNode;
}

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [provider, setProvider] = useState<AIProviderType>('mock');

  useEffect(() => {
    // Initialize AI service on app start
    initializeAIService();
  }, []);

  const initializeAIService = async () => {
    try {
      // Check for environment variables
      const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      const anthropicKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

      let config: AIConfig;

      if (openaiKey) {
        config = {
          provider: 'openai',
          apiKey: openaiKey,
          model: 'gpt-4',
        };
        setProvider('openai');
      } else if (anthropicKey) {
        config = {
          provider: 'anthropic',
          apiKey: anthropicKey,
          model: 'claude-3-sonnet-20240229',
        };
        setProvider('anthropic');
      } else {
        // Use mock provider for development
        config = {
          provider: 'mock',
        };
        setProvider('mock');
      }

      AIService.initialize(config);
      setIsConfigured(true);

      console.log('AI Service initialized with provider:', config.provider);
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      // Fallback to mock provider
      AIService.initialize({ provider: 'mock' });
      setProvider('mock');
      setIsConfigured(true);
    }
  };

  const initializeAI = async (config: AIConfig) => {
    try {
      AIService.initialize(config);
      setProvider(config.provider);
      setIsConfigured(true);
      console.log('AI Service reinitialized with provider:', config.provider);
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      throw error;
    }
  };

  const getStatus = () => {
    return AIService.getStatus();
  };

  const value: AIContextType = {
    isConfigured,
    provider,
    initializeAI,
    getStatus,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};
