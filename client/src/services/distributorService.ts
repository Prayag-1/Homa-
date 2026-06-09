import api from './api';

export type DistributorStatusFilter = 'all' | 'active' | 'inactive';

export interface Distributor {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  coverageArea: string;
  representative: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DistributorPayload {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  coverageArea?: string;
  representative?: string;
  isActive?: boolean;
}

export interface DistributorQuery {
  search?: string;
  status?: DistributorStatusFilter;
}

const PUBLIC_BASE = '/distributors';
const ADMIN_BASE = '/distributors/admin';

const cleanParams = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );

const unwrap = <T>(response: { data?: { data?: T } }) => response?.data?.data;

const normalizeString = (value: unknown) => String(value || '').trim();

export const normalizeDistributor = (item: any = {}): Distributor => ({
  id: String(item.id || item._id || ''),
  name: normalizeString(item.name),
  address: normalizeString(item.address),
  phone: normalizeString(item.phone),
  email: normalizeString(item.email),
  coverageArea: normalizeString(item.coverageArea),
  representative: normalizeString(item.representative),
  isActive: Boolean(item.isActive),
  createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
  updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
});

const normalizeDistributorList = (payload: unknown): Distributor[] => {
  const items = Array.isArray(payload)
    ? payload
    : (payload as { items?: unknown[] } | null)?.items || [];

  return items.map((item) => normalizeDistributor(item));
};

export async function fetchPublicDistributors(): Promise<Distributor[]> {
  const response = await api.get(PUBLIC_BASE);
  return normalizeDistributorList(unwrap(response));
}

export async function fetchAdminDistributors(params: DistributorQuery = {}): Promise<Distributor[]> {
  const response = await api.get(ADMIN_BASE, {
    params: cleanParams({
      search: params.search,
      isActive:
        params.status === 'active' ? true : params.status === 'inactive' ? false : undefined,
    }),
  });

  return normalizeDistributorList(unwrap(response));
}

export async function fetchAdminDistributorById(id: string): Promise<Distributor> {
  const response = await api.get(`${ADMIN_BASE}/${id}`);
  return normalizeDistributor(unwrap(response));
}

export async function createDistributor(payload: DistributorPayload): Promise<Distributor> {
  const response = await api.post(ADMIN_BASE, payload);
  return normalizeDistributor(unwrap(response));
}

export async function updateDistributor(id: string, payload: DistributorPayload): Promise<Distributor> {
  const response = await api.put(`${ADMIN_BASE}/${id}`, payload);
  return normalizeDistributor(unwrap(response));
}

export async function toggleDistributorActive(id: string): Promise<Distributor> {
  const response = await api.patch(`${ADMIN_BASE}/${id}/toggle`);
  return normalizeDistributor(unwrap(response));
}
