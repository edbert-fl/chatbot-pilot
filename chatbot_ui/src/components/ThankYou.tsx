'use client';

export default function ThankYou() {
  return (
    <div className="space-y-2">
      
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-green-800">Your message has been sent successfully!</h3>
            <p className="text-sm text-green-700">
              We&apos;ll get back to you within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
