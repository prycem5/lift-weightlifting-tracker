export type Theme = "dark" | "light";

export interface ThemeTokens {
  navBg: string;
  navBorder: string;
  iconIdle: string;
  iconHover: string;
  iconActiveBg: string;
  barBg: string;
  barText: string;
  barSubtext: string;
  barBorder: string;
  collapseHeaderBg: string;
}

export const THEME_TOKENS: Record<Theme, ThemeTokens> = {
  dark: {
    navBg: "bg-zinc-950/95",
    navBorder: "border-zinc-800",
    iconIdle: "text-zinc-500",
    iconHover: "hover:text-zinc-400",
    iconActiveBg: "bg-zinc-100 text-zinc-950",
    barBg: "bg-zinc-900",
    barText: "text-zinc-100",
    barSubtext: "text-zinc-500",
    barBorder: "border-zinc-800",
    collapseHeaderBg: "bg-zinc-800/80 hover:bg-zinc-800",
  },
  light: {
    navBg: "bg-zinc-950/95",
    navBorder: "border-zinc-800",
    iconIdle: "text-zinc-500",
    iconHover: "hover:text-zinc-400",
    iconActiveBg: "bg-zinc-100 text-zinc-950",
    barBg: "bg-zinc-900",
    barText: "text-zinc-100",
    barSubtext: "text-zinc-500",
    barBorder: "border-zinc-800",
    collapseHeaderBg: "bg-zinc-950/80 hover:bg-zinc-950",
  },
};