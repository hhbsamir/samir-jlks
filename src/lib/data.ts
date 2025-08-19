
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

// Helper to extract public_id from a Cloudinary URL
export function getPublicIdFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const versionAndId = parts[1];
    const publicIdWithFolder = versionAndId.substring(versionAndId.indexOf('/') + 1);
    
    // For images, Cloudinary URLs often don't include the extension in the public_id that the API uses.
    // For raw files (like PDFs), the extension is part of the public_id.
    if (url.includes('/image/upload/')) {
        const lastDotIndex = publicIdWithFolder.lastIndexOf('.');
        if (lastDotIndex !== -1) {
            return publicIdWithFolder.substring(0, lastDotIndex);
        }
    }

    return publicIdWithFolder;
  } catch (e) {
    console.error("Could not parse Cloudinary URL", e);
    return null;
  }
}
