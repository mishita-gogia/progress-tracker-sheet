import { SheetData } from './types';

export const INITIAL_SHEETS_DATA: SheetData = {
  leetcode: [
    {
      id: 'lc-1',
      date: '',
      cumulative: 0,
      individualToday: 0,
      topicNotes: ''
    }
  ],
  
  projects: [
    {
      id: 'proj-1',
      name: '',
      description: '',
      thingsToDo: '',
      addedToGithub: false,
      addedToLinkedin: false
    }
  ],

  hackathons: [
    {
      id: 'hack-1',
      name: '',
      selectedRounds: '',
      achievement: '',
      date: ''
    }
  ],

  certifications: [
    {
      id: 'cert-1',
      name: '',
      issuingOrg: '',
      dateCompleted: '',
      addedToLinkedin: false
    }
  ],

  dsa: [
    {
      id: 'dsa-1',
      topic: '',
      understanding: 'Not Started',
      questionsCount: 0,
      notes: ''
    }
  ],

  webdev: [
    {
      id: 'web-1',
      topic: '',
      understanding: 'Not Started',
      projectsPractice: ''
    }
  ],

  active_pursuits: [
    {
      id: 'pur-1',
      name: '',
      type: 'Simulation',
      organization: '',
      status: 'Not Started',
      endDateTarget: ''
    }
  ],

  tasks: [
    {
      id: 'task-1',
      task: '',
      dueDate: '',
      priority: 'Low',
      completed: false
    }
  ]
};
