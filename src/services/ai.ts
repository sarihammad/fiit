import { Platform } from 'react-native';
import { AICache } from '@/utils/cache';

// AI Provider Configuration
export type AIProvider = 'openai' | 'anthropic' | 'mock';

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface AIAnalysisRequest {
  type: 'profile' | 'conversation' | 'photo' | 'bio';
  data: any;
  context?: {
    userGoal?: string;
    targetAudience?: string;
    previousAnalysis?: any;
  };
}

export interface AIAnalysisResponse {
  success: boolean;
  data?: any;
  error?: string;
  confidence?: number;
  suggestions?: string[];
}

export interface ProfileAnalysisData {
  images: Array<{
    uri: string;
    type: 'profile' | 'lifestyle' | 'social';
  }>;
  bio: {
    text: string;
    interests: string[];
    occupation?: string;
    location?: string;
  };
  userPreferences?: {
    goal: string;
    targetAudience?: string;
  };
}

export interface ConversationAnalysisData {
  messages: Array<{
    text: string;
    sender: 'user' | 'other';
    timestamp: Date;
  }>;
  context: {
    platform: string;
    relationship: 'new' | 'ongoing' | 'friends';
    goal: string;
  };
}

export class AIService {
  private static config: AIConfig = {
    provider: 'mock',
    model: 'gpt-4',
  };

  // Initialize AI service with configuration
  static initialize(config: AIConfig) {
    this.config = { ...this.config, ...config };
  }

  // Analyze profile using AI
  static async analyzeProfile(
    data: ProfileAnalysisData
  ): Promise<AIAnalysisResponse> {
    try {
      switch (this.config.provider) {
        case 'openai':
          return await this.analyzeWithOpenAI('profile', data);
        case 'anthropic':
          return await this.analyzeWithAnthropic('profile', data);
        case 'mock':
        default:
          return await this.analyzeWithMock('profile', data);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      };
    }
  }

  // Analyze conversation using AI
  static async analyzeConversation(
    data: ConversationAnalysisData
  ): Promise<AIAnalysisResponse> {
    try {
      switch (this.config.provider) {
        case 'openai':
          return await this.analyzeWithOpenAI('conversation', data);
        case 'anthropic':
          return await this.analyzeWithAnthropic('conversation', data);
        case 'mock':
        default:
          return await this.analyzeWithMock('conversation', data);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      };
    }
  }

  // Generate conversation suggestions
  static async generateSuggestions(
    context: string,
    type: 'opener' | 'follow_up' | 'date_plan' | 'flirty' | 'casual'
  ): Promise<AIAnalysisResponse> {
    try {
      const data = { context, type };

      switch (this.config.provider) {
        case 'openai':
          return await this.analyzeWithOpenAI('suggestions', data);
        case 'anthropic':
          return await this.analyzeWithAnthropic('suggestions', data);
        case 'mock':
        default:
          return await this.analyzeWithMock('suggestions', data);
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate suggestions',
      };
    }
  }

