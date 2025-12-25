import { User, Phone, Clock, MapPin, Calendar, DollarSign, Briefcase } from "lucide-react";
import { useRef, useLayoutEffect, useState } from "react";

interface BookingEvent {
    id: string;
    customer: string;
    contact: string;
    serviceType: string;
    scheduledDate: string;
    scheduledTime: string;
    provider: string;
    providerColor: string;
    status?: string;
    location: string;
    price: number;
    durationHours?: number;
}

interface BookingEventTooltipProps {
    event: BookingEvent;
    targetElement: HTMLElement;
    visible: boolean;
}

export function BookingEventTooltip({ event, targetElement, visible }: BookingEventTooltipProps) {
    if (!visible) return null;

    const tooltipRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

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

        // Final vertical clamping
        if (top < scrollY + 8) {
            top = scrollY + 8;
        }
        if (top + tooltipRect.height > scrollY + viewportHeight - 8) {
            top = scrollY + viewportHeight - tooltipRect.height - 8;
        }

        setPosition({ top, left });
    }, [targetElement, visible]);

    const formattedDate = new Date(event.scheduledDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    const statusColors: Record<string, string> = {
        PENDING: 'bg-amber-100 text-amber-700',
        CONFIRMED: 'bg-blue-100 text-blue-700',
        IN_PROGRESS: 'bg-purple-100 text-purple-700',
        COMPLETED: 'bg-green-100 text-green-700',
        CANCELLED: 'bg-red-100 text-red-700',
    };

    return (
        <div
            ref={tooltipRef}
            className="fixed z-[9999] pointer-events-none"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden w-72">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4" />
                        <h3 className="font-bold text-sm">{event.serviceType}</h3>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-white/80">#{event.id}</span>
                        {event.status && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[event.status] || 'bg-gray-100 text-gray-700'}`}>
                                {event.status}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-3 space-y-2.5 text-sm">
                    {/* Customer */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Customer</p>
                            <p className="font-semibold text-gray-900 text-sm">{event.customer}</p>
                            {event.contact && (
                                <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                                    <Phone className="w-3 h-3" />
                                    {event.contact}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Provider */}
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${event.providerColor}20` }}
                        >
                            <User className="w-3.5 h-3.5" style={{ color: event.providerColor }} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Provider</p>
                            <p className="font-semibold text-gray-900 text-sm">{event.provider}</p>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Date & Time</p>
                            <p className="font-semibold text-gray-900 text-sm">{formattedDate} • {event.scheduledTime}</p>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Location</p>
                            <p className="font-medium text-gray-900 text-xs leading-relaxed truncate">{event.location}</p>
                        </div>
                    </div>

                    {/* Duration & Price */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        {event.durationHours && (
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs text-gray-600">{event.durationHours}h</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-primary" />
                            <span className="font-bold text-primary text-lg">${event.price.toFixed(0)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
