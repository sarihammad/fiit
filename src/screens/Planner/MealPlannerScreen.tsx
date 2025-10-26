import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { useMealPlanStore } from '@/state/mealplan.store';
import { useUserGoalsStore } from '@/state/userGoals.store';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { FIITAI } from '@/services/ai';
import { Toast } from '@/utils/toast';
import {
  DietPreference,
  BudgetLevel,
  MealPlanMeal,
  GroceryItem,
} from '@/types/nutrition';

type ViewMode = 'plan' | 'grocery';

export const MealPlannerScreen: React.FC = () => {
  const { theme } = useTheme();
  const {
    currentPlan,
    isGenerating,
    setPlan,
    setGenerating,
    setError,
    swapMealInPlan,
  } = useMealPlanStore();
  const { goals, updateGoals } = useUserGoalsStore();

  // Early return if theme is not loaded
  if (!theme) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#ffffff',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size={24} color="#22c55e" />
      </SafeAreaView>
    );
  }

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('plan');
  const [showControls, setShowControls] = useState(false);

  // Inline controls
  const [budget, setBudget] = useState<BudgetLevel>(
    goals?.budgetLevel || 'medium'
  );
  const [timeToCook, setTimeToCook] = useState(goals?.timeToCookMins || 30);
  const [diet, setDiet] = useState<DietPreference>(
    goals?.dietPreference || 'balanced'
  );
  const [allergiesText, setAllergiesText] = useState(
    goals?.allergies?.join(', ') || ''
  );

  // Swap state
  const [swappingMeal, setSwappingMeal] = useState<{
    dayDate: string;
    mealIndex: number;
    meal: MealPlanMeal;
  } | null>(null);
  const [swapAlternatives, setSwapAlternatives] = useState<any[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);

  const handleGeneratePlan = async () => {
    // Save inline controls to goals
    updateGoals({
      budgetLevel: budget,
      timeToCookMins: timeToCook,
      dietPreference: diet,
      allergies: allergiesText
        .split(',')
        .map(a => a.trim())
        .filter(Boolean),
    });

    setGenerating(true);
    setError(null);

    try {
      const weekStart = new Date();
      const weekStartISO = weekStart.toISOString().slice(0, 10);

      const response = await FIITAI.generateMealPlan(
        {
          goals: {
            ...goals,
            budgetLevel: budget,
            timeToCookMins: timeToCook,
            dietPreference: diet,
            allergies: allergiesText
              .split(',')
              .map(a => a.trim())
              .filter(Boolean),
          },
          weekStartISO,
        },
        { useCache: false } // Force fresh generation
      );

      setPlan(response.plan);
      Toast.success('Meal plan generated!');
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Failed to generate plan';
      setError(msg);
      Toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleSwapMeal = async (
    dayDate: string,
    mealIndex: number,
    meal: MealPlanMeal
  ) => {
    if (!meal || !meal.items) return;

    setSwappingMeal({ dayDate, mealIndex, meal });
    setIsSwapping(true);

    try {
      // Calculate target macros from meal items
      const targetCalories = meal.items.reduce(
        (sum, item) => sum + item.calories,
        0
      );
      const targetProtein = meal.items.reduce(
        (sum, item) => sum + item.protein,
        0
      );

      const result = await FIITAI.swapMeal(
        {
          when: meal.when,
          currentItems: meal.items,
          targetCalories,
          targetProtein,
        },
        goals
      );

      setSwapAlternatives(result.alternatives || []);
    } catch (error) {
      Toast.error('Failed to load alternatives');
      setSwappingMeal(null);
    } finally {
      setIsSwapping(false);
    }
  };

  const handleSelectAlternative = (alternative: any) => {
    if (!swappingMeal) return;

    // Swap meal in plan
    swapMealInPlan(swappingMeal.dayDate, swappingMeal.mealIndex, {
      ...swappingMeal.meal,
      recipeName: alternative.recipeName,
      items: alternative.items || swappingMeal.meal.items,
      prepTimeMins: alternative.prepTimeMins,
      instructions: alternative.instructions,
    });

    Toast.success('Meal swapped!');
    setSwappingMeal(null);
    setSwapAlternatives([]);
  };

  const handleCopyGroceries = async () => {
    if (!currentPlan) return;

    const groupedByCategory = groupGroceriesByAisle(currentPlan?.groceryList);
    let text = ' FIIT Grocery List\n\n';

    Object.entries(groupedByCategory || {}).forEach(([category, items]) => {
      text += `${category.toUpperCase()}\n`;
      items.forEach(item => {
        text += `  ☐ ${item.name} - ${item.qty}\n`;
      });
      text += '\n';
    });

    await Clipboard.setStringAsync(text);
    Toast.success('Copied to clipboard!');
  };

  const handleShareGroceries = async () => {
    if (!currentPlan) return;

    const groupedByCategory = groupGroceriesByAisle(currentPlan?.groceryList);
    let text = ' FIIT Grocery List\n\n';

    Object.entries(groupedByCategory || {}).forEach(([category, items]) => {
      text += `${category.toUpperCase()}\n`;
      items.forEach(item => {
        text += `  ☐ ${item.name} - ${item.qty}\n`;
      });
      text += '\n';
    });

    try {
      await Share.share({ message: text });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const groupGroceriesByAisle = (
    groceries: GroceryItem[]
  ): Record<string, GroceryItem[]> => {
    if (!groceries || !Array.isArray(groceries)) {
      return {};
    }

    const grouped: Record<string, GroceryItem[]> = {
      Produce: [],
      Protein: [],
      Dairy: [],
      Grains: [],
      Pantry: [],
      Other: [],
    };

    groceries.forEach(item => {
      const category = item.category || 'Other';
      const key = category.charAt(0).toUpperCase() + category.slice(1);
      if (grouped[key]) {
        grouped[key].push(item);
      } else {
        grouped.Other?.push(item);
      }
    });

    return Object.fromEntries(
      Object.entries(grouped).filter(([_, items]) => items?.length > 0)
    );
  };

  const budgetOptions: { value: BudgetLevel; label: string; icon: string }[] = [
    { value: 'low', label: 'Budget', icon: '💰' },
    { value: 'medium', label: 'Moderate', icon: '💵' },
    { value: 'high', label: 'Premium', icon: '💎' },
  ];

  const dietOptions: { value: DietPreference; label: string }[] = [
    { value: 'balanced', label: 'Balanced' },
    { value: 'high_protein', label: 'High Protein' },
    { value: 'low_carb', label: 'Low Carb' },
    { value: 'keto', label: 'Keto' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'pescatarian', label: 'Pescatarian' },
  ];

  // Show loading if goals not yet loaded
  if (!goals) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme?.colors?.background?.primary || '#ffffff',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator
          size="large"
          color={theme?.colors?.brand?.primary || '#22c55e'}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme?.colors?.background?.primary || '#ffffff',
      }}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: theme?.colors?.text?.primary || '#000000',
            marginBottom: 8,
          }}
        >
          AI Meal Planner
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme?.colors?.text?.secondary || '#666666',
            marginBottom: 24,
          }}
        >
          Personalized 7-day meal plan tailored to your goals
        </Text>

        {/* Inline Controls */}
        <Card style={{ marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setShowControls(!showControls)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <MaterialIcons
                name="settings"
                size={20}
                color={theme?.colors?.text?.primary || '#000000'}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: theme?.colors?.text?.primary || '#000000',
                }}
              >
                Preferences
              </Text>
            </View>
            <Text
              style={{
                fontSize: 20,
                color: theme?.colors?.text?.tertiary || '#999999',
              }}
            >
              {showControls ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>

          {showControls && (
            <View style={{ marginTop: 16 }}>
              {/* Budget */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme?.colors?.text?.primary || '#000000',
                  marginBottom: 8,
                }}
              >
                Budget
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {budgetOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setBudget(option.value)}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor:
                        budget === option.value
                          ? theme?.colors?.brand?.primary?.[50] || '#f0f9ff'
                          : theme?.colors?.background?.secondary || '#f5f5f5',
                      borderWidth: budget === option.value ? 2 : 1,
                      borderColor:
                        budget === option.value
                          ? theme?.colors?.brand?.primary?.[600] || '#22c55e'
                          : theme?.colors?.border?.primary || '#e5e5e5',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 20, marginBottom: 4 }}>
                      {option.icon}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color:
                          budget === option.value
                            ? theme?.colors?.brand?.primary?.[700] || '#15803d'
                            : theme?.colors?.text?.primary || '#000000',
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cooking Time */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme?.colors?.text?.primary || '#000000',
                  marginBottom: 8,
                }}
              >
                Cooking Time per Meal
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {[15, 30, 45, 60].map(mins => (
                  <TouchableOpacity
                    key={mins}
                    onPress={() => setTimeToCook(mins)}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor:
                        timeToCook === mins
                          ? theme?.colors?.brand?.primary?.[50] || '#f0f9ff'
                          : theme?.colors?.background?.secondary || '#f5f5f5',
                      borderWidth: timeToCook === mins ? 2 : 1,
                      borderColor:
                        timeToCook === mins
                          ? theme?.colors?.brand?.primary?.[600] || '#22c55e'
                          : theme?.colors?.border?.primary || '#e5e5e5',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color:
                          timeToCook === mins
                            ? theme?.colors?.brand?.primary?.[700] || '#15803d'
                            : theme?.colors?.text?.primary || '#000000',
                      }}
                    >
                      {mins}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Diet */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme?.colors?.text?.primary || '#000000',
                  marginBottom: 8,
                }}
              >
                Diet Preference
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {dietOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setDiet(option.value)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor:
                        diet === option.value
                          ? theme?.colors?.brand?.primary?.[600] || '#22c55e'
                          : theme?.colors?.background?.secondary || '#f5f5f5',
                      borderWidth: 1,
                      borderColor:
                        diet === option.value
                          ? theme?.colors?.brand?.primary?.[600] || '#22c55e'
                          : theme?.colors?.border?.primary || '#e5e5e5',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color:
                          diet === option.value
                            ? '#ffffff'
                            : theme?.colors?.text?.primary || '#000000',
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Allergies */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme?.colors?.text?.primary || '#000000',
                  marginBottom: 8,
                }}
              >
                Allergies (comma-separated)
              </Text>
              <TextInput
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor:
                    theme?.colors?.background?.secondary || '#f5f5f5',
                  borderWidth: 1,
                  borderColor: theme?.colors?.border?.primary || '#e5e5e5',
                  color: theme?.colors?.text?.primary || '#000000',
                  fontSize: 14,
                }}
                placeholder="e.g., peanuts, shellfish"
                placeholderTextColor={
                  theme?.colors?.text?.tertiary || '#999999'
                }
                value={allergiesText}
                onChangeText={setAllergiesText}
              />
            </View>
          )}
        </Card>

        {/* Generate Button */}
        <Button
          title={isGenerating ? 'Generating Plan...' : 'Generate This Week'}
          onPress={handleGeneratePlan}
          variant="primary"
          size="large"
          disabled={isGenerating}
          style={{ marginBottom: 24 }}
        />

        {/* Loading State */}
        {isGenerating && (
          <Card style={{ alignItems: 'center', padding: 32 }}>
            <ActivityIndicator
              size="large"
              color={theme?.colors?.brand?.primary?.[600] || '#22c55e'}
            />
            <Text
              style={{
                marginTop: 16,
                fontSize: 14,
                color: theme?.colors?.text?.secondary || '#666666',
              }}
            >
              Creating your personalized meal plan...
            </Text>
          </Card>
        )}

        {/* Plan Display */}
        {currentPlan && !isGenerating && (
          <View>
            {/* View Mode Toggle */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <Button
                title="Meal Plan"
                onPress={() => setViewMode('plan')}
                variant={viewMode === 'plan' ? 'primary' : 'secondary'}
                style={{ flex: 1 }}
              />
              <Button
                title="Grocery List"
                onPress={() => setViewMode('grocery')}
                variant={viewMode === 'grocery' ? 'primary' : 'secondary'}
                style={{ flex: 1 }}
              />
            </View>

            {/* Grocery List View */}
            {viewMode === 'grocery' && (
              <Card>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '600',
                      color: theme?.colors?.text?.primary || '#000000',
                    }}
                  >
                    Grocery List
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={handleCopyGroceries}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor:
                          theme?.colors?.brand?.primary?.[50] || '#f0f9ff',
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>📋</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleShareGroceries}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor:
                          theme?.colors?.brand?.primary?.[50] || '#f0f9ff',
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>📤</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {Object.entries(
                  groupGroceriesByAisle(currentPlan?.groceryList) || {}
                ).map(([category, items]) => (
                  <View key={category} style={{ marginBottom: 20 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '700',
                        color:
                          theme?.colors?.brand?.primary?.[700] || '#15803d',
                        marginBottom: 8,
                        textTransform: 'uppercase',
                      }}
                    >
                      {category}
                    </Text>
                    {items.map((item, idx) => (
                      <Text
                        key={idx}
                        style={{
                          fontSize: 15,
                          color: theme?.colors?.text?.primary || '#000000',
                          marginBottom: 6,
                          paddingLeft: 8,
                        }}
                      >
                        ☐ {item.name} - {item.qty}
                      </Text>
                    ))}
                  </View>
                ))}
              </Card>
            )}

            {/* Meal Plan View */}
            {viewMode === 'plan' && (
              <View>
                {currentPlan.days?.map(day => (
                  <Card key={day?.date} style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: theme?.colors?.text?.primary || '#000000',
                        marginBottom: 4,
                      }}
                    >
                      {new Date(day?.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: theme?.colors?.text?.tertiary || '#999999',
                        marginBottom: 12,
                      }}
                    >
                      {day?.dailyTotals?.calories} cal •{' '}
                      {day?.dailyTotals?.protein}g P • {day?.dailyTotals?.carbs}
                      g C • {day?.dailyTotals?.fat}g F
                    </Text>

                    {day.meals?.map((meal, mealIdx) => (
                      <View
                        key={mealIdx}
                        style={{
                          marginBottom: 12,
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor:
                            theme?.colors?.background?.secondary || '#f5f5f5',
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color:
                                theme?.colors?.brand?.primary?.[600] ||
                                '#22c55e',
                              textTransform: 'capitalize',
                            }}
                          >
                            {meal?.when}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              handleSwapMeal(day?.date, mealIdx, meal)
                            }
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 4,
                              borderRadius: 12,
                              backgroundColor:
                                theme?.colors?.brand?.primary?.[50] ||
                                '#f0f9ff',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '600',
                                color:
                                  theme?.colors?.brand?.primary?.[700] ||
                                  '#15803d',
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                }}
                              >
                                <MaterialIcons
                                  name="swap-horiz"
                                  size={16}
                                  color={
                                    theme?.colors?.brand?.primary?.[700] ||
                                    '#15803d'
                                  }
                                  style={{ marginRight: 4 }}
                                />
                                <Text
                                  style={{
                                    color:
                                      theme?.colors?.brand?.primary?.[700] ||
                                      '#15803d',
                                  }}
                                >
                                  Swap
                                </Text>
                              </View>
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '600',
                            color: theme?.colors?.text?.primary || '#000000',
                            marginBottom: 2,
                          }}
                        >
                          {meal?.recipeName ||
                            meal?.items?.map(i => i.name).join(', ')}
                        </Text>
                        {meal?.prepTimeMins && (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <MaterialIcons
                              name="access-time"
                              size={12}
                              color={theme?.colors?.text?.tertiary || '#999999'}
                            />
                            <Text
                              style={{
                                fontSize: 12,
                                color:
                                  theme?.colors?.text?.tertiary || '#999999',
                              }}
                            >
                              {meal?.prepTimeMins}min prep
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Swap Alternatives Modal */}
      <Modal
        visible={!!swappingMeal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSwappingMeal(null)}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: theme?.colors?.background?.primary || '#ffffff',
          }}
        >
          <View style={{ padding: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: theme?.colors?.text?.primary || '#000000',
                }}
              >
                Swap {swappingMeal?.meal.when}
              </Text>
              <TouchableOpacity onPress={() => setSwappingMeal(null)}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme?.colors?.brand?.primary?.[600] || '#22c55e',
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            {isSwapping ? (
              <Card style={{ alignItems: 'center', padding: 32 }}>
                <ActivityIndicator
                  size="large"
                  color={theme?.colors?.brand?.primary?.[600] || '#22c55e'}
                />
                <Text
                  style={{
                    marginTop: 16,
                    fontSize: 14,
                    color: theme?.colors?.text?.secondary || '#666666',
                  }}
                >
                  Finding alternatives...
                </Text>
              </Card>
            ) : (
              <ScrollView>
                {swapAlternatives.map((alt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSelectAlternative(alt)}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      backgroundColor:
                        theme?.colors?.background?.secondary || '#f5f5f5',
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: theme?.colors?.border?.primary || '#e5e5e5',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme?.colors?.text?.primary || '#000000',
                        marginBottom: 4,
                      }}
                    >
                      {alt.recipeName}
                    </Text>
                    {alt.prepTimeMins && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <MaterialIcons
                          name="access-time"
                          size={13}
                          color={theme?.colors?.text?.tertiary || '#999999'}
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            color: theme?.colors?.text?.tertiary || '#999999',
                          }}
                        >
                          {alt.prepTimeMins}min prep
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                {swapAlternatives?.length === 0 && !isSwapping && (
                  <Text
                    style={{
                      textAlign: 'center',
                      color: theme?.colors?.text?.secondary || '#666666',
                      marginTop: 32,
                    }}
                  >
                    No alternatives available. Try regenerating the plan.
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};
