"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth";

interface Property {
  id: string;
  title: string;
  slug: string;
  basePricePerNight: number;
  airbnbCalendarUrl?: string;
  googleCalendarUrl?: string;
}

export default function AdminPropertiesPage() {
  const { user, loading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [airbnbCalendarUrl, setAirbnbCalendarUrl] = useState("");
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState("");

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/posts");
      const result = await res.json();
      if (result.success && result.data) {
        setProperties(result.data);
      }
    } catch (err: any) {
      console.error("Failed to load properties:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-")
        .trim()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !basePrice) {
      setStatusMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user?.uid || "",
          "x-user-email": user?.email || ""
        },
        body: JSON.stringify({
          title,
          slug,
          basePricePerNight: Number(basePrice),
          airbnbCalendarUrl,
          googleCalendarUrl
        })
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.data || "Failed to create property.");
      }

      setStatusMessage({ type: "success", text: "Property created successfully!" });
      setTitle("");
      setSlug("");
      setBasePrice("");
      setAirbnbCalendarUrl("");
      setGoogleCalendarUrl("");
      fetchProperties(); // reload list
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-teal-500 border-white/10" />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
          <span className="text-4xl">🔐</span>
          <h2 className="text-xl font-black text-white mt-4">Access Denied</h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Administrative privileges are required to access this portal. Please sign in with an administrator account to continue.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <a
              href="/login"
              className="w-full rounded-xl bg-teal-500 py-3 text-center text-xs font-bold text-white hover:bg-teal-600 transition-all shadow-md shadow-teal-500/10"
            >
              Sign In as Admin
            </a>
            <a
              href="/"
              className="w-full rounded-xl bg-white/5 border border-white/10 py-3 text-center text-xs font-bold text-zinc-300 hover:text-white transition-all"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-teal-500/30 selection:text-teal-200">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              Admin Portal
            </h1>
            <p className="text-xs text-zinc-400 mt-1">Properties / Listings Management</p>
          </div>
          <span className="rounded-lg bg-teal-500/10 border border-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-400">
            🔐 Admin Access
          </span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Create Property Form */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>✙</span> Create New Property
            </h2>

            {statusMessage && (
              <div
                className={`mb-4 rounded-xl border p-3.5 text-center text-xs font-bold ${
                  statusMessage.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Property Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Llandudno Cliffside Shack"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Slug (Auto-generated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. llandudno-cliffside-shack"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white/60 focus:border-teal-500 focus:outline-none placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Base Price Per Night (ZAR)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Airbnb iCal URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://www.airbnb.co.za/calendar/ical/..."
                  value={airbnbCalendarUrl}
                  onChange={(e) => setAirbnbCalendarUrl(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none placeholder:text-zinc-600 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Google Calendar iCal URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://calendar.google.com/calendar/ical/..."
                  value={googleCalendarUrl}
                  onChange={(e) => setGoogleCalendarUrl(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none placeholder:text-zinc-600 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3 text-center text-xs font-bold text-white shadow-lg shadow-teal-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                {isSubmitting ? "Creating property..." : "Publish Property"}
              </button>
            </form>
          </div>

          {/* Properties List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center justify-between">
              <span>📋 Published Properties</span>
              <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400">
                Count: {properties.length}
              </span>
            </h2>

            {isLoading ? (
              <div className="flex flex-col items-center py-10 justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-teal-500 border-white/10" />
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-10 rounded-3xl border border-white/5 bg-white/5 text-zinc-500 text-xs">
                No properties published yet. Create one on the left.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {properties.map((p) => (
                  <div
                    key={p.id}
                    className="group rounded-2xl border border-white/5 bg-white/5 p-4 flex flex-col gap-2 hover:border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">{p.title}</h3>
                        <span className="text-[10px] text-zinc-550 block font-mono">id: {p.id} | slug: {p.slug}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-550">Price/Night</span>
                        <p className="text-sm font-black text-teal-400">R {p.basePricePerNight.toLocaleString()}</p>
                      </div>
                    </div>
                    {(p.airbnbCalendarUrl || p.googleCalendarUrl) && (
                      <div className="border-t border-white/5 pt-2 mt-1 space-y-1 text-[9px] text-zinc-450 font-mono">
                        {p.airbnbCalendarUrl && (
                          <div className="truncate" title={p.airbnbCalendarUrl}>
                            <span className="text-teal-400 font-bold">Airbnb:</span> {p.airbnbCalendarUrl}
                          </div>
                        )}
                        {p.googleCalendarUrl && (
                          <div className="truncate" title={p.googleCalendarUrl}>
                            <span className="text-emerald-400 font-bold">Google:</span> {p.googleCalendarUrl}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Edit Config</span>
                      <Link
                        href={`/admin/properties/${p.id}`}
                        className="rounded-lg bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 text-[10px] font-bold text-teal-400 hover:bg-teal-500 hover:text-white transition-all active:scale-95"
                      >
                        Edit Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
