export type SchoolCategory = "Sub-Junior" | "Junior" | "Senior";

export type School = {
  id: string;
  name: string;
  category: SchoolCategory;
};

export type Judge = {
  id: string;
  name: string;
  mobile: string;
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

export const initialCategories: CompetitionCategory[] = [
  { id: "cat1", name: "Dance" },
  { id: "cat2", name: "Costume" },
  { id: "cat3", name: "Theme" },
];

export const initialSchools: School[] = [
  { id: "sch1", name: "Starlight Academy", category: "Senior" },
  { id: "sch2", name: "Crestwood Preparatory", category: "Senior" },
  { id: "sch3", name: "Maplewood Junior High", category: "Junior" },
  { id: "sch4", name: "Riverdale Elementary", category: "Sub-Junior" },
  { id: "sch5", name: "Oakridge Institute", category: "Junior" },
];

export const initialJudges: Judge[] = [
  { id: "jud1", name: "Eleanor Vance", mobile: "555-0101" },
  { id: "jud2", name: "Marcus Thorne", mobile: "555-0102" },
];

export const initialScores: Score[] = [
  // Judge 1
  { schoolId: "sch1", judgeId: "jud1", categoryId: "cat1", score: 8 },
  { schoolId: "sch1", judgeId: "jud1", categoryId: "cat2", score: 9 },
  { schoolId: "sch1", judgeId: "jud1", categoryId: "cat3", score: 7 },
  { schoolId: "sch2", judgeId: "jud1", categoryId: "cat1", score: 9 },
  { schoolId: "sch2", judgeId: "jud1", categoryId: "cat2", score: 9 },
  { schoolId: "sch2", judgeId: "jud1", categoryId: "cat3", score: 9 },
  { schoolId: "sch3", judgeId: "jud1", categoryId: "cat1", score: 7 },
  { schoolId: "sch3", judgeId: "jud1", categoryId: "cat2", score: 6 },
  { schoolId: "sch3", judgeId: "jud1", categoryId: "cat3", score: 8 },
  { schoolId: "sch4", judgeId: "jud1", categoryId: "cat1", score: 9 },
  { schoolId: "sch4", judgeId: "jud1", categoryId: "cat2", score: 8 },
  { schoolId: "sch4", judgeId: "jud1", categoryId: "cat3", score: 8 },
  { schoolId: "sch5", judgeId: "jud1", categoryId: "cat1", score: 6 },
  { schoolId: "sch5", judgeId: "jud1", categoryId: "cat2", score: 7 },
  { schoolId: "sch5", judgeId: "jud1", categoryId: "cat3", score: 7 },
  // Judge 2
  { schoolId: "sch1", judgeId: "jud2", categoryId: "cat1", score: 7 },
  { schoolId: "sch1", judgeId: "jud2", categoryId: "cat2", score: 8 },
  { schoolId: "sch1", judgeId: "jud2", categoryId: "cat3", score: 8 },
  { schoolId: "sch2", judgeId: "jud2", categoryId: "cat1", score: 10 },
  { schoolId: "sch2", judgeId: "jud2", categoryId: "cat2", score: 8 },
  { schoolId: "sch2", judgeId: "jud2", categoryId: "cat3", score: 9 },
  { schoolId: "sch3", judgeId: "jud2", categoryId: "cat1", score: 8 },
  { schoolId: "sch3", judgeId: "jud2", categoryId: "cat2", score: 7 },
  { schoolId: "sch3", judgeId: "jud2", categoryId: "cat3", score: 7 },
  { schoolId: "sch4", judgeId: "jud2", categoryId: "cat1", score: 8 },
  { schoolId: "sch4", judgeId: "jud2", categoryId: "cat2", score: 9 },
  { schoolId: "sch4", judgeId: "jud2", categoryId: "cat3", score: 9 },
  { schoolId: "sch5", judgeId: "jud2", categoryId: "cat1", score: 7 },
  { schoolId: "sch5", judgeId: "jud2", categoryId: "cat2", score: 6 },
  { schoolId: "sch5", judgeId: "jud2", categoryId: "cat3", score: 6 },
];
