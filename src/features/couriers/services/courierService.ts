import { apiClient, type ApiEnvelope } from '@/api';

import type {
  Courier,
  CourierListData,
  CourierListParams,
  CreateCourierData,
  UpdateCourierData,
} from '../types';
import type {
  CourierPickup,
  CourierPickupListData,
  CourierPoliceStation,
  CreatePickupData,
  PickupStatus,
} from '../pickupTypes';

interface CourierData {
  courier: Courier;
}

class CourierService {
  private readonly basePath = '/couriers';

  async list(params: CourierListParams = {}): Promise<CourierListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search || undefined,
      isActive: params.isActive,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };
    const response = await apiClient.get<ApiEnvelope<CourierListData>>(this.basePath, { params: query });
    return response.data;
  }

  async getById(id: string): Promise<Courier> {
    const response = await apiClient.get<ApiEnvelope<CourierData>>(`${this.basePath}/${id}`);
    return response.data.courier;
  }

  async create(input: CreateCourierData): Promise<Courier> {
    const response = await apiClient.post<ApiEnvelope<CourierData>>(this.basePath, input);
    return response.data.courier;
  }

  async update(id: string, input: UpdateCourierData): Promise<Courier> {
    const response = await apiClient.patch<ApiEnvelope<CourierData>>(`${this.basePath}/${id}`, input);
    return response.data.courier;
  }

  async deactivate(id: string): Promise<Courier> {
    const response = await apiClient.delete<ApiEnvelope<CourierData>>(`${this.basePath}/${id}`);
    return response.data.courier;
  }

  // ─── Pickups ──────────────────────────────────────────────────────────
  // A pickup asks the courier to send a rider for parcels we already booked.

  /** Asks the courier for a rider; attaches `shipmentIds` to the request. */
  async requestPickup(courierId: string, input: CreatePickupData): Promise<CourierPickup> {
    const response = await apiClient.post<ApiEnvelope<{ pickup: CourierPickup }>>(
      `${this.basePath}/${courierId}/pickups`,
      input,
    );
    return response.data.pickup;
  }

  async listPickups(
    courierId: string,
    params: { page?: number; limit?: number; status?: PickupStatus } = {},
  ): Promise<CourierPickupListData> {
    const query: Record<string, string | number | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      ...(params.status && { status: params.status }),
    };
    const response = await apiClient.get<ApiEnvelope<CourierPickupListData>>(
      `${this.basePath}/${courierId}/pickups`,
      { params: query },
    );
    return response.data;
  }

  async getPickup(courierId: string, pickupId: string): Promise<CourierPickup> {
    const response = await apiClient.get<ApiEnvelope<{ pickup: CourierPickup }>>(
      `${this.basePath}/${courierId}/pickups/${pickupId}`,
    );
    return response.data.pickup;
  }

  /**
   * Closes a pickup: `collected` when staff confirm the rider took the parcels,
   * `cancelled` when the request is abandoned here.
   */
  async updatePickup(
    courierId: string,
    pickupId: string,
    input: { status: Exclude<PickupStatus, 'requested'>; note?: string },
  ): Promise<CourierPickup> {
    const response = await apiClient.patch<ApiEnvelope<{ pickup: CourierPickup }>>(
      `${this.basePath}/${courierId}/pickups/${pickupId}`,
      input,
    );
    return response.data.pickup;
  }

  /** Adds more parcels to a pickup that is still waiting for the rider. */
  async addPickupShipments(
    courierId: string,
    pickupId: string,
    shipmentIds: string[],
  ): Promise<CourierPickup> {
    const response = await apiClient.post<ApiEnvelope<{ pickup: CourierPickup }>>(
      `${this.basePath}/${courierId}/pickups/${pickupId}/shipments`,
      { shipmentIds },
    );
    return response.data.pickup;
  }

  /** Thana directory for the pickup form (proxied so the app holds no keys). */
  async listPickupStations(courierId: string): Promise<CourierPoliceStation[]> {
    const response = await apiClient.get<ApiEnvelope<{ stations: CourierPoliceStation[] }>>(
      `${this.basePath}/${courierId}/pickup-stations`,
    );
    return response.data.stations;
  }
}

export const courierService = new CourierService();
export { CourierService };



