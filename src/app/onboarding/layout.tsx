import React from 'react';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl mb-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome to InvoiceGen
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Let's set up your business profile to get started
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        {children}
      </div>
    </div>
  );
}
