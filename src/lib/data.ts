

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
  id: string;
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

export const initialCategories: CompetitionCategory[] = [
];

export const initialSchools: School[] = [
];

export const initialJudges: Judge[] = [
];

export const initialScores: Score[] = [
];

    
