import api from './api';

export type ContactInquiryStatus = 'new' | 'open' | 'resolved';

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactInquiryStatus;
  source: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ContactInquiryList {
  items: ContactInquiry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContactInquiryQuery {
  search?: string;
  status?: ContactInquiryStatus | 'all';
  page?: number;
  limit?: number;
}

const ADMIN_BASE = '/admin/contact-inquiries';

const unwrap = <T>(response: { data?: { data?: T } }) => response?.data?.data as T;

const cleanParams = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) =>
      value !== undefined && value !== null && value !== '' && value !== 'all',
    ),
  ) as Record<string, unknown>;

export async function fetchAdminContactInquiries(params: ContactInquiryQuery): Promise<ContactInquiryList> {
  const response = await api.get(ADMIN_BASE, {
    params: cleanParams({
      search: params.search,
      status: params.status,
      page: params.page,
      limit: params.limit,
    }),
  });

  return unwrap<ContactInquiryList>(response);
}

export async function fetchAdminContactInquiryById(id: string): Promise<ContactInquiry> {
  const response = await api.get(`${ADMIN_BASE}/${id}`);
  return unwrap<ContactInquiry>(response);
}

export async function updateContactInquiryStatus(id: string, status: ContactInquiryStatus): Promise<ContactInquiry> {
  const response = await api.patch(`${ADMIN_BASE}/${id}/status`, { status });
  return unwrap<ContactInquiry>(response);
}

export async function deleteContactInquiry(id: string): Promise<void> {
  await api.delete(`${ADMIN_BASE}/${id}`);
}
