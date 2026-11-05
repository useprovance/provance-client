import { useQuery } from '@tanstack/react-query';
import { BaseApiService } from './api.service';
import type { MasterkeyAvailability } from '@/utils/masterkey-availability';

class MasterkeyService extends BaseApiService {
  async availability(): Promise<MasterkeyAvailability> {
    try { return (await this.api.get('/masterkey/availability')).data; }
    catch (error) { throw this.handleError(error); }
  }
}
export const masterkeyService = new MasterkeyService();
export function useMasterkeyAvailability(enabled = true) {
  const query = useQuery({queryKey:['masterkey','availability'],queryFn:()=>masterkeyService.availability(),enabled,retry:false,staleTime:5000,refetchInterval:15000});
  const unavailable: MasterkeyAvailability = {ready:false,paymentsEnabled:false,reason:'Service availability could not be checked. Reopen the picker or check service settings.',operations:[]};
  return {...query,data:query.isError?unavailable:query.data};
}
