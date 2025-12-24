import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";

interface CallControlsProps {
  callStatus: "idle" | "connecting" | "ringing" | "connected" | "disconnected" | "error";
  isMuted: boolean;
  onCall: () => void;
  onHangup: () => void;
  onToggleMute: () => void;
  disabled?: boolean;
}

export function CallControls({
  callStatus,
  isMuted,
  onCall,
  onHangup,
  onToggleMute,
  disabled = false,
}: CallControlsProps) {
  const isCallActive = callStatus === "connecting" || callStatus === "ringing" || callStatus === "connected";

  return (
    <div className="flex items-center justify-center gap-4">
      {!isCallActive ? (
        <button
          onClick={onCall}
          disabled={disabled}
          className="flex items-center justify-center w-16 h-16 bg-green-500 text-white rounded-full hover:bg-green-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-500 shadow-lg"
        >
          <Phone className="w-7 h-7" />
        </button>
      ) : (
        <>
          <button
            onClick={onToggleMute}
            disabled={callStatus !== "connected"}
            className={`flex items-center justify-center w-14 h-14 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
              isMuted
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          <button
            onClick={onHangup}
            className="flex items-center justify-center w-16 h-16 bg-red-500 text-white rounded-full hover:bg-red-600 active:scale-95 transition-all shadow-lg"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </>
      )}
    </div>
  );
}
