/**
 * DiscGuard — wraps protected routes and redirects to /disc if the user
 * hasn't completed the DISC assessment yet.
 *
 * Must be placed INSIDE AuthGuard (requires user to be authenticated).
 */
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export default function DiscGuard({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [checking, setChecking] = useState(true);
    const [hasDisc, setHasDisc] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Check localStorage first — fast path
        const cached = localStorage.getItem(`disc_result_${user.id}`);
        if (cached) {
            setHasDisc(true);
            setChecking(false);
            return;
        }

        // No local cache — confirm user is on /disc already or hasn't done it
        setHasDisc(false);
        setChecking(false);
    }, [user]);

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="space-y-4 w-full max-w-md px-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        );
    }

    if (!hasDisc) {
        return <Navigate to="/disc" replace />;
    }

    return <>{children}</>;
}
