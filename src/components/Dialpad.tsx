import { Phone } from "lucide-react";

interface DialpadProps {
  onDigitClick: (digit: string) => void;
  disabled?: boolean;
}

export function Dialpad({ onDigitClick, disabled = false }: DialpadProps) {
  const digits = [
    { digit: "1", letters: "" },
    { digit: "2", letters: "ABC" },
    { digit: "3", letters: "DEF" },
    { digit: "4", letters: "GHI" },
    { digit: "5", letters: "JKL" },
    { digit: "6", letters: "MNO" },
    { digit: "7", letters: "PQRS" },
    { digit: "8", letters: "TUV" },
    { digit: "9", letters: "WXYZ" },
    { digit: "*", letters: "" },
    { digit: "0", letters: "+" },
    { digit: "#", letters: "" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
      {digits.map(({ digit, letters }) => (
        <button
          key={digit}
          onClick={() => onDigitClick(digit)}
          disabled={disabled}
          className="flex flex-col items-center justify-center h-16 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-primary active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200"
        >
          <span className="text-2xl font-semibold text-gray-900">{digit}</span>
          {letters && (
            <span className="text-xs text-gray-500 font-medium">{letters}</span>
          )}
        </button>
      ))}
    </div>
  );
}
