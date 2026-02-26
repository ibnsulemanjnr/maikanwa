export default function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-[#1E2A78] mb-6">Frequently Asked Questions</h1>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">How long does tailoring take?</h3>
          <p className="text-gray-700">Standard tailoring takes 7-14 business days.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Do you ship internationally?</h3>
          <p className="text-gray-700">Yes, we ship to select countries. Contact us for details.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
          <p className="text-gray-700">We accept card payments via Paystack.</p>
        </div>
      </div>
    </div>
  );
}
