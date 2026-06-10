"use client";

import React, { useState } from "react";

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
  source?: string;
}

interface CalendarPickerProps {
  selectedFromDate: string; // YYYY-MM-DD
  selectedToDate: string; // YYYY-MM-DD
  bookings: Booking[];
  onChange: (fromDate: string, toDate: string) => void;
}

export default function CalendarPicker({
  selectedFromDate,
  selectedToDate,
  bookings,
  onChange,
}: CalendarPickerProps) {
  // Current calendar month view (starts with the check-in date's month or current month)
  const initialDate = selectedFromDate ? new Date(selectedFromDate) : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed

  // Helper to format date as YYYY-MM-DD in local time
  const formatDateString = (year: number, month: number, day: number): string => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const todayStr = (() => {
    const d = new Date();
    return formatDateString(d.getFullYear(), d.getMonth(), d.getDate());
  })();

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // Check if a specific date is booked, returning the booking record
  const getBookingForDate = (year: number, month: number, day: number): Booking | null => {
    const date = new Date(year, month, day);
    const time = date.getTime();

    for (const b of bookings) {
      if (b.paymentStatus === "failed" || b.paymentStatus === "refunded") continue;
      const start = new Date(b.fromDate.split("T")[0]); // compare dates only
      const end = new Date(b.toDate.split("T")[0]);
      
      const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
      const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

      // Block night of check-in up to night before check-out
      if (time >= startTime && time < endTime) {
        return b;
      }
    }
    return null;
  };

  // Generate calendar days for a given month and year
  const getDaysInMonth = (year: number, month: number) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDayIndex, totalDays };
  };

  // Render a single month view
  const renderMonth = (year: number, month: number) => {
    const { firstDayIndex, totalDays } = getDaysInMonth(year, month);
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const days: React.JSX.Element[] = [];

    // Empty cells for offset before the first day of the month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10 w-10 md:h-11 md:w-11" />
      );
    }

    // Days cells
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = formatDateString(year, month, day);
      const booking = getBookingForDate(year, month, day);
      const isBooked = !!booking;
      
      const isSelectedFrom = selectedFromDate === dateStr;
      const isSelectedTo = selectedToDate === dateStr;
      
      // Check if day is inside selected range
      const isSelectedRange = (() => {
        if (!selectedFromDate || !selectedToDate) return false;
        return dateStr > selectedFromDate && dateStr < selectedToDate;
      })();

      const isToday = todayStr === dateStr;

      // Click handler for day selection
      const handleDayClick = () => {
        if (isBooked) return;

        // Selection Logic
        if (!selectedFromDate || (selectedFromDate && selectedToDate)) {
          // Select Check-in
          onChange(dateStr, "");
        } else {
          // Select Check-out
          if (dateStr > selectedFromDate) {
            // Ensure no booked days inside the selected range
            let hasOverlap = false;
            let current = new Date(selectedFromDate);
            const target = new Date(dateStr);
            
            while (current < target) {
              const checkB = getBookingForDate(current.getFullYear(), current.getMonth(), current.getDate());
              if (checkB) {
                hasOverlap = true;
                break;
              }
              current.setDate(current.getDate() + 1);
            }

            if (hasOverlap) {
              alert("The selected range overlaps with an existing booking. Please choose another range.");
              onChange(dateStr, "");
            } else {
              onChange(selectedFromDate, dateStr);
            }
          } else {
            // Selected a date before check-in date: reset check-in to this date
            onChange(dateStr, "");
          }
        }
      };

      // Determine label & styles for tooltip/indicator
      let tooltipText = "";
      if (isBooked && booking) {
        if (booking.source === "gcal") {
          tooltipText = `Unavailable: ${booking.customerName}`;
        } else if (booking.source === "airbnb") {
          tooltipText = `Airbnb: Blocked Dates`;
        } else {
          tooltipText = `Booked by ${booking.customerName}`;
        }
      } else if (isToday) {
        tooltipText = "Today";
      }

      // Styles
      let dayClass = "h-10 w-10 md:h-11 md:w-11 flex items-center justify-center text-xs font-semibold rounded-xl relative cursor-pointer transition-all duration-200 ";
      if (isBooked) {
        dayClass += "bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed hover:bg-red-500/20";
      } else if (isSelectedFrom || isSelectedTo) {
        dayClass += "bg-teal-500 text-black shadow-md shadow-teal-500/20 scale-105 z-10 font-bold";
      } else if (isSelectedRange) {
        dayClass += "bg-teal-500/20 text-teal-200 border border-teal-500/10";
      } else if (isToday) {
        dayClass += "bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700";
      } else {
        dayClass += "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white";
      }

      days.push(
        <div key={dateStr} className="relative group">
          <button
            type="button"
            onClick={handleDayClick}
            disabled={isBooked}
            className={dayClass}
          >
            {day}
            
            {/* Visual indicator for booked/blocked dates */}
            {isBooked && (
              <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-400 opacity-60" />
            )}
          </button>

          {/* Premium Tooltip */}
          {tooltipText && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-zinc-900 border border-white/10 text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-xl z-20 text-center font-sans tracking-wide">
              {tooltipText}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-900" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Month Header */}
        <div className="text-center font-bold text-sm text-white border-b border-white/5 pb-2.5">
          {monthNames[month]} {year}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 justify-items-center">
          {/* Weekday headers */}
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
            <div key={dayName} className="h-6 w-10 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {dayName}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  // Show two consecutive months
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const nextMonthVal = currentMonth === 11 ? 0 : currentMonth + 1;

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md space-y-6">
      {/* Calendar Navigation */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-xs font-extrabold uppercase tracking-widest text-teal-400 flex items-center gap-2">
          <span>📅</span> Availability calendar
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Responsive grids for two months */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {renderMonth(currentYear, currentMonth)}
        {renderMonth(nextMonthYear, nextMonthVal)}
      </div>

      {/* Date display legend */}
      <div className="border-t border-white/5 pt-4 flex flex-wrap gap-4 items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-teal-500" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-red-500/10 border border-red-500/30" />
            <span>Unavailable</span>
          </div>
        </div>

        {selectedFromDate && (
          <div className="text-teal-300 font-medium">
            Stay: <strong className="text-white">{selectedFromDate}</strong>
            {selectedToDate ? <> to <strong className="text-white">{selectedToDate}</strong></> : " (Select Check-out)"}
          </div>
        )}
      </div>
    </div>
  );
}
