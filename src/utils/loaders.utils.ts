import { queryClient } from "@/lib/queryClient";
import { workflowService } from "@/services/workflow.service";

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
