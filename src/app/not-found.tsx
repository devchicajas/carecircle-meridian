import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold text-ink-900">
        Not found · No encontrado
      </h1>
      <p className="max-w-md text-ink-600">
        That care record is not available in the current Meridian snapshot.
      </p>
      <Button asChild>
        <Link href="/patients">Back to patients</Link>
      </Button>
    </div>
  );
}
