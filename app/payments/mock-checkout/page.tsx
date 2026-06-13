"use client";

import React, { use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function MockCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const amountInCents = Number(searchParams.get("amountInCents") || "0");
  const description = searchParams.get("description") || "Llandudno stay booking";
  const packageType = searchParams.get("packageType") || "shack_stack";
  const bookingId = searchParams.get("bookingId") || "";

  const amountInRands = amountInCents / 100;

  const handleSimulate = (status: "success" | "cancel" | "failed") => {
    // Generate the redirect URL based on siteUrl or root of application
    let redirectUrl = "";
    if (status === "success") {
      redirectUrl = `/?payment=success&bookingId=${bookingId}&type=${packageType}&amount=${amountInRands}`;
    } else if (status === "cancel") {
      redirectUrl = `/?payment=cancel&bookingId=${bookingId}&type=${packageType}`;
    } else {
      redirectUrl = `/?payment=failed&bookingId=${bookingId}&type=${packageType}`;
    }
    
    window.location.href = redirectUrl;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 font-sans text-white">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/90 shadow-2xl">
        {/* Header */}
        <div className="border-b border-zinc-800 bg-zinc-900 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-wider text-teal-400">YOCO</span>
            <span className="text-[10px] rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400 uppercase font-semibold">Simulator</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Secure Connection</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="rounded-2xl bg-zinc-950 p-4 border border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Order Description</span>
            <h3 className="text-sm font-semibold text-white mt-0.5">{description}</h3>
            <div className="mt-4 border-t border-zinc-900 pt-3 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Total Amount</span>
              <span className="text-2xl font-black text-teal-400">R {amountInRands.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Checkout Form (Mock UI) */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Cardholder Name</label>
              <input
                type="text"
                disabled
                value="John Doe (Developer Mode)"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Card Number</label>
              <input
                type="text"
                disabled
                value="••••  ••••  ••••  4242"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-300 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Expiry Date</label>
                <input
                  type="text"
                  disabled
                  value="12 / 29"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">CVV</label>
                <input
                  type="text"
                  disabled
                  value="•••"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-300 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Secure details */}
          <div className="text-center text-[10px] text-zinc-500">
            🔒 This is a local mock payment checkout page. No real payment will be processed.
          </div>

          {/* Simulated actions */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-800">
            <button
              onClick={() => handleSimulate("success")}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-center text-xs font-bold text-white hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-teal-500/10"
            >
              Simulate Successful Payment (Success Redirect)
            </button>
            <button
              onClick={() => handleSimulate("failed")}
              className="w-full rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 py-3 text-center text-xs font-bold text-red-400 active:scale-95 transition-all"
            >
              Simulate Payment Failure (Failure Redirect)
            </button>
            <button
              onClick={() => handleSimulate("cancel")}
              className="w-full rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 py-3 text-center text-xs font-bold active:scale-95 transition-all"
            >
              Cancel and Return (Cancel Redirect)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MockCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-teal-500 border-white/10" />
      </div>
    }>
      <MockCheckoutContent />
    </Suspense>
  );
}
