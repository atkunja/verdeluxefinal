import React from "react";

interface QuizIdentityLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

export function QuizIdentityLayout({ children, title, subtitle }: QuizIdentityLayoutProps) {
    return (
        <div className="min-h-screen bg-[#f5f1e8] flex flex-col items-center justify-center px-4 py-12 text-[#163022]">
            <div className="w-full max-w-xl flex flex-col items-center">
                {/* Circular Image with nice border/glow */}
                <div className="relative mb-8 group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#163022]/20 to-[#4a6355]/20 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white">
                        <img
                            src="/bookquiz.jpg"
                            alt="Verde Luxe Cleaning"
                            className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-700 ease-in-out"
                            style={{ objectPosition: '62% 20%' }}
                        />
                    </div>
                    {/* Subtle micro-animation element */}
                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-3 shadow-lg border border-gray-100 animate-bounce">
                        <div className="bg-[#163022] rounded-full p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                    </div>
                </div>

                {/* Content Card */}
                <div className="w-full bg-white rounded-3xl border border-[#e3ded2] shadow-[0_20px_50px_rgba(22,48,34,0.1)] p-8 md:p-10 transition-all duration-300 hover:shadow-[0_30px_60px_rgba(22,48,34,0.15)]">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-[#163022] sm:text-4xl">{title}</h1>
                        {subtitle && (
                            <p className="mt-3 text-base text-[#5c5a55] leading-relaxed">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <div className="space-y-6">
                        {children}
                    </div>
                </div>

                {/* Footer info */}
                <div className="mt-8 text-center text-xs text-[#5c5a55]/60 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#163022]/40 animate-pulse"></span>
                    Verde Luxe Premium Cleaning • Secure Session
                </div>
            </div>
        </div>
    );
}
