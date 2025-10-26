import React, { useRef, useEffect, useState } from 'react';
import { View, Dimensions, ActivityIndicator, StyleSheet } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

const { width, height } = Dimensions.get('window');

export interface VideoHeroProps {
  source: any; // Video source (require('./path/to/video.mp4') or { uri: '...' })
  onLoad?: () => void;
  onError?: (error: string) => void;
  resizeMode?: ResizeMode;
  shouldPlay?: boolean;
  isMuted?: boolean;
  isLooping?: boolean;
  style?: any;
}

export const VideoHero: React.FC<VideoHeroProps> = ({
  source,
  onLoad,
  onError,
  resizeMode = ResizeMode.COVER,
  shouldPlay = true,
  isMuted = true,
  isLooping = true,
  style,
}) => {
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (shouldPlay && videoRef.current) {
      videoRef.current.playAsync();
    }
  }, [shouldPlay]);

  const handleLoad = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false);
      onLoad?.();
    }
  };

  const handleError = (error: any) => {
    console.error('Video error:', error);
    setHasError(true);
    setIsLoading(false);
    onError?.(error.message || 'Video playback error');
  };

  if (hasError) {
    return (
      <View style={[styles.errorContainer, style]}>
        <View style={styles.errorBackground} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Video
        ref={videoRef}
        style={styles.video}
        source={source}
        resizeMode={resizeMode}
        shouldPlay={shouldPlay}
        isMuted={isMuted}
        isLooping={isLooping}
        onLoad={handleLoad}
        onError={handleError}
        onPlaybackStatusUpdate={handleLoad}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  errorBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
  },
});
