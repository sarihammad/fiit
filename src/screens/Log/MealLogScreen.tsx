import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useNutritionStore } from '@/state/nutrition.store';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { CameraModal } from '@/components/CameraModal';
import { PortionSelector } from '@/components/PortionSelector';
import { MacroPreview } from '@/components/MacroPreview';
import { ManualEntryModal } from '@/components/ManualEntryModal';
import { searchFood, analyzePhoto, convertToMealItem } from '@/services/food';
import {
  MealItem,
  MealTime,
  FoodRecognitionResult,
  TopKPrediction,
} from '@/types/nutrition';
import { PredictionsConfirm } from '@/components/PredictionsConfirm';
import { Toast } from '@/utils/toast';

type TabType = 'photo' | 'search' | 'manual';

export const MealLogScreen: React.FC = () => {
  const { theme } = useTheme();
  const { trackEvent } = useAnalytics();
  const { getCurrentDayLog, addMeal, removeMeal } = useNutritionStore();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('photo');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MealItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Photo state
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  // Portion selection state
  const [showPortionModal, setShowPortionModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<MealItem | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [portionText, setPortionText] = useState('1 serving');

  // Manual entry state
  const [showManualModal, setShowManualModal] = useState(false);

  // Food recognition state
  const [foodRecognitionResult, setFoodRecognitionResult] =
    useState<FoodRecognitionResult | null>(null);
  const [showPredictions, setShowPredictions] = useState(false);
  const [lastPhotoUri, setLastPhotoUri] = useState<string>('');

  const dayLog = getCurrentDayLog();

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

  // ==================== Handlers ====================

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchFood(searchQuery);
      const mealItems = results.flatMap(result => result.items);
      setSearchResults(mealItems);
      if (mealItems.length === 0) {
        Toast.info('No results found. Try a different search.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      Toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePhotoTaken = async (uri: string) => {
    setShowCamera(false);
    setIsAnalyzingPhoto(true);
    setLastPhotoUri(uri);

    // Track food recognition request
    trackEvent('food_recognition_request', {
      platform: 'mobile',
      screen: 'MealLog',
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await analyzePhoto(uri);

      // Handle error case
      if ('error' in result) {
        Toast.error('Failed to analyze photo');
        return;
      }

      // Track food recognition result
      trackEvent('food_recognition_result', {
        top1_label: result.topk[0]?.label || 'unknown',
        top1_prob: result.topk[0]?.prob || 0,
        decision: result.decision,
        has_nutrition: !!result.nutrition,
        error: null,
        timestamp: new Date().toISOString(),
      });

      setFoodRecognitionResult(result);

      // Handle different decision types
      if (result.decision === 'auto_accept' && result.topk[0]) {
        // Auto-accept top prediction
        trackEvent('food_recognition_confirmed', {
          selected_label: result.topk[0].label,
          confidence: result.topk[0].prob,
          method: 'auto_accept',
        });
        acceptPrediction(result.topk[0].label, result.nutrition, uri);
      } else if (result.decision === 'confirm') {
        // Show prediction selection UI
        setShowPredictions(true);
      } else {
        // Fallback to manual entry
        Toast.warning('Low confidence prediction. Opening manual entry...');
        trackEvent('food_recognition_fallback', {
          reason: 'low_confidence',
          top1_prob: result.topk[0]?.prob || 0,
        });
        setShowManualModal(true);
      }
    } catch (error: any) {
      console.error('Photo analysis failed:', error);
      Toast.error('Photo analysis failed. Opening manual entry...');
      trackEvent('food_recognition_fallback', {
        reason: 'exception',
        error: error.message,
      });
      setShowManualModal(true);
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const handleSearchItemSelect = (item: MealItem) => {
    setSelectedFood(item);
    setPortionMultiplier(1);
    setPortionText(item.quantity || '1 serving');
    setShowPortionModal(true);
  };

  const handlePortionChange = (multiplier: number, text: string) => {
    setPortionMultiplier(multiplier);
    setPortionText(text);
  };

  const handleSaveFromPortion = () => {
    if (!selectedFood) return;

    const adjustedMeal: MealItem = {
      ...selectedFood,
      id: `${Date.now()}_${Math.random()}`,
      calories: Math.round(selectedFood.calories * portionMultiplier),
      protein: Math.round(selectedFood.protein * portionMultiplier),
      carbs: Math.round(selectedFood.carbs * portionMultiplier),
      fat: Math.round(selectedFood.fat * portionMultiplier),
      fiber: selectedFood.fiber
        ? Math.round(selectedFood.fiber * portionMultiplier)
        : undefined,
      quantity: portionText,
      when: getCurrentMealTime(),
      timestamp: new Date().toISOString(),
    };

    addMeal(adjustedMeal);
    Toast.success('Meal added!');

    // Reset
    setShowPortionModal(false);
    setSelectedFood(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleManualSave = (meal: MealItem) => {
    addMeal(meal);
    Toast.success('Meal added!');
  };

  const acceptPrediction = (
    label: string,
    nutrition: any,
    photoUri: string
  ) => {
    const mealItem = convertToMealItem(
      { topk: [{ label, prob: 1 }], decision: 'auto_accept', nutrition },
      label,
      100 // Default portion size
    );

    if (mealItem) {
      setSelectedFood(mealItem);
      setPortionMultiplier(1);
      setPortionText(mealItem.quantity || '1 serving');
      setShowPortionModal(true);
    } else {
      Toast.error('Failed to create meal item');
      setShowManualModal(true);
    }
  };

  const handlePredictionSelect = (label: string) => {
    if (foodRecognitionResult) {
      // Track user confirmation
      trackEvent('food_recognition_confirmed', {
        selected_label: label,
        confidence:
          foodRecognitionResult.topk.find(p => p.label === label)?.prob || 0,
        method: 'user_selected',
      });
      acceptPrediction(label, foodRecognitionResult.nutrition, lastPhotoUri);
      setShowPredictions(false);
    }
  };

  const handlePredictionFallback = () => {
    trackEvent('food_recognition_fallback', { reason: 'user_rejected' });
    setShowPredictions(false);
    setShowManualModal(true);
  };

  const handleRemoveMeal = (mealId: string) => {
    removeMeal(mealId);
    Toast.success('Meal removed');
  };

  const getCurrentMealTime = (): MealTime => {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 19) return 'dinner';
    return 'snack';
  };

  // ==================== Render ====================

  const tabs: {
    key: TabType;
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
  }[] = [
    { key: 'photo', label: 'Photo', icon: 'photo-camera' },
    { key: 'search', label: 'Search', icon: 'search' },
    { key: 'manual', label: 'Manual', icon: 'edit' },
  ];

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme?.colors?.background?.primary || '#ffffff',
      }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: theme?.colors?.text?.primary || '#000000',
            marginBottom: 8,
          }}
        >
          Log Meals
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme?.colors?.text?.secondary || '#666666',
            marginBottom: 24,
          }}
        >
          Snap, search, or enter meals manually
        </Text>

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: theme?.colors?.background?.secondary || '#f5f5f5',
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
          }}
        >
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor:
                  activeTab === tab.key
                    ? theme?.colors?.brand?.primary?.[600] || '#22c55e'
                    : 'transparent',
                alignItems: 'center',
              }}
              onPress={() => setActiveTab(tab.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: activeTab === tab.key }}
            >
              <MaterialIcons
                name={tab.icon}
                size={20}
                color={
                  activeTab === tab.key
                    ? theme?.colors?.brand?.primary?.[600] || '#2563eb'
                    : theme?.colors?.text?.secondary || '#6b7280'
                }
                style={{ marginBottom: 2 }}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color:
                    activeTab === tab.key
                      ? '#ffffff'
                      : theme?.colors?.text?.primary || '#000000',
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Photo Tab */}
        {activeTab === 'photo' && (
          <View>
            <Card
              style={{ marginBottom: 16, alignItems: 'center', padding: 32 }}
            >
              <MaterialIcons
                name="photo-camera"
                size={64}
                color={theme?.colors?.text?.secondary || '#6b7280'}
                style={{ marginBottom: 16 }}
              />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: theme?.colors?.text?.primary || '#000000',
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                Scan Your Meal
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme?.colors?.text?.secondary || '#666666',
                  marginBottom: 24,
                  textAlign: 'center',
                }}
              >
                Point your camera at food and we'll estimate calories & macros
              </Text>
              <Button
                title={isAnalyzingPhoto ? 'Analyzing...' : 'Open Camera'}
                onPress={() => setShowCamera(true)}
                variant="primary"
                size="large"
                disabled={isAnalyzingPhoto}
                accessibilityLabel="Open camera to scan meal"
              />
            </Card>

            {isAnalyzingPhoto && (
              <Card
                style={{
                  marginBottom: 16,
                  alignItems: 'center',
                  padding: 24,
                }}
              >
                <ActivityIndicator
                  size="large"
                  color={theme?.colors?.brand?.primary?.[600] || '#22c55e'}
                />
                <Text
                  style={{
                    marginTop: 12,
                    fontSize: 14,
                    color: theme?.colors?.text?.secondary || '#666666',
                  }}
                >
                  Analyzing your meal... (up to 8 seconds)
                </Text>
              </Card>
            )}

            {/* Food Recognition Results */}
            {showPredictions && foodRecognitionResult && (
              <Card style={{ marginBottom: 16, padding: 20 }}>
                <PredictionsConfirm
                  result={foodRecognitionResult}
                  onSelect={handlePredictionSelect}
                  onFallback={handlePredictionFallback}
                />
              </Card>
            )}
          </View>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <View>
            <Card style={{ marginBottom: 16 }}>
              <TextInput
                style={{
                  fontSize: 16,
                  color: theme?.colors?.text?.primary || '#000000',
                  padding: 16,
                  backgroundColor:
                    theme?.colors?.background?.secondary || '#f5f5f5',
                  borderRadius: 8,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: theme?.colors?.border?.primary || '#e5e5e5',
                }}
                placeholder="Search foods (e.g., chicken breast)"
                placeholderTextColor={
                  theme?.colors?.text?.tertiary || '#999999'
                }
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <Button
                title={isSearching ? 'Searching...' : 'Search'}
                onPress={handleSearch}
                variant="primary"
                disabled={isSearching || !searchQuery.trim()}
                accessibilityLabel="Search for food"
              />
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: theme?.colors?.text?.primary || '#000000',
                    marginBottom: 12,
                  }}
                >
                  Results
                </Text>
                {searchResults.map(result => (
                  <TouchableOpacity
                    key={result.id}
                    onPress={() => handleSearchItemSelect(result)}
                    style={{
                      padding: 16,
                      backgroundColor:
                        theme?.colors?.background?.secondary || '#f5f5f5',
                      borderRadius: 8,
                      marginBottom: 8,
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
                      {result.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme?.colors?.text?.tertiary || '#999999',
                      }}
                    >
                      {result.calories} cal • {result.protein}g protein •{' '}
                      {result.quantity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Card>
            )}
          </View>
        )}

        {/* Manual Tab */}
        {activeTab === 'manual' && (
          <View>
            <Card
              style={{ marginBottom: 16, alignItems: 'center', padding: 32 }}
            >
              <MaterialIcons
                name="edit"
                size={64}
                color={theme?.colors?.text?.secondary || '#6b7280'}
                style={{ marginBottom: 16 }}
              />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: theme?.colors?.text?.primary || '#000000',
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                Manual Entry
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme?.colors?.text?.secondary || '#666666',
                  marginBottom: 24,
                  textAlign: 'center',
                }}
              >
                Enter nutrition info from a food label or restaurant menu
              </Text>
              <Button
                title="Open Entry Form"
                onPress={() => setShowManualModal(true)}
                variant="primary"
                size="large"
                accessibilityLabel="Open manual entry form"
              />
            </Card>
          </View>
        )}

        {/* Today's Logged Meals */}
        <Card>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme?.colors?.text?.primary || '#000000',
              marginBottom: 12,
            }}
          >
            Today's Meals ({dayLog.meals.length})
          </Text>

          {dayLog.meals.length === 0 ? (
            <Text
              style={{
                fontSize: 14,
                color: theme?.colors?.text?.secondary || '#666666',
                textAlign: 'center',
                paddingVertical: 16,
              }}
            >
              No meals logged yet
            </Text>
          ) : (
            <View>
              {dayLog.meals.map(meal => (
                <View
                  key={meal.id}
                  style={{
                    padding: 12,
                    backgroundColor:
                      theme?.colors?.background?.secondary || '#f5f5f5',
                    borderRadius: 8,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: theme?.colors?.border?.primary || '#e5e5e5',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: theme?.colors?.text?.primary || '#000000',
                          marginBottom: 4,
                        }}
                      >
                        {meal.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: theme?.colors?.text?.tertiary || '#999999',
                          marginBottom: 2,
                        }}
                      >
                        {meal.calories} cal • {meal.protein}g P • {meal.carbs}g
                        C • {meal.fat}g F
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme?.colors?.text?.tertiary || '#999999',
                          textTransform: 'capitalize',
                        }}
                      >
                        {meal.when} • {meal.quantity}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveMeal(meal.id)}>
                      <Text
                        style={{
                          fontSize: 28,
                          color: theme?.colors?.error?.[500] || '#ef4444',
                          lineHeight: 28,
                        }}
                      >
                        ×
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Daily Totals */}
          {dayLog.meals.length > 0 && (
            <View
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: theme?.colors?.border?.primary || '#e5e5e5',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: theme?.colors?.text?.primary || '#000000',
                  marginBottom: 8,
                }}
              >
                Daily Totals
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme?.colors?.text?.secondary || '#666666',
                }}
              >
                {dayLog.totals.calories} cal • {dayLog.totals.protein}g protein
                • {dayLog.totals.carbs}g carbs • {dayLog.totals.fat}g fat
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Camera Modal */}
      <CameraModal
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onPhotoTaken={handlePhotoTaken}
      />

      {/* Portion Selection Modal */}
      <Modal
        visible={showPortionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPortionModal(false)}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: theme?.colors?.background?.primary || '#ffffff',
          }}
        >
          <ScrollView>
            {selectedFood && (
              <>
                <PortionSelector
                  foodItem={selectedFood}
                  onPortionChange={handlePortionChange}
                  selectedMultiplier={portionMultiplier}
                />
                <MacroPreview
                  foodItem={selectedFood}
                  multiplier={portionMultiplier}
                />
              </>
            )}
          </ScrollView>

          <View
            style={{
              padding: 20,
              borderTopWidth: 1,
              borderTopColor: theme?.colors?.border?.primary || '#e5e5e5',
              backgroundColor: theme?.colors?.background?.primary || '#ffffff',
            }}
          >
            <Button
              title="Save Meal"
              onPress={handleSaveFromPortion}
              variant="primary"
              size="large"
              fullWidth
              accessibilityLabel="Save meal with selected portion"
            />
            <TouchableOpacity
              onPress={() => setShowPortionModal(false)}
              style={{ marginTop: 12, alignItems: 'center', padding: 8 }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: theme?.colors?.text?.secondary || '#666666',
                  fontWeight: '600',
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Manual Entry Modal */}
      <ManualEntryModal
        visible={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSave={handleManualSave}
      />
    </SafeAreaView>
  );
};
