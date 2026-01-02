
import { createFileRoute, Link } from '@tanstack/react-router'
import { trpc } from '../../trpc/react'
import { Loader2, Calendar, User, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/blog/')({
    component: BlogIndex,
})

function BlogIndex() {
    const { data: posts, isLoading } = trpc.marketing.getPublicPosts.useQuery()

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header */}
            <section className="bg-[#163022] text-white py-20 px-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1581578731117-104f2a863a30?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
                <div className="relative z-10 max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-bold tracking-widest uppercase text-emerald-100">Our Journal</span>
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-white tracking-tight">Cleaning Tips & Company News</h1>
                    <p className="text-emerald-100/80 text-lg max-w-xl mx-auto">Expert advice on keeping your home pristine, plus updates from the V-Luxe team.</p>
                </div>
            </section>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#163022]" /></div>
                ) : (posts || []).length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-xl font-medium mb-2">No posts yet</p>
                        <p className="text-sm text-gray-400">Check back soon for our first article!</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts?.map((post) => (
                            <Link
                                key={post.slug}
                                to="/blog/$slug"
                                params={{ slug: post.slug }}
                                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                            >
                                {post.coverImage ? (
                                    <div className="h-48 overflow-hidden bg-gray-100">
                                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                ) : (
                                    <div className="h-48 bg-[#163022]/5 flex items-center justify-center text-[#163022]/20">
                                        <span className="font-heading font-bold text-2xl">V-Luxe</span>
                                    </div>
                                )}

                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                        {post.publishedAt && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(post.publishedAt).toLocaleDateString()}
                                            </div>
                                        )}
                                        {/* Add category if we had it */}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#163022] transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>

                                    {post.excerpt && (
                                        <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                                            {post.excerpt}
                                        </p>
                                    )}

                                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center text-[#163022] font-bold text-sm group/btn">
                                        Read Article
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
