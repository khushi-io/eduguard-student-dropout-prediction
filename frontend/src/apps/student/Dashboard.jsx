import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sprout, BarChart3, Calendar, BookOpen, MessageCircle,
  Library, TrendingUp, Star, Send, Smile,
  AlertTriangle, CheckCircle, Zap, ChevronRight
} from 'lucide-react';

import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, BarElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useAuth } from '../../AuthContext';
import Sidebar from '../../components/shared/Sidebar';
import { RiskBar, Badge } from '../../components/shared/Badge';
import { Toast, useToast } from '../../components/shared/Toast';

ChartJS.register(CategoryScale, LinearScale, LineElement, BarElement, PointElement, Title, Tooltip, Legend, Filler);

const API = 'http://localhost:5000';

/* ──────────────────────────────────────────────
   GROWTH GARDEN — SVG that actually grows
   stage 1: sprout  (risk > 70)
   stage 2: seedling (risk > 50)
   stage 3: growing  (risk > 30)
   stage 4: blooming (risk > 15)
   stage 5: flourishing (risk <= 15)
────────────────────────────────────────────── */
function GrowthGarden({ stage, risk }) {
  const stages = {
    sprout:      { label: 'Sprout', color: '#ffb800', stemH: 20, leaves: 0,  flowers: 0, fruit: 0 },
    seedling:    { label: 'Seedling', color: '#a8d464', stemH: 45, leaves: 2,  flowers: 0, fruit: 0 },
    growing:     { label: 'Growing', color: '#64c832', stemH: 75, leaves: 4,  flowers: 0, fruit: 0 },
    blooming:    { label: 'Blooming', color: '#00ff88', stemH: 100, leaves: 6, flowers: 3, fruit: 0 },
    flourishing: { label: 'Flourishing', color: '#00d4ff', stemH: 120, leaves: 8, flowers: 5, fruit: 3 },
  };

  const config = stages[stage] || stages.sprout;
  const groundY = 220;
  const centerX = 140;
  const stemTop = groundY - config.stemH;

  // Generate leaf positions along the stem
  const leafPositions = [];
  for (let i = 0; i < config.leaves; i++) {
    const t = (i + 1) / (config.leaves + 1);
    const ly = stemTop + t * config.stemH;
    const side = i % 2 === 0 ? -1 : 1;
    leafPositions.push({ x: centerX + side * 38, y: ly, side });
  }

  // Flower positions
  const flowerPositions = [];
  if (config.flowers > 0) {
    const angles = [0, 72, 144, 216, 288].slice(0, config.flowers);
    angles.forEach((a, i) => {
      const rad = (a * Math.PI) / 180;
      flowerPositions.push({
        x: centerX + Math.cos(rad) * 30,
        y: stemTop + Math.sin(rad) * 20 - 15,
      });
    });
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 280 260" className="w-64 h-64">
        {/* Ground */}
        <ellipse cx={centerX} cy={groundY} rx={80} ry={10}
          fill="rgba(0,212,255,0.08)" stroke="rgba(0,212,255,0.2)" strokeWidth="1" />

        {/* Soil particles */}
        {[-20, -5, 10, 25, 40].map((dx, i) => (
          <circle key={i} cx={centerX + dx} cy={groundY + 4} r={2} fill="rgba(0,212,255,0.15)" />
        ))}

        {/* Stem */}
        <motion.path
          d={`M ${centerX} ${groundY} Q ${centerX - 5} ${groundY - config.stemH / 2} ${centerX} ${stemTop}`}
          fill="none" stroke="#00cc66" strokeWidth="4" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
        />

        {/* Leaves */}
        {leafPositions.map((lp, i) => (
          <motion.g key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.1, duration: 0.5, type: 'spring' }}
            style={{ transformOrigin: `${centerX}px ${lp.y}px` }}>
            <ellipse
              cx={lp.x} cy={lp.y} rx={18} ry={9}
              fill={config.color} opacity={0.7}
              transform={`rotate(${lp.side > 0 ? 20 : -20}, ${lp.x}, ${lp.y})`}
              className="animate-sway"
            />
          </motion.g>
        ))}

        {/* Flowers */}
        {flowerPositions.map((fp, i) => (
          <motion.g key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.0 + i * 0.15, duration: 0.4, type: 'spring', stiffness: 300 }}
            style={{ transformOrigin: `${fp.x}px ${fp.y}px` }}>
            {/* Petals */}
            {[0, 72, 144, 216, 288].map((a, j) => {
              const pr = (a * Math.PI) / 180;
              return (
                <ellipse key={j}
                  cx={fp.x + Math.cos(pr) * 8} cy={fp.y + Math.sin(pr) * 8}
                  rx={5} ry={3}
                  fill={config.color} opacity={0.85}
                  transform={`rotate(${a}, ${fp.x + Math.cos(pr) * 8}, ${fp.y + Math.sin(pr) * 8})`}
                />
              );
            })}
            {/* Center */}
            <circle cx={fp.x} cy={fp.y} r={5} fill="#ffdd00"
              style={{ filter: 'drop-shadow(0 0 4px rgba(255,220,0,0.8))' }} />
          </motion.g>
        ))}

        {/* Fruits / berries */}
        {config.fruit > 0 && [-25, 0, 25].slice(0, config.fruit).map((dx, i) => (
          <motion.circle key={i}
            cx={centerX + dx} cy={stemTop + 20} r={7}
            fill="#ff6b9d"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.4 + i * 0.1, type: 'spring' }}
            style={{ filter: 'drop-shadow(0 0 6px rgba(255,107,157,0.6))' }}
          />
        ))}

        {/* Stage label */}
        <text x={centerX} y={245} textAnchor="middle" fill={config.color}
          fontSize="11" fontFamily="Fira Code" fontWeight="600">
          {config.label}
        </text>

        {/* Risk indicator dot */}
        <circle cx={230} cy={30} r={12} fill="none" stroke={risk > 60 ? '#ff4444' : risk > 35 ? '#ffb800' : '#00ff88'} strokeWidth="2" />
        <text x={230} y={35} textAnchor="middle" fill={risk > 60 ? '#ff4444' : risk > 35 ? '#ffb800' : '#00ff88'}
          fontSize="8" fontFamily="Fira Code" fontWeight="700">{Math.round(risk)}%</text>
      </svg>

      {/* Progress to next stage */}
      {stage !== 'flourishing' && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-[10px] text-muted mb-1 font-mono">
            <span>Growth Progress</span>
            <span>{100 - Math.round(risk)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${100 - risk}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${config.color}, #00d4ff)` }}
            />
          </div>
          <p className="text-[10px] text-muted mt-1 text-center font-mono">
            Reduce risk to {stage === 'sprout' ? '50' : stage === 'seedling' ? '30' : stage === 'growing' ? '15' : '5'}% to advance
          </p>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   WATER DROP ANIMATION
────────────────────────────────────────────── */
function WaterEffect({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div key={i}
              initial={{ y: -30, x: 80 + i * 15, opacity: 0, scale: 0 }}
              animate={{ y: 80, opacity: [0, 1, 0], scale: [0, 1, 0.5] }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.12, duration: 0.9 }}
              className="absolute w-2 h-3 rounded-full"
              style={{ background: '#00d4ff', filter: 'drop-shadow(0 0 4px #00d4ff)' }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

const RESOURCES_DETAILS = {
  'MCA-101 Data Structures': {
    title: 'MCA-101 Data Structures',
    desc: 'Arrays, Linked Lists, Trees, Graphs, Sorting & Searching',
    icon: '📊',
    color: '#00d4ff',
    modules: [
      { num: 'Module 1', title: 'Linked Lists & Stacks', desc: 'Singly, Doubly, and Circular Linked Lists; Stack operations, balancing parentheses, infix to postfix conversion.' },
      { num: 'Module 2', title: 'Binary Search Trees & AVL Trees', desc: 'Tree properties, binary tree traversals (preorder, inorder, postorder), BST insertion and deletion, AVL tree rotations, height-balancing.' },
      { num: 'Module 3', title: 'Graph Algorithms', desc: 'Representations (adjacency matrix/list), BFS & DFS traversals, Shortest Path (Dijkstra), Minimum Spanning Trees (Prim, Kruskal).' },
      { num: 'Module 4', title: 'Sorting & Searching', desc: 'Linear and Binary search; Bubble, Selection, Insertion, Merge, Quick, and Heap sort algorithms with time/space complexities.' }
    ],
    files: [
      { name: 'Trees_and_Graphs_Lecture_Notes.pdf', size: '1.4 MB', type: 'PDF' },
      { name: 'DS_Complexity_Reference_CheatSheet.pdf', size: '450 KB', type: 'CheatSheet' }
    ],
    quiz: [
      {
        q: 'What is the worst-case time complexity of searching in a height-balanced AVL tree?',
        options: ['O(log n)', 'O(n)', 'O(n log n)'],
        answer: 0,
        explanation: 'AVL trees are strictly balanced. The search, insert, and delete operations take O(log n) time in both average and worst cases.'
      },
      {
        q: 'Which data structure follows the First In First Out (FIFO) property?',
        options: ['Stack', 'Queue', 'Priority Queue'],
        answer: 1,
        explanation: 'Queues process items in the order they arrive (FIFO), whereas Stacks use Last In First Out (LIFO).'
      },
      {
        q: 'Which sorting algorithm has a guaranteed O(n log n) worst-case time complexity and is stable?',
        options: ['Quick Sort', 'Merge Sort', 'Heap Sort'],
        answer: 1,
        explanation: 'Merge Sort guarantees O(n log n) in all cases and is a stable sort, unlike Quick Sort (O(n²) worst case) and Heap Sort (unstable).'
      }
    ]
  },
  'MCA-102 OOPs with Java': {
    title: 'MCA-102 OOPs with Java',
    desc: 'Classes, Inheritance, Polymorphism, Design Patterns',
    icon: '☕',
    color: '#00ff88',
    modules: [
      { num: 'Module 1', title: 'Java Basics & Class Design', desc: 'JVM architecture, data types, constructors, this keyword, static members, access modifiers, encapsulation principles.' },
      { num: 'Module 2', title: 'Inheritance & Interfaces', desc: 'Method overriding, super keyword, abstract classes, multiple inheritance via interfaces, dynamic method dispatch.' },
      { num: 'Module 3', title: 'Exceptions & Multithreading', desc: 'Try-catch-finally, checked vs unchecked exceptions, custom exceptions, Thread lifecycle, synchronization, inter-thread communication.' },
      { num: 'Module 4', title: 'Collections & Generics', desc: 'Generics classes and methods, List, Set, Map interfaces, ArrayList, LinkedList, HashSet, HashMap implementations.' }
    ],
    files: [
      { name: 'OOPs_Design_Patterns_Handout.pdf', size: '850 KB', type: 'PDF' },
      { name: 'Java_Collections_Framework_Reference.pdf', size: '120 KB', type: 'CheatSheet' }
    ],
    quiz: [
      {
        q: 'Which keyword prevents a class from being inherited or overridden in Java?',
        options: ['static', 'final', 'const'],
        answer: 1,
        explanation: 'The final keyword applied to a class prevents inheritance. Applied to a method, it prevents overriding.'
      },
      {
        q: 'What is dynamic method dispatch an example of?',
        options: ['Compile-time Polymorphism', 'Runtime Polymorphism', 'Encapsulation'],
        answer: 1,
        explanation: 'Dynamic method dispatch is how Java resolves overridden methods at runtime, implementing runtime polymorphism.'
      },
      {
        q: 'Which collection class does NOT preserve insertion order and does NOT allow duplicate elements?',
        options: ['ArrayList', 'HashSet', 'LinkedHashSet'],
        answer: 1,
        explanation: 'HashSet does not allow duplicates and does not guarantee any specific order. LinkedHashSet preserves insertion order.'
      }
    ]
  },
  'MCA-103 DBMS': {
    title: 'MCA-103 DBMS',
    desc: 'SQL, ER Diagrams, Normalization, Transactions, Indexing',
    icon: '🗃️',
    color: '#ffb800',
    modules: [
      { num: 'Module 1', title: 'Data Models & ER Diagrams', desc: 'Database levels, data independence, Entity-Relationship model, attributes, relationships, cardinalities, weak entities.' },
      { num: 'Module 2', title: 'Relational Model & SQL', desc: 'Relational algebra (selection, projection, joins), SQL queries, nested queries, aggregate functions, views.' },
      { num: 'Module 3', title: 'Normalization Theories', desc: 'Functional dependencies, 1NF, 2NF, 3NF, Boyce-Codd Normal Form (BCNF), multi-valued dependencies.' },
      { num: 'Module 4', title: 'Transactions & Indexes', desc: 'ACID properties, serializability, lock-based concurrency protocols (2PL), deadlock resolution, B-Tree and B+ Tree indexing.' }
    ],
    files: [
      { name: 'SQL_Query_Optimization_Guide.pdf', size: '1.1 MB', type: 'PDF' },
      { name: 'Normalization_Forms_Quick_Reference.pdf', size: '320 KB', type: 'CheatSheet' }
    ],
    quiz: [
      {
        q: 'Which normal form eliminates transitive functional dependencies on the primary key?',
        options: ['2NF', '3NF', 'BCNF'],
        answer: 1,
        explanation: 'A relation is in 3NF if it is in 2NF and has no transitive dependencies. BCNF is a stronger version that handles overlapping candidate keys.'
      },
      {
        q: 'What does the "A" in ACID database properties stand for?',
        options: ['Atomicity', 'Availability', 'Accuracy'],
        answer: 0,
        explanation: 'Atomicity ensures that a transaction is treated as a single unit, which either succeeds completely or fails completely ("all or nothing").'
      },
      {
        q: 'Which SQL clause is used to filter records AFTER they have been grouped using aggregate functions?',
        options: ['WHERE', 'HAVING', 'GROUP BY'],
        answer: 1,
        explanation: 'WHERE is used to filter raw rows before grouping; HAVING is used to filter grouped results after aggregation.'
      }
    ]
  },
  'MCA-104 Computer Networks': {
    title: 'MCA-104 Computer Networks',
    desc: 'OSI Model, TCP/IP, Routing, Network Security',
    icon: '🌐',
    color: '#ff6b9d',
    modules: [
      { num: 'Module 1', title: 'OSI Model & Physical Layer', desc: 'ISO OSI reference model vs TCP/IP model, transmission media, line coding, switching techniques.' },
      { num: 'Module 2', title: 'Data Link & MAC Layer', desc: 'Framing, error detection (CRC, Hamming), flow control (Stop-and-Wait, Sliding Window), CSMA/CD, CSMA/CA.' },
      { num: 'Module 3', title: 'Network & Routing Layer', desc: 'IP addressing (IPv4, IPv6, subnetting, CIDR), routing algorithms (Link State, Distance Vector), OSPF and BGP protocols.' },
      { num: 'Module 4', title: 'Transport & Application Layers', desc: 'TCP connection establishment (3-way handshake) and congestion control, UDP protocol, DNS, HTTP, HTTPS, secure sockets.' }
    ],
    files: [
      { name: 'TCP_IP_Handshake_Diagram_Sheet.pdf', size: '950 KB', type: 'PDF' },
      { name: 'IP_Subnetting_Formula_CheatSheet.pdf', size: '510 KB', type: 'CheatSheet' }
    ],
    quiz: [
      {
        q: 'At which OSI layer does IP routing and logical subnet addressing operate?',
        options: ['Data Link Layer', 'Network Layer', 'Transport Layer'],
        answer: 1,
        explanation: 'The Network Layer (Layer 3) handles IP addressing, routing, packet forwarding, and path determination.'
      },
      {
        q: 'Which transport layer protocol is lightweight, connectionless, and does NOT guarantee packet delivery?',
        options: ['TCP', 'UDP', 'SCTP'],
        answer: 1,
        explanation: 'UDP (User Datagram Protocol) is a lightweight, connectionless protocol with minimal overhead, suitable for DNS and real-time streaming.'
      },
      {
        q: 'What is the default port number used for secure HTTPS web connections?',
        options: ['80', '443', '8080'],
        answer: 1,
        explanation: 'HTTP runs on port 80, while secure encrypted HTTPS runs on port 443 by default.'
      }
    ]
  },
  'Counselling Resources': {
    title: 'Counselling Resources',
    desc: 'Stress management, time management, academic help guides',
    icon: '💙',
    color: '#a78bfa',
    modules: [
      { num: 'Guide 1', title: 'Academic Stress & Anxiety Relief', desc: 'Simple tips to combat exam panic, structural study planning, deep breathing exercises, and work-life balance advice.' },
      { num: 'Guide 2', title: 'Effective Time Management Frameworks', desc: 'Implementing the Pomodoro technique, task prioritization using the Eisenhower Matrix, and setting SMART study goals.' },
      { num: 'Guide 3', title: 'Overcoming Imposter Syndrome', desc: 'Tips to celebrate minor achievements, self-compassion practices, and reframing self-doubt as learning opportunities.' },
      { num: 'Guide 4', title: 'Emergency Mental Health Support Contacts', desc: 'Departmental counselor contacts, institute health center hotlines, and 24/7 student wellness support details.' }
    ],
    files: [
      { name: 'Weekly_Stress_Relief_Activity_Tracker.pdf', size: '340 KB', type: 'Handout' },
      { name: 'Student_SelfCare_and_Wellness_Planner.pdf', size: '1.5 MB', type: 'PDF' }
    ],
    quiz: [
      {
        q: 'What is the standard recommended duration of sleep to maintain optimal memory retention and cognitive function?',
        options: ['4 to 5 hours', '7 to 8 hours', '10 to 12 hours'],
        answer: 1,
        explanation: 'Studies show that 7-8 hours of sleep is optimal for adults to synthesize memories and maintain day-to-day mental focus.'
      },
      {
        q: 'Which immediate technique is scientifically proven to reduce exam-related anxiety and rapid heart rate in under 2 minutes?',
        options: ['The 4-7-8 Deep Breathing Method', 'Drinking two double-shots of espresso', 'Last-minute hyper-focused cramming'],
        answer: 0,
        explanation: 'Deep abdominal breathing activates the parasympathetic nervous system, instantly slowing heart rates and calming cortisol rushes.'
      },
      {
        q: 'How can you book an in-person session with your assigned MCA department counselor?',
        options: ['By requesting HOD approval first', 'Directly through the dashboard "Counsellor Chat" tab or scheduling page', 'Only by visiting the medical centre'],
        answer: 1,
        explanation: 'You have direct, immediate, and 100% confidential access to your counselor via your dashboard chat panel without needing any intermediate approvals.'
      }
    ]
  },
  'Exam Prep Materials': {
    title: 'Exam Prep Materials',
    desc: 'Previous year papers, model answers, revision notes',
    icon: '📝',
    color: '#00d4ff',
    modules: [
      { num: 'Section 1', title: 'Previous 3 Years Solved Question Papers', desc: 'Past university semester end exam papers (2023, 2024, and 2025) with detailed step-by-step marking rubrics.' },
      { num: 'Section 2', title: 'Topper Model Answer Sheets', desc: 'Sample answer scripts from previous university toppers showcasing ideal formatting, diagram structuring, and time allocation.' },
      { num: 'Section 3', title: 'High-Yield Revision Mindmaps', desc: 'Visual summaries mapping important formulas, code templates, database relational equations, and network diagrams.' },
      { num: 'Section 4', title: 'Common Viva Voce & MCQ Lists', desc: 'Commonly asked questions during external practical labs, coding evaluations, and SQL schema defense viva exams.' }
    ],
    files: [
      { name: 'University_Solved_Papers_2023_2025.zip', size: '4.2 MB', type: 'ZIP' },
      { name: 'MCA_Semester_Revision_Mindmaps.pdf', size: '2.1 MB', type: 'PDF' }
    ],
    quiz: [
      {
        q: 'What is the minimum overall attendance percentage required to be eligible to sit for semester-end external exams?',
        options: ['65%', '75%', '85%'],
        answer: 1,
        explanation: 'The institute regulations mandate a minimum of 75% attendance overall. Students falling below this threshold are flagged on the HOD/Admin panels for critical attendance risk.'
      },
      {
        q: 'If you begin to notice a steady decline in your academic metrics or marks, what is the best proactive action?',
        options: ['Study in isolation and skip lab sessions', 'Discuss early academic/mental barriers with your assigned counselor confidentialy', 'Cram only during the last week'],
        answer: 1,
        explanation: 'Reaching out to your counselor early allows you to construct personalized study intervention plans, adjust stress factors, and resolve learning blocks before finals.'
      },
      {
        q: 'How are internal practical lab marks (out of 25) evaluated in the MCA department?',
        options: ['Through one single terminal MCQ test', 'Based on continuous evaluation (lab record, performance, viva, and attendance)', 'Solely based on student class attendance'],
        answer: 1,
        explanation: 'Lab marks are awarded via continuous assessment of daily lab files, runtime code correctness, viva explanations, and overall consistency.'
      }
    ]
  }
};

/* ──────────────────────────────────────────────
   MAIN STUDENT DASHBOARD
   ────────────────────────────────────────────── */
export default function StudentDashboard() {
  const { token } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('garden');
  const [gardenData, setGardenData] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [marksData, setMarksData] = useState(null);
  const [moodRating, setMoodRating] = useState(3);
  const [moodText, setMoodText] = useState('');
  const [message, setMessage] = useState('');
  const [showWater, setShowWater] = useState(false);
  const [loading, setLoading] = useState(true);

  // Interactive resources states
  const [selectedResource, setSelectedResource] = useState(null);
  const [modalTab, setModalTab] = useState('syllabus');
  const [quizActive, setQuizActive] = useState(false);
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({});

  const triggerDownload = (fileName) => {
    setDownloadProgress(prev => ({ ...prev, [fileName]: 1 }));
    let progress = 1;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        addToast(`${fileName} downloaded successfully!`, 'success');
      }
      setDownloadProgress(prev => ({ ...prev, [fileName]: progress }));
    }, 150);
  };

  const handleSelectOption = (optionIndex) => {
    setQuizAnswers(prev => ({ ...prev, [quizQuestionIndex]: optionIndex }));
  };

  const handleNextQuestion = () => {
    if (quizQuestionIndex < 2) {
      setQuizQuestionIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const getScore = () => {
    if (!selectedResource) return 0;
    let score = 0;
    selectedResource.quiz.forEach((qItem, idx) => {
      if (quizAnswers[idx] === qItem.answer) {
        score++;
      }
    });
    return score;
  };

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`${API}/api/student/garden`, { headers }).then(r => r.json()),
        fetch(`${API}/api/student/performance`, { headers }).then(r => r.json()),
        fetch(`${API}/api/student/marks`, { headers }).then(r => r.json()),
      ]);
      setGardenData(r1);
      setPerformance(r2);
      setMarksData(r3);
    } catch { addToast('Failed to load data', 'error'); }
    setLoading(false);
  };

  const submitMood = async () => {
    try {
      setShowWater(true);
      setTimeout(() => setShowWater(false), 1500);
      const r = await fetch(`${API}/api/student/mood`, {
        method: 'POST', headers, body: JSON.stringify({ mood_rating: moodRating, text_log: moodText })
      });
      const d = await r.json();
      addToast(d.message, r.ok ? 'success' : 'error');
      if (r.ok) { setMoodText(''); fetchAll(); }
    } catch { addToast('Failed to log mood', 'error'); }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      const r = await fetch(`${API}/api/counselor/note`, {
        method: 'POST', headers, body: JSON.stringify({ note: message })
      });
      const d = await r.json();
      addToast('Message sent to counsellor!', r.ok ? 'success' : 'error');
      if (r.ok) { setMessage(''); fetchAll(); }
    } catch { addToast('Failed to send', 'error'); }
  };

  const MOOD_EMOJIS = ['😔', '😕', '😐', '🙂', '😄'];
  const navItems = [
    { id: 'garden',      label: 'Growth Garden',    icon: Sprout },
    { id: 'overview',    label: 'My Overview',       icon: TrendingUp },
    { id: 'attendance',  label: 'Attendance',        icon: Calendar },
    { id: 'marks',       label: 'Marks & Grades',    icon: BarChart3 },
    { id: 'counsellor',  label: 'Counsellor Chat',   icon: MessageCircle },
    { id: 'resources',   label: 'Resources',         icon: Library },
  ];

  if (loading) return (
    <div className="page-wrap items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-2 border-border border-t-safe animate-spin mx-auto mb-4" />
        <p className="text-muted font-mono text-sm">LOADING YOUR PROFILE...</p>
      </div>
    </div>
  );

  const stage = gardenData?.plant_stage || 'sprout';
  const risk = performance?.student?.dropout_risk_score || 50;
  const riskLevel = performance?.student?.risk_level || 'Warning';

  return (
    <div className="page-wrap">
      <Sidebar navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
      <Toast toasts={toasts} removeToast={removeToast} />

      <main className="main-content p-6">

        {/* ── GROWTH GARDEN ───────────────────────────────────────────── */}
        {activeTab === 'garden' && gardenData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <div>
              <h2 className="text-2xl font-bold text-white font-display">Growth Garden</h2>
              <p className="text-sm text-muted">Your academic progress blooms here — every action grows your plant</p>
            </div>

            <div className="flex gap-6 items-start">
              {/* Garden display */}
              <div className="glass-card p-6 flex flex-col items-center gap-4 flex-shrink-0 w-80 relative overflow-hidden">
                <WaterEffect active={showWater} />
                <GrowthGarden stage={stage} risk={risk} />

                <div className="w-full p-3 rounded-lg text-center"
                     style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)' }}>
                  <p className="text-sm text-safe font-semibold">{gardenData.message}</p>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  {[
                    ['Attendance', `${gardenData.attendance_pct}%`, gardenData.attendance_pct >= 75 ? 'text-safe' : 'text-danger'],
                    ['Streak',     `${gardenData.streak_count} days`, 'text-neon'],
                    ['Assignments', `${gardenData.tasks_done} done`, 'text-safe'],
                    ['Assignment Rate', `${gardenData.assignment_rate}%`, 'text-neon'],
                  ].map(([k, v, c]) => (
                    <div key={k} className="text-center p-2 rounded" style={{ background: 'rgba(0,212,255,0.04)' }}>
                      <div className={`font-bold font-mono text-sm ${c}`}>{v}</div>
                      <div className="text-muted text-[10px] uppercase tracking-wider">{k}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column */}
              <div className="flex-1 flex flex-col gap-4">

                {/* Mood Check-In */}
                <div className="glass-card p-5">
                  <h3 className="text-sm font-bold text-white mb-3">Daily Mood Check-In</h3>
                  <p className="text-xs text-muted mb-3">How are you feeling today? This waters your plant!</p>

                  <div className="flex justify-between mb-4">
                    {MOOD_EMOJIS.map((emoji, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setMoodRating(i + 1)}
                        className="text-3xl transition-all duration-200"
                        style={{ filter: moodRating === i + 1 ? 'drop-shadow(0 0 8px #00d4ff)' : 'grayscale(0.6)', transform: moodRating === i + 1 ? 'scale(1.3)' : 'scale(1)' }}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>

                  <textarea rows={2} value={moodText} onChange={e => setMoodText(e.target.value)}
                    placeholder="Share how you're feeling today (optional)..."
                    className="input-dark resize-none mb-3" />
                  <button onClick={submitMood} className="btn-neon flex items-center gap-2 text-sm">
                    <Sprout size={15} /> Water My Plant
                  </button>
                </div>

                {/* Achievements */}
                <div className="glass-card p-5">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Star size={14} className="text-warn" /> Achievements
                  </h3>
                  <div className="flex flex-col gap-2">
                    {gardenData.achievements?.map((a, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-3 p-2.5 rounded-lg"
                        style={{
                          background: a.unlocked ? 'rgba(0,255,136,0.06)' : 'rgba(74,96,128,0.1)',
                          border: `1px solid ${a.unlocked ? 'rgba(0,255,136,0.25)' : 'rgba(74,96,128,0.2)'}`
                        }}
                      >
                        <span className="text-xl">{a.type === 'attendance' ? '🎯' : a.type === 'assignment' ? '📚' : '⭐'}</span>
                        <div className="flex-1">
                          <p className={`text-xs font-semibold ${a.unlocked ? 'text-white' : 'text-muted'}`}>{a.name}</p>
                          <p className="text-[10px] text-muted">{a.description}</p>
                        </div>
                        {a.unlocked
                          ? <CheckCircle size={14} className="text-safe animate-float" />
                          : <div className="w-3.5 h-3.5 rounded-full border border-muted opacity-40" />}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── MY OVERVIEW ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && performance && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-white font-display">My Overview</h2>

            {/* Risk gauge */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Dropout Risk Score</h3>
                <Badge level={riskLevel} />
              </div>
              <RiskBar score={risk} />
              {risk < 35 && (
                <p className="text-xs text-safe mt-2">✓ You're doing great! Keep maintaining your attendance and performance.</p>
              )}
            </div>

            {/* AI Suggestions */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Zap size={14} className="text-neon" /> AI Improvement Suggestions
              </h3>
              <div className="flex flex-col gap-2">
                {performance.ai_suggestions?.map((s, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2.5 p-3 rounded-lg"
                    style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.12)' }}>
                    <ChevronRightIcon />
                    <p className="text-xs text-light">{s}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4">
              {[
                ['Attendance', `${performance.student?.attendance_pct}%`, performance.student?.attendance_pct >= 75 ? 'safe' : 'danger'],
                ['Internal Marks', `${performance.student?.internal_marks}/30`, performance.student?.internal_marks >= 18 ? 'safe' : 'danger'],
                ['Lab Marks', `${performance.student?.lab_marks}/25`, performance.student?.lab_marks >= 15 ? 'safe' : 'warn'],
              ].map(([k, v, c]) => (
                <div key={k} className="glass-card p-4 text-center">
                  <div className={`text-2xl font-bold font-mono ${c === 'safe' ? 'text-safe' : c === 'danger' ? 'text-danger' : 'text-warn'}`}>{v}</div>
                  <div className="text-xs text-muted uppercase tracking-wider mt-1">{k}</div>
                </div>
              ))}
            </div>

            {/* Risk trend */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-4">Risk Trend</h3>
              <Line data={{
                labels: ['W-7','W-6','W-5','W-4','W-3','W-2','W-1','Now'],
                datasets: [{
                  label: 'Risk %',
                  data: performance.risk_trend || [],
                  borderColor: risk > 60 ? '#ff4444' : risk > 35 ? '#ffb800' : '#00ff88',
                  backgroundColor: risk > 60 ? 'rgba(255,68,68,0.1)' : risk > 35 ? 'rgba(255,184,0,0.1)' : 'rgba(0,255,136,0.1)',
                  borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3
                }]
              }} options={{
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { color: 'rgba(26,45,77,0.8)' }, ticks: { color: '#4a6080', font: { size: 10 } } },
                  y: { grid: { color: 'rgba(26,45,77,0.8)' }, ticks: { color: '#4a6080', font: { size: 10 } }, min: 0, max: 100 }
                }
              }} />
            </div>
          </motion.div>
        )}

        {/* ── ATTENDANCE ──────────────────────────────────────────────── */}
        {activeTab === 'attendance' && performance && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-white font-display">My Attendance</h2>

            <div className="grid grid-cols-3 gap-4">
              {[
                ['Total Classes', performance.student?.absences !== undefined ? (performance.attendance_history?.length || 0) : 0, 'neon'],
                ['Present', Math.round((performance.student?.attendance_pct / 100) * (performance.attendance_history?.length || 10)), 'safe'],
                ['Absent',  performance.student?.absences || 0, 'danger'],
              ].map(([k, v, c]) => (
                <div key={k} className="glass-card p-4 text-center">
                  <div className={`text-2xl font-bold font-mono ${c === 'safe' ? 'text-safe' : c === 'danger' ? 'text-danger' : 'text-neon'}`}>{v}</div>
                  <div className="text-xs text-muted uppercase tracking-wider mt-1">{k}</div>
                </div>
              ))}
            </div>

            {/* Attendance pct gauge */}
            <div className="glass-card p-5">
              <RiskBar score={100 - (performance.student?.attendance_pct || 0)} />
              <p className="text-xs text-center text-muted mt-2 font-mono">Attendance: {performance.student?.attendance_pct}% {performance.student?.attendance_pct < 75 ? '⚠ Below 75% threshold' : '✓ Above minimum'}</p>
            </div>

            {/* Recent attendance log */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-3">Recent Attendance Log</h3>
              <div className="flex flex-wrap gap-2">
                {performance.attendance_history?.slice(0, 30).map((a, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${a.status === 'Present' ? 'bg-safe/20 text-safe border border-safe/30' : 'bg-danger/20 text-danger border border-danger/30'}`}>
                      {a.status === 'Present' ? '✓' : '✗'}
                    </div>
                    <span className="text-[9px] text-muted font-mono">{new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── MARKS ───────────────────────────────────────────────────── */}
        {activeTab === 'marks' && marksData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-white font-display">Marks & Grades</h2>

            <div className="grid grid-cols-3 gap-4">
              {[
                ['Internal', `${marksData.internal_marks}/30`,    marksData.internal_marks >= 18 ? 'safe' : 'danger'],
                ['Lab',      `${marksData.lab_marks}/25`,         marksData.lab_marks >= 15 ? 'safe' : 'warn'],
                ['Assignment',`${marksData.assignment_marks}/25`, marksData.assignment_marks >= 15 ? 'safe' : 'warn'],
              ].map(([k, v, c]) => (
                <div key={k} className="glass-card p-5 text-center">
                  <div className={`text-3xl font-bold font-mono ${c === 'safe' ? 'text-safe' : c === 'danger' ? 'text-danger' : 'text-warn'}`}>{v}</div>
                  <div className="text-xs text-muted uppercase tracking-wider mt-2">{k} Marks</div>
                </div>
              ))}
            </div>

            {marksData.records?.map((subj) => (
              <div key={subj.subject} className="glass-card p-5">
                <h3 className="text-sm font-bold text-white mb-3">{subj.subject}</h3>
                <div className="flex flex-col gap-2">
                  {subj.records?.map(r => (
                    <div key={r.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted capitalize">{r.exam_type}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${r.percentage}%`, background: r.percentage >= 70 ? '#00ff88' : r.percentage >= 50 ? '#ffb800' : '#ff4444' }} />
                        </div>
                        <span className={`font-mono font-bold w-16 text-right ${r.percentage >= 70 ? 'text-safe' : r.percentage >= 50 ? 'text-warn' : 'text-danger'}`}>
                          {r.marks_obtained}/{r.max_marks}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── COUNSELLOR CHAT ─────────────────────────────────────────── */}
        {activeTab === 'counsellor' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5 max-w-2xl">
            <h2 className="text-2xl font-bold text-white font-display">Counsellor Chat</h2>
            <div className="glass-card p-5 flex flex-col" style={{ height: '60vh' }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-4">
                {gardenData?.messages?.map((msg, i) => (
                  <motion.div key={msg.id || i}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs p-3 rounded-xl text-xs ${msg.role === 'student'
                      ? 'bg-neon/10 border border-neon/20 text-white rounded-br-none'
                      : 'bg-border text-light rounded-bl-none'}`}>
                      <p className={`text-[10px] font-semibold mb-1 ${msg.role === 'student' ? 'text-neon' : 'text-safe'}`}>{msg.sender}</p>
                      <p>{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              {/* Input */}
              <div className="flex gap-2">
                <input value={message} onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message to your counsellor..."
                  className="input-dark flex-1 text-sm" />
                <button onClick={sendMessage} className="btn-neon px-4 flex items-center gap-1.5">
                  <Send size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── RESOURCES ───────────────────────────────────────────────── */}
        {activeTab === 'resources' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-white font-display">Study Resources</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'MCA-101 Data Structures', desc: 'Arrays, Linked Lists, Trees, Graphs, Sorting & Searching', icon: '📊', color: '#00d4ff' },
                { title: 'MCA-102 OOPs with Java',  desc: 'Classes, Inheritance, Polymorphism, Design Patterns', icon: '☕', color: '#00ff88' },
                { title: 'MCA-103 DBMS',            desc: 'SQL, ER Diagrams, Normalization, Transactions, Indexing', icon: '🗃️', color: '#ffb800' },
                { title: 'MCA-104 Computer Networks', desc: 'OSI Model, TCP/IP, Routing, Network Security', icon: '🌐', color: '#ff6b9d' },
                { title: 'Counselling Resources',    desc: 'Stress management, time management, academic help guides', icon: '💙', color: '#a78bfa' },
                { title: 'Exam Prep Materials',      desc: 'Previous year papers, model answers, revision notes', icon: '📝', color: '#00d4ff' },
              ].map((r, i) => (
                <motion.div key={r.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => {
                    setSelectedResource(RESOURCES_DETAILS[r.title]);
                    setModalTab('syllabus');
                    setQuizActive(false);
                    setQuizCompleted(false);
                    setQuizQuestionIndex(0);
                    setQuizAnswers({});
                  }}
                  className="glass-card p-5 flex items-start gap-4 cursor-pointer hover:border-neon/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 border border-border">
                  <span className="text-3xl flex-shrink-0">{r.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1" style={{ color: r.color }}>{r.title}</h3>
                    <p className="text-xs text-muted">{r.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── RESOURCE DETAIL MODAL OVERLAY ───────────────────────────── */}
        <AnimatePresence>
          {selectedResource && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-card w-full max-w-3xl overflow-hidden flex flex-col border border-border/80"
                style={{ maxHeight: '85vh', boxShadow: '0 0 50px rgba(0, 212, 255, 0.15)' }}
              >
                {/* Header */}
                <div className="p-6 border-b border-border/50 flex items-center justify-between" style={{ background: 'rgba(10, 22, 40, 0.5)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedResource.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-white" style={{ color: selectedResource.color }}>{selectedResource.title}</h3>
                      <p className="text-xs text-muted font-mono">{selectedResource.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedResource(null);
                      setQuizActive(false);
                      setQuizQuestionIndex(0);
                      setQuizAnswers({});
                      setQuizCompleted(false);
                    }}
                    className="text-muted hover:text-white transition-colors p-2 hover:bg-border rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                {/* Inner Tabs / Split Content */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                  {/* Tabs inside modal */}
                  <div className="flex border-b border-border/40 gap-6 text-sm">
                    <button
                      onClick={() => setModalTab('syllabus')}
                      className={`pb-3 font-semibold transition-all border-b-2 ${modalTab === 'syllabus' ? 'border-neon text-white' : 'border-transparent text-muted hover:text-light'}`}
                    >
                      Overview & Syllabus
                    </button>
                    <button
                      onClick={() => setModalTab('downloads')}
                      className={`pb-3 font-semibold transition-all border-b-2 ${modalTab === 'downloads' ? 'border-neon text-white' : 'border-transparent text-muted hover:text-light'}`}
                    >
                      Study Downloads
                    </button>
                    <button
                      onClick={() => setModalTab('quiz')}
                      className={`pb-3 font-semibold transition-all border-b-2 ${modalTab === 'quiz' ? 'border-neon text-white' : 'border-transparent text-muted hover:text-light'}`}
                    >
                      Practice Quiz
                    </button>
                  </div>

                  {/* TAB 1: SYLLABUS */}
                  {modalTab === 'syllabus' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-neon animate-ping" />
                        Department Curated Core Syllabus
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedResource.modules.map((m, idx) => (
                          <div key={idx} className="p-4 bg-navy/40 border border-border/30 rounded-xl hover:border-border/60 transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neon/10 text-neon font-bold">
                                {m.num}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-white mb-1">{m.title}</h5>
                            <p className="text-[11px] text-muted leading-relaxed">{m.desc}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: STUDY DOWNLOADS */}
                  {modalTab === 'downloads' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        📁 Academic Handouts & E-Books
                      </h4>
                      <div className="flex flex-col gap-3">
                        {selectedResource.files.map((file, idx) => {
                          const progress = downloadProgress[file.name] || 0;
                          return (
                            <div key={idx} className="p-4 bg-navy/40 border border-border/40 rounded-xl flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">
                                  {file.type === 'PDF' ? '📄' : file.type === 'ZIP' ? '📦' : '📝'}
                                </span>
                                <div>
                                  <p className="text-xs font-bold text-white">{file.name}</p>
                                  <p className="text-[10px] text-muted font-mono">{file.size} · {file.type} Document</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {progress > 0 && progress < 100 ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 h-1.5 rounded-full bg-border overflow-hidden">
                                      <div className="h-full bg-neon rounded-full" style={{ width: `${progress}%` }} />
                                    </div>
                                    <span className="text-[10px] font-mono text-neon font-bold">{progress}%</span>
                                  </div>
                                ) : progress === 100 ? (
                                  <span className="text-[10px] font-mono text-safe font-bold flex items-center gap-1">
                                    ✓ Saved!
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => triggerDownload(file.name)}
                                    className="btn-neon text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 font-mono font-bold"
                                  >
                                    📥 Download
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: QUIZ */}
                  {modalTab === 'quiz' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                      {!quizActive ? (
                        <div className="text-center py-8">
                          <span className="text-4xl mb-4 block">🧠</span>
                          <h4 className="text-md font-bold text-white mb-2">Subject Knowledge Self-Assessment</h4>
                          <p className="text-xs text-muted max-w-md mx-auto mb-6 leading-relaxed">
                            Test your understanding of {selectedResource.title} with a quick 3-question evaluation.
                            Get detailed explanations instantly!
                          </p>
                          <button
                            onClick={() => {
                              setQuizActive(true);
                              setQuizQuestionIndex(0);
                              setQuizAnswers({});
                              setQuizCompleted(false);
                            }}
                            className="btn-neon px-6 py-2.5 rounded-xl font-mono text-xs font-bold font-display"
                          >
                            Start Quick Assessment
                          </button>
                        </div>
                      ) : quizCompleted ? (
                        // QUIZ RESULTS
                        <div className="flex flex-col gap-5">
                          <div className="text-center p-6 bg-navy/40 border border-border/40 rounded-2xl max-w-md mx-auto w-full">
                            <span className="text-3xl mb-3 block">🏆</span>
                            <h4 className="text-md font-bold text-white mb-1">Assessment Complete!</h4>
                            <p className="text-xs text-muted mb-4">Here is how you performed in {selectedResource.title}:</p>
                            
                            {/* Ring score */}
                            <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path className="text-border" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="text-neon" strokeWidth="2.5" strokeDasharray={`${(getScore() / 3) * 100}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              </svg>
                              <div className="absolute text-center">
                                <span className="text-lg font-bold text-white font-mono">{getScore()}</span>
                                <span className="text-muted text-[10px] font-mono block">/ 3 Score</span>
                              </div>
                            </div>

                            <p className="text-xs font-bold text-white font-mono mb-6">
                              {getScore() === 3 ? '🥇 Perfect score! Excellent mastery!' : getScore() === 2 ? '🥈 Great job! Solid understanding.' : '🥉 Keep practicing! Review the notes below.'}
                            </p>

                            <button
                              onClick={() => setQuizActive(false)}
                              className="btn-neon text-xs px-4 py-2 font-mono"
                            >
                              Close & Go Back
                            </button>
                          </div>

                          {/* Answers review */}
                          <div className="flex flex-col gap-4">
                            <h5 className="text-xs font-bold text-white">Review Detailed Explanations</h5>
                            {selectedResource.quiz.map((qItem, idx) => {
                              const userAns = quizAnswers[idx];
                              const isCorrect = userAns === qItem.answer;
                              return (
                                <div key={idx} className={`p-4 bg-navy/40 border rounded-xl ${isCorrect ? 'border-safe/30' : 'border-danger/30'}`}>
                                  <p className="text-xs font-bold text-white mb-2 font-mono">Q{idx + 1}: {qItem.q}</p>
                                  <div className="flex flex-col gap-1.5 mb-3">
                                    {qItem.options.map((opt, oIdx) => (
                                      <div key={oIdx} className={`text-xs p-2 rounded-lg flex items-center justify-between ${
                                        oIdx === qItem.answer ? 'bg-safe/10 text-safe font-semibold' :
                                        oIdx === userAns ? 'bg-danger/10 text-danger' : 'text-muted'
                                      }`}>
                                        <span>{opt}</span>
                                        {oIdx === qItem.answer && <span>✓ Correct Answer</span>}
                                        {oIdx === userAns && oIdx !== qItem.answer && <span>✕ Your Answer</span>}
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-[11px] text-muted italic leading-relaxed">
                                    <strong className="text-neon not-italic font-sans">Key concept: </strong>{qItem.explanation}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        // ACTIVE QUESTION
                        <div className="p-6 bg-navy/40 border border-border/40 rounded-2xl max-w-xl mx-auto w-full">
                          <div className="flex items-center justify-between text-[10px] text-muted mb-4 font-mono">
                            <span>QUIZ QUESTION {quizQuestionIndex + 1} OF 3</span>
                            <span className="text-neon font-bold">PROGRESS {Math.round(((quizQuestionIndex + 1) / 3) * 100)}%</span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="h-1 bg-border rounded-full mb-6 overflow-hidden">
                            <div className="h-full bg-neon rounded-full" style={{ width: `${((quizQuestionIndex + 1) / 3) * 100}%` }} />
                          </div>

                          <h4 className="text-xs font-bold text-white mb-4 leading-relaxed font-mono">
                            {selectedResource.quiz[quizQuestionIndex].q}
                          </h4>

                          <div className="flex flex-col gap-2 mb-6">
                            {selectedResource.quiz[quizQuestionIndex].options.map((opt, oIdx) => (
                              <button
                                key={oIdx}
                                onClick={() => handleSelectOption(oIdx)}
                                className={`text-left text-xs p-3 rounded-xl border transition-all duration-150 ${
                                  quizAnswers[quizQuestionIndex] === oIdx
                                    ? 'bg-neon/10 border-neon text-white font-semibold'
                                    : 'bg-navy/30 border-border/40 text-light hover:border-border/80'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>

                          <div className="flex justify-between">
                            <button
                              onClick={() => setQuizQuestionIndex(prev => Math.max(0, prev - 1))}
                              disabled={quizQuestionIndex === 0}
                              className="text-xs font-semibold text-muted hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            >
                              ← Previous
                            </button>
                            
                            <button
                              onClick={handleNextQuestion}
                              disabled={quizAnswers[quizQuestionIndex] === undefined}
                              className="btn-neon text-[11px] px-5 py-2 font-mono font-bold"
                            >
                              {quizQuestionIndex === 2 ? 'Finish Assessment' : 'Next Question →'}
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Small helper used inside overview
function ChevronRightIcon() {
  return <ChevronRight size={12} className="text-neon flex-shrink-0 mt-0.5" />;
}
