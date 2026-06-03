/**
 * Type declarations for the Aesthetic Tracker Sheets
 */

export type ActiveTab =
  | 'leetcode'
  | 'projects'
  | 'hackathons'
  | 'certifications'
  | 'dsa'
  | 'webdev'
  | 'active_pursuits'
  | 'tasks';

export interface LeetCodeRow {
  id: string;
  date: string; // YYYY-MM-DD
  cumulative: number;
  individualToday: number;
  topicNotes: string;
}

export interface ProjectRow {
  id: string;
  name: string;
  description: string;
  thingsToDo: string;
  addedToGithub: boolean;
  addedToLinkedin: boolean;
}

export interface HackathonRow {
  id: string;
  name: string;
  selectedRounds: string; // e.g. "Round 1, Finalist"
  achievement: string; // e.g. "Runner Up", "Participation"
  date: string;
}

export interface CertificationRow {
  id: string;
  name: string;
  issuingOrg: string;
  dateCompleted: string;
  addedToLinkedin: boolean;
}

export interface DSARow {
  id: string;
  topic: string;
  understanding: 'Not Started' | 'In Progress' | 'Good' | 'Mastered';
  questionsCount: number;
  notes: string;
}

export interface WebDevRow {
  id: string;
  topic: string;
  understanding: 'Not Started' | 'In Progress' | 'Good' | 'Mastered';
  projectsPractice: string;
}

export interface PursuitRow {
  id: string;
  name: string;
  type: 'Certification' | 'Simulation' | 'Internship';
  organization: string;
  status: 'Not Started' | 'In Progress' | 'Halfway' | 'Near Completion' | 'Completed';
  endDateTarget: string;
}

export interface TaskRow {
  id: string;
  task: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
}

export interface SheetData {
  leetcode: LeetCodeRow[];
  projects: ProjectRow[];
  hackathons: HackathonRow[];
  certifications: CertificationRow[];
  dsa: DSARow[];
  webdev: WebDevRow[];
  active_pursuits: PursuitRow[];
  tasks: TaskRow[];
}
