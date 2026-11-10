"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AccountSettingsCardProps {
  displayUsername: string;
  userEmail?: string;
  isAccountExpanded: boolean;
  setIsAccountExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  recoveryEmailState: string;
  setRecoveryEmailState: (email: string) => void;
  handleUpdateRecoveryEmail: (e: React.FormEvent) => void;
  emailMessage: string;
  emailError: string;
  updatingEmail: boolean;
  currentRecoveryEmail?: string;
  onViewGuide: () => void;
  onSignOutClick: () => void;
  onHaptic: (type: "light" | "medium" | "heavy" | "warning") => void;
}

export function AccountSettingsCard({
  displayUsername,
  userEmail,
  isAccountExpanded,
  setIsAccountExpanded,
  recoveryEmailState,
  setRecoveryEmailState,
  handleUpdateRecoveryEmail,
  emailMessage,
  emailError,
  updatingEmail,
  currentRecoveryEmail,
  onViewGuide,
  onSignOutClick,
  onHaptic,
}: AccountSettingsCardProps) {
  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-all duration-200">
      <div
        className="flex items-center justify-between py-3 px-3.5 cursor-pointer select-none"
        onClick={() => {
          onHaptic("light");
          setIsAccountExpanded((prev) => !prev);
        }}
      >
        <span className="font-bold text-zinc-100 text-sm tracking-tight truncate">
          {displayUsername ? `@${displayUsername}` : userEmail || "Account Options"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-zinc-400 transition-transform duration-200 flex-shrink-0",
            isAccountExpanded && "rotate-180"
          )}
        />
      </div>

      <AnimatePresence>
        {isAccountExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="border-t border-zinc-800/80"
          >
            <div className="p-3.5 space-y-4">
              {/* Recovery Email Form */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground text-sm">Recovery Email</h3>

                <form onSubmit={handleUpdateRecoveryEmail} className="space-y-3 pt-0.5">
                  {emailMessage && (
                    <p className="text-xs text-pull-light font-medium bg-pull-light/10 border border-pull-light/20 px-3 py-2 rounded-lg animate-in fade-in duration-300">
                      {emailMessage}
                    </p>
                  )}
                  {emailError && (
                    <p className="text-xs text-leg-light font-medium bg-leg-light/10 border border-leg-light/20 px-3 py-2 rounded-lg animate-in fade-in duration-300">
                      {emailError}
                    </p>
                  )}

                  <div className="flex flex-row items-center gap-2">
                    <Input
                      id="settings-recovery-email"
                      type="email"
                      value={recoveryEmailState}
                      onChange={(e) => setRecoveryEmailState(e.target.value)}
                      placeholder="e.g. you@example.com"
                      required
                      className="h-9 rounded-xl border-zinc-700/60 bg-zinc-950/70 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 flex-1 px-3"
                    />
                    <button
                      type="submit"
                      disabled={updatingEmail || recoveryEmailState === (currentRecoveryEmail || "")}
                      className="h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:pointer-events-none px-3.5 text-xs font-semibold text-zinc-200 transition-all active:scale-[0.98] border border-zinc-700/50 flex items-center justify-center cursor-pointer flex-shrink-0"
                    >
                      {updatingEmail ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="-mx-3.5 h-px bg-zinc-800/80" />

              {/* Account Actions */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground text-sm">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2.5 w-full pt-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-9 px-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-200 transition-all text-xs font-medium border border-zinc-700/50 active:scale-[0.98]"
                    onClick={() => {
                      onHaptic("light");
                      onViewGuide();
                    }}
                  >
                    View Guide
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-9 px-3 rounded-xl bg-zinc-800/60 hover:bg-red-950/40 text-red-400 hover:text-red-300 transition-all text-xs font-medium border border-zinc-700/50 hover:border-red-900/40 active:scale-[0.98]"
                    onClick={() => {
                      onHaptic("warning");
                      onSignOutClick();
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
