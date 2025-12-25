import { User, Phone, Clock, MapPin, Calendar, DollarSign, Repeat, Hash, Briefcase } from "lucide-react";
import { formatTime12Hour } from "~/utils/formatTime";
import { useRef, useLayoutEffect, useState } from "react";

interface Booking {
  id: number;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  durationHours: number | null;
  finalPrice: number | null;
  serviceFrequency: string | null;
  client: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
  cleaner: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    color: string | null;
  } | null;
}

interface BookingTooltipProps {
  booking: Booking;
  targetElement: HTMLElement;
  visible: boolean;
}

export function BookingTooltip({ booking, targetElement, visible }: BookingTooltipProps) {
  if (!visible) return null;

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position after tooltip is rendered
  useLayoutEffect(() => {
    if (!tooltipRef.current || !targetElement) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const spacing = 8;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let top = targetRect.top + scrollY - tooltipRect.height - spacing;
    let left = targetRect.left + scrollX + targetRect.width / 2 - tooltipRect.width / 2;

    // If tooltip would go off the top, position it below instead
    if (targetRect.top - tooltipRect.height - spacing < 0) {
      top = targetRect.bottom + scrollY + spacing;
    }

    // If tooltip would still go off the bottom after positioning below, try above again
    if (top + tooltipRect.height > scrollY + viewportHeight) {
      top = targetRect.top + scrollY - tooltipRect.height - spacing;
    }

    // Clamp horizontally within viewport
    if (left < scrollX + 8) {
      left = scrollX + 8;
    }
    if (left + tooltipRect.width > scrollX + viewportWidth - 8) {
      left = scrollX + viewportWidth - tooltipRect.width - 8;
    }

    // Final vertical clamping to ensure it's always visible
    if (top < scrollY + 8) {
      top = scrollY + 8;
    }
    if (top + tooltipRect.height > scrollY + viewportHeight - 8) {
      top = scrollY + viewportHeight - tooltipRect.height - 8;
    }

    setPosition({ top, left });
  }, [targetElement, visible]);

  const clientName = `${booking.client.firstName || ''} ${booking.client.lastName || ''}`.trim() || booking.client.email;
  const cleanerName = booking.cleaner 
    ? `${booking.cleaner.firstName || ''} ${booking.cleaner.lastName || ''}`.trim() || booking.cleaner.email
    : 'Not assigned';
  
  const formattedDate = new Date(booking.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 pointer-events-none"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden max-w-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-3.5 h-3.5" />
            <h3 className="font-semibold text-sm">{booking.serviceType}</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/80">
            <Hash className="w-3 h-3" />
            <span>Booking #{booking.id}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2 text-sm">
          {/* Customer Info */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Customer</p>
              <p className="font-medium text-gray-900 text-sm">{clientName}</p>
              {booking.client.phone && (
                <a 
                  href={`tel:${booking.client.phone}`}
                  className="text-primary hover:text-primary-dark text-xs flex items-center gap-1 mt-0.5 pointer-events-auto"
                >
                  <Phone className="w-3 h-3" />
                  {booking.client.phone}
                </a>
              )}
            </div>
          </div>

          {/* Cleaner Info */}
          <div className="flex items-start gap-2.5">
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: booking.cleaner?.color ? `${booking.cleaner.color}20` : '#5e870d1A',
                color: booking.cleaner?.color || '#5e870d'
              }}
            >
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Assigned Cleaner</p>
              <p className="font-medium text-gray-900 text-sm">{cleanerName}</p>
              {booking.cleaner?.phone && (
                <a 
                  href={`tel:${booking.cleaner.phone}`}
                  className="text-primary hover:text-primary-dark text-xs flex items-center gap-1 mt-0.5 pointer-events-auto"
                >
                  <Phone className="w-3 h-3" />
                  {booking.cleaner.phone}
                </a>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Date & Time</p>
              <p className="font-medium text-gray-900 text-sm">{formattedDate}</p>
              <p className="text-gray-700 text-xs mt-0.5">{formatTime12Hour(booking.scheduledTime)}</p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Address</p>
              <p className="font-medium text-gray-900 text-xs leading-relaxed">{booking.address}</p>
            </div>
          </div>

          {/* Duration & Frequency */}
          <div className="grid grid-cols-2 gap-2.5">
            {booking.durationHours && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Duration</p>
                  <p className="font-medium text-gray-900 text-xs">{booking.durationHours}h</p>
                </div>
              </div>
            )}
            {booking.serviceFrequency && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Repeat className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Frequency</p>
                  <p className="font-medium text-gray-900 text-xs capitalize">
                    {booking.serviceFrequency.toLowerCase().replace('_', ' ')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Price */}
          {booking.finalPrice && (
            <div className="flex items-start gap-2.5 pt-2 border-t border-gray-100">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">Price</p>
                <p className="font-bold text-primary text-lg">${booking.finalPrice.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
