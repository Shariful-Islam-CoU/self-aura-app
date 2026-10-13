/**
 * Minimal API connectivity utilities.
 *
 * Uses the centralized `apiClient` to hit the backend's `/health` endpoint.
 * Development-only helpers are intended for debugging/verification - not for UI.
 */
import { apiClient } from './client';

export interface HealthResponse {
  success: boolean;
  message?: string;
}

export async function checkHealth(): Promise<HealthResponse> {
  // Backend exposes GET /api/health (mounted under /api)
  return apiClient.get<HealthResponse>('/health');
}

export async function pingBackend(): Promise<boolean> {
  try {
    const result = await checkHealth();
    console.log('Backend health check result:', result);
    return result.success === true;
  } catch (error) {
    console.error('Error occurred while checking backend health:', error);
    return false;
  }
}
