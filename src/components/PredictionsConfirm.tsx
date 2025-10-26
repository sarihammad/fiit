import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { PortionSelector } from '@/components/PortionSelector';

interface PredictionsConfirmProps {
  predictions: Array<{
    label: string;
    confidence: number;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
  }>;
  onConfirm: (selectedPrediction: any, portion: number) => void;
  onCancel: () => void;
  visible: boolean;
}

export const PredictionsConfirm: React.FC<PredictionsConfirmProps> = ({
  predictions,
  onConfirm,
  onCancel,
  visible,
}) => {
  const { theme } = useTheme();
  const [selectedPrediction, setSelectedPrediction] = useState(predictions[0]);
  const [portion, setPortion] = useState(1);

  if (!visible || !predictions.length) return null;

  const handleConfirm = () => {
    onConfirm(selectedPrediction, portion);
  };

  const calculateNutrition = (prediction: any, portion: number) => {
    return {
      calories: Math.round((prediction.calories || 0) * portion),
      protein_g: Math.round((prediction.protein_g || 0) * portion * 10) / 10,
      carbs_g: Math.round((prediction.carbs_g || 0) * portion * 10) / 10,
      fat_g: Math.round((prediction.fat_g || 0) * portion * 10) / 10,
    };
  };

  const nutrition = calculateNutrition(selectedPrediction, portion);

  return (
    <View style={styles.overlay}>
      <View style={[styles.modal, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Confirm Your Meal
          </Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            Select the food that best matches your meal:
          </Text>

          <View style={styles.predictionsList}>
            {predictions.map((prediction, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.predictionItem,
                  {
                    backgroundColor: selectedPrediction === prediction 
                      ? theme.colors.brand.primary + '20'
                      : theme.colors.background.secondary,
                    borderColor: selectedPrediction === prediction 
                      ? theme.colors.brand.primary
                      : theme.colors.border.primary,
                  }
                ]}
                onPress={() => setSelectedPrediction(prediction)}
              >
                <View style={styles.predictionContent}>
                  <Text style={[styles.predictionLabel, { color: theme.colors.text.primary }]}>
                    {prediction.label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Text style={[styles.predictionConfidence, { color: theme.colors.text.secondary }]}>
                    {Math.round(prediction.confidence * 100)}% confidence
                  </Text>
                </View>
                {selectedPrediction === prediction && (
                  <MaterialIcons name="check-circle" size={24} color={theme.colors.brand.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.portionSection}>
            <Text style={[styles.portionTitle, { color: theme.colors.text.primary }]}>
              Portion Size
            </Text>
            <PortionSelector
              value={portion}
              onChange={setPortion}
              min={0.1}
              max={5}
              step={0.1}
            />
          </View>

          <View style={[styles.nutritionCard, { backgroundColor: theme.colors.background.secondary }]}>
            <Text style={[styles.nutritionTitle, { color: theme.colors.text.primary }]}>
              Nutrition Breakdown
            </Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: theme.colors.text.primary }]}>
                  {nutrition.calories}
                </Text>
                <Text style={[styles.nutritionLabel, { color: theme.colors.text.secondary }]}>
                  Calories
                </Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: theme.colors.text.primary }]}>
                  {nutrition.protein_g}g
                </Text>
                <Text style={[styles.nutritionLabel, { color: theme.colors.text.secondary }]}>
                  Protein
                </Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: theme.colors.text.primary }]}>
                  {nutrition.carbs_g}g
                </Text>
                <Text style={[styles.nutritionLabel, { color: theme.colors.text.secondary }]}>
                  Carbs
                </Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: theme.colors.text.primary }]}>
                  {nutrition.fat_g}g
                </Text>
                <Text style={[styles.nutritionLabel, { color: theme.colors.text.secondary }]}>
                  Fat
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Add to Log"
            onPress={handleConfirm}
            variant="primary"
            size="large"
            style={styles.confirmButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  predictionsList: {
    marginBottom: 24,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  predictionContent: {
    flex: 1,
  },
  predictionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  predictionConfidence: {
    fontSize: 14,
  },
  portionSection: {
    marginBottom: 24,
  },
  portionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  nutritionCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  confirmButton: {
    width: '100%',
  },
});