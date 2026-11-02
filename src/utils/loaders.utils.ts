import { redirect } from "react-router";
import { queryClient } from "@/lib/queryClient";
import { workflowService } from "@/services/workflow.service";
import { agentService } from "@/services/agent.service";
import { authService } from "@/services/auth.service";

export const authLoader = async () => {
   for (let i = 0; i < 3; i++) {
      try {
         return await authService.me();
      } catch {
         if (i < 2) await new Promise((r) => setTimeout(r, 300));
      }
   }
   throw redirect("/");
};

export const workflowsLoader = async () => {
   try {
      return await queryClient.query({
         queryKey: ["workflows"],
         queryFn: () => workflowService.getAll(),
         staleTime: "static",
      });
   } catch {
      return null;
   }
};

export const agentsLoader = async () => {
   try {
      return await queryClient.query({
         queryKey: ["agents"],
         queryFn: () => agentService.getAll(),
         staleTime: "static",
      });
   } catch {
      return null;
   }
};

export const workflowByIdLoader = async ({ params }: { params: { id?: string } }) => {
   const id = params.id;
   if (!id) return null;
   try {
      return await queryClient.query({
         queryKey: ["workflows", id],
         queryFn: () => workflowService.getById(id),
         staleTime: 30_000,
      });
   } catch {
      return null;
   }
};
