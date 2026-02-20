import Loader from "@/components/ui/Loader";

export default function AdminHome() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      <p className="mt-2 text-gray-600">Products • Orders • Tailoring • Reports</p>
      <div className="mt-6">
        <Loader />
      </div>
    </div>
  );
}
