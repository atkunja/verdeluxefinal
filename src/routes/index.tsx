import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "~/components/Layout";
import { BeforeAfterSlider } from "~/components/BeforeAfterSlider";
import { TestimonialCarousel } from "~/components/TestimonialCarousel";
import {
  Home,
  CheckCircle,
  Shield,
  Building,
  ArrowRightCircle,
  Settings,
  Calendar,
  Wrench,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,

  Sparkles,
} from "lucide-react";
import { SEO } from "~/components/SEO";
import { useState } from "react";
import { formatTime12Hour } from "~/utils/formatTime";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <Layout>
      <SEO />
      {/* Hero Section */}
      <section className="relative pt-[150px] pb-[100px] overflow-hidden h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/imported/images/bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />

        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 mb-6 animate-in slide-in-from-top duration-700">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">Premium Service</span>
            </div>
            <h2 className="font-heading text-[52px] md:text-[72px] leading-[1.1] text-white mb-6 font-bold tracking-tight animate-in slide-in-from-left duration-700">
              Professional Cleaning<br />
              <span className="text-emerald-400 italic">Effortless</span> Results
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl leading-relaxed animate-in slide-in-from-left delay-150 duration-700">
              Verde Luxe delivers meticulous, eco-friendly cleaning services tailored to
              your lifestyle — so you can reclaim your time and enjoy a pristine space.
            </p>
            <div className="flex flex-wrap gap-4 animate-in slide-in-from-left delay-300 duration-700">
              <Link
                to="/book-now"
                className="inline-block px-8 py-4 text-sm font-bold text-white bg-primary rounded-xl hover:scale-[1.05] hover:shadow-2xl hover:shadow-primary/40 transition-all uppercase tracking-wider"
              >
                Book Your Clean
              </Link>
              <a
                href="tel:+17348920931"
                className="inline-block px-8 py-4 text-sm font-bold text-white bg-white/10 backdrop-blur border border-white/30 rounded-xl hover:bg-white hover:text-black transition-all uppercase tracking-wider"
              >
                Call Us Now
              </a>
            </div>
          </div>
        </div>
      </section>



      {/* Services Section */}
      <section className="py-10 md:py-[60px] bg-gray-bg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-[60px] px-0 md:px-[60px] max-w-none mx-auto">
            <h2 className="text-[28px] md:text-[36px] font-bold text-black mb-5">
              Our Cleaning Services
            </h2>
            <p className="text-[15px] text-gray-text leading-relaxed">
              At Verde Luxe, we take pride in offering a range of expert
              cleaning solutions tailored to suit every need. Whether it's your
              cozy home, a rental property, or a commercial space, our
              professional team ensures pristine results every time. Explore our
              services below to find what fits you best.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Service Cards */}
            <Link
              to="/services/standard-home-cleaning"
              className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] transition-shadow group text-center h-full"
            >
              <div className="text-primary mb-[15px] flex justify-center">
                <Home className="w-11 h-11" />
              </div>
              <h3 className="text-base font-bold text-black mb-[10px] group-hover:text-primary-dark transition-colors">
                Standard Home Cleaning
              </h3>
              <p className="text-sm text-[#565656] mb-0">Effortless Clean, Every Time</p>
            </Link>

            <Link
              to="/services/deep-home-cleaning"
              className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] transition-shadow group text-center h-full"
            >
              <div className="text-primary mb-[15px] flex justify-center">
                <CheckCircle className="w-11 h-11" />
              </div>
              <h3 className="text-base font-bold text-black mb-[10px] group-hover:text-primary-dark transition-colors">
                Deep Home Cleaning
              </h3>
              <p className="text-sm text-[#565656] mb-0">A Truly Deep Clean</p>
            </Link>

            <Link
              to="/services/vacation-rental-cleaning"
              className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] transition-shadow group text-center h-full"
            >
              <div className="text-primary mb-[15px] flex justify-center">
                <Shield className="w-11 h-11" />
              </div>
              <h3 className="text-base font-bold text-black mb-[10px] group-hover:text-primary-dark transition-colors">
                Vacation Rental Cleaning
              </h3>
              <p className="text-sm text-[#565656] mb-0">Hospitality-Level Cleaning</p>
            </Link>

            <Link
              to="/services/commercial-cleaning"
              className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] transition-shadow group text-center h-full"
            >
              <div className="text-primary mb-[15px] flex justify-center">
                <Building className="w-11 h-11" />
              </div>
              <h3 className="text-base font-bold text-black mb-[10px] group-hover:text-primary-dark transition-colors">
                Commercial Cleaning
              </h3>
              <p className="text-sm text-[#565656] mb-0">Professional Spaces, Maintained</p>
            </Link>

            <Link
              to="/services/moving-cleaning"
              className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] transition-shadow group text-center h-full"
            >
              <div className="text-primary mb-[15px] flex justify-center">
                <ArrowRightCircle className="w-11 h-11" />
              </div>
              <h3 className="text-base font-bold text-black mb-[10px] group-hover:text-primary-dark transition-colors">
                Move-In/Out Cleaning
              </h3>
              <p className="text-sm text-[#565656] mb-0">One Less Thing to Worry About</p>
            </Link>

            <Link
              to="/services/post-construction-cleaning"
              className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] transition-shadow group text-center h-full"
            >
              <div className="text-primary mb-[15px] flex justify-center">
                <Settings className="w-11 h-11" />
              </div>
              <h3 className="text-base font-bold text-black mb-[10px] group-hover:text-primary-dark transition-colors">
                Post Construction Cleaning
              </h3>
              <p className="text-sm text-[#565656] mb-0">Ready for a Fresh Start</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Mission & Story Section */}
      <section className="py-10 md:py-[60px]">
        <div className="container mx-auto px-4">
          {/* Mission */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-lg border border-gray-200 p-2 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)]">
                <img
                  src="/imported/images/mission.jpg"
                  alt="Our Mission"
                  className="w-full rounded-[5px]"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2 px-0 lg:px-10 pb-0">
              <h2 className="text-[28px] md:text-[34px] font-bold text-black mb-5">Our Mission</h2>
              <p className="text-[15px] text-gray-text leading-relaxed mb-0">
                Verde Luxe was founded with one simple mission: to simplify lives
                through immaculate cleaning. We're committed to quality,
                reliability, and detail — giving clients peace of mind and
                pristine results every time.
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-200 my-10 md:my-[60px]" />

          {/* Story */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2">
              <div className="bg-white rounded-lg border border-gray-200 p-2 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)]">
                <img
                  src="/imported/images/story.jpg"
                  alt="Our Story"
                  className="w-full rounded-[5px]"
                />
              </div>
            </div>
            <div className="order-1 px-0 lg:px-10 pb-0">
              <h2 className="text-[28px] md:text-[34px] font-bold text-black mb-5">Our Story</h2>
              <p className="text-[15px] text-gray-text leading-relaxed mb-0">
                What began as a local service between friends grew into a trusted
                cleaning partner for homes and businesses alike. With humble
                beginnings and high standards, our story is one of dedication,
                teamwork, and continuous growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process Section */}
      <section className="pt-10 pb-5 md:pt-20 md:pb-10 bg-gray-bg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-[60px] px-0 md:px-[60px] max-w-none mx-auto">
            <h2 className="text-[28px] md:text-[36px] font-bold text-black mb-5">
              Our 3-Step Process
            </h2>
            <p className="text-[15px] text-gray-text leading-relaxed">
              At Verde Luxe, we've refined our process into three seamless steps
              — designed for simplicity, transparency, and satisfaction from
              start to finish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-white rounded-lg border-0 p-[30px] pt-10 text-center shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] h-[90%] mb-10">
              <div className="text-primary mb-5 flex justify-center">
                <Calendar className="w-11 h-11" />
              </div>
              <div className="inline-block bg-primary text-white text-sm font-semibold px-[15px] py-[6px] rounded-full mb-[5px] font-heading leading-none">
                Step 1
              </div>
              <h2 className="text-lg font-bold text-black mb-[15px]">
                Schedule & Consult
              </h2>
              <p className="text-sm text-gray-text leading-relaxed mb-0">
                Begin by booking your appointment online or by phone. We'll
                discuss your needs, space, and preferences to tailor the perfect
                cleaning plan.
              </p>
            </div>

            <div className="bg-white rounded-lg border-0 p-[30px] pt-10 text-center shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] h-[90%] mb-10">
              <div className="text-primary mb-5 flex justify-center">
                <Wrench className="w-11 h-11" />
              </div>
              <div className="inline-block bg-primary text-white text-sm font-semibold px-[15px] py-[6px] rounded-full mb-[5px] font-heading leading-none">
                Step 2
              </div>
              <h2 className="text-lg font-bold text-black mb-[15px]">
                Clean with Care
              </h2>
              <p className="text-sm text-gray-text leading-relaxed mb-0">
                Our trusted professionals arrive fully equipped, ready to clean
                with precision and attention to detail — using safe, high-quality
                products.
              </p>
            </div>

            <div className="bg-white rounded-lg border-0 p-[30px] pt-10 text-center shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] h-[90%] mb-10">
              <div className="text-primary mb-5 flex justify-center">
                <ClipboardCheck className="w-11 h-11" />
              </div>
              <div className="inline-block bg-primary text-white text-sm font-semibold px-[15px] py-[6px] rounded-full mb-[5px] font-heading leading-none">
                Step 3
              </div>
              <h2 className="text-lg font-bold text-black mb-[15px]">
                Review & Refresh
              </h2>
              <p className="text-sm text-gray-text leading-relaxed mb-0">
                After the service, we walk you through the results and ensure
                everything meets your expectations. Fresh, spotless spaces —
                guaranteed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-10 md:py-[60px]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-[60px] px-0 md:px-[60px] max-w-none mx-auto">
            <h2 className="text-[28px] md:text-[36px] font-bold text-black mb-5">
              See the Difference
            </h2>
            <p className="text-[15px] text-gray-text leading-relaxed">
              At Verde Luxe, we connect clients with professionals who transform
              messy spaces into spotless environments. Explore real results below
              through our interactive sliders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0)] hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] transition-shadow">
              <BeforeAfterSlider
                beforeImage="/imported/images/clean/before1.jpg"
                afterImage="/imported/images/clean/after1.jpg"
                alt="Kitchen Cleaning"
              />
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0)] hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] transition-shadow">
              <BeforeAfterSlider
                beforeImage="/imported/images/clean/before2.jpg"
                afterImage="/imported/images/clean/after2.jpg"
                alt="Bathroom Cleaning"
              />
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0)] hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] transition-shadow">
              <BeforeAfterSlider
                beforeImage="/imported/images/clean/before4.jpg"
                afterImage="/imported/images/clean/after4.jpg"
                alt="Living Room Cleaning"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-10 md:py-[60px] bg-gray-bg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-[60px] px-0 md:px-[60px] max-w-none mx-auto">
            <h2 className="text-[28px] md:text-[36px] font-bold text-black mb-5">
              What Our Clients Say
            </h2>
            <p className="text-[15px] text-gray-text leading-relaxed">
              We value our clients' feedback and strive to exceed their
              expectations with every service. Here's what some of them have to
              say about their experience with Verde Luxe Cleaning.
            </p>
          </div>

          <TestimonialCarousel />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-10 md:py-[60px]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-[60px] px-0 md:px-[60px] max-w-none mx-auto">
            <h2 className="text-[28px] md:text-[36px] font-bold text-black mb-5">FAQ</h2>
            <p className="text-[15px] text-gray-text leading-relaxed">
              HOW CAN WE HELP?
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-[15px]"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className={`w-full px-6 py-4 text-left font-semibold text-base flex items-center justify-between transition-colors ${openFaq === index
                    ? "bg-primary-dark text-white rounded-t-lg"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300 rounded-lg"
                    }`}
                >
                  <span>{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 bg-white pb-[5px]">
                    <p className="text-gray-text leading-relaxed text-[15px]">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative pt-20 pb-10 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: "url('/imported/images/bg2.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 container mx-auto px-4 text-center mb-[30px]">
          <h2 className="text-[28px] md:text-[34px] font-bold text-white mb-[30px]">
            Get professional & affordable
            <br />
            house cleaning today
          </h2>
          <Link
            to="/book-now"
            className="inline-block px-[25px] py-[15px] text-[15px] font-semibold text-white bg-primary rounded-full hover:bg-primary-dark transition-all uppercase mb-2"
          >
            Book Now
          </Link>
        </div>
      </section>
    </Layout>
  );
}

const faqData = [
  {
    question: "Can I trust my cleaning professional?",
    answer:
      "All of our cleaners are interviewed and pass a nationwide detailed background check. We do not hire anyone unless they are trustworthy and have a clean record.",
  },
  {
    question: "How do I book my first appointment?",
    answer:
      "You can fill out our contact form on the Book Now page. You can also call or text us too for help! +1 (734) 892-0931.",
  },
  {
    question: "Do you bring your own supplies?",
    answer:
      "Yes, we provide all cleaning supplies, products and equipment, unless there is a specific request for a certain service.",
  },
  {
    question: "What services do we NOT do?",
    answer:
      "For our own health, safety, and liability concerns, we do not clean/perform the following: blinds that are prone to breaking (ex. white, flimsy blinds), hoarder homes, biohazards (feces, urine, vomit, blood, drug paraphernalia, etc), infestations (bugs, pests, etc), climb/use second story ladders, etc.",
  },
  {
    question: "What is your 100% satisfaction guaranteed policy?",
    answer:
      "If you're not happy with your cleaning, please let us know within 24 hours of your clean! We will come out and re-clean (within a 7-day window) at no additional charge to you. Customer satisfaction is our number one priority.",
  },
  {
    question: "Is my billing information kept safe and secure?",
    answer:
      "We have three levels of security in place. First off, our booking page is protected by extended validation SSL. Secondly, our booking form has it's own layer of 256 bit security. Third, credit card transactions are processed by Stripe and is layered on their own 256 security protocol. In addition, no credit card numbers are stored in our system (only a token that allows us to charge the card). Rest assured, we take security very seriously.",
  },
  {
    question: "What is your reschedule policy?",
    answer:
      "Life happens and that's okay! In the event that something comes up, we just ask that you respond to our reminders and let us know at least 48 hours in advance. Anything canceled less than 24-48 hours in advance will be charged a cancellation fee, which goes right to our cleaners for the loss of work that day.",
  },
];
