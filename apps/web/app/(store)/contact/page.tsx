export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-[#1E2A78] mb-6">Contact Us</h1>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Get in Touch</h2>
          <p className="text-gray-700">
            We would love to hear from you. Reach out to us for any inquiries.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Email</h3>
          <p className="text-gray-700">info@maikanwa.com</p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Phone</h3>
          <p className="text-gray-700">+234 XXX XXX XXXX</p>
        </div>
      </div>
    </div>
  );
}
