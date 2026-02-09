import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useFrameCallback,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

// --- Color hex → RGB ---

interface RGB {
  r: number;
  g: number;
  b: number;
}

const hexToRgb: Record<string, RGB> = {
  '#6DBF63': { r: 109, g: 191, b: 99 },
  '#7ABFCF': { r: 122, g: 191, b: 207 },
  '#85C97D': { r: 133, g: 201, b: 125 },
};

// --- Blob configs matching iOS exactly ---

type Region = 'top' | 'bottom';

interface BlobConfig {
  region: Region;
  speed: number;
  widthRatio: number;
  heightRatio: number;
  opacity: number;
  phaseOffset: number;
  xOffset: number;
  colors: [string, string, string];
}

const BLOBS: BlobConfig[] = [
  // Top cluster
  {
    region: 'top', speed: 0.58, widthRatio: 0.8, heightRatio: 0.3, opacity: 0.55,
    phaseOffset: 0.0, xOffset: -0.3,
    colors: ['#6DBF63', '#7ABFCF', '#85C97D'],
  },
  {
    region: 'top', speed: 0.30, widthRatio: 0.75, heightRatio: 0.22, opacity: 0.45,
    phaseOffset: 2.4, xOffset: 0.2,
    colors: ['#7ABFCF', '#85C97D', '#6DBF63'],
  },
  {
    region: 'top', speed: 0.20, widthRatio: 0.45, heightRatio: 0.16, opacity: 0.35,
    phaseOffset: 4.8, xOffset: -0.05,
    colors: ['#85C97D', '#6DBF63', '#7ABFCF'],
  },
  // Bottom cluster
  {
    region: 'bottom', speed: 0.18, widthRatio: 0.8, heightRatio: 0.14, opacity: 0.50,
    phaseOffset: 1.5, xOffset: 0.15,
    colors: ['#6DBF63', '#7ABFCF', '#85C97D'],
  },
  {
    region: 'bottom', speed: 0.30, widthRatio: 0.55, heightRatio: 0.22, opacity: 0.40,
    phaseOffset: 3.9, xOffset: -0.2,
    colors: ['#7ABFCF', '#85C97D', '#6DBF63'],
  },
  {
    region: 'bottom', speed: 0.20, widthRatio: 0.35, heightRatio: 0.16, opacity: 0.30,
    phaseOffset: 5.7, xOffset: 0.08,
    colors: ['#85C97D', '#6DBF63', '#7ABFCF'],
  },
];

const TRANSITION_DURATION = 1500;
const TRANSITION_EASING = Easing.bezier(0.65, 0, 0.35, 1);

// --- Single animated blob ---

function AnimatedBlob({
  config,
  time,
  progress,
  screenWidth,
  screenHeight,
}: {
  config: BlobConfig;
  time: Animated.SharedValue<number>;
  progress: Animated.SharedValue<number>;
  screenWidth: number;
  screenHeight: number;
}) {
  const blobW = screenWidth * config.widthRatio;
  const blobH = screenHeight * config.heightRatio;
  const borderRadius = Math.min(blobW, blobH) / 2;

  const c0 = hexToRgb[config.colors[0]];
  const c1 = hexToRgb[config.colors[1]];
  const c2 = hexToRgb[config.colors[2]];

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    if (p < 0.001) {
      return { opacity: 0 };
    }

    const t = time.value * config.speed + config.phaseOffset;

    // Breathing: ±8% scale, ~4s cycle
    const breathing = 1.0 + 0.08 * Math.sin(time.value * 0.25 + config.phaseOffset);

    // Drift
    const driftX = Math.cos(t * 0.9) * screenWidth * 0.06;
    const driftY = Math.sin(t * 0.6) * screenHeight * 0.02 * p;

    // Vertical position: slide from edge to rest
    const halfH = screenHeight * config.heightRatio * 0.5 * breathing * p;
    let edgeY: number;
    let restY: number;
    if (config.region === 'top') {
      edgeY = -halfH;
      restY = screenHeight * 0.04;
    } else {
      edgeY = screenHeight + halfH;
      restY = screenHeight * 0.96;
    }
    const centerY = edgeY + (restY - edgeY) * p;

    const translateX = screenWidth * (0.5 + config.xOffset) - blobW / 2 + driftX;
    const translateY = centerY - blobH / 2 + driftY;

    // Color cycling: sine-based blend through 3 colors, freq 0.35
    const cyclePhase = (Math.sin(t * 0.35) + 1.0) / 2.0 * 3;
    const idx = Math.floor(cyclePhase) % 3;
    const frac = cyclePhase - Math.floor(cyclePhase);

    let fromR: number, fromG: number, fromB: number;
    let toR: number, toG: number, toB: number;

    if (idx === 0) {
      fromR = c0.r; fromG = c0.g; fromB = c0.b;
      toR = c1.r; toG = c1.g; toB = c1.b;
    } else if (idx === 1) {
      fromR = c1.r; fromG = c1.g; fromB = c1.b;
      toR = c2.r; toG = c2.g; toB = c2.b;
    } else {
      fromR = c2.r; fromG = c2.g; fromB = c2.b;
      toR = c0.r; toG = c0.g; toB = c0.b;
    }

    const r = Math.round(fromR + (toR - fromR) * frac);
    const g = Math.round(fromG + (toG - fromG) * frac);
    const b = Math.round(fromB + (toB - fromB) * frac);

    return {
      opacity: config.opacity * p,
      backgroundColor: `rgb(${r},${g},${b})`,
      transform: [
        { translateX },
        { translateY },
        { scaleX: breathing },
        { scaleY: breathing * p },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: blobW,
          height: blobH,
          borderRadius,
        },
        animatedStyle,
      ]}
    />
  );
}

// --- ProcessingBlob container ---

interface ProcessingBlobProps {
  isActive: boolean;
}

export default function ProcessingBlob({ isActive }: ProcessingBlobProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const time = useSharedValue(0);
  const progress = useSharedValue(isActive ? 1 : 0);

  // ~30fps time accumulator
  useFrameCallback((info) => {
    if (info.timeSincePreviousFrame !== null) {
      time.value += info.timeSincePreviousFrame / 1000;
    }
  });

  // Animate progress on isActive change
  React.useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, {
      duration: TRANSITION_DURATION,
      easing: TRANSITION_EASING,
    });
  }, [isActive, progress]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={StyleSheet.absoluteFill}>
        {BLOBS.map((config, i) => (
          <AnimatedBlob
            key={i}
            config={config}
            time={time}
            progress={progress}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
          />
        ))}
      </View>
      <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
    </View>
  );
}
