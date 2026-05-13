import type { Metadata } from "next";
import AdminNewsletterClient from "@/showcase/admin-newsletter";

export const metadata: Metadata = {
  title: "G Skillpacks Newsletter Admin",
  description: "Admin panel for managing newsletter subscribers.",
  robots: { index: false, follow: false },
};

export default function AdminNewsletterPage() {
  return (
    <main className="page">
      <AdminNewsletterClient />
    </main>
  );
}
