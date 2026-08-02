import { EditorCanvas } from "@/components/editor/EditorCanvas";

export default async function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="h-full w-full">
      <EditorCanvas workflowId={id} />
    </div>
  );
}
