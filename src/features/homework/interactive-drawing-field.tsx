import { useCallback, useMemo, useState } from "react";
import {
  type GestureResponderEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, radii, spacing, typeScale } from "@/theme/tokens";

type DrawingPoint = [number, number];
type DrawingStroke = DrawingPoint[];

type InteractiveDrawingFieldProps = {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
};

function clampPoint(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}

function parseDrawing(value: string): DrawingStroke[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as { strokes?: unknown };

    if (!Array.isArray(parsed.strokes)) {
      return [];
    }

    return parsed.strokes
      .slice(0, 30)
      .map((stroke) => {
        if (!Array.isArray(stroke)) {
          return [];
        }

        return stroke
          .slice(0, 180)
          .flatMap((point) =>
            Array.isArray(point) &&
            typeof point[0] === "number" &&
            typeof point[1] === "number"
              ? [[clampPoint(point[0]), clampPoint(point[1])] as DrawingPoint]
              : [],
          );
      })
      .filter((stroke) => stroke.length > 0);
  } catch {
    return [];
  }
}

function serializeDrawing(strokes: DrawingStroke[]) {
  return JSON.stringify({ strokes, v: 1 });
}

function toPoint(
  event: GestureResponderEvent,
  size: { height: number; width: number },
): DrawingPoint | null {
  if (size.width <= 0 || size.height <= 0) {
    return null;
  }

  return [
    clampPoint((event.nativeEvent.locationX / size.width) * 100),
    clampPoint((event.nativeEvent.locationY / size.height) * 100),
  ];
}

function DrawingLines({
  size,
  strokes,
}: {
  size: { height: number; width: number };
  strokes: DrawingStroke[];
}) {
  return (
    <>
      {strokes.flatMap((stroke, strokeIndex) =>
        stroke.flatMap((point, pointIndex) => {
          if (pointIndex === 0 && stroke.length === 1) {
            return (
              <View
                key={`${strokeIndex}-dot`}
                style={[
                  styles.dot,
                  {
                    left: (point[0] / 100) * size.width - 2,
                    top: (point[1] / 100) * size.height - 2,
                  },
                ]}
              />
            );
          }

          if (pointIndex === 0) {
            return [];
          }

          const previous = stroke[pointIndex - 1];

          if (!previous) {
            return [];
          }

          const startX = (previous[0] / 100) * size.width;
          const startY = (previous[1] / 100) * size.height;
          const endX = (point[0] / 100) * size.width;
          const endY = (point[1] / 100) * size.height;
          const deltaX = endX - startX;
          const deltaY = endY - startY;
          const length = Math.sqrt(deltaX ** 2 + deltaY ** 2);

          return (
            <View
              key={`${strokeIndex}-${pointIndex}`}
              style={[
                styles.line,
                {
                  left: startX,
                  top: startY - 1.5,
                  transform: [
                    { rotate: `${Math.atan2(deltaY, deltaX)}rad` },
                  ],
                  width: length,
                },
              ]}
            />
          );
        }),
      )}
    </>
  );
}

export function InteractiveDrawingField({
  disabled,
  label,
  onChange,
  value,
}: InteractiveDrawingFieldProps) {
  const [activeStroke, setActiveStroke] = useState<DrawingStroke>([]);
  const [size, setSize] = useState({ height: 180, width: 1 });
  const storedStrokes = parseDrawing(value);
  const beginStroke = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) {
        return;
      }

      const point = toPoint(event, size);

      if (point) {
        setActiveStroke([point]);
      }
    },
    [disabled, size],
  );
  const continueStroke = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) {
        return;
      }

      const point = toPoint(event, size);

      if (!point) {
        return;
      }

      setActiveStroke((current) => {
        const previous = current.at(-1);

        if (
          current.length >= 180 ||
          (previous &&
            Math.abs(previous[0] - point[0]) < 0.8 &&
            Math.abs(previous[1] - point[1]) < 0.8)
        ) {
          return current;
        }

        return [...current, point];
      });
    },
    [disabled, size],
  );
  const finishStroke = useCallback(() => {
    if (disabled || activeStroke.length === 0) {
      return;
    }

    const next = [...storedStrokes, activeStroke].slice(-30);
    setActiveStroke([]);
    onChange(serializeDrawing(next));
  }, [activeStroke, disabled, onChange, storedStrokes]);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: beginStroke,
        onPanResponderMove: continueStroke,
        onPanResponderRelease: finishStroke,
        onPanResponderTerminate: finishStroke,
        onStartShouldSetPanResponder: () => !disabled,
      }),
    [beginStroke, continueStroke, disabled, finishStroke],
  );

  return (
    <View style={styles.field}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          accessibilityLabel={`Limpar ${label}`}
          accessibilityRole="button"
          disabled={disabled || storedStrokes.length === 0}
          onPress={() => onChange(serializeDrawing([]))}
        >
          <Text
            style={[
              styles.clear,
              disabled || storedStrokes.length === 0
                ? styles.clearDisabled
                : null,
            ]}
          >
            Limpar
          </Text>
        </Pressable>
      </View>
      <View
        accessibilityLabel={`${label}. Área para desenhar com o dedo.`}
        accessibilityRole="image"
        onLayout={(event) =>
          setSize({
            height: event.nativeEvent.layout.height,
            width: event.nativeEvent.layout.width,
          })
        }
        style={[styles.canvas, disabled ? styles.canvasDisabled : null]}
        {...panResponder.panHandlers}
      >
        <DrawingLines
          size={size}
          strokes={[...storedStrokes, activeStroke]}
        />
        {storedStrokes.length === 0 && activeStroke.length === 0 ? (
          <Text pointerEvents="none" style={styles.hint}>
            Desenhe aqui com o dedo
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: colors.text,
    flex: 1,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  clear: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "900",
    padding: spacing.xs,
  },
  clearDisabled: {
    color: colors.textMuted,
    opacity: 0.5,
  },
  canvas: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 180,
    overflow: "hidden",
    position: "relative",
  },
  canvasDisabled: {
    backgroundColor: colors.background,
  },
  line: {
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    height: 3,
    position: "absolute",
    transformOrigin: "left center",
  },
  dot: {
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    height: 4,
    position: "absolute",
    width: 4,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 14,
    left: 0,
    position: "absolute",
    right: 0,
    textAlign: "center",
    top: 78,
  },
});
