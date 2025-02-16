# React Pixel Canvas Component

This is a React component that behaves similar to original Pixel Canvas Component,
main difference is that this supports TailwindCSS, is written in Typescript and has
an `active` prop.

## Properties
- **`colors?: string[]`**  
  An array of colors. Accepts both hex color strings (e.g., `#ff0000`) or Tailwind class names (e.g., `bg-blue-500`).

- **`gap?: number`**  
  The gap (in pixels) between each pixel.

- **`speed?: number`**  
  A number between 0 and 100 controlling the speed.

- **`noFocus?: boolean`**  
  If true, focus events won’t trigger animations.

- **`active?: boolean`**  
  If true, the effect is always showing (animation runs continuously).

- **`style?: CSSProperties`**  
  Optional inline styles for the container.

- **`className?: string`**  
  Additional className(s) for the container (e.g., Tailwind classes).


## How To Use

- Copy the code and create your own component.
- Wrap the code in another component, or element you want it to use.
- Define Props and Colors.


## Example

```tsx
import PixelCanvas from "your-path/pixel-canvas";

<button type="button" variant={"outline"} className="cursor-pointer relative transition ease-in-out duration-300 hover:bg-transparent hover:border-yellow-500 hover:text-yellow-700">
                                    <PixelCanvas
                                        className="absolute"
                                        colors={["bg-yellow-500", "bg-yellow-300", "bg-yellow-100"]}
                                        gap={3}
                                        speed={20} noFocus />
                                    <p className="z-10">
                                        Get Started
                                    </p>
                                </button>
```
**Note** that button has `relative` class so that the canvas can be positioned absolutely and display correctly.

**Active** prop can be used to control the animation. I.E you want the effect to display without a hover.