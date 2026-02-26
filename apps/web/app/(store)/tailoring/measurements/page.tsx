export default function MeasurementsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-[#1E2A78] mb-6">Measurement Guide</h1>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">How to Take Your Measurements</h2>
          <p className="text-gray-700 mb-4">
            Accurate measurements ensure the perfect fit. Follow these guidelines:
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Chest</h3>
          <p className="text-gray-700">Measure around the fullest part of your chest.</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Waist</h3>
          <p className="text-gray-700">Measure around your natural waistline.</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Sleeve Length</h3>
          <p className="text-gray-700">Measure from shoulder to wrist with arm slightly bent.</p>
        </div>
      </div>
    </div>
  );
}
