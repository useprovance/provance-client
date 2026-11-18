import { redirect } from "react-router";
import { queryClient } from "@/lib/queryClient";
import { workflowService } from "@/services/workflow.service";
import { agentService } from "@/services/agent.service";
import { authService } from "@/services/auth.service";
import { aiService } from "@/services/ai.service";
import { walletService } from "@/services/wallet.service";
import { credentialService } from "@/services/credential.service";
import { chatService } from "@/services/chat.service";

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


export const credentialsLoader = async () => {
   try {
      return await queryClient.query({
         queryKey: ["credentials"],
         queryFn: () => credentialService.list(),
         staleTime: "static",
      });
   } catch {
      return null;
   }
};

export const walletsLoader = async () => {
   try {
      return await queryClient.query({
         queryKey: ["wallets"],
         queryFn: () => walletService.getAll(),
         staleTime: "static",
      });
   } catch {
      return null;
   }
};

export const chatLoader = async ({ params }: { params: { id?: string } }) => {
   if (!params.id) return null;
   try {
      return await queryClient.query({
         queryKey: ["chat-messages", params.id],
         queryFn: () => chatService.getMessages(params.id!),
      });
   } catch {
      return null;
   }
};

export const workflowEditorLoader = async ({ params }: { params: { id?: string } }) => {
   const id = params.id;
   if (!id) return null;
   try {
      const workflow = await queryClient.query({ queryKey: ["workflows", id], queryFn: () => workflowService.getById(id), staleTime: 30_000 });
      void queryClient.prefetchQuery({ queryKey: ["chat-history", id], queryFn: () => aiService.getChatHistory(id), staleTime: Infinity });
      return workflow;
   } catch {
      return null;
   }
};
