// Predictions confirmation component with nutrition info and portion selection
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { TopKPrediction, FoodRecognitionResult } from '@/types/nutrition';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from './Button';

type Props = {
  result: FoodRecognitionResult;
  onSelect: (label: string, portionSize?: number) => void;
  onFallback?: () => void;
  isLoading?: boolean;
};

export const PredictionsConfirm: React.FC<Props> = ({
  result,
  onSelect,
  onFallback,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const [selectedPrediction, setSelectedPrediction] =
    useState<TopKPrediction | null>(result.topk?.[0] || null);
  const [portionSize, setPortionSize] = useState(100); // Default 100g

  if (!result.topk?.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialIcons
            name="error-outline"
            size={48}
            color={theme?.colors?.error?.[500] || '#ef4444'}
          />
          <Text
            style={[
              styles.title,
              { color: theme?.colors?.text?.primary || '#000000' },
            ]}
          >
            No predictions available
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme?.colors?.text?.secondary || '#666666' },
            ]}
          >
            We couldn't identify the food in your photo. Try taking another
            photo or search manually.
          </Text>
        </View>

        {onFallback && (
          <Button
            title="Search Manually"
            onPress={onFallback}
            variant="outline"
            style={styles.fallbackButton}
          />
        )}
      </View>
    );
  }

  const handleConfirm = () => {
    if (selectedPrediction) {
      onSelect(selectedPrediction.label, portionSize);
    }
  };

  const formatConfidence = (prob: number) => {
    return `${Math.round(prob * 100)}%`;
  };

  const getConfidenceColor = (prob: number) => {
    if (prob >= 0.8) return theme?.colors?.success?.[500] || '#22c55e';
    if (prob >= 0.6) return theme?.colors?.warning?.[500] || '#f59e0b';
    return theme?.colors?.error?.[500] || '#ef4444';
  };

  const renderNutritionInfo = () => {
    if (!result.nutrition) return null;

    const nutrition = result.nutrition;
    const multiplier = portionSize / 100; // Default to 100g base

    return (
      <View
        style={[
          styles.nutritionContainer,
          { backgroundColor: theme?.colors?.surface?.secondary || '#f8fafc' },
        ]}
      >
        <Text
          style={[
            styles.nutritionTitle,
            { color: theme?.colors?.text?.primary || '#000000' },
          ]}
        >
          Nutrition Info ({portionSize}g)
        </Text>

        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <MaterialIcons
              name="local-fire-department"
              size={20}
              color={theme?.colors?.brand?.primary?.[600] || '#22c55e'}
            />
            <Text
              style={[
                styles.nutritionValue,
                { color: theme?.colors?.text?.primary || '#000000' },
              ]}
            >
              {Math.round((nutrition.kcal || 0) * multiplier)}
            </Text>
            <Text
              style={[
                styles.nutritionLabel,
                { color: theme?.colors?.text?.secondary || '#666666' },
              ]}
            >
              Calories
            </Text>
          </View>

          <View style={styles.nutritionItem}>
            <MaterialIcons
              name="fitness-center"
              size={20}
              color={theme?.colors?.brand?.primary?.[600] || '#22c55e'}
            />
            <Text
              style={[
                styles.nutritionValue,
                { color: theme?.colors?.text?.primary || '#000000' },
              ]}
            >
              {Math.round((nutrition.protein || 0) * multiplier * 10) / 10}g
            </Text>
            <Text
              style={[
                styles.nutritionLabel,
                { color: theme?.colors?.text?.secondary || '#666666' },
              ]}
            >
              Protein
            </Text>
          </View>

          <View style={styles.nutritionItem}>
            <MaterialIcons
              name="grain"
              size={20}
              color={theme?.colors?.brand?.primary?.[600] || '#22c55e'}
            />
            <Text
              style={[
                styles.nutritionValue,
                { color: theme?.colors?.text?.primary || '#000000' },
              ]}
            >
              {Math.round((nutrition.carbs || 0) * multiplier * 10) / 10}g
            </Text>
            <Text
              style={[
                styles.nutritionLabel,
                { color: theme?.colors?.text?.secondary || '#666666' },
              ]}
            >
              Carbs
            </Text>
          </View>

          <View style={styles.nutritionItem}>
            <MaterialIcons
              name="opacity"
              size={20}
              color={theme?.colors?.brand?.primary?.[600] || '#22c55e'}
            />
            <Text
              style={[
                styles.nutritionValue,
                { color: theme?.colors?.text?.primary || '#000000' },
              ]}
            >
              {Math.round((nutrition.fat || 0) * multiplier * 10) / 10}g
            </Text>
            <Text
              style={[
                styles.nutritionLabel,
                { color: theme?.colors?.text?.secondary || '#666666' },
              ]}
            >
              Fat
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPortionSelector = () => (
    <View style={styles.portionContainer}>
      <Text
        style={[
          styles.portionTitle,
          { color: theme?.colors?.text?.primary || '#000000' },
        ]}
      >
        Portion Size
      </Text>

      <View style={styles.portionButtons}>
        {[50, 100, 150, 200].map(size => (
          <Pressable
            key={size}
            style={[
              styles.portionButton,
              portionSize === size && styles.selectedPortionButton,
              {
                borderColor:
                  portionSize === size
                    ? theme?.colors?.brand?.primary?.[600] || '#22c55e'
                    : theme?.colors?.border?.primary || '#e5e5e5',
                backgroundColor:
                  portionSize === size
                    ? theme?.colors?.brand?.primary?.[50] || '#f0f9ff'
                    : 'transparent',
              },
            ]}
            onPress={() => setPortionSize(size)}
          >
            <Text
              style={[
                styles.portionButtonText,
                {
                  color:
                    portionSize === size
                      ? theme?.colors?.brand?.primary?.[600] || '#22c55e'
                      : theme?.colors?.text?.primary || '#000000',
                },
              ]}
            >
              {size}g
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <MaterialIcons
          name="restaurant"
          size={48}
          color={theme?.colors?.brand?.primary?.[600] || '#22c55e'}
        />
        <Text
          style={[
            styles.title,
            { color: theme?.colors?.text?.primary || '#000000' },
          ]}
        >
          Confirm your meal
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme?.colors?.text?.secondary || '#666666' },
          ]}
        >
          We found these foods in your photo. Select the correct one and adjust
          the portion size.
        </Text>
      </View>

      <View style={styles.predictionsContainer}>
        {result.topk.map((prediction, index) => (
          <Pressable
            key={index}
            style={[
              styles.predictionCard,
              selectedPrediction?.label === prediction.label &&
                styles.selectedCard,
              {
                borderColor:
                  selectedPrediction?.label === prediction.label
                    ? theme?.colors?.brand?.primary?.[600] || '#22c55e'
                    : theme?.colors?.border?.primary || '#e5e5e5',
                backgroundColor:
                  selectedPrediction?.label === prediction.label
                    ? theme?.colors?.brand?.primary?.[50] || '#f0f9ff'
                    : theme?.colors?.surface?.primary || '#ffffff',
              },
            ]}
            onPress={() => setSelectedPrediction(prediction)}
          >
            <View style={styles.predictionHeader}>
              <Text
                style={[
                  styles.predictionLabel,
                  { color: theme?.colors?.text?.primary || '#000000' },
                ]}
              >
                {prediction.label}
              </Text>
              <View
                style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceColor(prediction.prob) },
                ]}
              >
                <Text style={styles.confidenceText}>
                  {formatConfidence(prediction.prob)}
                </Text>
              </View>
            </View>

            {selectedPrediction?.label === prediction.label && (
              <View style={styles.selectedIndicator}>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={theme?.colors?.brand?.primary?.[600] || '#22c55e'}
                />
                <Text
                  style={[
                    styles.selectedText,
                    {
                      color: theme?.colors?.brand?.primary?.[600] || '#22c55e',
                    },
                  ]}
                >
                  Selected
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {renderPortionSelector()}
      {renderNutritionInfo()}

      <View style={styles.actionsContainer}>
        <Button
          title={isLoading ? 'Logging...' : 'Log This Meal'}
          onPress={handleConfirm}
          disabled={!selectedPrediction || isLoading}
          style={styles.confirmButton}
        />

        {onFallback && (
          <Button
            title="Search Manually"
            onPress={onFallback}
            variant="outline"
            style={styles.fallbackButton}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  predictionsContainer: {
    marginBottom: 24,
  },
  predictionCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedCard: {
    borderWidth: 2,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  predictionLabel: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  selectedText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  portionContainer: {
    marginBottom: 24,
  },
  portionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  portionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  portionButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedPortionButton: {
    borderWidth: 2,
  },
  portionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: 24,
  },
  confirmButton: {
    marginBottom: 12,
  },
  fallbackButton: {
    marginBottom: 12,
  },
});
