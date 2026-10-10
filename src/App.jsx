import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MissionControl from './components/MissionControl';
import MemoryView from './components/MemoryView';
import KnowledgeView from './components/KnowledgeView';
import PlannerView from './components/PlannerView';
import QuizModeView from './components/QuizModeView';
import SettingsView from './components/SettingsView';

import { 
  initialMemories, 
  initialSchedule, 
  initialTasks, 
  initialRecentActivity, 
  dbmsNotesDocument 
} from './utils/initialState';
import { initialExamPlan } from './utils/plannerEngine';
import { audioEngine } from './utils/audioEngine';

import { getSystemTimeContext, getDynamicExamPlan } from './utils/dateTime';

const API_BASE = "http://localhost:8000/api";

export default function App() {
  const [activeTab, setActiveTab] = useState('mission');
  const [memories, setMemories] = useState(initialMemories);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [tasks, setTasks] = useState(initialTasks);
  const [recentActivity, setRecentActivity] = useState(initialRecentActivity);
  const [studyProgress, setStudyProgress] = useState(55);
  const [examPlan, setExamPlan] = useState(initialExamPlan);
  const [dbmsDocument, setDbmsDocument] = useState(dbmsNotesDocument);
  const [aiStatus, setAiStatus] = useState("Online");
  const [systemTime, setSystemTime] = useState(getSystemTimeContext());

  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'astra',
      text: 'Good morning, Yuna. I am your ASTRA AI Command Center. Your day is clear and focused on DBMS revision. What would you like to do?',
      citations: [],
      time: '08:42 AM',
      status: 'Online'
    }
  ]);

  // Fetch state & system time from FastAPI Backend
  useEffect(() => {
    fetchState();
  }, []);

  const fetchState = async () => {
    try {
      const res = await fetch(`${API_BASE}/state`);
      if (res.ok) {
        const data = await res.json();
        if (data.memories && data.memories.length > 0) setMemories(data.memories);
        if (data.schedule && data.schedule.length > 0) setSchedule(data.schedule);
        if (data.tasks && data.tasks.length > 0) setTasks(data.tasks);
        if (data.recent_activities && data.recent_activities.length > 0) setRecentActivity(data.recent_activities);
        if (data.time_context) setSystemTime(data.time_context);
      }

      const planRes = await fetch(`${API_BASE}/planner`);
      if (planRes.ok) {
        const planData = await planRes.json();
        if (planData && planData.length > 0) setExamPlan(planData);
      }
    } catch (e) {
      console.warn("Backend API offline, using local state fallback.", e);
    }
  };

  const handleSendChatMessage = async (queryText) => {
    if (!queryText || !queryText.trim()) return;

    const userMsg = {
      sender: 'user',
      text: queryText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setAiStatus("Thinking...");

    // Format conversation history for LLM backend
    const historyPayload = updatedHistory.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: queryText,
          history: historyPayload
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiStatus(data.status || "Online");
        if (data.time_context) setSystemTime(data.time_context);

        const botMsg = {
          sender: 'astra',
          text: data.reply,
          citations: data.citations || [],
          action_executed: data.action_executed,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: data.status
        };

        setChatHistory(prev => [...prev, botMsg]);

        // Sync backend state
        if (data.updated_state) {
          if (data.updated_state.memories) setMemories(data.updated_state.memories);
          if (data.updated_state.schedule) setSchedule(data.updated_state.schedule);
          if (data.updated_state.tasks) setTasks(data.updated_state.tasks);
          if (data.updated_state.recent_activities) setRecentActivity(data.updated_state.recent_activities);
        }

        // Voice output
        audioEngine.speak(data.reply);
      }
    } catch (err) {
      console.error("Backend error:", err);
      setAiStatus("Online");
    }
  };

  const addMemory = async (newMem) => {
    try {
      const res = await fetch(`${API_BASE}/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMem)
      });
      if (res.ok) {
        fetchState();
      }
    } catch (e) {
      console.error("Error saving memory:", e);
    }
  };

  const resetDemo = () => {
    setMemories(initialMemories);
    setSchedule(initialSchedule);
    setTasks(initialTasks);
    setRecentActivity(initialRecentActivity);
    setStudyProgress(55);
    setExamPlan(initialExamPlan);
    setActiveTab('mission');
    setChatHistory([
      {
        sender: 'astra',
        text: 'Good morning, Yuna. I am your ASTRA AI Command Center. Your day is clear and focused on DBMS revision. What would you like to do?',
        citations: [],
        time: '08:42 AM',
        status: 'Online'
      }
    ]);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        memoryCount={memories.length} 
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Top Header */}
        <Header activeTab={activeTab} systemTime={systemTime} />

        {/* View Switcher */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'mission' && (
            <MissionControl 
              schedule={schedule}
              tasks={tasks}
              setTasks={setTasks}
              recentActivity={recentActivity}
              studyProgress={studyProgress}
              setStudyProgress={setStudyProgress}
              setActiveTab={setActiveTab}
              dbmsDocument={dbmsDocument}
              chatHistory={chatHistory}
              handleSendChatMessage={handleSendChatMessage}
              aiStatus={aiStatus}
              systemTime={systemTime}
            />
          )}

          {activeTab === 'memory' && (
            <MemoryView 
              memories={memories} 
              setMemories={setMemories}
              addMemory={addMemory}
              fetchState={fetchState}
            />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeView 
              documentData={dbmsDocument} 
            />
          )}

          {activeTab === 'planner' && (
            <PlannerView 
              examPlan={examPlan} 
              setExamPlan={setExamPlan}
              fetchState={fetchState}
            />
          )}

          {activeTab === 'quiz' && (
            <QuizModeView 
              setStudyProgress={setStudyProgress} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              resetDemo={resetDemo} 
            />
          )}
        </main>
      </div>

    </div>
  );
}
