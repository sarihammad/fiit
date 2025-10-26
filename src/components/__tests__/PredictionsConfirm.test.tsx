import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PredictionsConfirm } from '../PredictionsConfirm';
import { TopKPrediction, FoodRecognitionResult } from '@/types/nutrition';

// Mock the theme provider
jest.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        text: {
          primary: '#000000',
          secondary: '#666666',
          tertiary: '#999999',
        },
        background: {
          secondary: '#f5f5f5',
        },
        border: {
          primary: '#e5e5e5',
        },
      },
    },
  }),
}));

describe('PredictionsConfirm', () => {
  const mockOnSelect = jest.fn();
  const mockOnFallback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPredictions: TopKPrediction[] = [
    { label: 'pizza', prob: 0.85 },
    { label: 'burger', prob: 0.1 },
    { label: 'sandwich', prob: 0.05 },
  ];

  const mockResult: FoodRecognitionResult = {
    topk: mockPredictions,
    decision: 'confirm' as const,
    nutrition: {
      fdcId: 123,
      description: 'Pizza',
      kcal: 300,
      protein: 12,
      carbs: 35,
      fat: 10,
    },
  };

  it('should render predictions correctly', () => {
    const { getByText } = render(
      <PredictionsConfirm
        result={mockResult}
        onSelect={mockOnSelect}
        onFallback={mockOnFallback}
      />
    );

    expect(getByText('Is this your meal?')).toBeTruthy();
    expect(getByText('pizza')).toBeTruthy();
    expect(getByText('85%')).toBeTruthy();
    expect(getByText('burger')).toBeTruthy();
    expect(getByText('10%')).toBeTruthy();
    expect(getByText('sandwich')).toBeTruthy();
    expect(getByText('5%')).toBeTruthy();
  });

  it('should call onSelect when a prediction is tapped', () => {
    const { getByText } = render(
      <PredictionsConfirm
        result={mockResult}
        onSelect={mockOnSelect}
        onFallback={mockOnFallback}
      />
    );

    fireEvent.press(getByText('pizza'));
    expect(mockOnSelect).toHaveBeenCalledWith('pizza');
  });

  it('should call onFallback when fallback button is tapped', () => {
    const { getByText } = render(
      <PredictionsConfirm
        result={mockResult}
        onSelect={mockOnSelect}
        onFallback={mockOnFallback}
      />
    );

    fireEvent.press(getByText('None of these — search manually'));
    expect(mockOnFallback).toHaveBeenCalled();
  });

  it('should handle empty predictions array', () => {
    const emptyResult: FoodRecognitionResult = {
      topk: [],
      decision: 'fallback' as const,
      nutrition: null,
    };
    const { getByText } = render(
      <PredictionsConfirm
        result={emptyResult}
        onSelect={mockOnSelect}
        onFallback={mockOnFallback}
      />
    );

    expect(getByText('No predictions available')).toBeTruthy();
    expect(getByText('Search manually instead')).toBeTruthy();
  });

  it('should handle null predictions', () => {
    const nullResult: FoodRecognitionResult = {
      topk: [],
      decision: 'fallback' as const,
      nutrition: null,
    };
    const { getByText } = render(
      <PredictionsConfirm
        result={nullResult}
        onSelect={mockOnSelect}
        onFallback={mockOnFallback}
      />
    );

    expect(getByText('No predictions available')).toBeTruthy();
  });

  it('should limit to top 3 predictions', () => {
    const manyPredictions: TopKPrediction[] = [
      { label: 'food1', prob: 0.4 },
      { label: 'food2', prob: 0.3 },
      { label: 'food3', prob: 0.2 },
      { label: 'food4', prob: 0.1 },
    ];

    const manyResult: FoodRecognitionResult = {
      topk: manyPredictions,
      decision: 'confirm' as const,
      nutrition: {
        fdcId: 123,
        description: 'Food1',
        kcal: 200,
        protein: 10,
        carbs: 20,
        fat: 5,
      },
    };

    const { getByText, queryByText } = render(
      <PredictionsConfirm
        result={manyResult}
        onSelect={mockOnSelect}
        onFallback={mockOnFallback}
      />
    );

    expect(getByText('food1')).toBeTruthy();
    expect(getByText('food2')).toBeTruthy();
    expect(getByText('food3')).toBeTruthy();
    expect(queryByText('food4')).toBeFalsy(); // Should not be rendered
  });

  it('should render without fallback handler', () => {
    const { queryByText } = render(
      <PredictionsConfirm result={mockResult} onSelect={mockOnSelect} />
    );

    expect(queryByText('None of these — search manually')).toBeFalsy();
  });

  it('should format confidence percentages correctly', () => {
    const predictionsWithDecimals: TopKPrediction[] = [
      { label: 'food1', prob: 0.8567 },
      { label: 'food2', prob: 0.1234 },
    ];

    const decimalsResult: FoodRecognitionResult = {
      topk: predictionsWithDecimals,
      decision: 'confirm' as const,
      nutrition: {
        fdcId: 123,
        description: 'Food1',
        kcal: 200,
        protein: 10,
        carbs: 20,
        fat: 5,
      },
    };

    const { getByText } = render(
      <PredictionsConfirm
        result={decimalsResult}
        onSelect={mockOnSelect}
        onFallback={mockOnFallback}
      />
    );

    expect(getByText('86%')).toBeTruthy(); // Should round to nearest integer
    expect(getByText('12%')).toBeTruthy();
  });
});
