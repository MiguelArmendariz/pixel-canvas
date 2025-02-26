import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  CSSProperties,
} from "react";

interface PixelCanvasProps {
  /** An array of colors. Accepts both hex color strings (e.g., "#ff0000") or Tailwind class names (e.g., "bg-blue-500"). */
  colors?: string[];
  /** The gap (in pixels) between each pixel. */
  gap?: number;
  /** A number between 0 and 100 controlling the speed. */
  speed?: number;
  /** If true, focus events won’t trigger animations. */
  noFocus?: boolean;
  /** If true, the effect is always showing (animation runs continuously). */
  active?: boolean;
  /** Optional inline styles for the container. */
  style?: CSSProperties;
  /** Additional className(s) for the container (e.g., Tailwind classes). */
  className?: string;
}

class Pixel {
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  color: string;
  speed: number;
  size: number;
  sizeStep: number;
  minSize: number;
  maxSizeInteger: number;
  maxSize: number;
  delay: number;
  counter: number;
  counterStep: number;
  isIdle: boolean;
  isReverse: boolean;
  isShimmer: boolean;

  constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    speed: number,
    delay: number
  ) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = context;
    this.x = x;
    this.y = y;
    this.color = color;
    // Randomize the pixel’s speed slightly.
    this.speed = this.getRandomValue(0.1, 0.9) * speed;
    this.size = 0;
    this.sizeStep = Math.random() * 0.4;
    this.minSize = 0.5;
    this.maxSizeInteger = 2;
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
    this.delay = delay;
    this.counter = 0;
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
    this.isIdle = false;
    this.isReverse = false;
    this.isShimmer = false;
  }

  getRandomValue(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  draw(): void {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(
      this.x + centerOffset,
      this.y + centerOffset,
      this.size,
      this.size
    );
  }

  appear(): void {
    this.isIdle = false;
    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }
    if (this.size >= this.maxSize) {
      this.isShimmer = true;
    }
    if (this.isShimmer) {
      this.shimmer();
    } else {
      this.size += this.sizeStep;
    }
    this.draw();
  }

  disappear(): void {
    this.isShimmer = false;
    this.counter = 0;
    if (this.size <= 0) {
      this.isIdle = true;
      return;
    } else {
      this.size -= 0.1;
    }
    this.draw();
  }

  shimmer(): void {
    if (this.size >= this.maxSize) {
      this.isReverse = true;
    } else if (this.size <= this.minSize) {
      this.isReverse = false;
    }
    if (this.isReverse) {
      this.size -= this.speed;
    } else {
      this.size += this.speed;
    }
  }
}

