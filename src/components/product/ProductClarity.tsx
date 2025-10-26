# Product Clarity & Core Promise

This document outlines the core product promise and user experience improvements for FIIT.

## Core Promise

**"Lose 7 lbs in 30 days — guaranteed."**

### How the Guarantee Works

1. **Baseline Measurement**: User enters current weight and goal weight
2. **Daily Tracking**: AI-powered meal logging with instant feedback
3. **Personalized Plan**: Custom meal plans based on goals and preferences
4. **Progress Monitoring**: Weekly check-ins and adjustments
5. **Guarantee**: If user follows the plan for 30 days and doesn't lose 7 lbs, they get a full refund

### Guarantee Modal Content

```typescript
const GuaranteeModal = () => (
  <Modal>
    <Text style={styles.title}>Our 30-Day Guarantee</Text>
    <Text style={styles.description}>
      We're so confident in our AI-powered nutrition system that we guarantee 
      you'll lose 7 lbs in 30 days if you follow your personalized plan.
    </Text>
    
    <Text style={styles.subtitle}>How it works:</Text>
    <Text style={styles.step}>1. Log your meals daily with our AI camera</Text>
    <Text style={styles.step}>2. Follow your personalized meal plans</Text>
    <Text style={styles.step}>3. Track your progress weekly</Text>
    <Text style={styles.step}>4. If you don't lose 7 lbs, get a full refund</Text>
    
    <Text style={styles.note}>
      * Guarantee applies to users who log meals daily and follow their meal plans. 
      Refund processed within 48 hours of request.
    </Text>
  </Modal>
);
```

## First-Session Success Flow

### Onboarding → Day-1 Plan → First Meal Log → Immediate Feedback

```typescript
// Enhanced onboarding flow
const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      title: "Welcome to FIIT",
      subtitle: "Your AI nutrition coach",
      content: <WelcomeStep />,
    },
    {
      title: "Set Your Goal",
      subtitle: "What do you want to achieve?",
      content: <GoalStep />,
    },
    {
      title: "Your Profile",
      subtitle: "Tell us about yourself",
      content: <ProfileStep />,
    },
    {
      title: "Your Day-1 Plan",
      subtitle: "Here's your personalized meal plan",
      content: <DayOnePlanStep />,
    },
    {
      title: "Log Your First Meal",
      subtitle: "Try our AI camera",
      content: <FirstMealStep />,
    },
    {
      title: "Get Instant Feedback",
      subtitle: "See how AI helps you succeed",
      content: <FeedbackStep />,
    },
  ];
  
  return (
    <View style={styles.container}>
      <ProgressBar current={currentStep} total={steps.length} />
      {steps[currentStep].content}
    </View>
  );
};
```

### Day-1 Plan Generation

```typescript
const DayOnePlanStep = () => {
  const { user } = useAuthStore();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    generateDayOnePlan();
  }, []);
  
  const generateDayOnePlan = async () => {
    try {
      const response = await MealPlanningService.generateDayOnePlan({
        user: user,
        preferences: user.preferences,
        goals: user.goals,
      });
      setPlan(response);
    } catch (error) {
      console.error('Failed to generate day-1 plan:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <DayOnePlanSkeleton />;
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Day-1 Plan</Text>
      <Text style={styles.subtitle}>
        Based on your goals, here's your personalized meal plan for today:
      </Text>
      
      <MealPlanCard plan={plan} />
      
      <Button
        title="Start Logging Meals"
        onPress={() => navigateToMealLogging()}
        variant="primary"
        size="large"
      />
    </View>
  );
};
```

### First Meal Logging Experience

```typescript
const FirstMealStep = () => {
  const [step, setStep] = useState('camera');
  const [photo, setPhoto] = useState(null);
  const [prediction, setPrediction] = useState(null);
  
  const handlePhotoTaken = async (photoUri) => {
    setPhoto(photoUri);
    setStep('analyzing');
    
    try {
      const result = await FoodService.analyzePhoto(photoUri);
      setPrediction(result);
      setStep('confirm');
    } catch (error) {
      setStep('error');
    }
  };
  
  const handleConfirm = async () => {
    try {
      await MealService.logMeal({
        photo: photo,
        prediction: prediction,
        portion: prediction.portion,
      });
      
      // Show success feedback
      setStep('success');
      
      // Navigate to feedback after delay
      setTimeout(() => {
        navigateToFeedback();
      }, 2000);
    } catch (error) {
      setStep('error');
    }
  };
  
  return (
    <View style={styles.container}>
      {step === 'camera' && (
        <CameraStep onPhotoTaken={handlePhotoTaken} />
      )}
      {step === 'analyzing' && (
        <AnalyzingStep />
      )}
      {step === 'confirm' && (
        <ConfirmStep 
          prediction={prediction}
          onConfirm={handleConfirm}
        />
      )}
      {step === 'success' && (
        <SuccessStep />
      )}
      {step === 'error' && (
        <ErrorStep onRetry={() => setStep('camera')} />
      )}
    </View>
  );
};
```

