import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from './Button';
import { MealItem, MealTime } from '@/types/nutrition';

interface ManualEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (meal: MealItem) => void;
  initialData?: Partial<MealItem>;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
}) => {
  const { theme } = useTheme();

  const [name, setName] = useState(initialData?.name || '');
  const [calories, setCalories] = useState(
    initialData?.calories?.toString() || ''
  );
  const [protein, setProtein] = useState(
    initialData?.protein?.toString() || ''
  );
  const [carbs, setCarbs] = useState(initialData?.carbs?.toString() || '');
  const [fat, setFat] = useState(initialData?.fat?.toString() || '');
  const [mealTime, setMealTime] = useState<MealTime>(
    initialData?.when || 'lunch'
  );

  const handleSave = () => {
    if (!name.trim() || !calories) {
      return;
    }

    const meal: MealItem = {
      id: `manual_${Date.now()}`,
      name: name.trim(),
      calories: parseInt(calories, 10) || 0,
      protein: parseInt(protein, 10) || 0,
      carbs: parseInt(carbs, 10) || 0,
      fat: parseInt(fat, 10) || 0,
      when: mealTime,
      timestamp: new Date().toISOString(),
      source: 'search', // Manual entries treated as search
      photoUri: initialData?.photoUri,
    };

    onSave(meal);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setMealTime('lunch');
  };

  const mealTimes: {
    value: MealTime;
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
  }[] = [
    { value: 'breakfast', label: 'Breakfast', icon: 'wb-sunny' },
    { value: 'lunch', label: 'Lunch', icon: 'wb-sunny' },
    { value: 'dinner', label: 'Dinner', icon: 'nights-stay' },
    { value: 'snack', label: 'Snack', icon: 'restaurant' },
  ];

  const isValid = name.trim() && calories;

  // Early return if theme is not loaded
  if (!theme) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 16, color: '#666666' }}>Loading...</Text>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme?.colors?.background?.primary || '#ffffff' },
        ]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close manual entry"
              >
                <Text
                  style={[
                    styles.closeText,
                    { color: theme?.colors?.brand?.primary || '#22c55e' },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme?.colors?.text?.primary || '#000000' },
                ]}
              >
                Manual Entry
              </Text>
              <View style={styles.closeButton} />
            </View>

            {/* Food Name */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: theme?.colors?.text?.primary || '#000000' },
                ]}
              >
                Food Name *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      theme?.colors?.background?.secondary || '#f5f5f5',
                    borderColor: theme?.colors?.border?.primary || '#e5e5e5',
                    color: theme?.colors?.text?.primary || '#000000',
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Grilled Chicken"
                placeholderTextColor={
                  theme?.colors?.text?.tertiary || '#999999'
                }
                autoFocus
              />
            </View>

            {/* Meal Time */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: theme?.colors?.text?.primary || '#000000' },
                ]}
              >
                Meal Time
              </Text>
              <View style={styles.mealTimeGrid}>
                {mealTimes.map(time => (
                  <TouchableOpacity
                    key={time.value}
                    style={[
                      styles.mealTimeButton,
                      {
                        backgroundColor:
                          mealTime === time.value
                            ? theme?.colors?.brand?.primary + '20' || '#f0f9ff'
                            : theme?.colors?.background?.secondary || '#f5f5f5',
                        borderColor:
                          mealTime === time.value
                            ? theme?.colors?.brand?.primary || '#22c55e'
                            : theme?.colors?.border?.primary || '#e5e5e5',
                        borderWidth: mealTime === time.value ? 2 : 1,
                      },
                    ]}
                    onPress={() => setMealTime(time.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: mealTime === time.value }}
                  >
                    <MaterialIcons
                      name={time.icon}
                      size={20}
                      color={
                        mealTime === time.value
                          ? theme?.colors?.brand?.primary || '#15803d'
                          : theme?.colors?.text?.secondary || '#6b7280'
                      }
                    />
                    <Text
                      style={[
                        styles.mealTimeLabel,
                        {
                          color:
                            mealTime === time.value
                              ? theme?.colors?.brand?.primary || '#15803d'
                              : theme?.colors?.text?.primary || '#000000',
                        },
                      ]}
                    >
                      {time.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Macros */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: theme?.colors?.text?.primary || '#000000' },
                ]}
              >
                Nutrition (per serving)
              </Text>

              <View style={styles.macroRow}>
                <View style={styles.macroInput}>
                  <Text
                    style={[
                      styles.macroLabel,
                      { color: theme?.colors?.text?.secondary || '#666666' },
                    ]}
                  >
                    Calories *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor:
                          theme?.colors?.background?.secondary || '#f5f5f5',
                        borderColor:
                          theme?.colors?.border?.primary || '#e5e5e5',
                        color: theme?.colors?.text?.primary || '#000000',
                      },
                    ]}
                    value={calories}
                    onChangeText={setCalories}
                    placeholder="0"
                    placeholderTextColor={
                      theme?.colors?.text?.tertiary || '#999999'
                    }
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.macroInput}>
                  <Text
                    style={[
                      styles.macroLabel,
                      { color: theme?.colors?.text?.secondary || '#666666' },
                    ]}
                  >
                    Protein (g)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor:
                          theme?.colors?.background?.secondary || '#f5f5f5',
                        borderColor:
                          theme?.colors?.border?.primary || '#e5e5e5',
                        color: theme?.colors?.text?.primary || '#000000',
                      },
                    ]}
                    value={protein}
                    onChangeText={setProtein}
                    placeholder="0"
                    placeholderTextColor={
                      theme?.colors?.text?.tertiary || '#999999'
                    }
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.macroRow}>
                <View style={styles.macroInput}>
                  <Text
                    style={[
                      styles.macroLabel,
                      { color: theme?.colors?.text?.secondary || '#666666' },
                    ]}
                  >
                    Carbs (g)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor:
                          theme?.colors?.background?.secondary || '#f5f5f5',
                        borderColor:
                          theme?.colors?.border?.primary || '#e5e5e5',
                        color: theme?.colors?.text?.primary || '#000000',
                      },
                    ]}
                    value={carbs}
                    onChangeText={setCarbs}
                    placeholder="0"
                    placeholderTextColor={
                      theme?.colors?.text?.tertiary || '#999999'
                    }
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.macroInput}>
                  <Text
                    style={[
                      styles.macroLabel,
                      { color: theme?.colors?.text?.secondary || '#666666' },
                    ]}
                  >
                    Fat (g)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor:
                          theme?.colors?.background?.secondary || '#f5f5f5',
                        borderColor:
                          theme?.colors?.border?.primary || '#e5e5e5',
                        color: theme?.colors?.text?.primary || '#000000',
                      },
                    ]}
                    value={fat}
                    onChangeText={setFat}
                    placeholder="0"
                    placeholderTextColor={
                      theme?.colors?.text?.tertiary || '#999999'
                    }
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>

            {/* Estimated Calorie Check */}
            {protein && carbs && fat && (
              <View
                style={[
                  styles.estimateBox,
                  {
                    backgroundColor:
                      theme?.colors?.brand?.primary + '10' || '#eff6ff',
                    borderColor:
                      theme?.colors?.brand?.primary + '30' || '#93c5fd',
                  },
                ]}
              >
                <View style={styles.estimateContent}>
                  <MaterialIcons
                    name="lightbulb"
                    size={16}
                    color={theme?.colors?.brand?.primary || '#1d4ed8'}
                  />
                  <Text
                    style={[
                      styles.estimateText,
                      { color: theme?.colors?.brand?.primary || '#1d4ed8' },
                    ]}
                  >
                    Estimated from macros:{' '}
                    {parseInt(protein || '0', 10) * 4 +
                      parseInt(carbs || '0', 10) * 4 +
                      parseInt(fat || '0', 10) * 9}{' '}
                    cal
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Save Button */}
          <View
            style={[
              styles.footer,
              {
                backgroundColor:
                  theme?.colors?.background?.primary || '#ffffff',
                borderTopColor: theme?.colors?.border?.primary || '#e5e5e5',
              },
            ]}
          >
            <Button
              title="Save Meal"
              onPress={handleSave}
              variant="primary"
              size="large"
              fullWidth
              disabled={!isValid}
              accessibilityLabel="Save manual entry"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  closeButton: {
    width: 60,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  mealTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealTimeButton: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  mealTimeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  mealTimeLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  macroInput: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  estimateBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  estimateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  estimateText: {
    fontSize: 13,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
});