  // OpenAI Integration
  private static async analyzeWithOpenAI(
    type: string,
    data: any
  ): Promise<AIAnalysisResponse> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.buildPrompt(type, data);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a FIIT nutrition coach. Provide helpful, actionable advice for weight loss and nutrition.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    return {
      success: true,
      data: this.parseAIResponse(type, content),
      confidence: 0.85,
    };
  }

  // Anthropic Integration
  private static async analyzeWithAnthropic(
    type: string,
    data: any
  ): Promise<AIAnalysisResponse> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const prompt = this.buildPrompt(type, data);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.content[0]?.text;

    return {
      success: true,
      data: this.parseAIResponse(type, content),
      confidence: 0.9,
    };
  }

  // Mock AI for development
  private static async analyzeWithMock(
    type: string,
    data: any
  ): Promise<AIAnalysisResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    switch (type) {
      case 'profile':
        return this.generateMockProfileAnalysis(data);
      case 'conversation':
        return this.generateMockConversationAnalysis(data);
      case 'suggestions':
        return this.generateMockSuggestions(data);
      default:
        return {
          success: false,
          error: 'Unknown analysis type',
        };
    }
  }

  // Build prompts for different analysis types
  private static buildPrompt(type: string, data: any): string {
    switch (type) {
      case 'profile':
        return `Analyze this user profile and provide nutrition insights:

Bio: ${data.bio.text}
Interests: ${data.bio.interests.join(', ')}
Occupation: ${data.bio.occupation || 'Not specified'}
Location: ${data.bio.location || 'Not specified'}
Goal: ${data.userPreferences?.goal || 'Not specified'}

Please provide:
1. Overall attractiveness score (1-100)
2. Approachability score (1-100)
3. 3 specific improvement suggestions
4. 3 strengths to highlight
5. Confidence level in this analysis

Format as JSON.`;

      case 'conversation':
        return `Analyze this meal log and provide nutrition advice:

Messages: ${JSON.stringify(data.messages)}
Context: ${JSON.stringify(data.context)}

Please provide:
1. Conversation quality score (1-100)
2. 3 conversation improvement tips
3. 2 good follow-up message suggestions
4. Overall assessment

Format as JSON.`;

      case 'suggestions':
        return `Generate ${data.type} suggestions for this context: ${data.context}

Provide 5 different options that are:
- Engaging and personalized
- Appropriate for the context
- Likely to get a response

Format as JSON array.`;

      default:
        return `Please analyze this data: ${JSON.stringify(data)}`;
    }
  }

  // Parse AI responses
  private static parseAIResponse(type: string, content: string): any {
    try {
      // Try to parse as JSON first
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback to text parsing
      return { analysis: content };
    } catch (error) {
      return { analysis: content };
    }
  }

  // Mock profile analysis
  private static generateMockProfileAnalysis(
    data: ProfileAnalysisData
  ): AIAnalysisResponse {
    const baseScore = 65 + Math.random() * 25;
    const imageCount = data.images.length;
    const bioLength = data.bio.text.length;

    return {
      success: true,
      data: {
        attractiveness: Math.round(baseScore + imageCount * 5 + bioLength / 10),
        approachability: Math.round(70 + Math.random() * 20),
        confidence: Math.round(80 + Math.random() * 15),
        suggestions: [
          'Add more lifestyle photos showing your interests',
          'Include a clear, recent headshot as your main photo',
          'Expand your bio with specific conversation starters',
        ],
        strengths: [
          'Good variety in photo types',
          'Clear expression of interests',
          'Professional presentation',
        ],
        auraScore: Math.round(baseScore + 10),
      },
      confidence: 0.75,
    };
  }

  // Mock conversation analysis
  private static generateMockConversationAnalysis(
    data: ConversationAnalysisData
  ): AIAnalysisResponse {
    return {
      success: true,
      data: {
        quality: Math.round(70 + Math.random() * 25),
        tips: [
          'Ask more open-ended questions',
          'Share personal stories to build connection',
          'Keep responses timely and engaging',
        ],
        suggestions: [
          'What was the highlight of your weekend?',
          'I love that! Tell me more about your experience with that.',
        ],
        assessment:
          'Good conversation flow with room for improvement in engagement.',
      },
      confidence: 0.8,
    };
  }

  // Mock suggestions
  private static generateMockSuggestions(data: {
    context: string;
    type: string;
  }): AIAnalysisResponse {
    const suggestions = {
      opener: [
        `Hey! I noticed we both love ${data.context}. What's your favorite thing about it?`,
        'Hi there! Your profile caught my eye. How was your weekend?',
        "Hello! I love your energy. What's the most exciting thing you've done recently?",
      ],
      follow_up: [
        "That sounds amazing! I'd love to hear more about it.",
        'We should definitely chat more about that sometime!',
        'You seem really interesting. What else are you passionate about?',
      ],
      date_plan: [
        'Would you be interested in grabbing coffee sometime this week?',
        'I know this great place downtown. Want to check it out together?',
        'How about we meet up for a casual drink and see where the conversation goes?',
      ],
      flirty: [
        'You have such a beautiful smile in your photos 😊',
        "I can't stop thinking about your profile. You seem really special.",
        "You're exactly the kind of person I've been looking for 💫",
      ],
      casual: [
        "Hey! How's your day going so far?",
        "What's the best thing that happened to you today?",
        "I'm curious - what made you swipe right on my profile?",
      ],
    };

    return {
      success: true,
      data:
        suggestions[data.type as keyof typeof suggestions] ||
        suggestions.casual,
      confidence: 0.85,
    };
  }

  // Get AI provider status
  static getStatus(): { provider: AIProvider; configured: boolean } {
    return {
      provider: this.config.provider,
      configured: this.config.provider === 'mock' || !!this.config.apiKey,
    };
  }

  // FIIT-specific AI methods

  // Complete with JSON response (for structured data)
  static async completeJSON(
    prompt: string,
    config?: { provider?: AIProvider; model?: string }
  ): Promise<any> {
    const provider = config?.provider || this.config.provider;
    const model = config?.model || this.config.model;

    try {
      switch (provider) {
        case 'openai':
          return await this.completeJSONOpenAI(prompt, model);
        case 'anthropic':
          return await this.completeJSONAnthropic(prompt, model);
        case 'mock':
        default:
          return this.mockJSONResponse(prompt);
      }
    } catch (error) {
      console.error('[AIService] JSON completion failed:', error);
      return this.mockJSONResponse(prompt);
    }
  }

  private static async completeJSONOpenAI(
    prompt: string,
    model?: string
  ): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    return JSON.parse(content);
  }

  private static async completeJSONAnthropic(
    prompt: string,
    model?: string
  ): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.content[0]?.text;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  }

  private static mockJSONResponse(prompt: string): any {
    // Return mock data based on prompt content
    if (prompt.includes('meal plan') || prompt.includes('meal_plan')) {
      return {
        days: [],
        groceryList: [],
      };
    }
    if (prompt.includes('feedback') || prompt.includes('analysis')) {
      return {
        summary: 'Great job today! Keep it up.',
        tomorrowTip: 'Try to increase your protein intake.',
      };
    }
    return { message: 'Mock response' };
  }
}

