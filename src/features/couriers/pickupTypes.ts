/**
 * Pickup-request types, mirroring the backend contract
 * (`types/courierPickup.ts` + `validators/courierPickupValidators.ts`).
 *
 * `requested` is the only state the courier confirms. `collected` is a staff
 * confirmation that the rider took the parcels: the courier publishes no
 * endpoint to read a pickup's progress, so there is no "rider assigned" step
 * and the UI must not imply one.
 */

export const PICKUP_STATUSES = ["requested", "collected", "cancelled"] as const;
export type PickupStatus = (typeof PICKUP_STATUSES)[number];

export interface PickupShipmentRef {
  id: string;
  shipmentNumber?: string;
  trackingNumber?: string;
  status?: string;
  bookingStatus?: string;
}

export interface CourierPickup {
  id: string;
  provider: "manual" | "steadfast";
  courier: { id: string; name?: string };
  /** The courier's own id for the request, when it returned one. */
  pickupId?: string;
  status: PickupStatus;
  addressId: string;
  policeStationId: string;
  address: string;
  contactNumber: string;
  note?: string;
  estimatedQuantity?: number;
  parcelCount: number;
  shipments?: PickupShipmentRef[];
  requestedAt: string;
  requestedBy: { id: string; username?: string };
  collectedAt?: string;
  cancelledAt?: string;
  /** Present when the courier rejected the request. */
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourierPickupListData {
  pickups: CourierPickup[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CourierPoliceStation {
  id: string;
  name: string;
  district?: string;
}

/** POST /couriers/:id/pickups */
export interface CreatePickupData {
  /** Omit to use the address stored on the courier. */
  addressId?: string;
  policeStationId?: string;
  address?: string;
  contactNumber?: string;
  note?: string;
  estimatedQuantity?: number;
  shipmentIds?: string[];
}
