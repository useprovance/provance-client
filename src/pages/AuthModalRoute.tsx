import { useNavigate } from "react-router";
import AuthModal from "@/components/shared/AuthModal";

export default function AuthModalRoute() {
   const navigate = useNavigate();
   return (
      <AuthModal open={true} onOpenChange={(open) => { if (!open) navigate("/"); }} />
   );
}
