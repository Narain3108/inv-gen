/**
 * Landing Page
 * SaaS-style home page for Invoice Generator
 */

'use client';

import { useEffect } from 'react';
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
  TrendingUp
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Professional Invoice Generator</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Generate Professional
            <br />
            GST Invoices Instantly
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create, manage, and track professional GST-compliant invoices in seconds. 
            Perfect for freelancers, small businesses, and enterprises.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => router.push('/invoices')}
            >
              Start Generating Bills
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">GST Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">Free</div>
              <div className="text-sm text-muted-foreground">Forever</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">Instant</div>
              <div className="text-sm text-muted-foreground">PDF Download</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">Cloud</div>
              <div className="text-sm text-muted-foreground">Storage</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-xl text-muted-foreground">
            Powerful features to streamline your invoicing workflow
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <FileText className="h-12 w-12 text-primary mb-4" />
              <CardTitle>GST-Compliant Invoices</CardTitle>
              <CardDescription>
                Automatically calculate CGST, SGST, and IGST based on state codes. 
                Fully compliant with Indian GST regulations.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Building2 className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Multiple Companies</CardTitle>
              <CardDescription>
                Manage invoices for multiple companies from one account. 
                Perfect for consultants and agencies.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Client Management</CardTitle>
              <CardDescription>
                Store client details with GSTIN verification. 
                Quick access to billing information.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Package className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>
                Create a product/service catalog with HSN codes and GST rates. 
                Add items to invoices with one click.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Download className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Instant PDF Generation</CardTitle>
              <CardDescription>
                Generate professional PDF invoices instantly. 
                Preview before downloading.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Globe className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Cloud-Based</CardTitle>
              <CardDescription>
                Access your invoices from anywhere. 
                Data synced across all devices in real-time.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-3xl my-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground">
            Start generating invoices in 3 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Setup Company</h3>
            <p className="text-muted-foreground">
              Add your company details with GSTIN, address, and bank information
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Add Clients & Products</h3>
            <p className="text-muted-foreground">
              Create your client database and product catalog for quick invoicing
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Generate Invoice</h3>
            <p className="text-muted-foreground">
              Create professional invoices and download as PDF instantly
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Loved by Businesses</h2>
          <p className="text-xl text-muted-foreground">
            See what our users have to say
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Rajesh Kumar</div>
                  <div className="text-sm text-muted-foreground">Freelance Developer</div>
                </div>
              </div>
              <CardDescription className="text-base">
                "This tool has saved me hours every month. The GST calculations are automatic 
                and the invoices look incredibly professional. Highly recommended!"
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Priya Sharma</div>
                  <div className="text-sm text-muted-foreground">Agency Owner</div>
                </div>
              </div>
              <CardDescription className="text-base">
                "Managing invoices for multiple clients was a nightmare before. 
                Now I can generate and track everything from one place. Game changer!"
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Amit Patel</div>
                  <div className="text-sm text-muted-foreground">Small Business Owner</div>
                </div>
              </div>
              <CardDescription className="text-base">
                "Simple, fast, and completely free. The PDF quality is excellent and 
                my clients love receiving such professional-looking invoices."
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Streamline Your Invoicing?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of businesses generating professional GST invoices every day
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-6"
              onClick={() => router.push('/invoices')}
            >
              Get Started Now - It's Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">InvoiceHub</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional invoice generator for businesses of all sizes
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>GST Invoices</li>
                <li>Client Management</li>
                <li>Product Catalog</li>
                <li>PDF Export</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/invoices" className="text-muted-foreground hover:text-primary">
                    Generate Invoice
                  </Link>
                </li>
                <li>
                  <Link href="/invoices/clients" className="text-muted-foreground hover:text-primary">
                    Manage Clients
                  </Link>
                </li>
                <li>
                  <Link href="/invoices/products" className="text-muted-foreground hover:text-primary">
                    Products
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Help Center</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Contact Us</li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} InvoiceHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
