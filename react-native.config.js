module.exports = {
  dependencies: {
    // Disable New Architecture for all modules
    // This helps avoid TurboModuleRegistry errors
    '*': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
