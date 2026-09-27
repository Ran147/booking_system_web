import type { CSSProperties } from "react"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"

// Adapted from shadcn/ui: the theme comes from our ThemeProvider through the
// `theme` prop instead of next-themes (theming-standards §4).
const Toaster = ({ theme = "system", ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster, toast, type ToasterProps }
