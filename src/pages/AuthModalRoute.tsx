import { Navigate, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import AuthModal from "@/components/shared/AuthModal";
import { authService } from "@/services/auth.service";

export default function AuthModalRoute() {
   const navigate = useNavigate();

   const { data: user, isLoading } = useQuery({
      queryKey: ["auth", "me"],
      queryFn: () => authService.me(),
      retry: false,
      staleTime: 1000 * 60 * 5,
   });

   if (isLoading) return null;
   if (user) return <Navigate to="/app" replace />;

   return (
      <AuthModal open={true} onOpenChange={(open) => { if (!open) navigate("/"); }} />
   );
}
