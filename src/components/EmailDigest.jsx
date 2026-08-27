import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Mail, ArrowRight, Check } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/**
 * EmailDigest — Weekly digest signup section.
 * Client-side only — shows success state on submit.
 */
export default function EmailDigest() {
  const sectionRef = useRef(null);
  const cardRef = useRef(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (cardRef.current) {
        gsap.fromTo(cardRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power3.out",
            scrollTrigger: { trigger: cardRef.current, start: "top 88%", toggleActions: "play none none none" }
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <section
      ref={sectionRef}
      id="email-digest"
      className="bg-paper"
      style={{ paddingTop: "4rem", paddingBottom: "6rem" }}
      aria-label="Weekly email digest signup"
    >
      <div className="container-bp">
        <div ref={cardRef} className="email-digest-card" style={{ opacity: 0 }}>
          {submitted ? (
            /* Success State */
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-16 h-16 bg-green-500/10 border-2 border-green-500/30 rounded-2xl flex items-center justify-center mb-6">
                <Check size={28} className="text-green-500" />
              </div>
              <h3 className="font-heading text-2xl md:text-3xl font-bold mb-3">
                You&apos;re in.
              </h3>
              <p className="font-data text-sm text-midgray max-w-md leading-relaxed">
                Every Sunday, you&apos;ll get the top 5 trending Filipino reads — curated by BookPulse, delivered to your inbox.
              </p>
            </div>
          ) : (
            /* Form State */
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-signal rounded-xl flex items-center justify-center">
                    <Mail size={18} className="text-white" aria-hidden="true" />
                  </div>
                  <span className="font-data text-[10px] text-signal uppercase tracking-[0.2em] font-bold">
                    Weekly Digest
                  </span>
                </div>
                <h3 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3">
                  Never miss a trend.
                </h3>
                <p className="font-drama text-lg text-signal mb-2">
                  Every Sunday. 5 books. Zero noise.
                </p>
                <p className="font-data text-xs text-midgray leading-relaxed max-w-md">
                  Get the top 5 trending Filipino reads delivered to your inbox every Sunday morning. No spam, no affiliate links — just signal.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="w-full md:w-auto flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="email-digest-input font-data"
                    aria-label="Email address"
                    id="email-digest-input"
                  />
                  <button
                    type="submit"
                    className="email-digest-btn font-heading"
                    id="email-digest-submit"
                  >
                    Subscribe
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
                {error && (
                  <p className="font-data text-xs text-signal mt-2" role="alert">{error}</p>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
