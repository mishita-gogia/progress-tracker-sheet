/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, ChangeEvent } from 'react';

interface TabConfigItem {
  label: string;
  icon: any;
  color: string;
  sheetLetter: string;
  badge: string;
  headers: string[];
}
import {
  ActiveTab,
  SheetData,
  LeetCodeRow,
  ProjectRow,
  HackathonRow,
  CertificationRow,
  DSARow,
  WebDevRow,
  PursuitRow,
  TaskRow
} from './types';
import { INITIAL_SHEETS_DATA } from './initialData';
import {
  Code,
  FolderCode,
  Trophy,
  Award,
  BookOpen,
  Globe,
  Hourglass,
  CheckSquare,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Search,
  RotateCcw,
  Download,
  Upload,
  ExternalLink,
  Linkedin,
  Github,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ChevronDown,
  Info,
  Moon,
  Sun,
  User,
  Lock,
  LogIn,
  LogOut
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'aesthetic_sheet_tracker_v1';

export default function App() {
  // ----------------------------------------------------
  // Authentication & Session State
  // ----------------------------------------------------
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('aesthetic_sheet_active_user');
  });

  // Keep list of registered users: username -> password
  const [registeredUsers, setRegisteredUsers] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('aesthetic_sheet_registered_users');
    return saved ? JSON.parse(saved) : {};
  });

  // Auth toggle mode inside signup module
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authUsernameInput, setAuthUsernameInput] = useState('');
  const [authPasswordInput, setAuthPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // ----------------------------------------------------
  // Light/Dark Theme State
  // ----------------------------------------------------
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('aesthetic_sheet_theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return false; // light mode by default
  });

  // Toggle effect for html/body and local storage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('aesthetic_sheet_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('aesthetic_sheet_theme', 'light');
    }
  }, [isDarkMode]);

  // ----------------------------------------------------
  // Page Spreadsheet Data State
  // ----------------------------------------------------
  const [data, setData] = useState<SheetData>(() => {
    const active = localStorage.getItem('aesthetic_sheet_active_user');
    if (active) {
      const saved = localStorage.getItem(`aesthetic_sheet_user_data_${active}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object' && 'leetcode' in parsed) {
            return parsed as SheetData;
          }
        } catch (e) {
          console.error("Error reading saved user sheets database", e);
        }
      }
    }
    // Deep copy INITIAL_SHEETS_DATA to ensure we don't accidentally mutate the reference imports!
    return JSON.parse(JSON.stringify(INITIAL_SHEETS_DATA));
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('leetcode');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Row being edited
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);

  // Stats drawer or detailed visual tooltips
  const [hoveredChartPoint, setHoveredChartPoint] = useState<number | null>(null);
  const [showBackupAlert, setShowBackupAlert] = useState(false);
  const [backupAlertMsg, setBackupAlertMsg] = useState({ text: '', type: 'success' });

  // Sync active user's spreadsheet state to local storage on edits
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`aesthetic_sheet_user_data_${currentUser}`, JSON.stringify(data));
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, currentUser]);

  // ----------------------------------------------------
  // Authentication Actions
  // ----------------------------------------------------
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const username = authUsernameInput.trim();
    const password = authPasswordInput;

    if (!username || !password) {
      setAuthError('Please enter both username and password.');
      return;
    }

    if (isSigningUp) {
      if (registeredUsers[username]) {
        setAuthError('Username already exists. Try signing in!');
        return;
      }

      const updatedUsers = { ...registeredUsers, [username]: password };
      setRegisteredUsers(updatedUsers);
      localStorage.setItem('aesthetic_sheet_registered_users', JSON.stringify(updatedUsers));

      const freshData = JSON.parse(JSON.stringify(INITIAL_SHEETS_DATA));
      localStorage.setItem(`aesthetic_sheet_user_data_${username}`, JSON.stringify(freshData));

      setCurrentUser(username);
      localStorage.setItem('aesthetic_sheet_active_user', username);
      setData(freshData);
      
      triggerAlert(`Welcome, ${username}! Your workspace is ready.`, 'success');
      setAuthUsernameInput('');
      setAuthPasswordInput('');
    } else {
      const expectedPassword = registeredUsers[username];
      if (!expectedPassword || expectedPassword !== password) {
        setAuthError('Invalid username or password.');
        return;
      }

      setCurrentUser(username);
      localStorage.setItem('aesthetic_sheet_active_user', username);

      const savedUserStr = localStorage.getItem(`aesthetic_sheet_user_data_${username}`);
      let userSheetData;
      if (savedUserStr) {
        try {
          userSheetData = JSON.parse(savedUserStr);
        } catch (err) {
          userSheetData = JSON.parse(JSON.stringify(INITIAL_SHEETS_DATA));
        }
      } else {
        userSheetData = JSON.parse(JSON.stringify(INITIAL_SHEETS_DATA));
      }
      
      setData(userSheetData);
      triggerAlert(`Welcome back, ${username}!`, 'success');
      setAuthUsernameInput('');
      setAuthPasswordInput('');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('aesthetic_sheet_active_user');
    setData(JSON.parse(JSON.stringify(INITIAL_SHEETS_DATA)));
    setEditingRowId(null);
    setEditFormData(null);
    setSearchQuery('');
  };

  // ----------------------------------------------------
  // Dynamic Tab Customizations (Visual themes like real spreadsheets)
  // ----------------------------------------------------
  const tabConfig = useMemo<Record<ActiveTab, TabConfigItem>>(() => {
    return {
      leetcode: {
        label: 'Total LeetCode Solved',
        icon: Code,
        color: 'emerald',
        sheetLetter: 'A',
        badge: 'Competitive Programming',
        headers: ['Date', 'Cumulative Solved', 'Solved Today', 'Topics & Core Notes']
      },
      projects: {
        label: 'Projects Completed',
        icon: FolderCode,
        color: 'indigo',
        sheetLetter: 'B',
        badge: 'Portfolio Showcase',
        headers: ['Project Name', 'Core Description', 'Yet To Do (Checklist Items)', 'GitHub', 'LinkedIn']
      },
      hackathons: {
        label: 'Hackathons Attended',
        icon: Trophy,
        color: 'amber',
        sheetLetter: 'C',
        badge: 'Competitive Spirit',
        headers: ['Hackathon Tournament Name', 'Rounds Advanced', 'Participation & Achievements', 'Date']
      },
      certifications: {
        label: 'Certifications Completed',
        icon: Award,
        color: 'rose',
        sheetLetter: 'D',
        badge: 'Credentials',
        headers: ['Certification Name', 'Issuing Organization', 'Date Attained', 'LinkedIn Profile']
      },
      dsa: {
        label: 'DSA topic tracker',
        icon: BookOpen,
        color: 'orange',
        sheetLetter: 'E',
        badge: 'Problem Solving Engine',
        headers: ['DSA Topic Area', 'Understanding Status', 'LeetCode Count', 'Core Notes & Strategies']
      },
      webdev: {
        label: 'WebDev Tracker',
        icon: Globe,
        color: 'cyan',
        sheetLetter: 'F',
        badge: 'Skill building',
        headers: ['Web Technology', 'Familiarity Level', 'Projects Built & Practice Exercises']
      },
      active_pursuits: {
        label: 'Certifications/Simulation/Internship',
        icon: Hourglass,
        color: 'purple',
        sheetLetter: 'G',
        badge: 'Active Pursuits',
        headers: ['Pursuit Name', 'Program Category', 'Affiliated Organization', 'Current Progress', 'Target Target Date']
      },
      tasks: {
        label: 'To do in next few days',
        icon: CheckSquare,
        color: 'slate',
        sheetLetter: 'H',
        badge: 'Urgent Backlog',
        headers: ['Pending Task', 'Due Date Target', 'Priority Rank', 'Mark Finished']
      }
    };
  }, []);

  const activeColorTheme = tabConfig[activeTab].color;

  // ----------------------------------------------------
  // Dynamic Calculations (Summary Statistics)
  // ----------------------------------------------------
  const stats = useMemo(() => {
    // 1. Cumulative LeetCode
    const leetSorted = [...data.leetcode].sort((a, b) => b.date.localeCompare(a.date));
    const totalLeet = leetSorted.length > 0 ? leetSorted[0].cumulative : 0;
    
    // LeetCode Streak: daily active days recorded in the last 7 days
    const activeDaysLc = data.leetcode.filter(row => row.individualToday > 0).length;

    // 2. Completed Projects
    const totalProjects = data.projects.length;
    const itemsOnGithub = data.projects.filter(p => p.addedToGithub).length;
    const itemsOnLinkedin = data.projects.filter(p => p.addedToLinkedin).length;

    // 3. Certifications and Hackathons completed
    const certificationsCount = data.certifications.length;
    const hackathonsSpent = data.hackathons.length;

    // 4. DSA Mastery Percentage
    const totalDsa = data.dsa.length;
    const masteredDsa = data.dsa.filter(d => d.understanding === 'Mastered' || d.understanding === 'Good').length;
    const dsaProgress = totalDsa > 0 ? Math.round((masteredDsa / totalDsa) * 100) : 0;

    // 5. Active Pursuits status
    const ongoingPursuits = data.active_pursuits.filter(p => p.status !== 'Completed').length;

    // 6. Imminent To-Do Tasks
    const incompleteTasks = data.tasks.filter(t => !t.completed).length;

    return {
      totalLeet,
      activeDaysLc,
      totalProjects,
      itemsOnGithub,
      itemsOnLinkedin,
      certificationsCount,
      hackathonsSpent,
      dsaProgress,
      ongoingPursuits,
      incompleteTasks
    };
  }, [data]);

  // Alert Utility
  const triggerAlert = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setBackupAlertMsg({ text, type });
    setShowBackupAlert(true);
    setTimeout(() => {
      setShowBackupAlert(false);
    }, 4500);
  };

  // ----------------------------------------------------
  // LeetCode Automatic Date Generation Logic
  // ----------------------------------------------------
  const calculateNextLeetCodeDate = (): string => {
    if (data.leetcode.length === 0) {
      return new Date().toISOString().split('T')[0];
    }
    // Find the latest date string sequentially
    const sorted = [...data.leetcode].sort((a, b) => a.date.localeCompare(b.date));
    const lastDateStr = sorted[sorted.length - 1].date;
    const lastDate = new Date(lastDateStr);
    
    if (isNaN(lastDate.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    
    // Increment date by exactly 1 day for spreadsheet sequence
    lastDate.setDate(lastDate.getDate() + 1);
    return lastDate.toISOString().split('T')[0];
  };

  // ----------------------------------------------------
  // Grid Action Handlers (Add, Edit, Save, Delete)
  // ----------------------------------------------------
  
  // Create / Insert Row Template
  const handleAddRow = () => {
    const id = `${activeTab}-${Date.now()}`;
    let newRow: any = null;

    if (activeTab === 'leetcode') {
      const nextDate = calculateNextLeetCodeDate();
      // Get last cumulative value or default to 0
      const lastLc = [...data.leetcode].sort((a, b) => a.date.localeCompare(b.date));
      const lastCumulative = lastLc.length > 0 ? lastLc[lastLc.length - 1].cumulative : 130;
      
      newRow = {
        id,
        date: nextDate,
        cumulative: lastCumulative + 1, // Auto-increment total
        individualToday: 1, // Increments single problem default
        topicNotes: 'Recursion / Stack focus'
      } as LeetCodeRow;
    } 
    else if (activeTab === 'projects') {
      newRow = {
        id,
        name: 'New Custom Project',
        description: 'Full-stack application utilizing React and state machine workflows.',
        thingsToDo: '• Implement API bindings\n• Connect Github actions',
        addedToGithub: false,
        addedToLinkedin: false
      } as ProjectRow;
    } 
    else if (activeTab === 'hackathons') {
      newRow = {
        id,
        name: 'TechXcelerate AI Hackathon',
        selectedRounds: 'Idea Submission, Final Presentation',
        achievement: 'Special Track Finalist',
        date: new Date().toISOString().split('T')[0]
      } as HackathonRow;
    } 
    else if (activeTab === 'certifications') {
      newRow = {
        id,
        name: 'Advanced React Architecture Credential',
        issuingOrg: 'Front-End Authority',
        dateCompleted: new Date().toISOString().split('T')[0],
        addedToLinkedin: false
      } as CertificationRow;
    } 
    else if (activeTab === 'dsa') {
      newRow = {
        id,
        topic: 'Graph Algorithms & Trees',
        understanding: 'In Progress',
        questionsCount: 5,
        notes: 'Review topological sorting templates and Floyd-Warshall constraints.'
      } as DSARow;
    } 
    else if (activeTab === 'webdev') {
      newRow = {
        id,
        topic: 'Node & Fastify APIs',
        understanding: 'In Progress',
        projectsPractice: 'Created lightweight secure microservice'
      } as WebDevRow;
    } 
    else if (activeTab === 'active_pursuits') {
      newRow = {
        id,
        name: 'Certified Kubernetes Developer',
        type: 'Certification',
        organization: 'The Linux Foundation',
        status: 'In Progress',
        endDateTarget: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
      } as PursuitRow;
    } 
    else if (activeTab === 'tasks') {
      newRow = {
        id,
        task: 'Review LeetCode notes before upcoming internship submissions',
        dueDate: new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0],
        priority: 'Medium',
        completed: false
      } as TaskRow;
    }

    if (newRow) {
      setData(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], newRow]
      }));
      
      // Auto-focus into editing mode for the freshly added row
      setEditingRowId(id);
      setEditFormData({ ...newRow });
      triggerAlert('New tracker row inserted with auto-increment data!', 'success');
    }
  };

  // Toggle Editing Mode
  const startEditing = (row: any) => {
    setEditingRowId(row.id);
    setEditFormData({ ...row });
  };

  // Input Field changes during Edit Mode
  const handleEditFieldChange = (key: string, value: any) => {
    setEditFormData((prev: any) => {
      const updated = { ...prev, [key]: value };

      // Double-binding: If user is altering individualSolved on LeetCode grid,
      // offer to auto-increment cumulative field cleanly!
      if (activeTab === 'leetcode' && key === 'individualToday') {
        const otherRows = data.leetcode.filter(r => r.id !== prev.id);
        const sorted = [...otherRows].sort((a, b) => a.date.localeCompare(b.date));
        
        let baselineCumulative = 120;
        // Search for previous row based on alphabetical order of dates
        const incomingDate = prev.date;
        const previousRows = sorted.filter(r => r.date < incomingDate);
        if (previousRows.length > 0) {
          baselineCumulative = previousRows[previousRows.length - 1].cumulative;
        } else if (sorted.length > 0) {
          baselineCumulative = sorted[0].cumulative - (sorted[0].individualToday || 1);
        }

        const numVal = parseInt(value, 10) || 0;
        updated.cumulative = baselineCumulative + numVal;
      }

      return updated;
    });
  };

  // Cancel edit
  const cancelEditing = () => {
    setEditingRowId(null);
    setEditFormData(null);
  };

  // Save changes
  const saveRowChanges = (id: string) => {
    setData(prev => {
      const list = prev[activeTab] as any[];
      const updatedList = list.map(item => (item.id === id ? { ...editFormData } : item));
      return {
        ...prev,
        [activeTab]: updatedList
      };
    });
    setEditingRowId(null);
    setEditFormData(null);
    triggerAlert('Changes synchronized to browser memory.', 'success');
  };

  // Direct fast state toggles (e.g. check boxes)
  const toggleRowBoolean = (rowId: string, key: string) => {
    setData(prev => {
      const list = prev[activeTab] as any[];
      const updatedList = list.map(item => {
        if (item.id === rowId) {
          return { ...item, [key]: !item[key] };
        }
        return item;
      });
      return {
        ...prev,
        [activeTab]: updatedList
      };
    });
    triggerAlert('Toggled tracker checkpoint.', 'success');
  };

  // Delete row
  const deleteRow = (id: string) => {
    if (editingRowId === id) {
      setEditingRowId(null);
      setEditFormData(null);
    }
    
    setData(prev => {
      const list = prev[activeTab] as any[];
      return {
        ...prev,
        [activeTab]: list.filter(item => item.id !== id)
      };
    });
    triggerAlert('Row deleted from spreadsheet.', 'info');
  };

  // Restore Default Dataset
  const handleResetToDefault = () => {
    if (window.confirm('Do you want to reset all sheets back to clean empty template values? Your local changes will be replaced.')) {
      setData(JSON.parse(JSON.stringify(INITIAL_SHEETS_DATA)));
      setEditingRowId(null);
      setEditFormData(null);
      setSearchQuery('');
      triggerAlert('Aesthetic blank sheets restored.', 'info');
    }
  };

  // Export JSON Database
  const handleExportBackup = () => {
    const dataStr2 = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr2);
    downloadAnchor.setAttribute("download", `Aesthetic_Tracker_Database_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerAlert('Successfully exported tracker state backup!', 'success');
  };

  // Import JSON Database
  const handleImportBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;
    if (files && files.length > 0) {
      fileReader.readAsText(files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (parsed && typeof parsed === 'object' && 'leetcode' in parsed) {
            setData(parsed as SheetData);
            setEditingRowId(null);
            setEditFormData(null);
            triggerAlert('Imported sheets successfully! Workspace upgraded.', 'success');
          } else {
            triggerAlert('Invalid backup schema. Needs to have leetcode sheet.', 'error');
          }
        } catch (error) {
          triggerAlert('Could not parse JSON file.', 'error');
        }
      };
    }
  };


  // ----------------------------------------------------
  // Interactive Custom SVG Chart for LeetCode Tab
  // ----------------------------------------------------
  const renderedLeetcodeChart = useMemo(() => {
    const rawLc = [...data.leetcode].sort((a, b) => a.date.localeCompare(b.date));
    if (rawLc.length < 2) return null;

    // Sizing Parameters
    const width = 500;
    const height = 150;
    const paddingLeft = 40;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = 25;

    const usableWidth = width - paddingLeft - paddingRight;
    const usableHeight = height - paddingTop - paddingBottom;

    // Extents
    const values = rawLc.map(r => r.cumulative);
    const minVal = Math.max(0, Math.min(...values) - 8);
    const maxVal = Math.max(...values) + 5;
    const valRange = maxVal - minVal;

    // Helper to compute XY
    const getX = (index: number) => {
      return paddingLeft + (index / (rawLc.length - 1)) * usableWidth;
    };
    const getY = (val: number) => {
      const ratio = valRange > 0 ? (val - minVal) / valRange : 0.5;
      return height - paddingBottom - ratio * usableHeight;
    };

    // Construct area and line path strings
    let linePath = `M ${getX(0)} ${getY(rawLc[0].cumulative)}`;
    let areaPath = `M ${getX(0)} ${getY(rawLc[0].cumulative)}`;

    for (let i = 1; i < rawLc.length; i++) {
      const x = getX(i);
      const y = getY(rawLc[i].cumulative);
      linePath += ` L ${x} ${y}`;
      areaPath += ` L ${x} ${y}`;
    }

    areaPath += ` L ${getX(rawLc.length - 1)} ${height - paddingBottom}`;
    areaPath += ` L ${getX(0)} ${height - paddingBottom} Z`;

    const gridYValues = [
      minVal + valRange * 0.25,
      minVal + valRange * 0.5,
      minVal + valRange * 0.75,
      maxVal
    ];

    return (
      <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-xs rounded-xl p-4 flex flex-col md:flex-row gap-5 items-center justify-between">
        <div className="w-full md:w-1/2">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 px-2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wider uppercase">LeetCode Area Trend</span>
            <span className="text-slate-400 text-xs">Interactive Sparkline</span>
          </div>
          <h3 className="font-display font-bold text-slate-800 text-xl tracking-tight">
            Cumulative Solved Track
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Visual representations of individual daily coding sessions combined into one aggregate vector curve. Adding days builds the slope.
          </p>
          
          <div className="mt-4 flex gap-6 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Latest Count</span>
              <span className="text-2xl font-display font-semibold text-slate-800">{values[values.length - 1] || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-sans">Sessions Recorded</span>
              <span className="text-2xl font-display font-semibold text-emerald-600">{rawLc.length} days</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 relative bg-slate-50/50 rounded-lg p-2 border border-slate-100">
          <svg className="w-full h-auto" viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {gridYValues.map((v, idx) => (
              <line 
                key={idx} 
                x1={paddingLeft} 
                y1={getY(v)} 
                x2={width - paddingRight} 
                y2={getY(v)} 
                stroke="#e2e8f0" 
                strokeWidth="1" 
                strokeDasharray="4 4" 
              />
            ))}

            {/* Grid Label Y */}
            <text x={paddingLeft - 8} y={getY(minVal) + 4} textAnchor="end" className="text-[9px] fill-slate-400 font-mono font-medium">
              {Math.round(minVal)}
            </text>
            <text x={paddingLeft - 8} y={getY(maxVal) + 4} textAnchor="end" className="text-[9px] fill-slate-400 font-mono font-medium">
              {Math.round(maxVal)}
            </text>

            {/* The Gradient Area */}
            <path d={areaPath} fill="url(#chartGradient)" />

            {/* The Line */}
            <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Interactive Circles & Labels */}
            {rawLc.map((r, idx) => {
              const cx = getX(idx);
              const cy = getY(r.cumulative);
              const isHovered = hoveredChartPoint === idx;

              return (
                <g 
                  key={r.id} 
                  onMouseEnter={() => setHoveredChartPoint(idx)}
                  onMouseLeave={() => setHoveredChartPoint(null)}
                  className="cursor-pointer"
                >
                  {/* Outer active shadow */}
                  {isHovered && (
                    <circle cx={cx} cy={cy} r="8" fill="#10b981" fillOpacity="0.3" />
                  )}
                  {/* main dot */}
                  <circle cx={cx} cy={cy} r={isHovered ? "5" : "3.5"} fill={isHovered ? "#047857" : "#10b981"} stroke="#ffffff" strokeWidth="1.5" />
                  
                  {/* Minimal dates on bottom */}
                  {(idx === 0 || idx === rawLc.length - 1 || isHovered) && (
                    <text x={cx} y={height - 8} textAnchor="middle" className="text-[9px] fill-slate-400 font-mono font-medium">
                      {r.date.substring(5)} {/* MM-DD */}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip Indicator */}
          {hoveredChartPoint !== null && rawLc[hoveredChartPoint] && (
            <div className="absolute top-3 right-3 bg-slate-900 text-white rounded px-2 py-1 text-[10px] font-mono shadow-md flex gap-2 items-center z-10">
              <span className="text-emerald-400 font-bold">{rawLc[hoveredChartPoint].date}</span>
              <span className="text-slate-300">|</span>
              <span>Total: <strong className="text-white">{rawLc[hoveredChartPoint].cumulative}</strong> (+{rawLc[hoveredChartPoint].individualToday})</span>
            </div>
          )}
        </div>
      </div>
    );
  }, [data.leetcode, hoveredChartPoint]);


  // ----------------------------------------------------
  // Dynamic Search Filter Logic
  // ----------------------------------------------------
  const filteredRows = useMemo(() => {
    const list = data[activeTab] as any[];
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();

    return list.filter(row => {
      return Object.values(row).some(val => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, activeTab, searchQuery]);

  // Handle individual sheet headers and data mapping
  const headers = tabConfig[activeTab].headers;

  if (currentUser === null) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans antialiased select-none p-4 transition-colors duration-200 ${isDarkMode ? 'dark bg-[#0b0f19] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'}`}>
        
        {/* Floating Theme Switcher on Auth page */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg border transition-all cursor-pointer shadow-3xs hover:shadow-2xs ${
              isDarkMode 
                ? 'bg-[#192233] border-[#222E45] text-amber-400 hover:text-amber-300' 
                : 'bg-white border-[#E2E8F0] text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
        </div>

        {/* Auth centered Card */}
        <div className={`w-full max-w-md p-7 sm:p-8 rounded-xl border transition-all duration-250 ${
          isDarkMode 
            ? 'bg-[#13192B] border-[#222E45] shadow-2xl shadow-black/40' 
            : 'bg-white border-[#E2E8F0] shadow-xl shadow-slate-150/50'
        }`}>
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-4 animate-pulse">
              <Layers className="h-6 w-6" />
            </div>
            <h2 className="font-display font-bold text-xl tracking-tight uppercase">
              Workspace Tracker
            </h2>
            <p className={`text-xs mt-1.5 max-w-[280px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Keep accurate logs of your competitive coding, project showcase, and daily progress.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            
            {/* Input fields */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-450' : 'text-slate-500'}`}>
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`h-4 w-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Enter username"
                  value={authUsernameInput}
                  onChange={(e) => setAuthUsernameInput(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none font-medium transition-all focus:ring-1 ${
                    isDarkMode 
                      ? 'bg-[#192233] border-[#2E3C56] text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-emerald-500' 
                      : 'bg-white border-[#E2E8F0] text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-450' : 'text-slate-500'}`}>
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-4 w-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={authPasswordInput}
                  onChange={(e) => setAuthPasswordInput(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none font-medium transition-all focus:ring-1 ${
                    isDarkMode 
                      ? 'bg-[#192233] border-[#2E3C56] text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-emerald-500' 
                      : 'bg-white border-[#E2E8F0] text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="text-[11px] font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-md p-2 text-center">
                {authError}
              </div>
            )}

            {/* CTA button */}
            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-lg shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
            >
              {isSigningUp ? <Plus className="h-4 w-4" /> : <LogIn className="h-4 w-4 animate-pulse" />}
              <span>{isSigningUp ? 'Create Workspace Account' : 'Sign In to Tracker'}</span>
            </button>
          </form>

          {/* Toggle login vs signup */}
          <div className="mt-5 pt-4 border-t border-dashed border-slate-200/20 text-center">
            <button
              onClick={() => {
                setIsSigningUp(!isSigningUp);
                setAuthError('');
              }}
              className={`text-xs font-semibold hover:underline bg-transparent border-0 cursor-pointer ${
                isDarkMode ? 'text-emerald-400 hover:text-emerald-350' : 'text-emerald-700 hover:text-emerald-800'
              }`}
            >
              {isSigningUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-[#0b0f19] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'} flex flex-row font-sans select-none antialiased h-screen w-screen overflow-hidden transition-colors duration-200`}>
      {/* ----------------------------------------------------
          LEFT SIDEBAR NAVIGATION: HIGH-DENSITY SHEET SELECTOR
         ---------------------------------------------------- */}
      <aside className={`hidden md:flex w-64 flex-col shrink-0 select-none ${
        isDarkMode ? 'bg-[#101524] border-r border-[#222E45]' : 'bg-white border-r border-[#E2E8F0]'
      }`}>
        
        {/* Brand Header Section */}
        <div className={`p-4 border-b shrink-0 ${isDarkMode ? 'border-[#222E45]' : 'border-[#E2E8F0]'}`}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Layers className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-black text-xs tracking-tight uppercase leading-none">
                Workspace Tracker
              </h1>
              <span className="text-[9px] text-[#94A3B8] font-bold font-mono tracking-wider block mt-1 uppercase">Sandbox v2.5 Stable</span>
            </div>
          </div>
        </div>

        {/* Compact Sheet List Menu */}
        <div className="flex-1 py-1.5 px-2 overflow-y-auto space-y-0.5 custom-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-3 mb-1.5">📊 ACTIVE SHEETS</span>
          {Object.entries(tabConfig).map(([key, cfg]) => {
            const cfgItem = cfg as TabConfigItem;
            const isSelected = activeTab === key;
            const Icon = cfgItem.icon;
            const sheetLetter = cfgItem.sheetLetter;

            let activeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200/50';
            let activeText = 'text-emerald-755';
            let iconActive = 'text-emerald-600';

            if (isDarkMode) {
              activeBg = 'bg-emerald-950/40 text-emerald-300 border-emerald-900/35';
              activeText = 'text-emerald-400';
              iconActive = 'text-emerald-400';
              if (key === 'projects') { activeBg = 'bg-[#1A2035]/90 text-indigo-300 border-indigo-900/35'; activeText = 'text-indigo-400'; iconActive = 'text-indigo-400'; }
              else if (key === 'hackathons') { activeBg = 'bg-[#29221B]/90 text-amber-300 border-amber-900/35'; activeText = 'text-amber-400'; iconActive = 'text-amber-400'; }
              else if (key === 'certifications') { activeBg = 'bg-[#2E1D25]/90 text-rose-300 border-rose-900/35'; activeText = 'text-rose-400'; iconActive = 'text-rose-400'; }
              else if (key === 'dsa') { activeBg = 'bg-[#2E201C]/90 text-orange-300 border-orange-900/35'; activeText = 'text-orange-400'; iconActive = 'text-orange-400'; }
              else if (key === 'webdev') { activeBg = 'bg-[#142633]/90 text-cyan-300 border-cyan-900/35'; activeText = 'text-cyan-400'; iconActive = 'text-cyan-400'; }
              else if (key === 'active_pursuits') { activeBg = 'bg-[#251A3B]/90 text-purple-300 border-purple-900/35'; activeText = 'text-purple-400'; iconActive = 'text-purple-400'; }
              else if (key === 'tasks') { activeBg = 'bg-[#1E2638] text-slate-300 border-slate-700/55'; activeText = 'text-slate-300'; iconActive = 'text-slate-400'; }
            } else {
              if (key === 'projects') { activeBg = 'bg-indigo-50 text-indigo-800 border-indigo-200/50'; activeText = 'text-indigo-700'; iconActive = 'text-indigo-600'; }
              else if (key === 'hackathons') { activeBg = 'bg-amber-50 text-amber-800 border-amber-200/50'; activeText = 'text-amber-700'; iconActive = 'text-amber-600'; }
              else if (key === 'certifications') { activeBg = 'bg-rose-50 text-rose-800 border-rose-200/50'; activeText = 'text-rose-700'; iconActive = 'text-rose-600'; }
              else if (key === 'dsa') { activeBg = 'bg-orange-50 text-orange-850 border-orange-200/50'; activeText = 'text-orange-700'; iconActive = 'text-orange-600'; }
              else if (key === 'webdev') { activeBg = 'bg-cyan-50 text-cyan-850 border-cyan-200/50'; activeText = 'text-cyan-700'; iconActive = 'text-cyan-600'; }
              else if (key === 'active_pursuits') { activeBg = 'bg-purple-50 text-purple-850 border-purple-200/50'; activeText = 'text-purple-700'; iconActive = 'text-purple-600'; }
              else if (key === 'tasks') { activeBg = 'bg-slate-100 text-slate-800 border-slate-300'; activeText = 'text-slate-800'; iconActive = 'text-slate-600'; }
            }

            return (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key as ActiveTab);
                  setEditingRowId(null);
                  setEditFormData(null);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-[11.5px] font-semibold rounded-md border border-transparent transition-all truncate select-none text-left cursor-pointer ${
                  isSelected 
                    ? `${activeBg} font-bold shadow-3xs` 
                    : (isDarkMode ? 'hover:bg-[#151D2F] text-slate-400 hover:text-slate-200' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-700')
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? iconActive : 'text-slate-400'}`} />
                  <span className="truncate leading-none">{cfgItem.label}</span>
                </div>
                <span className={`text-[8px] font-mono opacity-70 shrink-0 ml-1 rounded px-1 py-0.5 font-bold ${
                  isDarkMode 
                    ? 'bg-slate-800 border border-slate-700/50 text-slate-300' 
                    : 'bg-slate-100 border border-slate-200/30 text-slate-650'
                }`}>Sheet{sheetLetter}</span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Utilities Box */}
        <div className={`p-3 border-t space-y-2 shrink-0 select-none ${
          isDarkMode ? 'border-[#222E45] bg-[#0E1322]' : 'border-[#E2E8F0] bg-slate-50/50'
        }`}>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block px-1 font-mono">Workspace Database Tools</span>
          
          <div className="grid grid-cols-2 gap-1.5">
            <label className={`flex items-center justify-center gap-1.5 px-2 py-1 border text-[10px] font-bold rounded-md cursor-pointer transition-colors shadow-3xs ${
              isDarkMode 
                ? 'bg-[#192233] border-[#222E45] hover:bg-[#1E2A41] text-slate-300 hover:text-slate-100' 
                : 'bg-white border-[#E2E8F0] hover:bg-slate-50 text-slate-600 hover:text-slate-800'
            }`}>
              <Upload className="h-3 w-3 shrink-0" />
              <span>Import</span>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportBackup} 
                className="hidden" 
              />
            </label>
            
            <button 
              onClick={handleExportBackup}
              className={`flex items-center justify-center gap-1.5 px-2 py-1 border text-[10px] font-bold rounded-md transition-colors shadow-3xs cursor-pointer ${
                isDarkMode 
                  ? 'bg-[#192233] border-[#222E45] hover:bg-[#1E2A41] text-slate-300 hover:text-slate-100' 
                  : 'bg-white border-[#E2E8F0] hover:bg-slate-50 text-slate-600 hover:text-slate-800'
              }`}
              title="Download backup data file"
            >
              <Download className="h-3 w-3 shrink-0" />
              <span>Export</span>
            </button>
          </div>

          <button 
            onClick={handleResetToDefault}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 border font-mono text-[10px] font-bold rounded-md transition-all shadow-3xs cursor-pointer ${
              isDarkMode 
                ? 'bg-rose-955/20 border-rose-900/30 hover:bg-rose-950/35 text-rose-450 hover:border-rose-900/50' 
                : 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-700 border-rose-200 hover:border-rose-300'
            }`}
            title="Restore fresh blank workspace template values"
          >
            <RotateCcw className="h-3 w-3 shrink-0" />
            <span>Reset to Template</span>
          </button>
        </div>
      </aside>

      {/* ----------------------------------------------------
          RIGHT MAIN PLATFORM VIEWPORT COVER
         ---------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Workspace Dense Sub-Header */}
        <header className={`h-14 border-b px-5 sm:px-6 flex items-center justify-between shrink-0 select-none transition-colors duration-205 ${
          isDarkMode ? 'bg-[#13192B] border-[#222E45]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-md flex items-center justify-center font-bold text-sm select-none shrink-0 font-display ${
              isDarkMode 
                ? 'bg-slate-800 text-slate-200 border border-slate-700/50' 
                : `bg-${activeColorTheme}-50 border border-${activeColorTheme}-200/50`
            }`} style={{ color: isDarkMode ? undefined : `var(--color-brand-700)` }}>
              {tabConfig[activeTab].sheetLetter}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className={`text-xs sm:text-sm font-bold leading-none ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  {tabConfig[activeTab].label}
                </h2>
                <span className="text-[9.5px] text-slate-400 font-bold font-mono">Sheet{tabConfig[activeTab].sheetLetter}</span>
              </div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1 leading-none">
                {tabConfig[activeTab].badge}
              </p>
            </div>
          </div>

          {/* Controls: Mode Switcher + Auth Indicator */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex lg:flex items-center gap-1 text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider pr-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Spreadsheet connected
            </span>

            {/* Dark & Light toggle button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-3xs ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:text-amber-350 hover:bg-slate-750' 
                  : 'bg-white border-[#E2E8F0] text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Active User Badge & Session Log Out option */}
            <div className={`flex items-center gap-2 pl-3 border-l ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                isDarkMode 
                  ? 'bg-[#192233] border-[#222E45] text-slate-300' 
                  : 'bg-slate-50 border-[#E2E8F0] text-slate-700'
              }`}>
                <User className="h-3 w-3 text-emerald-500 shrink-0" />
                <span className="truncate max-w-[80px] font-mono">{currentUser}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-900/30' 
                    : 'bg-white border-[#E2E8F0] text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                }`}
                title="Log Out of Workspace"
              >
                <LogOut className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </div>
        </header>

      {/* Floating Top Warning Notification toast */}
      {showBackupAlert && (
          <div 
            style={{ animation: 'bounceIn 0.3s' }}
            className={`absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-[11px] font-bold border shadow-md z-50 flex items-center gap-1.5 select-none ${
              backupAlertMsg.type === 'error' 
                ? 'bg-rose-50 border-rose-200 text-rose-800' 
                : backupAlertMsg.type === 'info'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-current animate-pulse shrink-0" />
            <span>{backupAlertMsg.text}</span>
          </div>
      )}

         {/* PRIMARY SCROLLABLE BODY AREA */}
      <div className={`flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar transition-colors duration-200 ${
        isDarkMode ? 'bg-[#0B0F19]' : 'bg-[#F8FAFC]'
      }`}>
          
          {/* STATIC HORIZONTAL METRICS PANEL */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 select-none shrink-0">
            
            {/* Metric Card 1 */}
            <div className={`border rounded-lg p-2.5 flex items-center gap-2.5 shadow-3xs hover:shadow-2xs transition-all ${
              isDarkMode ? 'bg-[#13192B] border-[#222E45]' : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className={`p-1.5 rounded shrink-0 ${isDarkMode ? 'bg-emerald-950/45 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                <Code className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className={`text-[9px] uppercase font-bold tracking-wider block leading-none ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>LeetCode Total</span>
                <span className={`text-[14px] font-display font-extrabold truncate block mt-0.5 leading-tight ${isDarkMode ? 'text-slate-100' : 'text-[#1E293B]'}`}>
                  {stats.totalLeet} Solved
                </span>
                <span className={`text-[9.5px] block truncate leading-none mt-0.5 font-mono ${isDarkMode ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
                  {stats.activeDaysLc} active entries
                </span>
              </div>
            </div>

            {/* Metric Card 2 */}
            <div className={`border rounded-lg p-2.5 flex items-center gap-2.5 shadow-3xs hover:shadow-2xs transition-all ${
              isDarkMode ? 'bg-[#13192B] border-[#222E45]' : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className={`p-1.5 bg-indigo-50 text-indigo-650 rounded shrink-0 ${isDarkMode ? 'bg-indigo-950/45 text-indigo-350' : 'bg-indigo-50 text-indigo-655'}`}>
                <FolderCode className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className={`text-[9px] uppercase font-bold tracking-wider block leading-none font-sans ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Projects Showcase</span>
                <span className={`text-[14px] font-display font-extrabold truncate block mt-0.5 leading-tight ${isDarkMode ? 'text-slate-100' : 'text-[#1E293B]'}`}>
                  {stats.totalProjects} Completed
                </span>
                <span className={`text-[9.5px] block truncate leading-none mt-0.5 font-mono ${isDarkMode ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
                  {stats.itemsOnGithub} on GitHub
                </span>
              </div>
            </div>

            {/* Metric Card 3 */}
            <div className={`border rounded-lg p-2.5 flex items-center gap-2.5 shadow-3xs hover:shadow-2xs transition-all ${
              isDarkMode ? 'bg-[#13192B] border-[#222E45]' : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className={`p-1.5 rounded shrink-0 ${isDarkMode ? 'bg-rose-950/45 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
                <Award className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className={`text-[9px] uppercase font-bold tracking-wider block leading-none ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Credentials Total</span>
                <span className={`text-[14px] font-display font-extrabold truncate block mt-0.5 leading-tight ${isDarkMode ? 'text-slate-100' : 'text-[#1E293B]'}`}>
                  {stats.certificationsCount} Earned
                </span>
                <span className={`text-[9.5px] block truncate leading-none mt-0.5 font-mono ${isDarkMode ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
                  {stats.itemsOnLinkedin} shared
                </span>
              </div>
            </div>

            {/* Metric Card 4 */}
            <div className={`border rounded-lg p-2.5 flex items-center gap-2.5 shadow-3xs hover:shadow-2xs transition-all ${
              isDarkMode ? 'bg-[#13192B] border-[#222E45]' : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className={`p-1.5 rounded shrink-0 ${isDarkMode ? 'bg-slate-800 text-slate-300 border border-slate-700/50' : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'}`}>
                <Clock className="h-4 w-4 font-bold" />
              </div>
              <div className="min-w-0">
                <span className={`text-[9px] uppercase font-bold tracking-wider block leading-none ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Pending Backlog</span>
                <span className={`text-[14px] font-display font-extrabold truncate block mt-0.5 leading-tight ${isDarkMode ? 'text-slate-100' : 'text-[#1E293B]'}`}>
                  {stats.incompleteTasks} Active Items
                </span>
                <span className={`text-[9.5px] block truncate leading-none mt-0.5 font-mono ${isDarkMode ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
                  {stats.ongoingPursuits} working items
                </span>
              </div>
            </div>

          </section>

          {/* LeetCode Area Line Plot */}
          {activeTab === 'leetcode' && (
            <div className="animate-fade-in duration-200">
              {renderedLeetcodeChart}
            </div>
          )}

          {/* SPREADSHEET CARD WRAPPER */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-3xs overflow-hidden flex flex-col">
            
            {/* Sheet Sub-Toolbar operations */}
            <div className="bg-slate-50/70 border-b border-[#E2E8F0] px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 select-none shrink-0">
              
              <div className="flex items-center gap-1.5 col-span-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">Structured Grid Sandbox</span>
                <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[8.5px] rounded px-1.5 font-bold font-mono shrink-0">MUTABLE_SANDBOX</span>
              </div>

              {/* Dynamic Search Bar & Insert Row Buttons */}
              <div className="flex items-center gap-2">
                
                {/* Search query input */}
                <div className="relative w-40 sm:w-52">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                    <Search className="h-3 w-3 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder={`Search rows S${tabConfig[activeTab].sheetLetter}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-7 py-1 bg-white border border-[#E2E8F0] rounded text-[11px] font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-shadow shadow-3xs"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Add dynamic new row line */}
                <button
                  onClick={handleAddRow}
                  className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded shadow-3xs transition-all cursor-pointer"
                  style={{ backgroundColor: `var(--color-brand-600)` }}
                  id="add-row-btn"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span>Insert Row</span>
                </button>

              </div>
            </div>

            {/* SPREADSHEET SPREADSHEEET TABLE VIEW */}
            <div className="w-full overflow-x-auto custom-scrollbar">
            <table className={`w-full min-w-[750px] border-collapse text-left transition-colors duration-200 ${isDarkMode ? 'bg-[#13192B]' : 'bg-white'}`}>
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-[#222E45]' : 'border-slate-300'}`}>
                  {/* Row Index Placeholder Column */}
                  <th className={`py-2.5 px-3 border-r text-slate-400 font-mono text-[10px] text-center font-bold w-12 select-none ${
                    isDarkMode ? 'bg-[#1A2234] border-[#222E45]' : 'bg-slate-100 border-slate-200'
                  }`}>
                    Row
                  </th>

                  {/* Header Columns linked directly to spreadsheet values */}
                  {headers.map((hdr, hIdx) => (
                    <th key={hdr} className="grid-header-cell">
                      <div className="flex items-center justify-between">
                        <span className="truncate">{hdr}</span>
                        <span className="text-[9px] font-mono text-slate-400 ml-1 font-normal" style={isDarkMode ? {color: '#475569'} : undefined}>
                          C{hIdx + 1}
                        </span>
                      </div>
                    </th>
                  ))}

                  {/* Controls Actions Column */}
                  <th className={`py-2.5 px-3 border-r text-slate-400 font-mono text-[10px] text-center font-bold w-24 select-none ${
                    isDarkMode ? 'bg-[#1A2234] border-[#222E45]' : 'bg-slate-100/80 border-slate-200'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length + 2} className="py-12 text-center text-slate-400 text-xs">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto p-4">
                        <Info className="h-6 w-6 text-slate-400" />
                        <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>No matching sheet data found</span>
                        <span>Create your first item using the "+ Add Row" button above or type different query strings in search index focus.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, rowIndex) => {
                    const isRowEditing = editingRowId === row.id;

                    return (
                      <tr 
                        key={row.id} 
                        className={isRowEditing ? 'grid-row-active' : 'grid-row'}
                      >
                        {/* Static index spreadsheet column */}
                        <td className={`py-2 px-3 text-center border-r font-mono text-slate-400 text-xs font-medium select-none ${
                          isDarkMode ? 'bg-[#192233] border-[#222E45]' : 'bg-slate-50 border-slate-100'
                        }`}>
                          {rowIndex + 1}
                        </td>

                        {/* ----------------------------------------------------
                            CONDITIONAL CELL FIELDS FOR TABS
                           ---------------------------------------------------- */}

                        {/* TAB 1: LEETCODE TRACKER */}
                        {activeTab === 'leetcode' && (() => {
                          const lc = row as LeetCodeRow;
                          return (
                            <>
                              {/* C1: DATE */}
                              <td className="grid-cell font-mono text-[12.5px] font-medium text-slate-700 w-36">
                                {isRowEditing ? (
                                  <input 
                                    type="date"
                                    value={editFormData.date}
                                    onChange={(e) => handleEditFieldChange('date', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs"
                                  />
                                ) : (
                                  lc.date
                                )}
                              </td>

                              {/* C2: Cumulative solved */}
                              <td className="grid-cell font-mono font-semibold text-slate-800 w-44">
                                {isRowEditing ? (
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="number"
                                      min="0"
                                      value={editFormData.cumulative}
                                      onChange={(e) => handleEditFieldChange('cumulative', parseInt(e.target.value, 10) || 0)}
                                      className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-semibold"
                                    />
                                    <span className="text-[10px] text-slate-400 font-normal select-none" title="Cumulative problems count">Total</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-slate-800">
                                    <span className="font-semibold">{lc.cumulative}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">solved</span>
                                  </div>
                                )}
                              </td>

                              {/* C3: Solved Today */}
                              <td className="grid-cell font-mono w-40">
                                {isRowEditing ? (
                                  <input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={editFormData.individualToday}
                                    onChange={(e) => handleEditFieldChange('individualToday', parseInt(e.target.value, 10) || 0)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-bold text-center text-emerald-800"
                                  />
                                ) : (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    lc.individualToday > 3 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : lc.individualToday > 0 
                                      ? 'bg-emerald-50 text-emerald-700' 
                                      : 'bg-slate-100 text-slate-400'
                                  }`}>
                                    +{lc.individualToday} solved today
                                  </span>
                                )}
                              </td>

                              {/* C4: Topics & Notes */}
                              <td className="grid-cell text-slate-600">
                                {isRowEditing ? (
                                  <input 
                                    type="text"
                                    value={editFormData.topicNotes}
                                    onChange={(e) => handleEditFieldChange('topicNotes', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-2 py-0.5 rounded text-xs"
                                    placeholder="Enter topics, specific patterns, or difficult problem details."
                                  />
                                ) : (
                                  lc.topicNotes
                                )}
                              </td>
                            </>
                          );
                        })()}

                        {/* TAB 2: PROJECTS REGISTER */}
                        {activeTab === 'projects' && (() => {
                          const p = row as ProjectRow;
                          return (
                            <>
                              {/* C1: PROJECT NAME */}
                              <td className="grid-cell font-medium text-slate-800 w-52">
                                {isRowEditing ? (
                                  <input 
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => handleEditFieldChange('name', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-semibold text-slate-800"
                                  />
                                ) : (
                                  p.name
                                )}
                              </td>

                              {/* C2: DESCRIPTION */}
                              <td className="grid-cell text-slate-600 w-72">
                                {isRowEditing ? (
                                  <textarea 
                                    rows={2}
                                    value={editFormData.description}
                                    onChange={(e) => handleEditFieldChange('description', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs leading-normal resize-none"
                                  />
                                ) : (
                                  <p className="line-clamp-2 text-slate-500 leading-normal">{p.description}</p>
                                )}
                              </td>

                              {/* C3: THINGS YET TO DO */}
                              <td className="grid-cell text-xs py-1.5 w-80">
                                {isRowEditing ? (
                                  <textarea 
                                    rows={3}
                                    value={editFormData.thingsToDo}
                                    onChange={(e) => handleEditFieldChange('thingsToDo', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded font-mono text-2xs leading-normal resize-none"
                                    placeholder="• Task 1&#10;• Task 2"
                                  />
                                ) : (
                                  <div className="bg-slate-50 border border-slate-250/20 rounded-md p-1.5 font-mono text-[10.5px] text-slate-500 whitespace-pre-wrap leading-tight max-h-[70px] overflow-y-auto">
                                    {p.thingsToDo || "✔️ Fully complete / clean production checklist!"}
                                  </div>
                                )}
                              </td>

                              {/* C4: GITHUB STATUS */}
                              <td className="grid-cell w-36 text-center">
                                <div className="flex justify-center">
                                  {isRowEditing ? (
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input 
                                        type="checkbox"
                                        checked={editFormData.addedToGithub}
                                        onChange={(e) => handleEditFieldChange('addedToGithub', e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                      />
                                      <span className="text-[11px] font-medium text-slate-500">Pushed</span>
                                    </label>
                                  ) : (
                                    <button
                                      onClick={() => toggleRowBoolean(p.id, 'addedToGithub')}
                                      className={`px-2.5 py-1 rounded-full text-2xs font-semibold flex items-center gap-1 transition-colors ${
                                        p.addedToGithub 
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                      }`}
                                    >
                                      <Github className="h-3 w-3" />
                                      <span>{p.addedToGithub ? 'GitHub Live' : 'Not Pushed'}</span>
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* C5: LINKEDIN STATUS */}
                              <td className="grid-cell w-36 text-center">
                                <div className="flex justify-center">
                                  {isRowEditing ? (
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input 
                                        type="checkbox"
                                        checked={editFormData.addedToLinkedin}
                                        onChange={(e) => handleEditFieldChange('addedToLinkedin', e.target.checked)}
                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                                      />
                                      <span className="text-[11px] font-medium text-slate-500">Shared</span>
                                    </label>
                                  ) : (
                                    <button
                                      onClick={() => toggleRowBoolean(p.id, 'addedToLinkedin')}
                                      className={`px-2.5 py-1 rounded-full text-2xs font-semibold flex items-center gap-1 transition-colors ${
                                        p.addedToLinkedin 
                                          ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                      }`}
                                    >
                                      <Linkedin className="h-3 w-3" />
                                      <span>{p.addedToLinkedin ? 'Shared' : 'Post to LI'}</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </>
                          );
                        })()}

                        {/* TAB 3: HACKATHONS */}
                        {activeTab === 'hackathons' && (() => {
                          const hk = row as HackathonRow;
                          return (
                            <>
                              {/* C1: TOURNAMENT NAME */}
                              <td className="grid-cell font-medium text-slate-800 w-52">
                                {isRowEditing ? (
                                  <input 
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => handleEditFieldChange('name', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-semibold text-slate-800"
                                  />
                                ) : (
                                  hk.name
                                )}
                              </td>

                              {/* C2: SELECTED ROUNDS */}
                              <td className="grid-cell text-slate-600 w-64">
                                {isRowEditing ? (
                                  <input 
                                    type="text"
                                    value={editFormData.selectedRounds}
                                    onChange={(e) => handleEditFieldChange('selectedRounds', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs"
                                    placeholder="Rounds selected (e.g. Ideation, Demo)"
                                  />
                                ) : (
                                  <span className="text-slate-500">{hk.selectedRounds}</span>
                                )}
                              </td>

                              {/* C3: ACHIEVEMENT */}
                              <td className="grid-cell w-64">
                                {isRowEditing ? (
                                  <input 
                                    type="text"
                                    value={editFormData.achievement}
                                    onChange={(e) => handleEditFieldChange('achievement', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-semibold text-slate-800"
                                  />
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-200/80">
                                    <Trophy className="h-3 w-3 text-amber-600" />
                                    <span>{hk.achievement}</span>
                                  </span>
                                )}
                              </td>

                              {/* C4: DATE */}
                              <td className="grid-cell font-mono text-[12.5px] text-slate-500 w-36">
                                {isRowEditing ? (
                                  <input 
                                    type="date"
                                    value={editFormData.date}
                                    onChange={(e) => handleEditFieldChange('date', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-mono"
                                  />
                                ) : (
                                  hk.date
                                )}
                              </td>
                            </>
                          );
                        })()}

                        {/* TAB 4: CERTIFICATIONS */}
                        {activeTab === 'certifications' && (() => {
                          const c = row as CertificationRow;
                          return (
                            <>
                              {/* C1: CREDENTIAL NAME */}
                              <td className="grid-cell font-medium text-slate-800 w-72">
                                {isRowEditing ? (
                                  <input 
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => handleEditFieldChange('name', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-semibold text-slate-800"
                                  />
                                ) : (
                                  c.name
                                )}
                              </td>

                              {/* C2: ISSUING ORG */}
                              <td className="grid-cell text-slate-600 w-56">
                                {isRowEditing ? (
                                  <input 
                                    type="text"
                                    value={editFormData.issuingOrg}
                                    onChange={(e) => handleEditFieldChange('issuingOrg', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs"
                                  />
                                ) : (
                                  <span className="text-slate-500">{c.issuingOrg}</span>
                                )}
                              </td>

                              {/* C3: DATE COMPLETED */}
                              <td className="grid-cell font-mono text-[12.5px] text-slate-500 w-36">
                                {isRowEditing ? (
                                  <input 
                                    type="date"
                                    value={editFormData.dateCompleted}
                                    onChange={(e) => handleEditFieldChange('dateCompleted', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-mono"
                                  />
                                ) : (
                                  c.dateCompleted
                                )}
                              </td>

                              {/* C4: SHARED */}
                              <td className="grid-cell w-36 text-center">
                                <div className="flex justify-center">
                                  {isRowEditing ? (
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input 
                                        type="checkbox"
                                        checked={editFormData.addedToLinkedin}
                                        onChange={(e) => handleEditFieldChange('addedToLinkedin', e.target.checked)}
                                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                                      />
                                      <span className="text-[11px] font-medium text-slate-500">Shared</span>
                                    </label>
                                  ) : (
                                    <button
                                      onClick={() => toggleRowBoolean(c.id, 'addedToLinkedin')}
                                      className={`px-2.5 py-1 rounded-full text-2xs font-semibold flex items-center gap-1 transition-colors ${
                                        c.addedToLinkedin 
                                          ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                      }`}
                                    >
                                      <Linkedin className="h-3 w-3" />
                                      <span>{c.addedToLinkedin ? 'LinkedIn Live' : 'Link Profile'}</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </>
                          );
                        })()}

                        {/* TAB 5: DSA TOPICS */}
                        {activeTab === 'dsa' && (() => {
                          const d = row as DSARow;
                          return (
                            <>
                              {/* C1: TOPIC SECTION */}
                              <td className="grid-cell font-medium text-slate-800 w-60">
                                {isRowEditing ? (
                                  <input 
                                    type="text"
                                    value={editFormData.topic}
                                    onChange={(e) => handleEditFieldChange('topic', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-semibold text-slate-800"
                                  />
                                ) : (
                                  d.topic
                                )}
                              </td>

                              {/* C2: UNDERSTANDING STATUS */}
                              <td className="grid-cell w-44">
                                {isRowEditing ? (
                                  <select
                                    value={editFormData.understanding}
                                    onChange={(e) => handleEditFieldChange('understanding', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-medium"
                                  >
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Good">Good</option>
                                    <option value="Mastered">Mastered</option>
                                  </select>
                                ) : (
                                  <span className={`px-2.5 py-0.5 rounded-full text-2xs font-semibold select-none ${
                                    d.understanding === 'Mastered' 
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                      : d.understanding === 'Good' 
                                      ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' 
                                      : d.understanding === 'In Progress' 
                                      ? 'bg-amber-50 text-amber-800 border border-amber-20 border-amber-200' 
                                      : 'bg-slate-100 text-slate-400'
                                  }`}>
                                    {d.understanding}
                                  </span>
                                )}
                              </td>

                              {/* C3: QUESTIONS COUNT */}
                              <td className="grid-cell font-mono w-40 text-center">
                                {isRowEditing ? (
                                  <input 
                                    type="number"
                                    min="0"
                                    value={editFormData.questionsCount}
                                    onChange={(e) => handleEditFieldChange('questionsCount', parseInt(e.target.value, 10) || 0)}
                                    className="w-16 mx-auto bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-semibold text-center"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="font-semibold text-slate-700">{d.questionsCount}</span>
                                    <span className="text-2xs text-slate-400">probs</span>
                                  </div>
                                )}
                              </td>

                              {/* C4: TOPIC NOTES */}
                              <td className="grid-cell text-slate-600">
                                {isRowEditing ? (
                                  <input 
                                    type="text"
                                    value={editFormData.notes}
                                    onChange={(e) => handleEditFieldChange('notes', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-2 py-0.5 rounded text-xs"
                                  />
                                ) : (
                                  d.notes
                                )}
                              </td>
                            </>
                          );
                        })()}

                        {/* TAB 6: WEB DEV */}
                        {activeTab === 'webdev' && (() => {
                          const w = row as WebDevRow;
                          return (
                            <>
                              {/* C1: WEB TECH */}
                              <td className="grid-cell font-medium text-slate-800 w-64">
                                {isRowEditing ? (
                                  <input 
                                    type="text"
                                    value={editFormData.topic}
                                    onChange={(e) => handleEditFieldChange('topic', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-semibold text-slate-800"
                                  />
                                ) : (
                                  w.topic
                                )}
                              </td>

                              {/* C2: UNDERSTANDING STATUS */}
                              <td className="grid-cell w-44">
                                {isRowEditing ? (
                                  <select
                                    value={editFormData.understanding}
                                    onChange={(e) => handleEditFieldChange('understanding', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-medium"
                                  >
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Good">Good</option>
                                    <option value="Mastered">Mastered</option>
                                  </select>
                                ) : (
                                  <span className={`px-2.5 py-0.5 rounded-full text-2xs font-semibold select-none ${
                                    w.understanding === 'Mastered' 
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                      : w.understanding === 'Good' 
                                      ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' 
                                      : w.understanding === 'In Progress' 
                                      ? 'bg-amber-50 text-amber-800 border border-amber-20 border-amber-200' 
                                      : 'bg-slate-100 text-slate-400'
                                  }`}>
                                    {w.understanding}
                                  </span>
                                )}
                              </td>

                              {/* C3: PROJECTS / EXERCISES */}
                              <td className="grid-cell text-slate-600">
                                {isRowEditing ? (
                                  <input 
                                    type="text"
                                    value={editFormData.projectsPractice}
                                    onChange={(e) => handleEditFieldChange('projectsPractice', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-2 py-0.5 rounded text-xs"
                                  />
                                ) : (
                                  w.projectsPractice
                                )}
                              </td>
                            </>
                          );
                        })()}

                        {/* TAB 7: ACTIVE PURSUITS */}
                        {activeTab === 'active_pursuits' && (() => {
                          const pr = row as PursuitRow;
                          return (
                            <>
                              {/* C1: PURSUIT NAME */}
                              <td className="grid-cell font-medium text-slate-800 w-64">
                                {isRowEditing ? (
                                  <input 
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => handleEditFieldChange('name', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-semibold text-slate-800"
                                  />
                                ) : (
                                  pr.name
                                )}
                              </td>

                              {/* C2: PROGRAM CATEGORY */}
                              <td className="grid-cell text-slate-600 w-40">
                                {isRowEditing ? (
                                  <select
                                    value={editFormData.type}
                                    onChange={(e) => handleEditFieldChange('type', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs"
                                  >
                                    <option value="Certification">Certification</option>
                                    <option value="Simulation">Simulation</option>
                                    <option value="Internship">Internship</option>
                                  </select>
                                ) : (
                                  <span className="p-1 px-1.5 font-mono text-[10.5px] rounded border border-slate-200 bg-slate-50 text-slate-500 font-semibold select-none">
                                    {pr.type}
                                  </span>
                                )}
                              </td>

                              {/* C3: ORGANIZATION */}
                              <td className="grid-cell text-slate-600 w-52">
                                {isRowEditing ? (
                                  <input 
                                    type="text"
                                    value={editFormData.organization}
                                    onChange={(e) => handleEditFieldChange('organization', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs"
                                  />
                                ) : (
                                  <span className="text-slate-500">{pr.organization}</span>
                                )}
                              </td>

                              {/* C4: PROGRESS STATUS BAR */}
                              <td className="grid-cell w-56">
                                {isRowEditing ? (
                                  <select
                                    value={editFormData.status}
                                    onChange={(e) => handleEditFieldChange('status', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-medium"
                                  >
                                    <option value="Not Started" className="font-semibold text-slate-400">Not Started</option>
                                    <option value="In Progress" className="font-semibold text-amber-500">In Progress</option>
                                    <option value="Halfway" className="font-semibold text-indigo-500">Halfway</option>
                                    <option value="Near Completion" className="font-semibold text-pink-500">Near Completion</option>
                                    <option value="Completed" className="font-semibold text-emerald-500">Completed</option>
                                  </select>
                                ) : (() => {
                                  let percent = 0;
                                  let progressColor = 'bg-slate-300';
                                  if (pr.status === 'In Progress') { percent = 25; progressColor = 'bg-amber-500'; }
                                  else if (pr.status === 'Halfway') { percent = 50; progressColor = 'bg-indigo-500'; }
                                  else if (pr.status === 'Near Completion') { percent = 85; progressColor = 'bg-pink-500'; }
                                  else if (pr.status === 'Completed') { percent = 100; progressColor = 'bg-emerald-500'; }
                                  
                                  return (
                                    <div className="flex flex-col gap-1.5 py-0.5 select-none">
                                      <div className="flex justify-between items-center text-[10.5px]">
                                        <span className="font-semibold text-slate-600">{pr.status}</span>
                                        <span className="font-mono text-slate-400">{percent}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                        <div 
                                          className={`h-full ${progressColor} transition-all duration-300`} 
                                          style={{ width: `${percent}%` }} 
                                        />
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>

                              {/* C5: TARGET END DATE */}
                              <td className="grid-cell font-mono text-[12.5px] text-slate-500 w-36">
                                {isRowEditing ? (
                                  <input 
                                    type="date"
                                    value={editFormData.endDateTarget}
                                    onChange={(e) => handleEditFieldChange('endDateTarget', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-mono"
                                  />
                                ) : (
                                  pr.endDateTarget
                                )}
                              </td>
                            </>
                          );
                        })()}

                        {/* TAB 8: TO-DO IN NEXT FEW DAYS */}
                        {activeTab === 'tasks' && (() => {
                          const t = row as TaskRow;
                          return (
                            <>
                              {/* C1: PENDING TASK */}
                              <td className={`grid-cell w-96 font-medium ${t.completed ? 'line-through text-slate-400 decoration-slate-300' : 'text-slate-800'}`}>
                                {isRowEditing ? (
                                  <input 
                                    type="text"
                                    value={editFormData.task}
                                    onChange={(e) => handleEditFieldChange('task', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-semibold text-slate-800"
                                  />
                                ) : (
                                  t.task
                                )}
                              </td>

                              {/* C2: DUE DATE */}
                              <td className="grid-cell font-mono text-[12.5px] text-slate-500 w-40">
                                {isRowEditing ? (
                                  <input 
                                    type="date"
                                    value={editFormData.dueDate}
                                    onChange={(e) => handleEditFieldChange('dueDate', e.target.value)}
                                    className="w-full bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-mono"
                                  />
                                ) : (
                                  t.dueDate
                                )}
                              </td>

                              {/* C3: PRIORITY RANK */}
                              <td className="grid-cell w-36 text-center">
                                <div className="flex justify-center">
                                  {isRowEditing ? (
                                    <select
                                      value={editFormData.priority}
                                      onChange={(e) => handleEditFieldChange('priority', e.target.value)}
                                      className="bg-white border border-slate-200 outline-hidden px-1.5 py-0.5 rounded text-xs font-semibold"
                                    >
                                      <option value="Low">Low</option>
                                      <option value="Medium">Medium</option>
                                      <option value="High">High</option>
                                    </select>
                                  ) : (
                                    <span className={`px-2 py-0.5 font-mono text-[10.5px] font-bold rounded-md select-none ${
                                      t.priority === 'High' 
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                        : t.priority === 'Medium' 
                                        ? 'bg-amber-55 bg-amber-50 text-amber-700 border border-amber-200' 
                                        : 'bg-slate-100 text-slate-400'
                                    }`}>
                                      {t.priority}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* C4: MARK FINISHED */}
                              <td className="grid-cell w-32 text-center">
                                <div className="flex justify-center">
                                  {isRowEditing ? (
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input 
                                        type="checkbox"
                                        checked={editFormData.completed}
                                        onChange={(e) => handleEditFieldChange('completed', e.target.checked)}
                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                      />
                                      <span className="text-[11px] font-medium text-slate-500">Done</span>
                                    </label>
                                  ) : (
                                    <button
                                      onClick={() => toggleRowBoolean(t.id, 'completed')}
                                      className={`p-1.5 rounded-full transition-all ${
                                        t.completed 
                                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200/80' 
                                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                      }`}
                                      title={t.completed ? 'Mark task incomplete' : 'Mark task complete'}
                                    >
                                      {t.completed ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                      ) : (
                                        <Clock className="h-4 w-4 text-slate-400" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </>
                          );
                        })()}

                        {/* ----------------------------------------------------
                            GLOBAL ACTIONS CONTROL ACTIONS
                           ---------------------------------------------------- */}
                        <td className="py-2 px-3 border-r border-slate-150/10 text-center w-28">
                          <div className="flex items-center justify-center gap-1.5">
                            {isRowEditing ? (
                              <>
                                <button
                                  onClick={() => saveRowChanges(row.id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                  title="Commit line changes"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="p-1 text-slate-400 hover:bg-slate-100 rounded transition-colors"
                                  title="Cancel changes"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditing(row)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                  title="Edit row inline"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm("Delete row? This action is temporary until synchronized.")) {
                                      deleteRow(row.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title="Drop row"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer spreadsheet info strip */}
          <div className="bg-slate-50 border-t border-[#E2E8F0] px-4 py-2 flex items-center justify-between text-2xs text-slate-400 font-mono select-none">
            <div className="flex items-center gap-4">
              <span>Selected Scope: R{filteredRows.length} x C{headers.length}</span>
              <span className="hidden sm:inline">Active Filter: {searchQuery ? `"${searchQuery}"` : 'None'}</span>
            </div>
            <div>
              <span>System Memory Locked</span>
            </div>
          </div>

        </div>

      </div>

      {/* ----------------------------------------------------
          ESTABLISHED GOOGLE SHEETS SPREADSHEET BOTTOM TAB SELECTOR (FOR MOBILE & BACKUP)
         ---------------------------------------------------- */}
      <footer className="bg-[#f1f5f9] border-t border-slate-300 py-1 sticky bottom-0 z-45 shadow-xl select-none md:hidden shrink-0">
        <div className="max-w-7xl mx-auto px-1 sm:px-2 flex items-center justify-between">
          
          {/* Scrollable sheet selector */}
          <div className="flex-1 overflow-x-auto custom-scrollbar flex items-end pr-4">
            <div className="flex items-center gap-1 pl-1">
              {Object.entries(tabConfig).map(([key, cfg]) => {
                const cfgItem = cfg as TabConfigItem;
                const isSelected = activeTab === key;
                const Icon = cfgItem.icon;
                const sheetLetter = cfgItem.sheetLetter;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTab(key as ActiveTab);
                      setEditingRowId(null);
                      setEditFormData(null);
                      setSearchQuery('');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold border-x border-t transition-all truncate select-none shrink-0 ${
                      isSelected 
                        ? 'bg-white text-slate-800 border-slate-300 rounded-t-md font-bold shadow-xs border-t-2' 
                        : 'bg-[#e2e8f0]/60 hover:bg-[#cbd5e1]/40 text-slate-500 border-transparent hover:text-slate-700'
                    }`}
                    style={isSelected ? { borderTopColor: `var(--color-brand-600)` } : {}}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{cfgItem.label}</span>
                    <span className="text-[9px] opacity-45 font-mono font-normal">S{sheetLetter}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick interactive note */}
          <div className="hidden lg:flex items-center gap-2 pr-4 text-slate-400 text-[10.5px] font-mono shrink-0">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Google Drive Sheet Sandbox | Ready</span>
          </div>

        </div>
      </footer>
    </div>
  </div>
  );
}