### Immediate Actionable Feedback

```typescript
const FeedbackStep = () => {
  const { user } = useAuthStore();
  const [feedback, setFeedback] = useState(null);
  
  useEffect(() => {
    generateImmediateFeedback();
  }, []);
  
  const generateImmediateFeedback = async () => {
    try {
      const response = await FeedbackService.generateImmediateFeedback({
        user: user,
        firstMeal: user.firstMeal,
        goals: user.goals,
      });
      setFeedback(response);
    } catch (error) {
      console.error('Failed to generate feedback:', error);
    }
  };
  
  if (!feedback) {
    return <FeedbackSkeleton />;
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Great job!</Text>
      <Text style={styles.subtitle}>
        Here's your personalized feedback:
      </Text>
      
      <FeedbackCard feedback={feedback} />
      
      <View style={styles.actions}>
        <Button
          title="Continue to App"
          onPress={() => navigateToHome()}
          variant="primary"
          size="large"
        />
        <Button
          title="Log Another Meal"
          onPress={() => navigateToMealLogging()}
          variant="outline"
          size="large"
        />
      </View>
    </View>
  );
};
```

## Sticky Habit Loop

### Next Best Action (NBA) Component

```typescript
const NextBestAction = () => {
  const { user } = useAuthStore();
  const { meals } = useMealStore();
  const [action, setAction] = useState(null);
  
  useEffect(() => {
    generateNextBestAction();
  }, [user, meals]);
  
  const generateNextBestAction = () => {
    const now = new Date();
    const hour = now.getHours();
    const lastMeal = meals[meals.length - 1];
    const lastMealTime = lastMeal ? new Date(lastMeal.timestamp) : null;
    
    let nextAction;
    
    // Morning (6-11 AM)
    if (hour >= 6 && hour < 11) {
      if (!lastMealTime || lastMealTime.getHours() < 6) {
        nextAction = {
          type: 'log_breakfast',
          title: 'Log Your Breakfast',
          subtitle: 'Start your day with a healthy meal',
          icon: 'breakfast-dining',
          action: () => navigateToMealLogging(),
        };
      } else {
        nextAction = {
          type: 'view_plan',
          title: 'Check Your Meal Plan',
          subtitle: 'See what to eat for lunch',
          icon: 'restaurant-menu',
          action: () => navigateToMealPlan(),
        };
      }
    }
    // Afternoon (11 AM - 5 PM)
    else if (hour >= 11 && hour < 17) {
      if (!lastMealTime || lastMealTime.getHours() < 11) {
        nextAction = {
          type: 'log_lunch',
          title: 'Log Your Lunch',
          subtitle: 'Keep your energy up with a balanced meal',
          icon: 'lunch-dining',
          action: () => navigateToMealLogging(),
        };
      } else {
        nextAction = {
          type: 'view_feedback',
          title: 'Check Your Progress',
          subtitle: 'See how you\'re doing today',
          icon: 'trending-up',
          action: () => navigateToFeedback(),
        };
      }
    }
    // Evening (5 PM - 10 PM)
    else if (hour >= 17 && hour < 22) {
      if (!lastMealTime || lastMealTime.getHours() < 17) {
        nextAction = {
          type: 'log_dinner',
          title: 'Log Your Dinner',
          subtitle: 'End your day with a nutritious meal',
          icon: 'dinner-dining',
          action: () => navigateToMealLogging(),
        };
      } else {
        nextAction = {
          type: 'view_summary',
          title: 'View Daily Summary',
          subtitle: 'See your progress and get tomorrow\'s tip',
          icon: 'summarize',
          action: () => navigateToDailySummary(),
        };
      }
    }
    // Night (10 PM - 6 AM)
    else {
      nextAction = {
        type: 'view_summary',
        title: 'View Daily Summary',
        subtitle: 'See your progress and get tomorrow\'s tip',
        icon: 'summarize',
        action: () => navigateToDailySummary(),
      };
    }
    
    setAction(nextAction);
  };
  
  if (!action) {
    return <NextBestActionSkeleton />;
  }
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={action.action}
      accessibilityRole="button"
      accessibilityLabel={action.title}
    >
      <View style={styles.content}>
        <MaterialIcons
          name={action.icon}
          size={24}
          color={theme.colors.brand.primary}
        />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{action.title}</Text>
          <Text style={styles.subtitle}>{action.subtitle}</Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={theme.colors.text.tertiary}
        />
      </View>
    </TouchableOpacity>
  );
};
```

### Habit Loop Components

