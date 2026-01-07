/**
 * TestimonialsSection Component
 * Customer testimonials for the landing page
 */

'use client';

import React from 'react';
import { Card, CardDescription, CardHeader } from '@/components/ui/card';
import { Star, Users, Building2, TrendingUp } from 'lucide-react';

const testimonials = [
    {
        icon: Users,
        name: 'Rajesh Kumar',
        role: 'Freelance Developer',
        content: '"This tool has saved me hours every month. The GST calculations are automatic and the invoices look incredibly professional. Highly recommended!"',
    },
    {
        icon: Building2,
        name: 'Priya Sharma',
        role: 'Agency Owner',
        content: '"Managing invoices for multiple clients was a nightmare before. Now I can generate and track everything from one place. Game changer!"',
    },
    {
        icon: TrendingUp,
        name: 'Amit Patel',
        role: 'Small Business Owner',
        content: '"Simple, fast, and completely free. The PDF quality is excellent and my clients love receiving such professional-looking invoices."',
    },
];

export function TestimonialsSection() {
    return (
        <section id="testimonials" className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-28">
            <div className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 border border-primary/20 dark:border-primary/30">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-primary fill-primary" />
                    <span className="text-xs sm:text-sm font-medium text-primary">Testimonials</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-4">Loved by Businesses</h2>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                    See what our users have to say
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
                {testimonials.map((testimonial) => (
                    <Card
                        key={testimonial.name}
                        className="group border-2 border-primary/10 dark:border-primary/20 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300 hover-lift hover:shadow-xl dark:hover:shadow-primary/20"
                    >
                        <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30 rounded-full p-2.5 sm:p-3 group-hover:scale-110 transition-transform duration-300 shrink-0">
                                    <testimonial.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-sm sm:text-base truncate">{testimonial.name}</div>
                                    <div className="text-xs sm:text-sm text-muted-foreground">{testimonial.role}</div>
                                </div>
                            </div>
                            <div className="flex gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-yellow-500" />
                                ))}
                            </div>
                            <CardDescription className="text-sm sm:text-base leading-relaxed">
                                {testimonial.content}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </section>
    );
}

export default TestimonialsSection;
