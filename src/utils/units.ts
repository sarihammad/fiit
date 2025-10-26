// Unit conversion utilities for FIIT

export type UnitSystem = 'metric' | 'imperial';

export class UnitConverter {
  // Weight conversions
  static kgToLbs(kg: number): number {
    return kg * 2.20462;
  }

  static lbsToKg(lbs: number): number {
    return lbs / 2.20462;
  }

  // Height conversions
  static cmToInches(cm: number): number {
    return cm / 2.54;
  }

  static inchesToCm(inches: number): number {
    return inches * 2.54;
  }

  static cmToFeetInches(cm: number): { feet: number; inches: number } {
    const totalInches = this.cmToInches(cm);
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  }

  static feetInchesToCm(feet: number, inches: number): number {
    return this.inchesToCm(feet * 12 + inches);
  }

  // Format weight for display
  static formatWeight(kg: number, system: UnitSystem): string {
    if (system === 'imperial') {
      return `${this.kgToLbs(kg).toFixed(1)} lbs`;
    }
    return `${kg.toFixed(1)} kg`;
  }

  // Format height for display
  static formatHeight(cm: number, system: UnitSystem): string {
    if (system === 'imperial') {
      const { feet, inches } = this.cmToFeetInches(cm);
      return `${feet}'${inches}"`;
    }
    return `${Math.round(cm)} cm`;
  }

  // Parse weight input
  static parseWeight(input: string, system: UnitSystem): number | null {
    const num = parseFloat(input);
    if (isNaN(num) || num <= 0) return null;

    if (system === 'imperial') {
      return this.lbsToKg(num);
    }
    return num;
  }

  // Parse height input
  static parseHeight(input: string, system: UnitSystem): number | null {
    if (system === 'imperial') {
      // Expected format: "5'10" or "5 10" or "70" (inches)
      const feetInches = input.match(/(\d+)['']?\s*(\d+)?/);
      if (feetInches) {
        const feet = parseInt(feetInches[1] || '0');
        const inches = feetInches[2] ? parseInt(feetInches[2]) : 0;
        return this.feetInchesToCm(feet, inches);
      }
      // Just inches
      const totalInches = parseFloat(input);
      if (!isNaN(totalInches) && totalInches > 0) {
        return this.inchesToCm(totalInches);
      }
      return null;
    }

    const cm = parseFloat(input);
    if (isNaN(cm) || cm <= 0) return null;
    return cm;
  }
}
