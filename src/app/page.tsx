/**
 * Landing Page
 * Mobile-first responsive design with dark mode support
 * Refactored to use separate section components
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Splash } from '@/components/shared';
import {
  LandingNavbar,
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
  CTASection,
  LandingFooter,
} from '@/components/landing';

export default function LandingPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSplashFinish = () => {
    // After splash, navigate directly to login page
    try {
      router.push('/auth/login');
    } catch (e) {
      // fallback
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
    }
  };

  // Always show splash for 3 seconds then redirect to login
  if (showSplash) {
    return <Splash durationMs={3000} logoSrc="/loo.jpg" onFinish={handleSplashFinish} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 dark:from-background dark:via-primary/10 dark:to-accent/10 transition-colors duration-300">
      <LandingNavbar
        scrolled={scrolled}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
      />

      <HeroSection />

      <FeaturesSection />

      <HowItWorksSection />

      <TestimonialsSection />

      <CTASection />

      <LandingFooter />
    </div>
  );
}
