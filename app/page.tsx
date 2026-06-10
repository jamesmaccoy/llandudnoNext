"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthProvider, useAuth, AuthCard } from "@/components/auth";
import Link from "next/link";
import CalendarPicker from "@/components/CalendarPicker";

interface Property {
  id: string;
  title: string;
  slug: string;
  basePricePerNight: number;
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const paymentStatus = searchParams.get("payment");
  const packageType = searchParams.get("type");
  const amountPaid = searchParams.get("amount");

  const { user, loading: authLoading } = useAuth();

  // Portal States
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingProps, setIsLoadingProps] = useState(true);

  // Date Selection (Step 1 - Saved to profile)
  const [fromDate, setFromDate] = useState("2026-06-16");
  const [toDate, setToDate] = useState("2026-06-19");
  const [isSavingDates, setIsSavingDates] = useState(false);
  const [savedDates, setSavedDates] = useState<{ fromDate: string; toDate: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  // Load properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch("/api/posts");
        const result = await res.json();
        if (result.success && result.data) {
          setProperties(result.data);
        }
      } catch (err) {
        console.error("Failed to load properties:", err);
      } finally {
        setIsLoadingProps(false);
      }
    };
    fetchProperties();
  }, []);

  // Fetch bookings to display in CalendarPicker
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/bookings");
        const result = await res.json();
        if (result.success && result.data) {
          setBookings(result.data);
        }
      } catch (err) {
        console.error("Failed to load bookings for calendar picker:", err);
      }
    };
    fetchBookings();
  }, []);

  // Fetch saved dates if user is logged in
  useEffect(() => {
    if (authLoading || !user) {
      setSavedDates(null);
      return;
    }

    const fetchSavedDates = async () => {
      try {
        const res = await fetch(`/api/user/dates?userId=${user.uid}`);
        const result = await res.json();
        if (result.success && result.data) {
          setSavedDates(result.data);
          // Set inputs to match saved profile dates
          setFromDate(result.data.fromDate.split("T")[0]);
          setToDate(result.data.toDate.split("T")[0]);
        }
      } catch (err) {
        console.error("Failed to fetch saved user dates:", err);
      }
    };
    fetchSavedDates();
  }, [user, authLoading]);

  const handleSaveDates = async () => {
    if (!user) {
      alert("Please sign in or register to save your stay dates.");
      return;
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      alert("Please select valid check-in and check-out dates.");
      return;
    }

    setIsSavingDates(true);
    setSaveStatus(null);

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
        throw new Error(result.error || "Failed to save date profile.");
      }

      setSavedDates(result.data);
      setSaveStatus("✅ Date selection saved successfully to your guest profile!");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      setSaveStatus(`❌ Error: ${err.message}`);
    } finally {
      setIsSavingDates(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-[40%] -left-[20%] w-[85%] h-[85%] rounded-full bg-emerald-500/5 blur-[130px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[75%] rounded-full bg-teal-500/5 blur-[130px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Intro Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-teal-400 mb-4">
            <span>✨ Guest Booking Flow</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            Llandudno Stays
          </h1>
          <p className="mt-4 text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Begin by choosing your stay dates and authenticating. Your selections will be saved dynamically to configure package checkouts.
          </p>
        </header>

        {/* Payment confirmation banners */}
        {paymentStatus && (
          <div className="w-full max-w-3xl mx-auto mb-8 animate-fade-in">
            {paymentStatus === "success" && (
              <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-2xl">
                  ✓
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Payment Received Successfully!</h3>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    Stay booking secured for <strong className="text-emerald-400">R {amountPaid}</strong>. The package reservation for <strong>"{packageType}"</strong> has been processed successfully.
                  </p>
                </div>
              </div>
            )}
            {paymentStatus === "cancel" && (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-lg">
                  🗙
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Booking Checkout Cancelled</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    You cancelled the checkout session. Your booking for <strong>"{packageType}"</strong> has been discarded. You can retry booking below.
                  </p>
                </div>
              </div>
            )}
            {paymentStatus === "failed" && (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center text-lg">
                  ⚠
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Payment Checkout Failed</h3>
                  <p className="text-xs text-red-400 mt-1 leading-relaxed">
                    The payment gateway reported a failed transaction for package <strong>"{packageType}"</strong>. Please try again.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Dates Selector */}
        <div className="w-full max-w-xl mx-auto mb-12 border-b border-white/5 pb-12">
          {/* Date Picker Selector */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-teal-400">📅</span> Step 1: Set Stay Dates
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Define check-in and check-out ranges. Dates must be persistent to user profiles before package selection is enabled.
            </p>

            <CalendarPicker
              selectedFromDate={fromDate}
              selectedToDate={toDate}
              bookings={bookings}
              onChange={(start, end) => {
                setFromDate(start);
                setToDate(end);
              }}
            />

            {saveStatus && (
              <div className="text-center text-[10px] font-bold text-zinc-300 bg-white/5 py-2.5 rounded-xl border border-white/5 animate-pulse">
                {saveStatus}
              </div>
            )}

            <button
              onClick={handleSaveDates}
              disabled={isSavingDates || authLoading}
              className={`w-full rounded-xl py-3 text-center text-xs font-bold text-white transition-all ${
                !user
                  ? "bg-neutral-800 text-white/35 cursor-not-allowed border border-neutral-700"
                  : "bg-gradient-to-r from-teal-500 to-emerald-500 shadow-md shadow-teal-500/10 hover:brightness-110 active:scale-95"
              }`}
            >
              {!user 
                ? "🔒 Authenticate first to lock dates" 
                : isSavingDates 
                ? "Saving Date Profile..." 
                : "Confirm & Save Dates"}
            </button>
          </div>
        </div>

        {/* Step 2: Property Listings Selection */}
        <div className="space-y-6">
          <h2 className="text-lg font-black text-center text-white flex items-center justify-center gap-2">
            <span>🏡</span> Select Destination Property
          </h2>
          <p className="text-xs text-zinc-400 text-center max-w-md mx-auto leading-relaxed">
            After configuring check-in dates, select a property to view options and book your package.
          </p>

          {isLoadingProps ? (
            <div className="flex flex-col items-center py-12 justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-teal-500 border-white/10" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-10 rounded-3xl border border-white/5 bg-white/5 text-zinc-500 text-xs">
              No destination properties available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map((p) => {
                const datesLocked = !!savedDates;
                return (
                  <div
                    key={p.id}
                    className="group rounded-3xl border border-white/5 bg-white/5 p-6 hover:border-white/10 hover:bg-white/10 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="inline-block rounded-md bg-teal-500/10 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-teal-400">
                        Stay Listing
                      </span>
                      <h3 className="text-lg font-extrabold text-white mt-2 group-hover:text-teal-400 transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-[10px] font-mono text-zinc-500 mt-0.5">slug: {p.slug}</p>
                      
                      {datesLocked && (
                        <div className="mt-4 rounded-xl bg-teal-500/5 border border-teal-500/10 p-3 text-[11px] text-teal-300">
                          📅 Selected: <strong className="text-white">{new Date(savedDates.fromDate).toLocaleDateString()}</strong> to <strong className="text-white">{new Date(savedDates.toDate).toLocaleDateString()}</strong>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase">Nightly Cost</span>
                        <span className="text-base font-black text-teal-400">R {p.basePricePerNight.toLocaleString()}</span>
                      </div>

                      <Link
                        href={`/posts/${p.slug}`}
                        className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2.5 text-xs font-bold text-white hover:brightness-110 active:scale-95 transition-all shadow-md shadow-teal-500/10"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-teal-500 border-white/10" />
      </div>
    }>
      <AuthProvider>
        <HomePageContent />
      </AuthProvider>
    </Suspense>
  );
}
