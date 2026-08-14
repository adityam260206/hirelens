export type OfferStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "WITHDRAWN";

export type Offer = {
  id: string;
  applicationId: string;
  position: string;
  salary: number;
  currency: string;
  joiningDate: string;
  location: string | null;
  benefits: string[];
  terms: string | null;
  status: OfferStatus;
  sentAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateOfferPayload = {
  position: string;
  salary: number;
  currency?: string;
  joiningDate: string;
  location?: string;
  benefits: string[];
  terms?: string;
};