const PixelCanvas: React.FC<PixelCanvasProps> = ({
  colors = ["#f8fafc", "#f1f5f9", "#cbd5e1"],
  gap = 5,
  speed = 35,
  noFocus = false,
  active = false,
  style,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(null);
  const timeIntervalRef = useRef<number>(1000 / 60);
  const timePreviousRef = useRef<number>(performance.now());
  const pixelsRef = useRef<Pixel[]>([]);
  const resizeObserverRef = useRef<ResizeObserver>(null);

  // State to hold the computed/resolved colors.
  const [resolvedColors, setResolvedColors] = useState<string[]>([]);

  // Ensure gap is within allowed range (4 to 50).
  const validatedGap = Math.min(Math.max(gap, 4), 50);

  // Respect "prefers-reduced-motion."
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    .matches;
  const throttle = 0.001;
  const validatedSpeed =
    speed <= 0 || reducedMotion
      ? 0
      : speed >= 100
      ? 100 * throttle
      : speed * throttle;

  // Convert a color string to a valid CSS color or get computed color from Tailwind classes.
  const resolveColor = (color: string): string => {
    if (
      color.startsWith("#") ||
      color.startsWith("rgb") ||
      color.startsWith("hsl")
    ) {
      return color;
    }
    const tempEl = document.createElement("div");
    tempEl.className = color;
    tempEl.style.display = "none";
    document.body.appendChild(tempEl);
    const computed = getComputedStyle(tempEl).backgroundColor;
    document.body.removeChild(tempEl);
    return computed;
  };

  // Resolve any Tailwind-based colors into actual CSS color strings.
  useEffect(() => {
    const computed = colors.map((c) => resolveColor(c));
    setResolvedColors(computed);
  }, [colors]);

  // Distance from (x, y) to the canvas center.
  const getDistanceToCanvasCenter = (x: number, y: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const dx = x - canvas.width / 2;
    const dy = y - canvas.height / 2;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Create a new array of Pixel instances based on the canvas dimensions.
  const createPixels = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixelArray: Pixel[] = [];
    const colorArray = resolvedColors.length > 0 ? resolvedColors : colors;
    for (let x = 0; x < canvas.width; x += validatedGap) {
      for (let y = 0; y < canvas.height; y += validatedGap) {
        const color = colorArray[Math.floor(Math.random() * colorArray.length)];
        const delay = reducedMotion ? 0 : getDistanceToCanvasCenter(x, y);
        pixelArray.push(
          new Pixel(canvas, ctx, x, y, color, validatedSpeed, delay)
        );
      }
    }
    pixelsRef.current = pixelArray;
  }, [
    colors,
    resolvedColors,
    validatedGap,
    validatedSpeed,
    reducedMotion,
    getDistanceToCanvasCenter,
  ]);

  // Initialize the canvas size and pixel grid.
  const init = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    createPixels();
  }, [createPixels]);

  // The animation loop – calls either 'appear' or 'disappear' on each pixel.
  const animate = useCallback(
    (fnName: "appear" | "disappear") => {
      animationFrameRef.current = requestAnimationFrame(() =>
        animate(fnName)
      );

      const now = performance.now();
      const timePassed = now - timePreviousRef.current;
      if (timePassed < timeIntervalRef.current) return;
      timePreviousRef.current = now - (timePassed % timeIntervalRef.current);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pixelsRef.current.forEach((pixel) => {
        fnName === "appear" ? pixel.appear() : pixel.disappear();
      });

      // Only stop if not active and all pixels are idle.
      if (!active && pixelsRef.current.every((p) => p.isIdle)) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      }
    },
    [active]
  );

  // Trigger the animation loop with a given mode.
  const handleAnimation = useCallback(
    (mode: "appear" | "disappear") => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animate(mode);
    },
    [animate]
  );

  // Set up the canvas and resize observer on mount.
  useEffect(() => {
    init();
    if (containerRef.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        init();
      });
      resizeObserverRef.current.observe(containerRef.current);
    }

    // Start animation if active is true on mount
    if (active) {
      handleAnimation('appear');
    }

    return () => {
      if (resizeObserverRef.current && containerRef.current) {
        resizeObserverRef.current.unobserve(containerRef.current);
        resizeObserverRef.current.disconnect();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [init, active, handleAnimation]);

  // Whenever "active" becomes true, we want the same fresh appearance as a hover.
  // So we re-init the pixels and trigger the "appear" animation.
  useEffect(() => {
    if (active) {
      init(); // Re-create the pixel grid so we start from scratch.
      handleAnimation("appear");
    }
  }, [active, init, handleAnimation]);

  // Default container styling (can be overridden by the "style" prop).
  const containerStyle: CSSProperties = {
    display: "grid",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    ...style,
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className={className}
      onMouseEnter={() => {
        if (!active) handleAnimation("appear");
      }}
      onMouseLeave={() => {
        if (!active) handleAnimation("disappear");
      }}
      onFocus={() => {
        if (!noFocus && !active) handleAnimation("appear");
      }}
      onBlur={() => {
        if (!noFocus && !active) handleAnimation("disappear");
      }}
      tabIndex={0} // Make the container focusable.
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
};

export default PixelCanvas;
