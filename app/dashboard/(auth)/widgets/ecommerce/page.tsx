import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "E-commerce Widgets",
    description:
      "A modern and elegant responsive sales admin Dashboard. Easily manage, analyze, and report your sales data. Built with shadcn/ui, Tailwind CSS, Next.js.",
    canonical: "/widgets/ecommerce"
  });
}

export default function Page() {
  return <div className="text-muted-foreground ps-2 text-sm">Coming soon...</div>;
}
