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
