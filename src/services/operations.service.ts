import {BaseApiService} from './api.service';
export interface Credits {enabled:boolean;balance:string;reserved:string;available:string;frozen:boolean;billingConfigured:boolean;operator:boolean;packs:{id:string;cents:number}[]}
export interface OperatingSettings {enabled:boolean;dailyLimit:string;creditsEnabled:boolean}
export interface ServiceCall {id:string;ownerId:string;runId:string;status:string;createdAt:string;receipt:string|null;serviceId:string;maxFeeUsd:string;hasEvidence:boolean}
class OperationsService extends BaseApiService {
 async credits():Promise<Credits>{try{return(await this.api.get('/billing/credits')).data;}catch(e){throw this.handleError(e);}}
 async checkout(packId:string,purchaseId:string):Promise<string>{try{return(await this.api.post('/billing/credits/checkout',{packId,purchaseId})).data.url;}catch(e){throw this.handleError(e);}}
 async calls():Promise<ServiceCall[]>{try{return(await this.api.get('/operator/calls')).data.calls;}catch(e){throw this.handleError(e);}}
 async settings():Promise<OperatingSettings>{try{return(await this.api.get('/operator/settings')).data;}catch(e){throw this.handleError(e);}}
 async save(value:OperatingSettings){try{await this.api.put('/operator/settings',value);}catch(e){throw this.handleError(e);}}
 async reconcile(id:string,transactionHash?:string){try{return(await this.api.post(`/operator/calls/${id}/reconcile`,{transactionHash:transactionHash||undefined})).data;}catch(e){throw this.handleError(e);}}
}
export const operationsService=new OperationsService();
