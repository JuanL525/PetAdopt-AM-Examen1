import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface LottieAnimationProps {
  source: any;
  size?: number;
  loop?: boolean;
  style?: ViewStyle;
  autoPlay?: boolean;
}

export function LottieAnimation({
  source,
  size = 200,
  loop = true,
  style,
  autoPlay = true,
}: LottieAnimationProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <LottieView
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
      />
    </View>
  );
}
