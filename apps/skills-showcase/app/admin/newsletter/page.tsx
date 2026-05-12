import type { Metadata } from "next";
import AdminNewsletterClient from "@/showcase/admin-newsletter";

export const metadata: Metadata = {
  title: "Newsletter Admin — G / agentic-skills",
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
