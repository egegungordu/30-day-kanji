
export interface Theme {
  name: string;
  displayName: string;
  theme: "dark" | "light";
}
export const themes = [
  {
    name: "polar",
    displayName: "Polar",
    theme: "dark",
  },
  {
    name: "midnight-tokyo",
    displayName: "Midnight Tokyo",
    theme: "dark",
  },
  {
    name: "vs-dark",
    displayName: "Visual Studio Dark",
    theme: "dark",
  },
  {
    name: "vs-light",
    displayName: "Visual Studio Light",
    theme: "light",
  },
] as const satisfies Theme[];