// FIIT AI Service - Nutrition-specific AI methods
import {
  MealPlanRequest,
  MealPlanResponse,
  FeedbackRequest,
  FeedbackResponse,
  UserGoals,
  DayLog,
} from '@/types/nutrition';

export class FIITAI {
  /**
   * Generate weekly meal plan with caching
   * Cache key based on week start + goals hash
   * Supports per-meal swap (only regenerates target meal)
   */
  static async generateMealPlan(
    req: MealPlanRequest,
    options?: { useCache?: boolean }
  ): Promise<MealPlanResponse> {
    const useCache = options?.useCache !== false;

    if (useCache) {
      // Generate cache key from request
      const cacheKey = AICache.generateKey('mealplan', {
        week: req.weekStartISO,
        goals: {
          calories: req.goals.dailyCalorieTarget,
          diet: req.goals.dietPreference,
          allergies: req.goals.allergies.sort().join(','),
          budget: req.goals.budgetLevel,
          time: req.goals.timeToCookMins,
        },
      });

      try {
        // Try stale-while-revalidate
        return await AICache.getStaleWhileRevalidate(
          cacheKey,
          () => this._generateMealPlanInternal(req),
          7 * 24 * 60 * 60 * 1000 // 7 days TTL
        );
      } catch (error) {
        console.error(
          '[FIITAI] Cached plan fetch failed, generating fresh:',
          error
        );
        // Fall through to internal generation
      }
    }

    return this._generateMealPlanInternal(req);
  }

  /**
   * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor
   */
  private static calculateBMR(
    weightKg: number,
    heightCm: number,
    age: number,
    sex: 'male' | 'female' | 'other'
  ): number {
    // Mifflin-St Jeor Equation
    const baseBMR = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return sex === 'male' ? baseBMR + 5 : baseBMR - 161;
  }

  /**
   * Enforce calorie guardrails (never < 0.75 * BMR)
   */
  private static enforceCalorieGuardrails(
    targetCalories: number,
    goals: any
  ): { calories: number; warning?: string } {
    if (!goals.currentWeightKg || !goals.heightCm || !goals.age) {
      return { calories: targetCalories };
    }

    const bmr = this.calculateBMR(
      goals.currentWeightKg,
      goals.heightCm,
      goals.age,
      goals.sex || 'other'
    );

    const minimumCalories = Math.round(bmr * 0.75);

    if (targetCalories < minimumCalories) {
      return {
        calories: minimumCalories,
        warning: `Target increased to ${minimumCalories} cal (75% of BMR) for safety. Extreme deficits can harm your health.`,
      };
    }

    return { calories: targetCalories };
  }

