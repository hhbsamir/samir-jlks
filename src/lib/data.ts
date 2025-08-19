

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

export interface Participant {
  name: string;
  idCardUrl: string;
  idCardFileName: string;
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
}

export interface Registration {
    id: string;
    schoolName: string;
    participants: Participant[];
    bankDetails: BankDetails;
    contactPerson: ContactPerson;
    createdAt: Timestamp;
}


export const initialCategories: CompetitionCategory[] = [
];

export const initialSchools: School[] = [
];

export const initialJudges: Judge[] = [
];

export const initialScores: Score[] = [
];

    

    


