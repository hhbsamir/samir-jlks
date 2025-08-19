
import { Timestamp } from "firebase/firestore";

export type SchoolCategory = "Sub-Junior" | "Junior" | "Senior";

export type School = {
  id: string;
  name: string;
  category: SchoolCategory;
  serialNumber?: number;
};

export type Judge = {
  id: string;
  name: string;
  mobile: string;
  password?: string;
  createdAt: number | null;
  imageUrl?: string;
};

export type CompetitionCategory = {
  id:string;
  name: string;
};

export type Score = {
  schoolId: string;
  judgeId: string;
  categoryId: string;
  score: number;
};

export type Feedback = {
  schoolId: string;
  judgeId: string;
  feedback: string;
}

export type ReportSettings = {
    id: string;
    remarks: string;
}

export type HomePageContent = {
    id: string;
    imageUrl: string;
    note: string;
}

export type InterschoolCulturalSettings = {
    id: string;
    registrationPdfUrl: string;
    registrationPdfName: string;
    registrationPdfPublicId?: string;
}

export interface Participant {
  name: string;
  idCardUrl?: string;
}

export interface BankDetails {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiId?: string;
}

export interface ContactPerson {
    contactName: string;
    designation: string;
    mobileNumber: string;
    email?: string;
}

export interface Registration {
    id: string;
    schoolName: string;
    participants: Participant[];
    bankDetails: BankDetails;
    contactPerson: ContactPerson;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}


export const initialCategories: CompetitionCategory[] = [
];

export const initialSchools: School[] = [
];

export const initialJudges: Judge[] = [
];

export const initialScores: Score[] = [
];

// This function is no longer needed for PDF management and is being removed to avoid future issues.

    