"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { useAuth, AuthProvider } from "@/components/auth";
import CalendarPicker from "@/components/CalendarPicker";
import { formatDisplayDate } from "@/lib/utils";

interface Property {
  id: string;
  title: string;
  slug: string;
  basePricePerNight: number;
}

interface PackageData {
  id: string;
  propertyId: string;
  name: string;
  price: number;
  description: string;
  multiplier: number;
  baseRate: number;
  yocoId: string;
  category: string;
  isEnabled: boolean;
}

interface PropertyDetailsContentProps {
  slug: string;
}

function PropertyDetailsContent({ slug }: PropertyDetailsContentProps) {
  const { user, loading: authLoading } = useAuth();

  // Page States
  const [property, setProperty] = useState<Property | null>(null);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [savedDates, setSavedDates] = useState<{ fromDate: string; toDate: string } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDates, setIsSavingDates] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  // Date Picker Inputs
  const [fromDate, setFromDate] = useState("2026-06-16");
  const [toDate, setToDate] = useState("2026-06-19");
  const [bookings, setBookings] = useState<any[]>([]);

  const loadPropertyData = async () => {
    try {
      // 1. Fetch Property by slug
      const propRes = await fetch("/api/posts");
      const propResult = await propRes.json();
      if (propResult.success && propResult.data) {
        const found = propResult.data.find((p: Property) => p.slug === slug);
        if (found) {
          setProperty(found);
          // 2. Fetch Packages for this property
          const pkgRes = await fetch(`/api/packages?propertyId=${found.id}`);
          const pkgResult = await pkgRes.json();
          if (pkgResult.success && pkgResult.data) {
            setPackages(pkgResult.data);
          }
          
          // 3. Fetch Bookings for this property
          const bksRes = await fetch(`/api/bookings?propertyId=${found.id}`);
          const bksResult = await bksRes.json();
          if (bksResult.success && bksResult.data) {
            setBookings(bksResult.data);
          }
        }
      }
    } catch (err) {
      console.error("Failed to query property data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPropertyData();
  }, [slug]);

  // Load user profile dates
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchUserDates = async () => {
      try {
        const res = await fetch(`/api/user/dates?userId=${user.uid}`);
        const result = await res.json();
        if (result.success && result.data) {
          setSavedDates(result.data);
          setFromDate(result.data.fromDate.split("T")[0]);
          setToDate(result.data.toDate.split("T")[0]);
        }
      } catch (err) {
        console.error("Failed to load user dates:", err);
      }
    };
    
    fetchUserDates();
  }, [user, authLoading]);

  const handleSaveDates = async () => {
    if (!user) {
      alert("Please sign in to save your dates.");
      return;
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      setDateError("Invalid date selection.");
      return;
    }

    setDateError(null);
    setIsSavingDates(true);

    try {
      const response = await fetch("/api/user/dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          fromDate: start.toISOString(),
          toDate: end.toISOString()
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save dates.");
      }

      setSavedDates(result.data);
      alert("✅ Dates locked successfully to your profile!");
    } catch (err: any) {
      setDateError(err.message);
    } finally {
      setIsSavingDates(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-teal-500 border-white/10" />
        <span className="mt-3 text-xs text-zinc-500">Retrieving Listing Information...</span>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl border border-white/10 bg-white/5 text-center">
        <span className="text-3xl">⚠️</span>
        <h3 className="text-lg font-bold text-white mt-4">Listing Not Found</h3>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          The property slug matching <strong>"{slug}"</strong> does not exist in our database.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block w-full rounded-xl bg-teal-500 py-3 text-center text-xs font-bold text-white hover:bg-teal-600 transition-all"
        >
          Return to Listings
        </Link>
      </div>
    );
  }

  // Calculate stay parameters
  const datesLocked = !!savedDates;
  let nights = 0;
  let baseStayCost = 0;

  if (datesLocked && savedDates) {
    const start = new Date(savedDates.fromDate);
    const end = new Date(savedDates.toDate);
    nights = Math.max(1, Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    baseStayCost = property.basePricePerNight * nights;
  }

  return (
    <div className="relative max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] left-[20%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[120px]" />
      </div>

      <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors mb-6 inline-block">
        ← Back to Listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left Side: Property Specs */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
            <div>
              <span className="inline-block rounded bg-teal-500/10 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-teal-400">
                Premium Stay
              </span>
              <h1 className="text-3xl font-black text-white mt-2">{property.title}</h1>
              <span className="text-[10px] text-zinc-500 font-mono block mt-1">Slug: {property.slug} | Database ID: {property.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase">Nightly base price</span>
                <p className="text-lg font-black text-teal-400">R {property.basePricePerNight.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase">Location</span>
                <p className="text-sm font-semibold text-white mt-1">🏖 Llandudno, Cape Town</p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <span className="text-[10px] text-zinc-500 uppercase block">About this property</span>
              <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                Experience Llandudno at its finest. This property features unparalleled coastline scenery, proximity to the beach, luxury amenities, and private decks. Connect package options and addons at checkout.
              </p>
            </div>
          </div>

          {/* Package deals list */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-white">Available Packages for this Listing</h3>
            
            {packages.length === 0 ? (
              <p className="text-xs text-zinc-500">No specific packages config created for this property yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="rounded-2xl bg-black/40 p-4 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="inline-block rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[8px] font-bold text-zinc-400 uppercase tracking-wide">
                        {pkg.category} Category
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1">{pkg.name}</h4>
                      {pkg.description && <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{pkg.description}</p>}
                    </div>
                    <div className="text-right pl-4">
                      <span className="text-[9px] text-zinc-500 block uppercase">Price</span>
                      <p className="text-sm font-extrabold text-teal-400">R {pkg.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Stay Scheduler Block */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-white/15 pb-2">📅 Stay Dates Planner</h3>

            {!user ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Sign in or register to lock check-in dates and access package booking options.
                </p>
                <Link
                  href="/login"
                  className="inline-block w-full rounded-xl bg-teal-500 py-3 text-center text-xs font-bold text-white hover:bg-teal-600 transition-all shadow-md shadow-teal-500/10"
                >
                  Sign In to Book
                </Link>
              </div>
            ) : datesLocked ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-teal-500/5 border border-teal-500/15 p-4 space-y-2">
                  <div className="flex justify-between text-xs text-zinc-300">
                    <span>Selected Range:</span>
                    <span className="font-bold text-white">
                      {formatDisplayDate(savedDates!.fromDate)} - {formatDisplayDate(savedDates!.toDate)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-300">
                    <span>Stay Duration:</span>
                    <span className="font-bold text-white">{nights} night(s)</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-300">
                    <span>Estimated Base Cost:</span>
                    <span className="font-bold text-teal-400">R {baseStayCost.toLocaleString()}</span>
                  </div>
                </div>

                <Link
                  href={`/bookings?propertyId=${property.id}`}
                  className="block w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3 text-center text-xs font-bold text-white hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-teal-500/10"
                >
                  Proceed to Package Selection & Pay →
                </Link>

                <button
                  onClick={() => setSavedDates(null)}
                  className="w-full text-center text-[10px] text-zinc-500 hover:text-zinc-300 font-bold"
                >
                  Change Stay Dates
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400">Select stay ranges to persist to your guest profile.</p>

                {dateError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-center text-xs text-red-400 font-bold">
                    ⚠️ {dateError}
                  </div>
                )}

                <CalendarPicker
                  selectedFromDate={fromDate}
                  selectedToDate={toDate}
                  bookings={bookings}
                  onChange={(start, end) => {
                    setFromDate(start);
                    setToDate(end);
                  }}
                />

                <button
                  onClick={handleSaveDates}
                  disabled={isSavingDates}
                  className="w-full rounded-xl bg-teal-500 py-3 text-center text-xs font-bold text-white hover:bg-teal-600 transition-all active:scale-95 shadow-md shadow-teal-500/10"
                >
                  {isSavingDates ? "Saving date selection..." : "Confirm & Save Dates"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PropertyDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-teal-500 border-white/10" />
      </div>
    }>
      <AuthProvider>
        <PropertyDetailsContent slug={unwrappedParams.slug} />
      </AuthProvider>
    </Suspense>
  );
}
