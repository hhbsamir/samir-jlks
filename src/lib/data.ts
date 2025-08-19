
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
  
  // Example URL: http://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
  // We want to extract "folder/public_id"
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    // Find resource type - 'image', 'video', etc.
    const resourceTypeIndex = uploadIndex - 1;
    const resourceType = urlParts[resourceTypeIndex];

    if (uploadIndex === -1 || uploadIndex + 2 >= urlParts.length) {
      return null;
    }
    
    // The part after the version number is the public_id with extension
    const publicIdWithVersionAndFolder = urlParts.slice(uploadIndex + 2).join('/');
    
    // For images, we remove the extension. For other types like 'raw' (PDFs), we keep it.
    if (resourceType === 'image') {
        const lastDot = publicIdWithVersionAndFolder.lastIndexOf('.');
        if (lastDot !== -1) {
            return publicIdWithVersionAndFolder.substring(0, lastDot);
        }
    }
    
    return publicIdWithVersionAndFolder;

  } catch (e) {
    console.error("Could not parse Cloudinary URL", e);
    return null;
  }
}
