import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#1E2A78] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Maikanwa</h3>
            <p className="text-sm text-gray-300">
              Kayan inganci + dinki na zamani.
              <br />
              Quality fabrics. Clean tailoring.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shop/fabrics" className="text-gray-300 hover:text-[#F4B400]">Fabrics</Link></li>
              <li><Link href="/shop/ready-made" className="text-gray-300 hover:text-[#F4B400]">Ready-made</Link></li>
              <li><Link href="/shop/caps" className="text-gray-300 hover:text-[#F4B400]">Caps</Link></li>
              <li><Link href="/shop/shoes" className="text-gray-300 hover:text-[#F4B400]">Shoes</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tailoring" className="text-gray-300 hover:text-[#F4B400]">Tailoring</Link></li>
              <li><Link href="/tailoring/measurements" className="text-gray-300 hover:text-[#F4B400]">Measurements</Link></li>
              <li><Link href="/orders" className="text-gray-300 hover:text-[#F4B400]">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="text-gray-300 hover:text-[#F4B400]">Contact</Link></li>
              <li><Link href="/faq" className="text-gray-300 hover:text-[#F4B400]">FAQ</Link></li>
              <li><Link href="/shipping" className="text-gray-300 hover:text-[#F4B400]">Shipping</Link></li>
              <li><Link href="/returns" className="text-gray-300 hover:text-[#F4B400]">Returns</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2A3A88] mt-8 pt-8 text-sm text-gray-300 text-center">
          <p>&copy; {new Date().getFullYear()} Maikanwa Clothing. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
