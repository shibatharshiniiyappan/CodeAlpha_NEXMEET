import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskFlowProvider } from './context/TaskFlowContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { LobbyView } from './components/LobbyView';
import { MeetingRoom } from './components/MeetingRoom';
import { AuthModal } from './components/AuthModal';
import { SecurityModal } from './components/SecurityModal';
import { CreateMeetingModal } from './components/CreateMeetingModal';
import { JoinMeetingModal } from './components/JoinMeetingModal';
import { SidebarNav, TaskFlowNavTab } from './components/taskflow/SidebarNav';
import { TaskUniverse } from './components/taskflow/TaskUniverse';
import { SpatialRoomsView } from './components/taskflow/SpatialRoomsView';
import { IdeaActionCanvasView } from './components/taskflow/IdeaActionCanvasView';
import { MeetingPulseView } from './components/taskflow/MeetingPulseView';
import { AIMissionControlView } from './components/taskflow/AIMissionControlView';
import { ProjectsView } from './components/taskflow/ProjectsView';
import { SettingsView } from './components/taskflow/SettingsView';
import { Meeting } from './types';

function AppContent() {
  const { user, setGuestUser } = useAuth();

  // Navigation states: 'landing' | 'dashboard' | 'lobby' | 'room'
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'lobby' | 'room'>('dashboard');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  // TaskFlow Navigation Tab
  const [activeTaskFlowTab, setActiveTaskFlowTab] = useState<TaskFlowNavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isCreateMeetingModalOpen, setIsCreateMeetingModalOpen] = useState<boolean>(false);
  const [isJoinMeetingModalOpen, setIsJoinMeetingModalOpen] = useState<boolean>(false);

  // Check URL query on mount for invite links (e.g. ?room=849-392-1849)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setActiveRoomId(roomParam.trim());
      setCurrentView('lobby');
    }
  }, []);

  // Synchronize URL query parameter with active room so browser refresh retains room state
  useEffect(() => {
    if (activeRoomId && (currentView === 'lobby' || currentView === 'room')) {
      const targetQuery = `?room=${encodeURIComponent(activeRoomId)}`;
      if (window.location.search !== targetQuery) {
        window.history.replaceState(null, '', `${window.location.pathname}${targetQuery}`);
      }
    } else if (currentView === 'landing' || currentView === 'dashboard') {
      if (window.location.search) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [activeRoomId, currentView]);

  const handleStartMeetingFromModal = (meeting: Meeting) => {
    setActiveRoomId(meeting.code);
    setCurrentView('lobby');
    setIsCreateMeetingModalOpen(false);
  };

  const handleJoinWithCode = (code: string) => {
    setActiveRoomId(code.trim());
    setCurrentView('lobby');
  };

  const handleJoinSuccess = (roomId: string, name?: string) => {
    if (name) {
      setGuestUser(name);
    }
    setActiveRoomId(roomId.trim());
    setCurrentView('lobby');
    setIsJoinMeetingModalOpen(false);
  };

  const handleEnterRoom = () => {
    setCurrentView('room');
  };

  const handleLeaveRoom = () => {
    // Clear URL param
    window.history.replaceState(null, '', window.location.pathname);
    setActiveRoomId(null);
    setCurrentView(user ? 'dashboard' : 'landing');
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSelectTab = (tab: TaskFlowNavTab) => {
    setActiveTaskFlowTab(tab);
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#080D19] text-slate-100 flex flex-col font-sans">
      {/* Show Top Bar only on Landing */}
      {currentView === 'landing' && (
        <Navbar
          onStartMeeting={() => setIsCreateMeetingModalOpen(true)}
          onOpenJoin={() => setIsJoinMeetingModalOpen(true)}
          onOpenAuth={handleOpenAuth}
          onOpenDashboard={() => setCurrentView('dashboard')}
          onOpenSecurity={() => setIsSecurityModalOpen(true)}
          onOpenTab={(tab) => handleSelectTab(tab)}
        />
      )}

      {/* Main View Switching */}
      {currentView === 'landing' && (
        <LandingPage
          onStartInstantMeeting={() => setIsCreateMeetingModalOpen(true)}
          onJoinWithCode={handleJoinWithCode}
          onOpenSecurity={() => setIsSecurityModalOpen(true)}
          onOpenAuth={handleOpenAuth}
          onOpenJoinModal={() => setIsJoinMeetingModalOpen(true)}
        />
      )}

      {currentView === 'dashboard' && (
        <div className="flex-1 flex min-h-0 h-screen overflow-hidden">
          {/* Collapsible Sidebar */}
          <SidebarNav
            currentTab={activeTaskFlowTab}
            onSelectTab={setActiveTaskFlowTab}
            onOpenVideoMeeting={() => setIsCreateMeetingModalOpen(true)}
            onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onOpenLanding={() => setCurrentView('landing')}
          />

          {/* Active Tab View */}
          <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#080D19] overflow-hidden">
            {activeTaskFlowTab === 'dashboard' && (
              <Dashboard
                onOpenCreateMeeting={() => setIsCreateMeetingModalOpen(true)}
                onOpenJoinMeeting={() => setIsJoinMeetingModalOpen(true)}
                onJoinRoom={(roomId) => {
                  setActiveRoomId(roomId);
                  setCurrentView('lobby');
                }}
                onOpenSecurity={() => setIsSecurityModalOpen(true)}
                onOpenTaskUniverse={() => setActiveTaskFlowTab('task_universe')}
                onOpenSpatialRooms={() => setActiveTaskFlowTab('spatial_rooms')}
                onOpenIdeaCanvas={() => setActiveTaskFlowTab('idea_canvas')}
                onOpenMeetingPulse={() => setActiveTaskFlowTab('meeting_pulse')}
                onOpenMissionControl={() => setActiveTaskFlowTab('mission_control')}
              />
            )}

            {activeTaskFlowTab === 'task_universe' && <TaskUniverse />}

            {activeTaskFlowTab === 'spatial_rooms' && (
              <SpatialRoomsView
                onJoinMeetingRoom={(roomId) => {
                  setActiveRoomId(roomId);
                  setCurrentView('lobby');
                }}
              />
            )}

            {activeTaskFlowTab === 'idea_canvas' && <IdeaActionCanvasView />}

            {activeTaskFlowTab === 'meeting_pulse' && <MeetingPulseView />}

            {activeTaskFlowTab === 'mission_control' && <AIMissionControlView />}

            {activeTaskFlowTab === 'projects' && (
              <ProjectsView
                onOpenTaskUniverseProject={() => setActiveTaskFlowTab('task_universe')}
                onOpenSpatialRoom={() => setActiveTaskFlowTab('spatial_rooms')}
              />
            )}

            {activeTaskFlowTab === 'settings' && <SettingsView />}
          </main>
        </div>
      )}

      {currentView === 'lobby' && activeRoomId && (
        <LobbyView
          roomId={activeRoomId}
          onJoin={handleEnterRoom}
          onBack={handleLeaveRoom}
          onJoinAnother={() => setIsJoinMeetingModalOpen(true)}
        />
      )}

      {currentView === 'room' && activeRoomId && (
        <MeetingRoom
          roomId={activeRoomId}
          onLeave={handleLeaveRoom}
        />
      )}

      {/* Create Meeting Modal (Zoom-style Unique ID & Shareable Invitation) */}
      <CreateMeetingModal
        isOpen={isCreateMeetingModalOpen}
        onClose={() => setIsCreateMeetingModalOpen(false)}
        onStartMeeting={handleStartMeetingFromModal}
        currentUser={user || undefined}
      />

      {/* Join Meeting Modal (Zoom-style Paste ID or Link) */}
      <JoinMeetingModal
        isOpen={isJoinMeetingModalOpen}
        onClose={() => setIsJoinMeetingModalOpen(false)}
        onJoinSuccess={handleJoinSuccess}
        defaultName={user?.name || ''}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        defaultMode={authMode}
        onClose={() => {
          setIsAuthModalOpen(false);
          if (user) {
            setCurrentView('dashboard');
          }
        }}
      />

      {/* Security Architecture Specifications Modal */}
      {isSecurityModalOpen && (
        <SecurityModal
          onClose={() => setIsSecurityModalOpen(false)}
          roomId={activeRoomId || undefined}
        />
      )}
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[NEXMEET Runtime Error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080D19] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold mb-2">Workspace Recovery Mode</h2>
          <p className="text-xs text-slate-400 max-w-md mb-6">
            {this.state.error?.message || 'An unexpected client error occurred while rendering the workspace.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-500/20"
          >
            Reload NEXMEET
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TaskFlowProvider>
          <AppContent />
        </TaskFlowProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
