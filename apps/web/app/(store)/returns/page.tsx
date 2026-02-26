export default function ReturnsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-[#1E2A78] mb-6">Returns & Refunds</h1>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Return Policy</h2>
          <p className="text-gray-700">
            Items can be returned within 14 days of delivery in original condition.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Custom Orders</h2>
          <p className="text-gray-700">
            Custom tailored items cannot be returned unless defective.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Refund Process</h2>
          <p className="text-gray-700">
            Refunds are processed within 5-7 business days after receiving the returned item.
          </p>
        </div>
      </div>
    </div>
  );
}
