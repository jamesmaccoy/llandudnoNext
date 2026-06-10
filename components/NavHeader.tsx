"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth";

export default function NavHeader() {
  const { user, loading, logOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-black text-white hover:text-teal-400 transition-colors">
          <span className="text-xl tracking-wider">LLANDUDNO</span>
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">
            Portal
          </Link>
          <Link href="/admin/properties" className="hover:text-white transition-colors">
            Properties
          </Link>
          <Link href="/admin/packages" className="hover:text-white transition-colors">
            Packages
          </Link>

          {/* Auth State Button */}
          <div className="border-l border-white/10 pl-6 flex items-center gap-4">
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border border-t-teal-500 border-white/10" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right text-[10px] lowercase text-zinc-500 leading-none">
                  <span className="text-white font-bold">{user.displayName || user.email?.split("@")[0]}</span>
                  <span className="mt-0.5">{user.email}</span>
                </div>
                <button
                  onClick={logOut}
                  className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] font-bold text-zinc-300 hover:text-white transition-all active:scale-95"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-teal-500 px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-teal-600 transition-all active:scale-95"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
