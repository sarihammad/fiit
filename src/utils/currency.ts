export interface CurrencyFormat {
  symbol: string;
  position: 'before' | 'after';
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}

export const CURRENCY_FORMATS: Record<string, CurrencyFormat> = {
  USD: {
    symbol: '$',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  EUR: {
    symbol: '€',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  GBP: {
    symbol: '£',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  JPY: {
    symbol: '¥',
    position: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
};

export class CurrencyUtils {
  // Format price with currency symbol
  static formatPrice(
    amount: number,
    currency: string = 'USD',
    includeSymbol: boolean = true
  ): string {
    const format = (CURRENCY_FORMATS[
      currency as keyof typeof CURRENCY_FORMATS
    ] ?? CURRENCY_FORMATS.USD) as CurrencyFormat;

    // Format the number
    const formattedNumber = this.formatNumber(amount, format);

    if (!includeSymbol) {
      return formattedNumber;
    }

    // Add currency symbol
    if (format.position === 'before') {
      return `${format.symbol}${formattedNumber}`;
    } else {
      return `${formattedNumber}${format.symbol}`;
    }
  }

  // Format number with separators
  static formatNumber(amount: number, format: CurrencyFormat): string {
    const absAmount = Math.abs(amount);
    const integerPart = Math.floor(absAmount);
    const decimalPart = absAmount - integerPart;

    // Format integer part with thousands separator
    const integerString = integerPart.toString();
    const formattedInteger = this.addThousandsSeparator(
      integerString,
      format.thousandsSeparator
    );

    // Format decimal part
    if (format.decimalPlaces === 0) {
      return formattedInteger;
    }

    const decimalString = decimalPart.toFixed(format.decimalPlaces);
    const decimalDigits = decimalString.substring(2); // Remove "0."

    return `${formattedInteger}${format.decimalSeparator}${decimalDigits}`;
  }

  // Add thousands separator
  private static addThousandsSeparator(
    number: string,
    separator: string
  ): string {
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  }

  // Parse price string back to number
  static parsePrice(priceString: string, currency: string = 'USD'): number {
    const format = (CURRENCY_FORMATS[
      currency as keyof typeof CURRENCY_FORMATS
    ] ?? CURRENCY_FORMATS.USD) as CurrencyFormat;

    // Remove currency symbol and whitespace
    let cleanString = priceString.replace(/[^\d.,]/g, '');

    // Replace thousands separator with empty string
    cleanString = cleanString.replace(
      new RegExp(`\\${format.thousandsSeparator}`, 'g'),
      ''
    );

    // Replace decimal separator with dot for parsing
    cleanString = cleanString.replace(
      new RegExp(`\\${format.decimalSeparator}`, 'g'),
      '.'
    );

    const parsed = parseFloat(cleanString);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Get currency symbol
  static getCurrencySymbol(currency: string = 'USD'): string {
    const format = (CURRENCY_FORMATS[
      currency as keyof typeof CURRENCY_FORMATS
    ] ?? CURRENCY_FORMATS.USD) as CurrencyFormat;
    return format.symbol;
  }

  // Format price range
  static formatPriceRange(
    minAmount: number,
    maxAmount: number,
    currency: string = 'USD'
  ): string {
    const minFormatted = this.formatPrice(minAmount, currency);
    const maxFormatted = this.formatPrice(maxAmount, currency);

    return `${minFormatted} - ${maxFormatted}`;
  }

  // Format monthly price from annual
  static formatMonthlyPrice(
    annualAmount: number,
    currency: string = 'USD'
  ): string {
    const monthlyAmount = annualAmount / 12;
    return this.formatPrice(monthlyAmount, currency);
  }

  // Get savings percentage
  static getSavingsPercentage(
    originalPrice: number,
    discountedPrice: number
  ): number {
    if (originalPrice <= 0) return 0;
    const savings = originalPrice - discountedPrice;
    return Math.round((savings / originalPrice) * 100);
  }

  // Format savings text
  static formatSavings(
    originalPrice: number,
    discountedPrice: number,
    currency: string = 'USD'
  ): string {
    const savings = originalPrice - discountedPrice;
    const percentage = this.getSavingsPercentage(
      originalPrice,
      discountedPrice
    );
    const savingsFormatted = this.formatPrice(savings, currency);

    return `Save ${savingsFormatted} (${percentage}% off)`;
  }
}
