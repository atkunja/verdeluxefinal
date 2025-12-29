import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

interface QuizIdentityLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

export function QuizIdentityLayout({ children, title, subtitle }: QuizIdentityLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0d1d14] via-[#163022] to-[#1a3a2a] flex">
            {/* Left Side - Content */}
            <div className="flex-1 flex flex-col px-8 py-10 lg:px-16 xl:px-24">
                {/* Back to Home */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors group w-fit"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Home</span>
                </Link>

                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center py-8">
                    <div className="w-full max-w-xl">
                        {/* Title Section */}
                        <div className="text-center lg:text-left mb-10">
                            <div className="flex items-center gap-3 justify-center lg:justify-start mb-6">
                                <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
                                    <img src="/imported/images/logo.png" alt="" className="h-6 w-auto invert brightness-0" />
                                </div>
                                <span className="text-xl font-extrabold text-white">Verde Luxe</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">{title}</h1>
                            {subtitle && (
                                <p className="mt-3 text-base text-white/60 leading-relaxed">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {/* Content Card */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 md:p-10 shadow-2xl">
                            <div className="space-y-6">
                                {children}
                            </div>
                        </div>

                        {/* Footer info */}
                        <div className="mt-8 text-center lg:text-left text-xs text-white/40 flex items-center gap-2 justify-center lg:justify-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse"></span>
                            Verde Luxe Premium Cleaning • Secure Session
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Image */}
            <div className="hidden lg:block lg:w-[45%] xl:w-[50%] relative overflow-hidden">
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#163022]/80 z-10" />

                {/* Decorative elements */}
                <div className="absolute top-20 right-20 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl" />
                <div className="absolute bottom-40 right-40 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />

                {/* Main Image */}
                <div className="absolute inset-0 flex items-start justify-end pr-8 pt-8 xl:pt-12">
                    <div className="relative">
                        {/* Glow effect */}
                        <div className="absolute -inset-8 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-3xl" />

                        {/* Image - no container, just the image */}
                        <img
                            src="/bookquiz.png"
                            alt="Verde Luxe Cleaning Professional"
                            className="relative w-[400px] xl:w-[500px] 2xl:w-[600px] h-auto object-contain drop-shadow-2xl"
                        />
                    </div>
                </div>

                {/* Feature badges */}
                <div className="absolute bottom-20 left-8 right-8 z-20">
                    <div className="flex flex-wrap gap-3 justify-center">
                        <div className="px-4 py-2.5 bg-white/10 backdrop-blur-xl rounded-full text-white text-sm font-medium border border-white/20 shadow-lg">
                            ✨ Premium Service
                        </div>
                        <div className="px-4 py-2.5 bg-white/10 backdrop-blur-xl rounded-full text-white text-sm font-medium border border-white/20 shadow-lg">
                            🛡️ Insured & Bonded
                        </div>
                        <div className="px-4 py-2.5 bg-white/10 backdrop-blur-xl rounded-full text-white text-sm font-medium border border-white/20 shadow-lg">
                            ⭐ 5-Star Rated
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
