import { PhoneIncoming, PhoneOutgoing, Clock } from "lucide-react";

interface CallLog {
  id: number;
  callSid: string;
  fromNumber: string;
  toNumber: string;
  status: string;
  direction: string;
  duration: number | null;
  startTime: Date | null;
  createdAt: Date;
}

interface CallHistoryProps {
  callLogs: CallLog[];
}

export function CallHistory({ callLogs }: CallHistoryProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatPhoneNumber = (number: string) => {
    // Format as (XXX) XXX-XXXX
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return number;
  };

  if (callLogs.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No call history yet</p>
        <p className="text-gray-500 text-sm mt-1">Your recent calls will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {callLogs.map((log) => (
        <div
          key={log.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${
                log.direction === "outbound"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-green-100 text-green-600"
              }`}>
                {log.direction === "outbound" ? (
                  <PhoneOutgoing className="w-4 h-4" />
                ) : (
                  <PhoneIncoming className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {log.direction === "outbound"
                    ? formatPhoneNumber(log.toNumber)
                    : formatPhoneNumber(log.fromNumber)}
                </p>
                <p className="text-sm text-gray-600 capitalize">{log.status}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {formatDuration(log.duration)}
              </p>
              <p className="text-xs text-gray-500">
                {log.startTime
                  ? new Date(log.startTime).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
