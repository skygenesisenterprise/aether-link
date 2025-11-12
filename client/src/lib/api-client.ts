import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private wsURL: string;

  constructor() {
    this.baseURL = `${process.env.NEXT_PUBLIC_AETHER_LINK_PROTOCOL}://${process.env.NEXT_PUBLIC_AETHER_LINK_HOST}:${process.env.NEXT_PUBLIC_AETHER_LINK_PORT}`;
    this.wsURL = `${process.env.NEXT_PUBLIC_AETHER_LINK_WS_PROTOCOL}://${process.env.NEXT_PUBLIC_AETHER_LINK_HOST}:${process.env.NEXT_PUBLIC_AETHER_LINK_WS_PORT}`;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.removeAuthToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  public getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  private removeAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  }

  private setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  // Generic request methods
  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request<ApiResponse<T>>(config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Request failed');
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  // Authentication methods
  async login(credentials: { username: string; password: string }): Promise<ApiResponse<{ user: any; token: string }>> {
    const response = await this.post<{ user: any; token: string }>('/api/auth/login', credentials);
    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.post('/api/auth/logout');
    this.removeAuthToken();
    return response;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await this.post<{ token: string }>('/api/auth/refresh');
    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
    }
    return response;
  }

  // User management
  async getUsers(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.get(`/api/users${queryParams ? `?${queryParams}` : ''}`);
  }

  async getUser(id: string): Promise<ApiResponse<any>> {
    return this.get(`/api/users/${id}`);
  }

  async createUser(userData: any): Promise<ApiResponse<any>> {
    return this.post('/api/users', userData);
  }

  async updateUser(id: string, userData: any): Promise<ApiResponse<any>> {
    return this.put(`/api/users/${id}`, userData);
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.delete(`/api/users/${id}`);
  }

  // Extension management
  async getExtensions(params?: { page?: number; limit?: number; userId?: string }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.get(`/api/extensions${queryParams ? `?${queryParams}` : ''}`);
  }

  async getExtension(id: string): Promise<ApiResponse<any>> {
    return this.get(`/api/extensions/${id}`);
  }

  async createExtension(extensionData: any): Promise<ApiResponse<any>> {
    return this.post('/api/extensions', extensionData);
  }

  async updateExtension(id: string, extensionData: any): Promise<ApiResponse<any>> {
    return this.put(`/api/extensions/${id}`, extensionData);
  }

  async deleteExtension(id: string): Promise<ApiResponse> {
    return this.delete(`/api/extensions/${id}`);
  }

  // Trunk management
  async getTrunks(): Promise<ApiResponse<any[]>> {
    return this.get('/api/trunks');
  }

  async getTrunk(id: string): Promise<ApiResponse<any>> {
    return this.get(`/api/trunks/${id}`);
  }

  async createTrunk(trunkData: any): Promise<ApiResponse<any>> {
    return this.post('/api/trunks', trunkData);
  }

  async updateTrunk(id: string, trunkData: any): Promise<ApiResponse<any>> {
    return this.put(`/api/trunks/${id}`, trunkData);
  }

  async deleteTrunk(id: string): Promise<ApiResponse> {
    return this.delete(`/api/trunks/${id}`);
  }

  // Dialplan management
  async getDialplan(context?: string): Promise<ApiResponse<any[]>> {
    return this.get(`/api/dialplan${context ? `?context=${context}` : ''}`);
  }

  async updateDialplan(context: string, rules: any[]): Promise<ApiResponse> {
    return this.put(`/api/dialplan/${context}`, { rules });
  }

  async reloadDialplan(): Promise<ApiResponse> {
    return this.post('/api/dialplan/reload');
  }

  // Monitoring
  async getSystemStatus(): Promise<ApiResponse<any>> {
    return this.get('/api/monitoring/status');
  }

  async getActiveCalls(): Promise<ApiResponse<any[]>> {
    return this.get('/api/monitoring/calls');
  }

  async getActiveChannels(): Promise<ApiResponse<any[]>> {
    return this.get('/api/monitoring/channels');
  }

  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.get('/api/monitoring/dashboard');
  }

  // CDR
  async getCDRs(params?: { 
    page?: number; 
    limit?: number; 
    startDate?: string; 
    endDate?: string; 
    source?: string; 
    destination?: string; 
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.get(`/api/cdr${queryParams ? `?${queryParams}` : ''}`);
  }

  // WebSocket connection
  createWebSocket(): WebSocket {
    const token = this.getAuthToken();
    const wsUrl = `${this.wsURL}/monitoring${token ? `?token=${token}` : ''}`;
    return new WebSocket(wsUrl);
  }

  // Utility methods
  getBaseURL(): string {
    return this.baseURL;
  }

  getWSURL(): string {
    return this.wsURL;
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  getCurrentUser(): any {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;