import { apiClient } from "./client";

export interface Bill {
  id?: string;
  billNumber?: number;
  material: string;
  party: string;
  date: string;
  inTime: string;
  outTime: string;
  customer: string;
  vehicleNumber: string;
  emptyWeight: number;
  loadWeight: number;
  netWeight: number;
  paymentType: string;
  deliveryType: string;
  remarks?: string;
  printStatus?: boolean;
}

export const billsApi = {
  getStats: async () => {
    const { data } = await apiClient.get("/api/bills/stats");
    return data;
  },

  getNextBillNumber: async () => {
    const { data } = await apiClient.get("/api/bills/next-number");
    return data;
  },

  getDeletedBills: async () => {
    const { data } = await apiClient.get("/api/bills/deleted");
    return data;
  },

  getBills: async (page = 0, size = 20) => {
    const { data } = await apiClient.get("/api/bills", { params: { page, size } });
    return data;
  },

  getBill: async (id: string) => {
    const { data } = await apiClient.get(`/api/bills/${id}`);
    return data;
  },

  createBill: async (bill: Bill) => {
    const { data } = await apiClient.post("/api/bills", bill);
    return data;
  },

  updateBill: async (id: string, bill: Bill) => {
    const { data } = await apiClient.put(`/api/bills/${id}`, bill);
    return data;
  },
  
  deleteBill: async (id: string) => {
    await apiClient.delete(`/api/bills/${id}`);
  },

  restoreBill: async (id: string) => {
    const { data } = await apiClient.post(`/api/bills/${id}/restore`);
    return data;
  },
};
