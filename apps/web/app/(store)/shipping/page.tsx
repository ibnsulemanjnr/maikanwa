export default function ShippingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-[#1E2A78] mb-6">Shipping Information</h1>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Delivery Times</h2>
          <p className="text-gray-700">Standard delivery: 3-5 business days within Nigeria.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Shipping Costs</h2>
          <p className="text-gray-700">
            Shipping costs are calculated at checkout based on your location.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Tracking</h2>
          <p className="text-gray-700">Track your order from your account dashboard.</p>
        </div>
      </div>
    </div>
  );
}
