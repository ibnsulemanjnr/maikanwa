import Link from "next/link";
import { Button } from "@/components/ui";
import { CategoryCard } from "@/components/store";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-[#1E2A78] via-[#2A3A88] to-[#1E2A78] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Kayan inganci + dinki na zamani
            </h1>
            <p className="text-2xl md:text-3xl mb-4 text-white/95">
              Quality Fabrics. Clean Tailoring. Reliable Delivery.
            </p>
            <p className="text-lg md:text-xl mb-10 text-white/85 leading-relaxed">
              Buy premium fabrics, ready-made clothing, and get expert tailoring services — all in
              one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/shop">
                <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
                  Shop Now
                </Button>
              </Link>
              <Link href="/tailoring">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white text-white hover:bg-white hover:text-[#1E2A78] text-lg px-8 py-4"
                >
                  Tailoring Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-3">Shop by Category</h2>
            <p className="text-lg text-gray-600">Zaɓi abin da kake bukata</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <CategoryCard
              name="Fabrics"
              slug="fabrics"
              image="/images/categories/fabrics.jpg"
              productCount={150}
            />
            <CategoryCard
              name="Ready-made"
              slug="ready-made"
              image="/images/categories/ready-made.jpg"
              productCount={80}
            />
            <CategoryCard
              name="Caps"
              slug="caps"
              image="/images/categories/caps.jpg"
              productCount={45}
            />
            <CategoryCard
              name="Shoes"
              slug="shoes"
              image="/images/categories/shoes.jpg"
              productCount={60}
            />
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#1E2A78] to-[#2A3A88] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-3">Quality Guaranteed</h3>
              <p className="text-gray-600">Premium fabrics and materials from trusted suppliers</p>
            </div>
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F4B400] to-[#F5C542] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <svg
                  className="w-10 h-10 text-[#111827]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-3">Expert Tailoring</h3>
              <p className="text-gray-600">Professional tailors with years of experience</p>
            </div>
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#1E2A78] to-[#2A3A88] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-3">Fast Delivery</h3>
              <p className="text-gray-600">Reliable delivery across Nigeria</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-3">
              How Tailoring Works
            </h2>
            <p className="text-lg text-gray-600">Simple process from fabric to fit</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#F4B400] to-[#F5C542] rounded-2xl flex items-center justify-center mx-auto mb-5 text-[#111827] font-bold text-2xl shadow-lg">
                1
              </div>
              <h3 className="font-bold text-[#111827] mb-2 text-lg">Choose Fabric</h3>
              <p className="text-gray-600">Browse and select your preferred fabric</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#F4B400] to-[#F5C542] rounded-2xl flex items-center justify-center mx-auto mb-5 text-[#111827] font-bold text-2xl shadow-lg">
                2
              </div>
              <h3 className="font-bold text-[#111827] mb-2 text-lg">Add Tailoring</h3>
              <p className="text-gray-600">Select tailoring service and style</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#F4B400] to-[#F5C542] rounded-2xl flex items-center justify-center mx-auto mb-5 text-[#111827] font-bold text-2xl shadow-lg">
                3
              </div>
              <h3 className="font-bold text-[#111827] mb-2 text-lg">Submit Measurements</h3>
              <p className="text-gray-600">Provide your measurements or upload sheet</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#F4B400] to-[#F5C542] rounded-2xl flex items-center justify-center mx-auto mb-5 text-[#111827] font-bold text-2xl shadow-lg">
                4
              </div>
              <h3 className="font-bold text-[#111827] mb-2 text-lg">Receive & Enjoy</h3>
              <p className="text-gray-600">Get your perfectly tailored outfit</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-gradient-to-br from-[#1E2A78] via-[#2A3A88] to-[#1E2A78] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-10 text-white/90">
            Join thousands of satisfied customers who trust Maikanwa for quality fabrics and
            tailoring.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop">
              <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
                Browse Products
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-[#1E2A78] text-lg px-8 py-4"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
