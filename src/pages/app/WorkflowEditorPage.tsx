import { useLoaderData } from "react-router";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import type { Workflow } from "@/services/workflow.service";

export default function WorkflowEditorPage() {
   const workflow = useLoaderData() as Workflow | null;

   if (!workflow) return null;

   return (
      <div className="h-full flex flex-col overflow-hidden">
         <EditorCanvas workflow={workflow} />
      </div>
   );
}
