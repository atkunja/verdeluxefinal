
import { createFileRoute, Link } from '@tanstack/react-router'
import { trpc } from '../../trpc/react'
import { Loader2, Calendar, User, ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export const Route = createFileRoute('/blog/$slug')({
    component: BlogPost,
})

function BlogPost() {
    const { slug } = Route.useParams()
    const { data: post, isLoading } = trpc.marketing.getPost.useQuery({ slug })

    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-[#163022]" /></div>

    if (!post) return (
        <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Post Not Found</h1>
            <p className="text-gray-500 mb-6">The article you are looking for does not exist or has been removed.</p>
            <Link to="/blog" className="px-6 py-2 bg-[#163022] text-white rounded-xl font-bold hover:bg-[#0f241a] transition-all">Back to Blog</Link>
        </div>
    )

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="bg-[#163022] relative">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="max-w-4xl mx-auto px-4 py-20 relative z-10 text-center">
                    <Link to="/blog" className="inline-flex items-center text-emerald-200 hover:text-white font-bold mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Posts
                    </Link>
                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-white tracking-tight mb-6 leading-tight">{post.title}</h1>
                    <div className="flex items-center justify-center gap-6 text-emerald-100 font-medium">
                        {post.publishedAt && (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(post.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            V-Luxe Team
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-16">
                <article className="prose prose-lg prose-emerald max-w-none">
                    <ReactMarkdown
                        components={{
                            h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 font-heading" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 font-heading" {...props} />,
                            p: ({ node, ...props }) => <p className="text-gray-600 leading-relaxed mb-4" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-6 space-y-2 mb-4 text-gray-600" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-6 space-y-2 mb-4 text-gray-600" {...props} />,
                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-[#163022] pl-4 italic text-gray-700 my-6 bg-gray-50 py-2 pr-4 rounded-r-lg" {...props} />,
                        }}
                    >
                        {post.content}
                    </ReactMarkdown>
                </article>
            </div>

            {/* Footer CTA */}
            <div className="bg-neutral-50 border-t border-gray-200 py-16 text-center px-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 font-heading">Ready for a Cleaner Home?</h2>
                <p className="text-gray-600 mb-8 max-w-lg mx-auto">Experience the V-Luxe difference today. Book your first premium cleaning service in minutes.</p>
                <Link to="/" className="inline-block px-8 py-4 bg-[#163022] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">Book Now</Link>
            </div>
        </div>
    )
}
