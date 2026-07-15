"use client";
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface TestimonialItem {
  name: string;
  role?: string;
  company?: string;
  avatar?: string;
  content?: string;
  text?: string;
  rating?: number;
}

export default function Testimonials({ items, brand = "var(--color-brand-500)" }: { items?: TestimonialItem[]; brand?: string }) {
  const t = useTranslations('landing.testimonials');
  const defaultTestimonials = t.raw('defaultItems') as TestimonialItem[];
  const testimonials = items && items.length > 0 ? items : defaultTestimonials;
  const isUrl = (s?: string) => !!s && s.startsWith("http");
  const initials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="landing-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('heading')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[var(--color-brand-500)]/30 transition-all duration-300"
            >
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating || 5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                &ldquo;{testimonial.text || testimonial.content}&rdquo;
              </blockquote>

              <div className="flex items-center">
                {isUrl(testimonial.avatar) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover me-4" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center me-4" style={{ background: `${brand}22` }}>
                    <span className="font-semibold text-sm" style={{ color: brand }}>
                      {testimonial.avatar && testimonial.avatar.length <= 3 ? testimonial.avatar : initials(testimonial.name)}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{[testimonial.role, testimonial.company].filter(Boolean).join(" • ")}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 text-center"
        >
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-start mb-6 md:mb-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('bottomCta.title')}
                </h3>
                <p className="text-gray-600">
                  {t('bottomCta.subtitle')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="px-6 py-3 bg-[var(--color-brand-500)] text-white rounded-lg font-medium hover:bg-[var(--color-brand-600)] transition-colors">
                  {t('bottomCta.trial')}
                </button>
                <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  {t('bottomCta.demo')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
