"use client"

import { useState, useRef, useEffect } from "react"

interface HelpTooltipProps {
  text: string
  position?: "top" | "bottom" | "left" | "right"
  size?: "sm" | "md"
}

export default function HelpTooltip({ text, position = "top", size = "sm" }: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Adjust position if tooltip would overflow viewport
  useEffect(() => {
    if (isVisible && tooltipRef.current && buttonRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const buttonRect = buttonRef.current.getBoundingClientRect()

      // Check if tooltip overflows viewport
      if (position === "top" && tooltipRect.top < 0) {
        setActualPosition("bottom")
      } else if (position === "bottom" && tooltipRect.bottom > window.innerHeight) {
        setActualPosition("top")
      } else if (position === "left" && tooltipRect.left < 0) {
        setActualPosition("right")
      } else if (position === "right" && tooltipRect.right > window.innerWidth) {
        setActualPosition("left")
      } else {
        setActualPosition(position)
      }
    }
  }, [isVisible, position])

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  }

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700 border-l-transparent border-r-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700 border-l-transparent border-r-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700 border-t-transparent border-b-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700 border-t-transparent border-b-transparent border-l-transparent"
  }

  const sizeClasses = size === "sm" ? "w-4 h-4 text-[10px]" : "w-5 h-5 text-xs"

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className={`${sizeClasses} rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1`}
        aria-label="Ajuda"
      >
        ?
      </button>

      {isVisible && (
        <span
          ref={tooltipRef}
          role="tooltip"
          className={`absolute z-50 ${positionClasses[actualPosition]} pointer-events-none`}
        >
          <span className="block bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 min-w-[180px] max-w-sm shadow-lg whitespace-normal">
            {text}
          </span>
          <span
            className={`absolute w-0 h-0 border-4 ${arrowClasses[actualPosition]}`}
          />
        </span>
      )}
    </span>
  )
}

// Inline help text component for longer explanations
export function HelpText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
      <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{children}</span>
    </p>
  )
}

// Section header with help tooltip
export function SectionHeader({
  title,
  helpText,
  icon,
  action
}: {
  title: string
  helpText?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
        {icon && <span className="p-2 bg-primary/10 rounded-lg">{icon}</span>}
        {title}
        {helpText && <HelpTooltip text={helpText} />}
      </h3>
      {action}
    </div>
  )
}

// Card with optional help icon in header
export function HelpCard({
  title,
  helpText,
  children,
  className = ""
}: {
  title: string
  helpText?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-card rounded-xl shadow-sm p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        {helpText && <HelpTooltip text={helpText} />}
      </div>
      {children}
    </div>
  )
}
