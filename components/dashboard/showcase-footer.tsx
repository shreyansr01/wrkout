"use client"

import { ArrowUpRight, Github } from "lucide-react"

interface ShowcaseFooterProps {
  className?: string
}

export function ShowcaseFooter({ className = "" }: ShowcaseFooterProps) {
  return (
    <footer className={`w-full mt-6 pt-4 pb-2 border-t border-zinc-800/60 flex flex-col items-center justify-center gap-1.5 text-xs select-none text-center ${className}`}>
      {/* Top line: Project Name · Description */}
      <div className="flex items-center justify-center gap-1.5 min-w-0">
        <span className="font-semibold text-zinc-300 tracking-tight">wrkout</span>
        <span className="text-zinc-600 font-bold">·</span>
        <span className="text-zinc-500 font-normal">Progressive Overload Tracker</span>
      </div>

      {/* Bottom line: Shreyan Sardar ↗ / GitHub */}
      <div className="flex items-center justify-center gap-2.5 font-medium flex-shrink-0">
        <a
          href="https://shreyandev.vercel.app"
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-100 transition-colors"
          aria-label="Visit Shreyan Sardar's portfolio (opens in new tab)"
        >
          <span>Shreyan Sardar</span>
          <ArrowUpRight className="h-[13px] w-[13px] stroke-[1.8] relative top-[0.5px] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[1px] group-hover:-translate-y-[1px]" />
        </a>

        <span className="text-zinc-700">/</span>

        <a
          href="https://github.com/shreyansr01/wrkout"
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors"
          aria-label="View wrkout repository on GitHub (opens in new tab)"
        >
          <Github className="h-[13px] w-[13px] stroke-[1.8] relative top-[0.5px] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[1px] group-hover:-translate-y-[1px]" />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  )
}
