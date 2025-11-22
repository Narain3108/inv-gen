/**
 * Landing Page
 * Professional landing page with modern UI/UX
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Zap, 
  Shield, 
  Globe, 
  CheckCircle2, 
  ArrowRight,
  Building2,
  Users,
  Package,
  Download,
  CreditCard,
  TrendingUp,
  Menu,
  X,
  Star,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Navigation Header */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/80 backdrop-blur-xl shadow-lg border-b border-primary/10' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-accent shadow-lg group-hover:scale-110 transition-transform duration-200">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                InvoiceHub
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
                How It Works
              </Link>
              <Link href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
                Testimonials
              </Link>
              <Button 
                onClick={() => router.push('/invoices/dashboard')}
                className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-primary/10 shadow-xl animate-in slide-in-from-top-5">
              <div className="container mx-auto px-4 py-6 space-y-4">
                <Link 
                  href="#features" 
                  className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="#how-it-works" 
                  className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link 
                  href="#testimonials" 
                  className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Testimonials
                </Link>
                <Button 
                  onClick={() => router.push('/invoices/dashboard')}
                  className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 font-semibold"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20 md:pb-32 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-1000">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 shadow-lg">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Professional Invoice Management
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Create Stunning Invoices in{' '}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
                Seconds
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Streamline your billing process with our intuitive invoice generator. 
              Create, manage, and send professional invoices that get you paid faster.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => router.push('/invoices/dashboard')}
                className="bg-gradient-to-r from-primary to-accent text-white shadow-xl shadow-primary/30 hover:shadow-2xl hover:scale-105 transition-all duration-200 font-semibold text-base px-8 py-6 group"
              >
                Start Creating Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Free Forever Plan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Instant Setup</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 hover:border-primary/30 transition-all hover-lift">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">100%</div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">GST Compliant</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 hover:border-primary/30 transition-all hover-lift">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">Free</div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">Forever</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 hover:border-primary/30 transition-all hover-lift">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">Instant</div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">PDF Download</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 hover:border-primary/30 transition-all hover-lift">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">Cloud</div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">Storage</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 md:py-28">
        <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powerful Features</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold">Everything You Need</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features to streamline your invoicing workflow
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="group border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift hover:shadow-xl hover:shadow-primary/10">
            <CardHeader className="space-y-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 w-fit group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">GST-Compliant Invoices</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Automatically calculate CGST, SGST, and IGST based on state codes. 
                Fully compliant with Indian GST regulations.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift hover:shadow-xl hover:shadow-primary/10">
            <CardHeader className="space-y-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 w-fit group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Multiple Companies</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Manage invoices for multiple companies from one account. 
                Perfect for consultants and agencies.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift hover:shadow-xl hover:shadow-primary/10">
            <CardHeader className="space-y-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 w-fit group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Client Management</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Store client details with GSTIN verification. 
                Quick access to billing information.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift hover:shadow-xl hover:shadow-primary/10">
            <CardHeader className="space-y-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 w-fit group-hover:scale-110 transition-transform duration-300">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Product Catalog</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Create a product/service catalog with HSN codes and GST rates. 
                Add items to invoices with one click.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift hover:shadow-xl hover:shadow-primary/10">
            <CardHeader className="space-y-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 w-fit group-hover:scale-110 transition-transform duration-300">
                <Download className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Instant PDF Generation</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Generate professional PDF invoices instantly. 
                Preview before downloading.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift hover:shadow-xl hover:shadow-primary/10">
            <CardHeader className="space-y-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 w-fit group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Cloud-Based</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Access your invoices from anywhere. 
                Data synced across all devices in real-time.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-20 md:py-28 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background rounded-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Simple Process</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold">How It Works</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Start generating invoices in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="relative group">
              <div className="text-center p-8 rounded-2xl border-2 border-primary/10 bg-background/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover-lift hover:shadow-xl">
                <div className="relative mb-6">
                  <div className="bg-gradient-to-r from-primary to-accent text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
                    1
                  </div>
                  {/* Connecting Line - Desktop Only */}
                  <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-y-1/2" />
                </div>
                <h3 className="text-xl font-bold mb-3">Setup Company</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Add your company details with GSTIN, address, and bank information
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="text-center p-8 rounded-2xl border-2 border-primary/10 bg-background/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover-lift hover:shadow-xl">
                <div className="relative mb-6">
                  <div className="bg-gradient-to-r from-primary to-accent text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
                    2
                  </div>
                  {/* Connecting Line - Desktop Only */}
                  <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-y-1/2" />
                </div>
                <h3 className="text-xl font-bold mb-3">Add Clients & Products</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Create your client database and product catalog for quick invoicing
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="text-center p-8 rounded-2xl border-2 border-primary/10 bg-background/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover-lift hover:shadow-xl">
                <div className="relative mb-6">
                  <div className="bg-gradient-to-r from-primary to-accent text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
                    3
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">Generate Invoice</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Create professional invoices and download as PDF instantly
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="container mx-auto px-4 py-20 md:py-28">
        <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
            <Star className="h-4 w-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-primary">Testimonials</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold">Loved by Businesses</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            See what our users have to say
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="group border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift hover:shadow-xl hover:shadow-primary/10">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-full p-3 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold">Rajesh Kumar</div>
                  <div className="text-sm text-muted-foreground">Freelance Developer</div>
                </div>
              </div>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <CardDescription className="text-base leading-relaxed">
                "This tool has saved me hours every month. The GST calculations are automatic 
                and the invoices look incredibly professional. Highly recommended!"
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift hover:shadow-xl hover:shadow-primary/10">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-full p-3 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold">Priya Sharma</div>
                  <div className="text-sm text-muted-foreground">Agency Owner</div>
                </div>
              </div>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <CardDescription className="text-base leading-relaxed">
                "Managing invoices for multiple clients was a nightmare before. 
                Now I can generate and track everything from one place. Game changer!"
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift hover:shadow-xl hover:shadow-primary/10">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-full p-3 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold">Amit Patel</div>
                  <div className="text-sm text-muted-foreground">Small Business Owner</div>
                </div>
              </div>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <CardDescription className="text-base leading-relaxed">
                "Simple, fast, and completely free. The PDF quality is excellent and 
                my clients love receiving such professional-looking invoices."
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="relative overflow-hidden rounded-3xl">
          {/* Background with Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-shimmer" />
          
          {/* Content */}
          <div className="relative p-12 md:p-16 text-center text-white">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                Ready to Streamline Your Invoicing?
              </h2>
              <p className="text-lg md:text-xl opacity-95 leading-relaxed">
                Join thousands of businesses generating professional GST invoices every day. 
                No credit card required. Start for free in seconds.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="bg-white text-primary hover:bg-white/90 shadow-xl font-semibold text-base px-8 py-6 group"
                  onClick={() => router.push('/invoices/dashboard')}
                >
                  Get Started Now - It's Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white/20 text-white bg-transparent hover:bg-white/5 hover:border-white/30 transition-all duration-200 font-semibold text-base px-8 py-6 backdrop-blur-sm"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Learn More
                </Button>
              </div>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  <span>Lightning Fast</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <span>Cloud Synced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/10 mt-20">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-4 gap-8 md:gap-12">
            {/* Brand */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2 group w-fit">
                <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-accent shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  InvoiceHub
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Professional invoice generator for businesses of all sizes. 
                Create GST-compliant invoices in seconds.
              </p>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-bold mb-4 text-foreground">Features</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">GST Invoices</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Client Management</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Product Catalog</li>
                <li className="hover:text-primary transition-colors cursor-pointer">PDF Export</li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4 text-foreground">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/invoices/invoices" className="text-muted-foreground hover:text-primary transition-colors">
                    Generate Invoice
                  </Link>
                </li>
                <li>
                  <Link href="/invoices/clients" className="text-muted-foreground hover:text-primary transition-colors">
                    Manage Clients
                  </Link>
                </li>
                <li>
                  <Link href="/invoices/products" className="text-muted-foreground hover:text-primary transition-colors">
                    Products
                  </Link>
                </li>
                <li>
                  <Link href="/invoices/settings" className="text-muted-foreground hover:text-primary transition-colors">
                    Settings
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold mb-4 text-foreground">Support</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">Help Center</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Terms of Service</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Contact Us</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-primary/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} InvoiceHub. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="hover:text-primary transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-primary transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-primary transition-colors cursor-pointer">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
