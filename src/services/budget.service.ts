import { BaseApiService } from './api.service';

export interface BudgetSnapshot {
  dailyEnabled: boolean; dailyLimit: string; dailySpent: string; dailyReserved: string;
  dailyRemaining: string | null; resetsAt: string; runLimit: string | null;
  runSpent: string; runReserved: string; runRemaining: string | null;
}
export const validFee = (value: string) => /^(?:0|[1-9]\d{0,13})(?:\.\d{1,6})?$/.test(value);
class BudgetService extends BaseApiService {
  async get(runId?: string): Promise<BudgetSnapshot> {
    try {return (await this.api.get<{budget: BudgetSnapshot}>(runId ? `/runs/${runId}/budget` : '/budgets')).data.budget;}
    catch(error){throw this.handleError(error);}
  }
  async save(dailyEnabled: boolean, dailyLimit: string): Promise<BudgetSnapshot> {
    try {return (await this.api.put<{budget: BudgetSnapshot}>('/budgets',{dailyEnabled,dailyLimit})).data.budget;}
    catch(error){throw this.handleError(error);}
  }
  async masterkey(): Promise<{mode:'hosted';ready:boolean;enabledOperations:number;paymentsEnabled:boolean;reason:string;serviceCount:number;syncedAt:string}> {
    try {return (await this.api.get('/masterkey/status')).data;}
    catch(error){throw this.handleError(error);}
  }
  async disconnectMasterkey(){
    try {await this.api.delete('/masterkey/connection');}catch(error){throw this.handleError(error);}
  }
  async approve(runId:string,nodeId:string,callIndex:number,approved:boolean,approvalId?:string){
    try{await this.api.post(`/runs/${runId}/approval`,{nodeId,callIndex,approved,approvalId});}catch(error){throw this.handleError(error);}
  }
}
export const budgetService=new BudgetService();
