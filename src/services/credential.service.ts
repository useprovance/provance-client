import { BaseApiService } from './api.service';

export interface Credential {
  id: string;
  name: string;
  created_at: string;
}

class CredentialService extends BaseApiService {
  async list(): Promise<Credential[]> {
    try {
      const res = await this.api.get<{ credentials: Credential[] }>('/credentials');
      return res.data.credentials;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async add(name: string, value: string): Promise<Credential> {
    try {
      const res = await this.api.post<{ credential: Credential }>('/credentials', { name, value });
      return res.data.credential;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.api.delete(`/credentials/${id}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export const credentialService = new CredentialService();
