"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth";

interface Property {
  id: string;
  title: string;
  slug: string;
  basePricePerNight: number;
  airbnbCalendarUrl?: string;
  googleCalendarUrl?: string;
}

function EditPropertyContent({ id }: { id: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [airbnbCalendarUrl, setAirbnbCalendarUrl] = useState("");
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState("");

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/posts/${id}`);
        const result = await res.json();
        if (result.success && result.data) {
          setProperty(result.data);
          setTitle(result.data.title || "");
          setSlug(result.data.slug || "");
          setBasePrice(result.data.basePricePerNight ? String(result.data.basePricePerNight) : "");
          setAirbnbCalendarUrl(result.data.airbnbCalendarUrl || "");
          setGoogleCalendarUrl(result.data.googleCalendarUrl || "");
        } else {
          setStatusMessage({ type: "error", text: result.error || "Property not found." });
        }
      } catch (err: any) {
        console.error("Failed to load property details:", err);
        setStatusMessage({ type: "error", text: "Failed to load property details." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !basePrice) {
      setStatusMessage({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "PUT",
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
        throw new Error(resJson.error || "Failed to update property.");
      }

      setStatusMessage({ type: "success", text: "Property updated successfully!" });
      setTimeout(() => {
        router.push("/admin/properties");
      }, 1500);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this property? All associated packages will also be deleted.")) {
      return;
    }
    
    setIsSubmitting(true);
    setStatusMessage(null);
    
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user?.uid || "",
          "x-user-email": user?.email || ""
        }
      });
      
      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || "Failed to delete property.");
      }
      
      setStatusMessage({ type: "success", text: "Property deleted successfully!" });
      setTimeout(() => {
        router.push("/admin/properties");
      }, 1500);
    } catch (err: unknown) {
      const error = err as Error;
      setStatusMessage({ type: "error", text: error.message || "An error occurred." });
      setIsSubmitting(false);
    }
  };


  if (authLoading || isLoading) {
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
            <Link
              href="/login"
              className="w-full rounded-xl bg-teal-500 py-3 text-center text-xs font-bold text-white hover:bg-teal-600 transition-all shadow-md shadow-teal-500/10"
            >
              Sign In as Admin
            </Link>
            <Link
              href="/"
              className="w-full rounded-xl bg-white/5 border border-white/10 py-3 text-center text-xs font-bold text-zinc-300 hover:text-white transition-all"
            >
              Back to Home
            </Link>
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

      <div className="relative max-w-xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <Link href="/admin/properties" className="text-xs text-zinc-500 hover:text-white transition-colors mb-2 inline-block">
              ← Back to Properties
            </Link>
            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              Edit Property
            </h1>
            <p className="text-xs text-zinc-400 mt-1">Update property and external iCal feed credentials</p>
          </div>
          <span className="rounded-lg bg-teal-500/10 border border-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-400">
            ID: {id}
          </span>
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span>⚙</span> Update Details
          </h2>

          {statusMessage && (
            <div
              className={`mb-6 rounded-xl border p-3.5 text-center text-xs font-bold ${
                statusMessage.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {property ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Property Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Llandudno Cliffside Shack"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none placeholder:text-zinc-650"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. llandudno-cliffside-shack"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none placeholder:text-zinc-650"
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
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none placeholder:text-zinc-650"
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
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none placeholder:text-zinc-650 text-xs"
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
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none placeholder:text-zinc-650 text-xs"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-grow rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3 text-center text-xs font-bold text-white shadow-lg shadow-teal-500/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  {isSubmitting ? "Saving changes..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-3 text-center text-xs font-bold text-red-400 hover:bg-red-550 hover:text-white transition-all active:scale-95"
                >
                  Delete
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 text-zinc-550 text-xs font-semibold">
              Could not retrieve property metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-teal-500 border-white/10" />
      </div>
    }>
      <EditPropertyContent id={unwrappedParams.id} />
    </Suspense>
  );
}
