
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
  
  // Example Image URL: http://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
  // Example Raw URL:   http://res.cloudinary.com/cloud_name/raw/upload/v1234567890/folder/public_id.pdf
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    // Take everything after the version number
    const publicIdWithVersion = parts[1];
    const publicId = publicIdWithVersion.substring(publicIdWithVersion.indexOf('/') + 1);

    // For images, we want to remove the extension. For raw files, we keep it.
    if (url.includes('/image/upload/')) {
        const lastDotIndex = publicId.lastIndexOf('.');
        if (lastDotIndex !== -1) {
            return publicId.substring(0, lastDotIndex);
        }
    }
    
    return publicId;

  } catch (e) {
    console.error("Could not parse Cloudinary URL", e);
    return null;
  }
}
