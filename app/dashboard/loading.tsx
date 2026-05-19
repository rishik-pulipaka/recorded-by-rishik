import { Montserrat } from "next/font/google";

const mono = Montserrat({ subsets: ["latin"], weight: "400" });

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className={`min-h-screen bg-primary text-secondary px-6 py-10 ${mono.className}`}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    </div>
  );
}
