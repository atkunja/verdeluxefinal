import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "~/components/Layout";
import { BeforeAfterSlider } from "~/components/BeforeAfterSlider";
import { TestimonialCarousel } from "~/components/TestimonialCarousel";
import {
  Home,
  CheckCircle,
  Shield,
  Building,
  ArrowRight,
  Calendar,
  Wrench,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Star,
  Leaf,
  Heart,
  Clock,
  Award,
} from "lucide-react";
import { SEO } from "~/components/SEO";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

// Custom hook for scroll animations
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <Layout>
      <SEO />

      {/* Hero Section - Vellaclean Inspired */}
      <section className="relative min-h-screen bg-[#fdfcfa] overflow-hidden pt-24 pb-20">
        {/* Floating decorative elements */}
        <div className="absolute top-32 right-20 w-4 h-4 bg-emerald-400 rounded-full animate-float opacity-60" />
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-amber-400 rounded-full animate-float-delayed opacity-60" />
        <div className="absolute bottom-40 left-20 w-5 h-5 bg-teal-300 rounded-full animate-float opacity-40" />
        <div className="absolute top-1/3 left-10 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />

        {/* Large decorative shape */}
        <div className="absolute -right-40 top-20 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 opacity-60" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            {/* Left Content */}
            <div className="order-2 lg:order-1">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 mb-8 animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Premium Cleaning Service</span>
              </div>

              <h1
                className="font-serif text-5xl md:text-6xl lg:text-7xl text-slate-900 leading-[1.1] mb-8 animate-fade-in-up"
                style={{ animationDelay: "0.4s" }}
              >
                Custom housekeeping
                <br />
                <span className="text-emerald-600 italic">on demand.</span>
              </h1>

              <p
                className="text-lg text-slate-600 leading-relaxed mb-10 max-w-lg animate-fade-in-up"
                style={{ animationDelay: "0.6s" }}
              >
                Verde Luxe delivers meticulous, eco-friendly cleaning tailored to your lifestyle —
                so you can reclaim your time and enjoy a pristine space.
              </p>

              <div
                className="flex flex-wrap gap-4 animate-fade-in-up"
                style={{ animationDelay: "0.8s" }}
              >
                <Link
                  to="/book-now"
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5"
                >
                  Book Your Clean
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="tel:+17348920931"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-700 font-bold rounded-full border-2 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                >
                  Call Us Now
                </a>
              </div>

              {/* Trust indicators */}
              <div
                className="flex flex-wrap items-center gap-6 mt-12 pt-8 border-t border-slate-100 animate-fade-in-up"
                style={{ animationDelay: "1s" }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white" />
                    ))}
                  </div>
                  <span className="text-sm text-slate-600 font-medium">500+ Happy Clients</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-sm text-slate-600 font-medium ml-2">5.0 Rating</span>
                </div>
              </div>
            </div>

            {/* Right - Image Composition */}
            <div className="order-1 lg:order-2 relative">
              <div className="relative">
                {/* Main oval image */}
                <div
                  className="relative w-full aspect-[4/5] rounded-[40%_40%_40%_40%] overflow-hidden shadow-2xl animate-fade-in-up"
                  style={{ animationDelay: "0.5s" }}
                >
                  <img
                    src="/imported/images/mission.jpg"
                    alt="Professional Cleaning"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Floating badge */}
                <div
                  className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl animate-fade-in-up"
                  style={{ animationDelay: "0.9s" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Award className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">5+</p>
                      <p className="text-xs text-slate-500 font-medium">Years Experience</p>
                    </div>
                  </div>
                </div>

                {/* Eco badge */}
                <div
                  className="absolute -top-4 -right-4 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl p-4 shadow-xl animate-fade-in-up"
                  style={{ animationDelay: "1.1s" }}
                >
                  <div className="flex items-center gap-2">
                    <Leaf className="w-5 h-5" />
                    <span className="text-sm font-bold">Eco-Friendly</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-slate-400" />
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16 max-w-2xl mx-auto">
            <span className="inline-block px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              Our Services
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-slate-900 mb-6">
              Cleans tailored to <span className="text-emerald-600 italic">your</span> needs
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              From standard upkeep to deep cleans — we've got every corner covered.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Home, title: "Standard Clean", desc: "Effortless clean, every time", color: "bg-teal-50 text-teal-600", link: "/services/standard-home-cleaning" },
              { icon: CheckCircle, title: "Deep Clean", desc: "A truly thorough clean", color: "bg-emerald-50 text-emerald-600", link: "/services/deep-home-cleaning" },
              { icon: Shield, title: "Vacation Rental", desc: "Hospitality-level cleaning", color: "bg-amber-50 text-amber-600", link: "/services/vacation-rental-cleaning" },
              { icon: Building, title: "Commercial", desc: "Professional spaces, maintained", color: "bg-blue-50 text-blue-600", link: "/services/commercial-cleaning" },
              { icon: ArrowRight, title: "Move In/Out", desc: "One less thing to worry about", color: "bg-rose-50 text-rose-600", link: "/services/moving-cleaning" },
              { icon: Wrench, title: "Post Construction", desc: "Ready for a fresh start", color: "bg-purple-50 text-purple-600", link: "/services/post-construction-cleaning" },
            ].map((service, i) => (
              <AnimatedSection key={service.title} delay={i * 100}>
                <Link
                  to={service.link}
                  className="group block bg-white rounded-3xl border-2 border-slate-100 p-8 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 h-full"
                >
                  <div className={`w-14 h-14 ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <service.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-600">{service.desc}</p>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us - Feature Cards */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16 max-w-2xl mx-auto">
            <span className="inline-block px-4 py-2 bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              Why Verde Luxe
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-slate-900 mb-6">
              What makes us <span className="text-emerald-600 italic">different</span>
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Fully Insured", desc: "Complete peace of mind with our comprehensive coverage", color: "from-emerald-500 to-teal-500" },
              { icon: Leaf, title: "Eco-Friendly", desc: "Safe, sustainable products for your family and pets", color: "from-green-500 to-emerald-500" },
              { icon: Heart, title: "Satisfaction Guaranteed", desc: "Not happy? We'll re-clean for free within 24 hours", color: "from-rose-500 to-pink-500" },
              { icon: Clock, title: "Flexible Scheduling", desc: "Book online anytime — we work around your life", color: "from-blue-500 to-indigo-500" },
            ].map((feature, i) => (
              <AnimatedSection key={feature.title} delay={i * 100}>
                <div className="bg-white rounded-3xl p-8 shadow-lg shadow-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 h-full text-center group">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="py-24 bg-gradient-to-b from-white to-emerald-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-teal-100 rounded-full blur-3xl opacity-60" />

        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              How It Works
            </span>
            <h2 className="font-serif text-4xl md:text-5xl mb-6 text-slate-900">
              Three simple steps to a <span className="text-emerald-600 italic">spotless</span> home
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, icon: Calendar, title: "Book Online", desc: "Schedule your clean in under 2 minutes. Pick your date, time, and service." },
              { step: 2, icon: Wrench, title: "We Clean", desc: "Our vetted professionals arrive with everything needed for a perfect clean." },
              { step: 3, icon: ClipboardCheck, title: "Enjoy", desc: "Walk into your refreshed space and enjoy the results. Satisfaction guaranteed." },
            ].map((step, i) => (
              <AnimatedSection key={step.step} delay={i * 150}>
                <div className="text-center group p-8 rounded-3xl bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                      <step.icon className="w-10 h-10 text-emerald-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-amber-900 font-bold text-sm shadow-md border-2 border-white">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16 max-w-2xl mx-auto">
            <span className="inline-block px-4 py-2 bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              Our Results
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-slate-900 mb-6">
              See the <span className="text-emerald-600 italic">difference</span>
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Real transformations from our skilled cleaning professionals.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { before: "/imported/images/clean/before1.jpg", after: "/imported/images/clean/after1.jpg", alt: "Kitchen" },
              { before: "/imported/images/clean/before2.jpg", after: "/imported/images/clean/after2.jpg", alt: "Bathroom" },
              { before: "/imported/images/clean/before4.jpg", after: "/imported/images/clean/after4.jpg", alt: "Living Room" },
            ].map((item, i) => (
              <AnimatedSection key={item.alt} delay={i * 100}>
                <div className="rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-500">
                  <BeforeAfterSlider
                    beforeImage={item.before}
                    afterImage={item.after}
                    alt={item.alt}
                  />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16 max-w-2xl mx-auto">
            <span className="inline-block px-4 py-2 bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              Testimonials
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-slate-900 mb-6">
              Loved by <span className="text-emerald-600 italic">hundreds</span>
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <TestimonialCarousel />
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16 max-w-2xl mx-auto">
            <span className="inline-block px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              FAQ
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-slate-900 mb-6">
              Questions? We've got <span className="text-emerald-600 italic">answers</span>
            </h2>
          </AnimatedSection>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqData.map((faq, index) => (
              <AnimatedSection key={index} delay={index * 50}>
                <div className="bg-slate-50 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleFaq(index)}
                    className={`w-full px-6 py-5 text-left font-bold text-lg flex items-center justify-between transition-all ${openFaq === index ? "bg-emerald-600 text-white" : "text-slate-900 hover:bg-slate-100"
                      }`}
                  >
                    <span>{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 flex-shrink-0" />
                    )}
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${openFaq === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                  >
                    <div className="px-6 py-5 bg-white">
                      <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-emerald-50 via-teal-50 to-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-200/20 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center max-w-2xl mx-auto">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-8 leading-tight text-slate-900">
              Ready for the clean of your <span className="text-emerald-600 italic">dreams</span>?
            </h2>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Experience a flawless clean like never before. Book today and see the difference.
            </p>
            <Link
              to="/book-now"
              className="group inline-flex items-center gap-3 px-10 py-5 bg-emerald-600 text-white font-bold text-lg rounded-full hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:-translate-y-1"
            >
              Get Started Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </Layout>
  );
}

const faqData = [
  {
    question: "Can I trust my cleaning professional?",
    answer: "All of our cleaners are interviewed and pass a nationwide detailed background check. We do not hire anyone unless they are trustworthy and have a clean record.",
  },
  {
    question: "How do I book my first appointment?",
    answer: "You can fill out our contact form on the Book Now page. You can also call or text us too for help! +1 (734) 892-0931.",
  },
  {
    question: "Do you bring your own supplies?",
    answer: "Yes, we provide all cleaning supplies, products and equipment, unless there is a specific request for a certain service.",
  },
  {
    question: "What is your 100% satisfaction guaranteed policy?",
    answer: "If you're not happy with your cleaning, please let us know within 24 hours of your clean! We will come out and re-clean (within a 7-day window) at no additional charge to you.",
  },
  {
    question: "What is your reschedule policy?",
    answer: "Life happens and that's okay! In the event that something comes up, we just ask that you respond to our reminders and let us know at least 48 hours in advance.",
  },
];
