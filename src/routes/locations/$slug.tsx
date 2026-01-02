
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTRPC } from '../../trpc/react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, MapPin, CheckCircle, Star } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export const Route = createFileRoute('/locations/$slug')({
    component: LocationPage,
})

function LocationPage() {
    const { slug } = Route.useParams()
    const trpc = useTRPC()
    const { data: location, isLoading } = useQuery(trpc.marketing.getLocationPage.queryOptions({ slug }))

    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-[#163022]" /></div>

    if (!location) return (
        <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Location Not Found</h1>
            <p className="text-gray-500 mb-6">We don't have a specific page for this location yet.</p>
            <Link to="/" className="px-6 py-2 bg-[#163022] text-white rounded-xl font-bold hover:bg-[#0f241a] transition-all">Go Home</Link>
        </div>
    )

    return (
        <div className="min-h-screen bg-white">
            {/* Localized Hero */}
            <section className="bg-[#163022] relative overflow-hidden text-white py-24 px-4">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1527513231358-de5f092e0322?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-sm font-bold text-emerald-100 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2">
                        <MapPin className="w-4 h-4" />
                        Serving {location.city}, {location.state}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight leading-tight">
                        Premium Cleaning in <span className="text-emerald-300">{location.city}</span>
                    </h1>
                    <p className="text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed">
                        V-Luxe brings 5-star hotel standards to your {location.city} home. Experience the difference of a truly professional clean.
                    </p>
                    <div className="pt-8">
                        <Link to="/" className="inline-block bg-white text-[#163022] px-8 py-4 rounded-xl font-bold text-lg shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform">
                            Book in {location.city}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Trust Indicators */}
            <section className="bg-emerald-50 border-y border-emerald-100 py-6">
                <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-16 text-[#163022]/80 font-bold text-sm uppercase tracking-wider">
                    <div className="flex items-center gap-2"><Star className="w-5 h-5 fill-[#163022]" /> Top Rated in {location.city}</div>
                    <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Background Checked Staff</div>
                    <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5" /> 100% Satisfaction Guarantee</div>
                </div>
            </section>

            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto px-4 py-20">
                {location.content ? (
                    <article className="prose prose-lg prose-emerald max-w-none">
                        <ReactMarkdown>{location.content}</ReactMarkdown>
                    </article>
                ) : (
                    <div className="space-y-12">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6 font-heading">Why {location.city} Residents Choose V-Luxe</h2>
                            <p className="text-lg text-gray-600 leading-relaxed mb-6">
                                Living in {location.city} implies a busy lifestyle. Whether you're a working professional or managing a bustling household, the last thing you want to worry about is cleaning.
                                V-Luxe provides a comprehensive cleaning solution tailored to the high standards of {location.city} homes.
                            </p>
                            <ul className="grid md:grid-cols-2 gap-4">
                                {["Deep Kitchen Cleaning", "Resort-Style Bathrooms", "Dust-Free Living Areas", "Eco-Friendly Products"].map(item => (
                                    <li key={item} className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 font-semibold text-gray-700">
                                        <CheckCircle className="w-5 h-5 text-emerald-600" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-[#163022] rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-3xl font-bold mb-4 font-heading">Book Your {location.city} Clean Today</h3>
                                <p className="text-emerald-100 mb-8 max-w-lg mx-auto">Don't settle for average. Get the premium V-Luxe experience and reclaim your weekends.</p>
                                <Link to="/" className="inline-block bg-white text-[#163022] px-8 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors">
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