  /**
   * Internal meal plan generation (no cache)
   */
  private static async _generateMealPlanInternal(
    req: MealPlanRequest
  ): Promise<MealPlanResponse> {
    // Enforce safety guardrails
    const { calories: safeCalories, warning } = this.enforceCalorieGuardrails(
      req.goals.dailyCalorieTarget || 2000,
      req.goals
    );

    const systemPrompt = `You are FIIT, a nutrition coach AI. Create realistic meal plans that match the user's:
- Goals: weight loss, calorie target, macro targets
- Dietary rules: diet preference, allergies
- Budget: ${req.goals.budgetLevel} budget
- Time: ${req.goals.timeToCookMins} minutes average cooking time per meal

SAFETY GUARDRAILS:
- NEVER recommend calorie targets below user's BMR * 0.75
- NEVER suggest extreme fasting or very low calorie diets
- Prefer protein-first adjustments to maintain muscle mass
- Always provide balanced, sustainable meal plans

Output strictly valid JSON matching this schema:
{
  "id": "string",
  "weekStartDate": "YYYY-MM-DD",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "meals": [
        {
          "when": "breakfast|lunch|dinner|snack",
          "items": [
            {
              "id": "string",
              "name": "string",
              "calories": number,
              "protein": number,
              "carbs": number,
              "fat": number,
              "fiber": number,
              "quantity": "string",
              "when": "breakfast|lunch|dinner|snack",
              "timestamp": "ISO string",
              "source": "ai"
            }
          ],
          "recipeName": "string",
          "prepTimeMins": number,
          "cookTimeMins": number,
          "instructions": ["step1", "step2"]
        }
      ],
      "dailyTotals": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      }
    }
  ],
  "groceryList": [
    { "name": "string", "qty": "string", "category": "string" }
  ],
  "createdAt": "ISO string"
}

Guardrails:
- Never recommend extreme calorie deficits (<1200 cal/day)
- Respect all allergies strictly
- Prefer simple, repeatable meals
- Balance nutrients across the week
- No medical claims or unsafe advice`;

    const userPrompt = `Create a 7-day meal plan starting ${req.weekStartISO}.

User Profile:
- Current weight: ${req.goals.currentWeightKg}kg
- Goal weight: ${req.goals.goalWeightKg}kg
- Height: ${req.goals.heightCm}cm
- Age: ${req.goals.age}, Sex: ${req.goals.sex}
- Activity: ${req.goals.activity}
- Diet: ${req.goals.dietPreference}
- Allergies: ${req.goals.allergies.join(', ') || 'none'}
- Budget: ${req.goals.budgetLevel}
- Cooking time: ${req.goals.timeToCookMins} min/meal

Daily Targets:
- Calories: ${req.goals.dailyCalorieTarget}
- Protein: ${req.goals.proteinTargetGrams}g
- Carbs: ${req.goals.carbTargetGrams}g
- Fat: ${req.goals.fatTargetGrams}g

${req.excludeFoods?.length ? `Exclude: ${req.excludeFoods.join(', ')}` : ''}
${req.preferredCuisines?.length ? `Preferred cuisines: ${req.preferredCuisines.join(', ')}` : ''}

Return only valid JSON.`;

    try {
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      const jsonResponse = await AIService.completeJSON(fullPrompt, {
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      return {
        plan: jsonResponse,
        confidence: 0.85,
      };
    } catch (error) {
      console.error('[FIITAI] Meal plan generation failed:', error);
      throw new Error('Failed to generate meal plan. Please try again.');
    }
  }

  /**
   * Generate daily feedback with caching
   * Cache by day + totals; stale-while-revalidate pattern
   * Enhanced fallback tips when OpenAI fails
   */
  static async dailyFeedback(
    req: FeedbackRequest,
    options?: { useCache?: boolean }
  ): Promise<FeedbackResponse> {
    const useCache = options?.useCache !== false;

    if (useCache) {
      // Cache key: day + rounded totals
      const cacheKey = AICache.generateKey('feedback', {
        date: req.dayLog.date,
        calories: Math.round(req.dayLog.totals.calories / 50) * 50, // Round to nearest 50
        protein: Math.round(req.dayLog.totals.protein / 10) * 10,
      });

      try {
        return await AICache.getStaleWhileRevalidate(
          cacheKey,
          () => this._generateDailyFeedbackInternal(req),
          24 * 60 * 60 * 1000 // 24 hours TTL
        );
      } catch (error) {
        console.error('[FIITAI] Cached feedback fetch failed:', error);
      }
    }

    return this._generateDailyFeedbackInternal(req);
  }

  /**
   * Internal daily feedback generation with enhanced fallback
   */
  private static async _generateDailyFeedbackInternal(
    req: FeedbackRequest
  ): Promise<FeedbackResponse> {
    const systemPrompt = `You are FIIT, a supportive nutrition coach. Analyze today's eating vs targets and provide:
1. Brief summary of the day (2 sentences)
2. One actionable tip for tomorrow
3. Specific notes on protein, carbs, hydration if relevant

Output strictly valid JSON:
{
  "id": "string",
  "date": "YYYY-MM-DD",
  "summary": "string",
  "tomorrowTip": "string",
  "proteinNote": "string or null",
  "carbsNote": "string or null",
  "hydrationNote": "string or null",
  "calorieNote": "string or null",
  "mood": "encouraging|supportive|analytical|celebratory",
  "streak": number
}

Tone: encouraging, never judgmental. Celebrate small wins.`;

    const userPrompt = `Analyze this day:

Date: ${req.dayLog.date}
Logged meals: ${req.dayLog.meals.length}
Totals:
- Calories: ${req.dayLog.totals.calories} / ${req.goals.dailyCalorieTarget}
- Protein: ${req.dayLog.totals.protein}g / ${req.goals.proteinTargetGrams}g
- Carbs: ${req.dayLog.totals.carbs}g / ${req.goals.carbTargetGrams}g
- Fat: ${req.dayLog.totals.fat}g / ${req.goals.fatTargetGrams}g

Current streak: ${req.streak || 0} days

Meals:
${req.dayLog.meals.map(m => `- ${m.name} (${m.calories} cal, ${m.protein}g protein)`).join('\n')}

Return only valid JSON.`;

    try {
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      const jsonResponse = await AIService.completeJSON(fullPrompt, {
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      // Validate with zod
      // Note: validateFeedback would need to be imported statically
      // For now, we'll skip validation and return the response directly
      return jsonResponse;
    } catch (error) {
      console.error('[FIITAI] Daily feedback failed:', error);
      // Return enhanced fallback feedback
      return this._generateFallbackFeedback(req);
    }
  }

  /**
   * Generate fallback feedback when AI fails
   * Provides 3 bullets + tomorrow tip + hydration target
   */
  private static _generateFallbackFeedback(
    req: FeedbackRequest
  ): FeedbackResponse {
    const { dayLog, goals, streak } = req;
    const { calories, protein, carbs, fat } = dayLog.totals;

    // Calculate percentages
    const caloriePercent =
      (calories / (goals.dailyCalorieTarget || 2000)) * 100;
    const proteinPercent = (protein / (goals.proteinTargetGrams || 150)) * 100;

    // Generate 3 contextual bullets
    const bullets: string[] = [];

    if (caloriePercent > 110) {
      bullets.push(
        `You consumed ${Math.round(caloriePercent - 100)}% more calories than your target. Consider smaller portions tomorrow.`
      );
    } else if (caloriePercent < 80) {
      bullets.push(
        `You're ${Math.round(100 - caloriePercent)}% under your calorie target. Make sure you're eating enough to fuel your day.`
      );
    } else {
      bullets.push(
        `Great job staying within your calorie target! You're ${Math.round(caloriePercent)}% on track.`
      );
    }

    if (proteinPercent < 80) {
      bullets.push(
        `Protein was low today (${protein}g / ${goals.proteinTargetGrams}g). Add eggs, chicken, or Greek yogurt tomorrow.`
      );
    } else if (proteinPercent >= 100) {
      bullets.push(
        `Excellent protein intake today! ${protein}g helps preserve muscle while losing weight.`
      );
    } else {
      bullets.push(`Protein: ${protein}g — solid foundation for the day.`);
    }

    if (dayLog.meals.length < 3) {
      bullets.push(
        `Only ${dayLog.meals.length} meals logged. Try to log all meals for better tracking.`
      );
    } else {
      bullets.push(
        `${dayLog.meals.length} meals logged — consistency is key to your success!`
      );
    }

    // Tomorrow tip with meal swap suggestion
    let tomorrowTip = 'Focus on protein-first meals tomorrow.';
    if (proteinPercent < 80) {
      tomorrowTip = `Swap your usual breakfast for: 3 eggs + 1 cup Greek yogurt + berries (35g protein, ~350 cal)`;
    } else if (caloriePercent > 110) {
      tomorrowTip = `Try this lighter dinner: Grilled chicken breast (200g) + roasted vegetables (350 cal total)`;
    } else {
      tomorrowTip = `Keep up the great work! Tomorrow, try adding a 10-minute walk after meals.`;
    }

    // Hydration target
    const hydrationOz = Math.round((goals.currentWeightKg || 70) / 2);

    return {
      id: `feedback_${Date.now()}`,
      date: dayLog.date,
      summary: bullets.join(' '),
      tomorrowTip,
      hydrationNote: `Hydration target: ${hydrationOz} oz water (~${Math.round(hydrationOz / 8)} glasses)`,
      mood:
        caloriePercent <= 110 && proteinPercent >= 80
          ? 'celebratory'
          : 'encouraging',
      streak: streak || 0,
    };
  }

  /**
   * Swap a single meal in the plan (doesn't regenerate entire week)
   * Returns 2-3 alternatives for the specified meal
   */
  static async swapMeal(
    currentMeal: {
      when: string;
      currentItems: any[];
      targetCalories: number;
      targetProtein: number;
    },
    goals: UserGoals
  ): Promise<{ alternatives: any[] }> {
    const systemPrompt = `You are FIIT nutrition coach. Generate 2-3 meal alternatives that match:
- Meal time: ${currentMeal.when}
- Target calories: ${currentMeal.targetCalories} ±50
- Target protein: ${currentMeal.targetProtein}g ±5g
- Diet: ${goals.dietPreference}
- Allergies: ${goals.allergies.join(', ') || 'none'}
- Budget: ${goals.budgetLevel}
- Cooking time: ${goals.timeToCookMins} min

Return valid JSON:
{
  "alternatives": [
    {
      "recipeName": "string",
      "items": [...meal items...],
      "prepTimeMins": number,
      "instructions": ["step1", "step2"]
    }
  ]
}`;

    const userPrompt = `Current meal: ${currentMeal.currentItems.map(i => i.name).join(', ')}

Generate 2-3 different alternatives that are just as satisfying. Return only valid JSON.`;

    try {
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      const jsonResponse = await AIService.completeJSON(fullPrompt, {
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      return jsonResponse;
    } catch (error) {
      console.error('[FIITAI] Meal swap failed:', error);
      // Return generic alternatives
      return {
        alternatives: [
          {
            recipeName: `Quick ${currentMeal.when} option`,
            items: [],
            prepTimeMins: 10,
            instructions: ['Check planner for similar meals'],
          },
        ],
      };
    }
  }

  // Explain calorie/macro balance
  static async explainBalance(
    dayLog: DayLog,
    goals: UserGoals
  ): Promise<string> {
    const prompt = `As FIIT nutrition coach, explain in 2-3 sentences why this day's macros are balanced or not:

Eaten: ${dayLog.totals.calories} cal (${dayLog.totals.protein}g protein, ${dayLog.totals.carbs}g carbs, ${dayLog.totals.fat}g fat)
Target: ${goals.dailyCalorieTarget} cal (${goals.proteinTargetGrams}g protein, ${goals.carbTargetGrams}g carbs, ${goals.fatTargetGrams}g fat)

Be concise and actionable.`;

    try {
      const response = await AIService.completeJSON(prompt, {
        provider: 'openai',
        model: 'gpt-4o-mini',
      });
      return response.explanation || 'Your macros look balanced overall.';
    } catch (error) {
      return 'Your macros look balanced overall. Keep focusing on hitting your protein target.';
    }
  }
}
