/**
 * DiscGuard — wraps protected routes and redirects to /disc if the user
 * hasn't completed the DISC assessment yet.
 *
 * Checks Supabase disc_results table (source of truth, works across devices)
 */
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function DiscGuard({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [checking, setChecking] = useState(true);
    const [hasDisc, setHasDisc] = useState(false);

    useEffect(() => {
        if (!user) {
            setHasDisc(false);
            setChecking(false);
            return;
        }

        // Check Supabase database — source of truth
        checkDiscCompletion();
    }, [user]);

    const checkDiscCompletion = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("disc_results")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) {
                console.error("Error checking DISC status:", error);
                setHasDisc(false);
            } else {
                setHasDisc(!!data);
            }
        } catch (err) {
            console.error("Error:", err);
            setHasDisc(false);
        } finally {
            setChecking(false);
        }
    };

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
