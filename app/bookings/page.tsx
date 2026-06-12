"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, AuthProvider } from "@/components/auth";
import Link from "next/link";
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

interface Booking {
  id: string;
  propertyId: string;
  packageId: string | null;
  customerName: string;
  customerEmail: string;
  fromDate: string;
  toDate: string;
  total: number;
  paymentStatus: string;
}

function BookingsCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("propertyId") || "";

  const { user, loading: authLoading } = useAuth();

  // Page States
  const [property, setProperty] = useState<Property | null>(null);
  const [savedDates, setSavedDates] = useState<{ fromDate: string; toDate: string } | null>(null);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [checkoutLog, setCheckoutLog] = useState<string[]>([]);
  const [dateConflict, setDateConflict] = useState<string | null>(null);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);

  // Load property, user dates, and packages
  useEffect(() => {
    if (!propertyId) {
      setIsLoading(false);
      return;
    }

    const loadPageData = async () => {
      try {
        // 1. Fetch Property details
        const propRes = await fetch("/api/posts");
        const propResult = await propRes.json();
        if (propResult.success && propResult.data) {
          const found = propResult.data.find((p: Property) => p.id === propertyId);
          if (found) setProperty(found);
        }

        // 2. Fetch Packages for this property
        const pkgRes = await fetch(`/api/packages?propertyId=${propertyId}`);
        const pkgResult = await pkgRes.json();
        if (pkgResult.success && pkgResult.data) {
          setPackages(pkgResult.data);
          if (pkgResult.data.length > 0) {
            setSelectedPackageId(pkgResult.data[0].id);
          }
        }

        // 3. Fetch Bookings for history list
        const bksRes = await fetch(`/api/bookings?propertyId=${propertyId}`);
        const bksResult = await bksRes.json();
        if (bksResult.success && bksResult.data) {
          setBookingsList(bksResult.data);
        }
      } catch (err) {
        console.error("Failed to load checkout details:", err);
      }
    };

    loadPageData();
  }, [propertyId]);

  // Load saved dates for logged-in user
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchUserDates = async () => {
      try {
        const res = await fetch(`/api/user/dates?userId=${user.uid}`);
        const result = await res.json();
        if (result.success && result.data) {
          setSavedDates(result.data);
        }
      } catch (err) {
        console.error("Failed to retrieve user dates:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDates();
  }, [user, authLoading]);

  // Check for date overlaps
  useEffect(() => {
    if (!savedDates || !propertyId || bookingsList.length === 0) return;

    const from = new Date(savedDates.fromDate);
    const to = new Date(savedDates.toDate);

    const conflict = bookingsList.find(b => {
      if (b.paymentStatus === "failed" || b.paymentStatus === "refunded") return false;
      const bStart = new Date(b.fromDate);
      const bEnd = new Date(b.toDate);
      return from < bEnd && to > bStart;
    });

    if (conflict) {
      const startStr = formatDisplayDate(conflict.fromDate);
      const endStr = formatDisplayDate(conflict.toDate);
      setDateConflict(`Dates overlap with an existing booking (${startStr} - ${endStr}) by ${conflict.customerName}`);
    } else {
      setDateConflict(null);
    }
  }, [savedDates, propertyId, bookingsList]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-teal-500 border-white/10" />
        <span className="mt-3 text-xs text-zinc-500">Securing Session Context...</span>
      </div>
    );
  }

  // 1. Not Authenticated State
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl border border-white/10 bg-white/5 text-center">
        <span className="text-3xl">🔑</span>
        <h3 className="text-lg font-bold text-white mt-4">Authentication Required</h3>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          You must be logged in and have selected stay dates before checking out a package.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block w-full rounded-xl bg-teal-500 py-3 text-center text-xs font-bold text-white hover:bg-teal-600 transition-all"
        >
          Go to Homepage Login & Date Picker
        </Link>
      </div>
    );
  }

  // 2. Dates not selected state
  if (!savedDates) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl border border-white/10 bg-white/5 text-center">
        <span className="text-3xl">📅</span>
        <h3 className="text-lg font-bold text-white mt-4">Dates Missing</h3>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          No active stay dates found on your profile. Please configure check-in and check-out dates on the portal first.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block w-full rounded-xl bg-teal-500 py-3 text-center text-xs font-bold text-white hover:bg-teal-600 transition-all"
        >
          Select Dates First
        </Link>
      </div>
    );
  }

  // Calculate stay duration
  const from = new Date(savedDates.fromDate);
  const to = new Date(savedDates.toDate);
  const nights = Math.max(1, Math.ceil(Math.abs(to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));

  const basePricePerNight = property ? property.basePricePerNight : 1500;
  const selectedPackage = packages.find(p => p.id === selectedPackageId);

  // Focus math solely on package values and stay total
  const baseCost = basePricePerNight * nights;
  const packageMultiplier = selectedPackage ? selectedPackage.multiplier : 1.0;
  const packageBaseRate = selectedPackage ? selectedPackage.baseRate : 0;
  
  // Total calculated combining baseCost, packageMultiplier, and packageBaseRate
  const finalTotal = (baseCost + packageBaseRate) * packageMultiplier;

  const handleUpdateDates = async (start: string, end: string) => {
    if (!user) return;

    // Local update for responsive UI feedback
    if (!end) {
      setSavedDates({
        fromDate: new Date(start).toISOString(),
        toDate: new Date(start).toISOString()
      });
      return;
    }

    try {
      const response = await fetch("/api/user/dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          fromDate: new Date(start).toISOString(),
          toDate: new Date(end).toISOString()
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setSavedDates(result.data);
      }
    } catch (err) {
      console.error("Failed to update user stay dates:", err);
    }
  };

  const handleBookNow = async () => {
    if (dateConflict) {
      alert("Please resolve the date conflict before proceeding.");
      return;
    }

    setIsSubmitting(true);
    setCheckoutLog(["1. Validating stay selection...", "2. Registering booking ledger entries..."]);

    try {
      // POST booking
      const bookRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          packageId: selectedPackageId || null,
          customerName: user.displayName || user.email?.split("@")[0] || "Authenticated Guest",
          customerEmail: user.email || "",
          fromDate: from.toISOString(),
          toDate: to.toISOString(),
          total: finalTotal
        })
      });

      const bookResult = await bookRes.json();
      if (!bookRes.ok || !bookResult.success) {
        throw new Error(bookResult.error || "Failed to commit booking.");
      }

      setCheckoutLog(prev => [
        ...prev,
        "3. ✅ Booking logged successfully. Preparing payment details...",
        "4. Generating secure Yoco Checkout redirect URL..."
      ]);

      const targetType = selectedPackage ? selectedPackage.yocoId : "shack_stack";

      // POST create link
      const linkRes = await fetch("/api/v1/generate_checkout_link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: targetType })
      });

      const linkResult = await linkRes.json();
      if (!linkRes.ok || !linkResult.status) {
        throw new Error(linkResult.data || "Redirect link generation failed.");
      }

      setCheckoutLog(prev => [
        ...prev,
        "5. ✅ Redirecting to Yoco Checkout Gateway..."
      ]);

      setTimeout(() => {
        window.location.href = linkResult.data.redirectUrl;
      }, 1200);

    } catch (err: any) {
      setCheckoutLog(prev => [...prev, `❌ Error: ${err.message}`]);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <header className="mb-10 border-b border-white/10 pb-6 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wide">Step 2: Checkout</span>
          <h1 className="text-3xl font-black text-white mt-1">Book Your Package stay</h1>
        </div>
        <Link
          href="/"
          className="text-xs text-zinc-400 hover:text-white transition-colors"
        >
          ← Change Dates / Property
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left Side: Summary & Package Select */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stay Details summary */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-white">1. Stay Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl bg-black/40 p-4 border border-white/5">
                <span className="text-[10px] text-zinc-500 uppercase block">Selected Destination</span>
                <span className="text-sm font-extrabold text-white mt-1 block">
                  {property ? property.title : "Llandudno"}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">id: {propertyId}</span>
              </div>
              <div className="rounded-2xl bg-black/40 p-4 border border-white/5">
                <span className="text-[10px] text-zinc-500 uppercase block">Booking Dates</span>
                <span className="text-sm font-extrabold text-white mt-1 block">
                  {formatDisplayDate(from)} - {formatDisplayDate(to)}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">{nights} night(s) stay</span>
              </div>
            </div>
          </div>

          {/* Package Configuration */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-white">2. Select Package Option</h3>
            
            <div>
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-teal-500 focus:outline-none"
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id} className="bg-zinc-950">
                    {pkg.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedPackage && (
              <div className="rounded-2xl bg-black/40 p-4 border border-white/5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="rounded bg-teal-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-teal-400">
                    {selectedPackage.category} Package
                  </span>
                  <span className="text-xs text-zinc-500">
                    Base Multiplier: <strong>{selectedPackage.multiplier}x</strong>
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-white">{selectedPackage.name}</h4>
                {selectedPackage.description && (
                  <p className="text-xs text-zinc-400 leading-relaxed">{selectedPackage.description}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Total calculations & Secure Book action */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-white/15 pb-2">3. Cost Estimate & Pay</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Stay Duration:</span>
                <span className="font-bold text-white">{nights} nights</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Nightly Cost (R {basePricePerNight} × {nights}):</span>
                <span className="font-bold text-white">R {baseCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Addon Base rate:</span>
                <span className="font-bold text-white">R {packageBaseRate}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Package Multiplier:</span>
                <span className="font-bold text-white">× {packageMultiplier}</span>
              </div>
              
              <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                <span className="text-sm font-bold text-white">Payable Total ZAR:</span>
                <span className="text-2xl font-black text-teal-400">
                  R {finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Date Overlap block alert & visual resolver */}
            {dateConflict && (
              <div className="space-y-4">
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-xs font-bold text-red-400">
                  ⚠️ {dateConflict}
                </div>
                <div className="rounded-3xl border border-white/5 bg-zinc-950 p-4 space-y-3">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Select an available date range on the calendar below to update your stay dates:
                  </p>
                  <CalendarPicker
                    selectedFromDate={savedDates.fromDate.split("T")[0]}
                    selectedToDate={savedDates.toDate.split("T")[0]}
                    bookings={bookingsList}
                    onChange={handleUpdateDates}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleBookNow}
              disabled={isSubmitting || !!dateConflict}
              className={`w-full rounded-xl py-3.5 text-center text-xs font-bold text-white transition-all ${
                !!dateConflict
                  ? "bg-neutral-800 text-white/30 cursor-not-allowed border border-neutral-700"
                  : "bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/15 hover:scale-[1.01] hover:brightness-110 active:scale-95"
              }`}
            >
              {isSubmitting ? "Generating Yoco transaction..." : "Confirm & Pay via Yoco"}
            </button>
          </div>

          {/* Checkout console logger */}
          {checkoutLog.length > 0 && (
            <div className="rounded-3xl border border-white/5 bg-black/60 p-4 font-mono text-[9px] text-teal-300 space-y-1 max-h-40 overflow-y-auto">
              <div className="text-white/40 mb-1 border-b border-white/5 pb-1 font-sans text-[10px]">Session Logs</div>
              {checkoutLog.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bookings Ledger */}
      <div className="mt-12 border-t border-white/5 pt-12 space-y-4">
        <h2 className="text-base font-bold uppercase tracking-wider text-zinc-500 text-center">
          Property Bookings Ledger
        </h2>
        
        {bookingsList.length === 0 ? (
          <div className="text-center py-10 rounded-3xl border border-white/5 bg-white/5 text-zinc-500 text-xs">
            No bookings registered in the ledger for this property yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-white/5 bg-white/5">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-zinc-400 uppercase tracking-wider font-bold">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Paid Total</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {bookingsList.map((b) => {
                  const checkIn = formatDisplayDate(b.fromDate);
                  const checkOut = formatDisplayDate(b.toDate);

                  return (
                    <tr key={b.id} className="hover:bg-white/5 transition-all">
                      <td className="px-5 py-4">
                        <span className="font-bold text-white block">{b.customerName}</span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">{b.customerEmail}</span>
                      </td>
                      <td className="px-5 py-4 text-zinc-400 font-mono">
                        {checkIn} - {checkOut}
                      </td>
                      <td className="px-5 py-4 font-bold text-teal-400">
                        R {b.total.toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
                            b.paymentStatus === "paid" || b.paymentStatus === "success"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                              : b.paymentStatus === "failed"
                              ? "bg-red-500/10 text-red-400 border border-red-500/25"
                              : "bg-orange-500/10 text-orange-400 border border-orange-500/25"
                          }`}
                        >
                          {b.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingsCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-teal-500 border-white/10" />
      </div>
    }>
      <AuthProvider>
        <BookingsCheckoutContent />
      </AuthProvider>
    </Suspense>
  );
}
