import { create } from "zustand";

type CallStatus = "idle" | "connecting" | "ringing" | "connected" | "disconnected" | "error";

type DialerStore = {
  callStatus: CallStatus;
  activeCallSid: string | null;
  isMuted: boolean;
  phoneNumber: string;
  callDuration: number;
  errorMessage: string | null;
  
  setCallStatus: (status: CallStatus) => void;
  setActiveCallSid: (sid: string | null) => void;
  setMuted: (muted: boolean) => void;
  setPhoneNumber: (number: string) => void;
  setCallDuration: (duration: number) => void;
  setErrorMessage: (message: string | null) => void;
  resetDialer: () => void;
};

export const useDialerStore = create<DialerStore>()((set) => ({
  callStatus: "idle",
  activeCallSid: null,
  isMuted: false,
  phoneNumber: "",
  callDuration: 0,
  errorMessage: null,
  
  setCallStatus: (status) => set({ callStatus: status }),
  setActiveCallSid: (sid) => set({ activeCallSid: sid }),
  setMuted: (muted) => set({ isMuted: muted }),
  setPhoneNumber: (number) => set({ phoneNumber: number }),
  setCallDuration: (duration) => set({ callDuration: duration }),
  setErrorMessage: (message) => set({ errorMessage: message }),
  resetDialer: () => set({
    callStatus: "idle",
    activeCallSid: null,
    isMuted: false,
    phoneNumber: "",
    callDuration: 0,
    errorMessage: null,
  }),
}));