```typescript
// Progress tracking for habit formation
const HabitProgress = () => {
  const { user } = useAuthStore();
  const { meals } = useMealStore();
  const [streak, setStreak] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(21); // 3 meals x 7 days
  
  useEffect(() => {
    calculateStreak();
  }, [meals]);
  
  const calculateStreak = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const weeklyMeals = meals.filter(meal => 
      new Date(meal.timestamp) >= startOfWeek
    );
    
    setStreak(weeklyMeals.length);
  };
  
  const progress = (streak / weeklyGoal) * 100;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Progress</Text>
      <Text style={styles.subtitle}>
        {streak} of {weeklyGoal} meals logged this week
      </Text>
      
      <ProgressBar
        progress={progress}
        color={theme.colors.brand.primary}
        height={8}
      />
      
      {progress >= 100 && (
        <Text style={styles.celebration}>
          🎉 Great job! You've logged all your meals this week!
        </Text>
      )}
    </View>
  );
};

// Streak celebration
const StreakCelebration = () => {
  const { user } = useAuthStore();
  const [streak, setStreak] = useState(0);
  
  useEffect(() => {
    calculateStreak();
  }, []);
  
  const calculateStreak = () => {
    // Calculate consecutive days of meal logging
    const today = new Date();
    let currentStreak = 0;
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const hasMeals = user.meals.some(meal => 
        new Date(meal.timestamp).toDateString() === date.toDateString()
      );
      
      if (hasMeals) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    setStreak(currentStreak);
  };
  
  if (streak < 3) return null;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 {streak} Day Streak!</Text>
      <Text style={styles.subtitle}>
        Keep it up! You're building a healthy habit.
      </Text>
      
      {streak >= 7 && (
        <Text style={styles.milestone}>
          🏆 Weekly Warrior! You've logged meals for 7+ days straight.
        </Text>
      )}
      
      {streak >= 30 && (
        <Text style={styles.milestone}>
          🎯 Monthly Master! You've logged meals for 30+ days straight.
        </Text>
      )}
    </View>
  );
};
```

## Enhanced Paywall Copy

```typescript
const PaywallScreen = () => {
  const benefits = [
    {
      icon: 'psychology',
      title: 'AI Meal Planning',
      description: 'Get personalized meal plans tailored to your goals and preferences',
    },
    {
      icon: 'camera-alt',
      title: '5-Second Photo Logging',
      description: 'Snap a photo and get instant calorie and macro breakdowns',
    },
    {
      icon: 'lightbulb',
      title: 'Daily AI Tips',
      description: 'Receive actionable feedback and tips to stay on track',
    },
    {
      icon: 'shopping-cart',
      title: 'Smart Grocery Lists',
      description: 'Automatically generated shopping lists for your meal plans',
    },
  ];
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Unlock Your Full Potential</Text>
        <Text style={styles.subtitle}>
          Join thousands of users who've achieved their goals with FIIT
        </Text>
      </View>
      
      <View style={styles.benefits}>
        {benefits.map((benefit, index) => (
          <BenefitCard key={index} benefit={benefit} />
        ))}
      </View>
      
      <View style={styles.guarantee}>
        <Text style={styles.guaranteeTitle}>30-Day Money-Back Guarantee</Text>
        <Text style={styles.guaranteeText}>
          If you don't lose 7 lbs in 30 days, we'll refund your subscription.
        </Text>
        <TouchableOpacity onPress={() => showGuaranteeModal()}>
          <Text style={styles.guaranteeLink}>Learn more</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.socialProof}>
        <Text style={styles.socialProofTitle}>Trusted by 10,000+ users</Text>
        <Text style={styles.socialProofText}>
          "FIIT helped me lose 15 lbs in 6 weeks. The AI feedback was incredibly helpful!"
        </Text>
        <Text style={styles.socialProofAuthor}>- Sarah M.</Text>
      </View>
      
      <View style={styles.pricing}>
        <PricingCard
          title="FIIT Pro"
          price="$9.99"
          period="month"
          features={[
            'Unlimited meal logging',
            'AI meal planning',
            'Daily feedback',
            'Progress tracking',
            'Priority support',
          ]}
          onSelect={() => purchaseSubscription()}
        />
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => restorePurchases()}>
          <Text style={styles.footerLink}>Restore Purchases</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => manageSubscription()}>
          <Text style={styles.footerLink}>Manage Subscription</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
```

This comprehensive product clarity enhancement provides:

1. **Clear Core Promise**: "Lose 7 lbs in 30 days — guaranteed"
2. **First-Session Success**: Guided onboarding → Day-1 plan → first meal log → immediate feedback
3. **Sticky Habit Loop**: Next Best Action component with time-based CTAs
4. **Enhanced Paywall**: Clear benefits, social proof, and guarantee
5. **Progress Tracking**: Streak celebrations and habit formation
6. **Immediate Value**: Users see results from their first interaction

The system reduces choice paralysis by always showing one clear next action and provides immediate value through personalized feedback and meal plans.
