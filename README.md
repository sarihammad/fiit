# FIIT - AI-Powered Nutrition Tracking

FIIT is a production-ready React Native app that uses AI to help users track their nutrition through photo recognition, personalized meal planning, and daily feedback.

## 🚀 Features

### Core Functionality

- **Photo Food Recognition**: Take photos of food and get instant nutrition analysis
- **AI Meal Planning**: Personalized meal plans based on your goals and preferences
- **Daily Feedback**: AI-powered coaching with actionable tips
- **Progress Tracking**: Monitor your nutrition journey with detailed analytics
- **Offline Support**: Queue failed logs and sync when connectivity returns

### Authentication & Security

- **Google & Apple Sign-In**: Secure authentication with social providers
- **Guest Mode**: Try the app without creating an account
- **Secure Storage**: All tokens stored in expo-secure-store
- **API Key Authentication**: Secure backend communication

### Subscription & Monetization

- **RevenueCat Integration**: Seamless subscription management
- **Tiered Features**: Free, Pro, and Premium tiers
- **Rescue Offers**: Win-back campaigns for churned users
- **Trial Management**: Free trials with automatic conversion

### Production Features

- **Error Tracking**: Sentry integration for crash reporting
- **Analytics**: Comprehensive user behavior tracking
- **Push Notifications**: Daily reminders and engagement
- **Deep Linking**: Seamless navigation from notifications
- **Offline Queue**: Retry failed operations when online

## 🛠 Tech Stack

### Frontend

- **React Native** with Expo SDK 52
- **TypeScript** with strict mode enabled
- **Zustand** for state management
- **React Navigation** for routing
- **Expo Vector Icons** for UI
- **Tailwind CSS** for styling

### Backend

- **FastAPI** with Python 3.11
- **HuggingFace Transformers** for food recognition
- **USDA FoodData Central** for nutrition data
- **Redis** for caching
- **Prometheus** for metrics
- **Docker** for containerization

### Infrastructure

- **Google Cloud Run** for backend hosting
- **RevenueCat** for subscription management
- **Sentry** for error tracking
- **GitHub Actions** for CI/CD

## 📱 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/fiit.git
   cd fiit
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

### Environment Variables

Create a `.env` file with the following variables:

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://your-api-url.com
EXPO_PUBLIC_FIIT_API_KEY=your-api-key

# RevenueCat
EXPO_PUBLIC_RC_IOS_API_KEY=your-ios-key
EXPO_PUBLIC_RC_ANDROID_API_KEY=your-android-key

# Analytics
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
EXPO_PUBLIC_POSTHOG_KEY=your-posthog-key

# External APIs
EXPO_PUBLIC_NUTRITIONIX_APP_ID=your-nutritionix-id
EXPO_PUBLIC_NUTRITIONIX_API_KEY=your-nutritionix-key
EXPO_PUBLIC_CALORIEMAMA_API_KEY=your-caloriemama-key

# Environment
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_APP_VERSION=1.0.0
```

## 🏗 Project Structure

```
fiit/
├── src/
│   ├── app/                 # Navigation setup
│   ├── components/          # Reusable UI components
│   ├── providers/           # Context providers
│   ├── screens/             # Screen components
│   ├── services/            # API and business logic
│   ├── state/               # Zustand stores
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── theme/               # Theme configuration
├── backend/
│   └── fiit-food101/        # FastAPI backend
├── .github/
│   └── workflows/           # CI/CD pipelines
└── docs/                    # Documentation
```

## 🧪 Testing

### Frontend Tests

```bash
# Run unit tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

### Backend Tests

```bash
cd backend/fiit-food101
python -m pytest tests/ -v --cov=.
```

## 🚀 Deployment

### Mobile App

1. **Build for preview**

   ```bash
   eas build --platform all --profile preview
   ```

2. **Build for production**

   ```bash
   eas build --platform all --profile production
   ```

3. **Submit to app stores**
   ```bash
   eas submit --platform all
   ```

### Backend

1. **Build Docker image**

   ```bash
   cd backend/fiit-food101
   docker build -t fiit-food101 .
   ```

2. **Deploy to Google Cloud Run**
   ```bash
   ./deploy_production.sh
   ```

## 📊 Monitoring

### Error Tracking

- **Sentry Dashboard**: Monitor crashes and errors
- **Release Tracking**: Track errors by app version
- **Performance Monitoring**: Monitor app performance

### Analytics

- **User Funnel**: Track user journey from install to purchase
- **Feature Usage**: Monitor feature adoption
- **Retention**: Track user retention metrics

### Backend Monitoring

- **Health Checks**: `/health` and `/ready` endpoints
- **Metrics**: Prometheus metrics at `/metrics`
- **Logs**: Structured logging with correlation IDs

## 🔒 Security

### Frontend Security

- **Secure Storage**: All sensitive data in expo-secure-store
- **API Key Protection**: Environment variables only
- **Input Validation**: Zod schemas for all API calls
- **Error Sanitization**: No sensitive data in error messages

### Backend Security

- **API Key Authentication**: Secure API access
- **Rate Limiting**: Prevent abuse and DoS attacks
- **Input Validation**: Pydantic models for all inputs
- **CORS Configuration**: Restricted origins
- **Non-root Container**: Security-hardened Docker image

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write tests for new features
- Use conventional commits
- Update documentation
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/fiit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/fiit/discussions)

## 🎯 Roadmap

### v1.1

- [ ] Social features (sharing meals, challenges)
- [ ] Barcode scanning
- [ ] Recipe suggestions
- [ ] Integration with fitness trackers

### v1.2

- [ ] Meal prep planning
- [ ] Grocery list optimization
- [ ] Restaurant menu integration
- [ ] Advanced analytics dashboard

### v2.0

- [ ] AI nutritionist chat
- [ ] Personalized supplement recommendations
- [ ] Health condition tracking
- [ ] Integration with healthcare providers

---

Built with ❤️ by the FIIT team
