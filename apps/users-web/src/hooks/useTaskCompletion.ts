import { useState } from "react";
import { apiFetch } from "../api/apiFetch";

type UseTaskCompletionOptions = {
    runId: string;
    onCompleted: () => void | Promise<void>;
};

export function useTaskCompletion({
    runId,
    onCompleted,
}:UseTaskCompletionOptions){
 const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
 const [completionError, setCompletionError] = useState<string | null>(null);

 async function completeTask(taskId: string){
    if(completingTaskId){
        return;
    }
    setCompletingTaskId(taskId);
    setCompletionError(null);

    try{
        await apiFetch(`/scenario-runs/${runId}/tasks/${taskId}/complete`,
        {method: "PATCH"},
        );

        await onCompleted();
    } catch(error){
        setCompletionError(error instanceof Error ? error.message : "Opgaven kunne ikke færdiggøres")
    } finally {
        setCompletingTaskId(null);
    }
    }
    return {
        completeTask,
        completingTaskId,
        completionError
    }
 }