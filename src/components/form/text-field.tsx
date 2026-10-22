import { SymbolView } from 'expo-symbols';
import { useEffect, useState, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextFieldProps = Omit<TextInputProps, 'placeholder'> & {
  /** Shown inside the field when empty; floats to the top on focus or once filled. */
  label: string;
  /** Validation message shown under the field; also turns the border red. */
  error?: string;
  /** Adds a show/hide toggle and masks the text (for passwords). */
  secureToggle?: boolean;
  ref?: Ref<TextInput>;
};

const FIELD_HEIGHT = 56;
const LABEL_SIZE = 17;
const FLOATED_LABEL_SIZE = 12;
const LABEL_LINE_HEIGHT = 22;
// Resting label is vertically centered; floated label sits near the top edge.
const LABEL_REST_TOP = (FIELD_HEIGHT - LABEL_LINE_HEIGHT) / 2;
const LABEL_FLOAT_SHIFT = -12;

/**
 * Labeled text input with an Instagram-style floating label. Pass iOS/Android autofill hints
 * (`textContentType`, `autoComplete`) so the keychain can fill emails, passwords and codes.
 */
export function TextField({
  label,
  error,
  secureToggle,
  secureTextEntry,
  style,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const [isHidden, setIsHidden] = useState(true);

  const isFloated = isFocused || Boolean(rest.value);
  const float = useSharedValue(isFloated ? 1 : 0);

  useEffect(() => {
    float.value = withTiming(isFloated ? 1 : 0, { duration: reduceMotion ? 0 : 150 });
  }, [float, isFloated, reduceMotion]);

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [0, LABEL_FLOAT_SHIFT]) },
      { scale: interpolate(float.value, [0, 1], [1, FLOATED_LABEL_SIZE / LABEL_SIZE]) },
    ],
  }));

  const borderColor = error ? theme.danger : isFocused ? theme.primary : theme.border;
  const labelColor = error ? theme.danger : isFocused ? theme.primary : theme.textSecondary;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputRow,
          { backgroundColor: theme.backgroundElement, borderColor },
          (isFocused || error) && styles.inputRowEmphasis,
        ]}>
        <Animated.Text
          // The TextInput carries the accessible label; this is visual only.
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          pointerEvents="none"
          numberOfLines={1}
          style={[styles.label, { color: labelColor }, labelStyle]}>
          {label}
        </Animated.Text>
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error}
          selectionColor={theme.primary}
          secureTextEntry={secureToggle ? isHidden : secureTextEntry}
          style={[styles.input, { color: theme.text }, style]}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          {...rest}
        />
        {secureToggle && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isHidden ? 'Show password' : 'Hide password'}
            hitSlop={Spacing.two}
            onPress={() => setIsHidden((hidden) => !hidden)}
            style={styles.toggle}>
            <SymbolView
              name={{ ios: isHidden ? 'eye' : 'eye.slash', android: isHidden ? 'visibility' : 'visibility_off' }}
              size={20}
              tintColor={theme.textSecondary}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <ThemedText type="small" style={{ color: theme.danger }} accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
    alignSelf: 'stretch',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: FIELD_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  inputRowEmphasis: {
    borderWidth: 2,
    // Keep the text from shifting when the border thickens.
    paddingHorizontal: Spacing.three - 1,
  },
  label: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    top: LABEL_REST_TOP - 1,
    fontSize: LABEL_SIZE,
    lineHeight: LABEL_LINE_HEIGHT,
    fontWeight: 500,
    transformOrigin: 'left center',
  },
  input: {
    flex: 1,
    fontSize: LABEL_SIZE,
    // Leave room above the text for the floated label.
    paddingTop: Spacing.four,
    paddingBottom: Spacing.half,
  },
  toggle: {
    justifyContent: 'center',
    paddingLeft: Spacing.two,
  },
});
