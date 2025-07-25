import React, { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth.jsx";
import { useFamily } from "./hooks/useFamily.jsx";
import { useTasks } from "./hooks/useTasks.jsx";
import ProfileSelector from "./components/ProfileSelector";
import TaskList from "./components/TaskList";
import Modal from "./components/Modal";
import AuthModal from "./components/AuthModal";
import FamilyAdminPanel from "./components/FamilyAdminPanel";
import TaskVerification from "./components/TaskVerification";
import PointsHistory from "./components/PointsHistory";
import CreateTaskForm from "./components/CreateTaskForm";
import StatsView from "./components/StatsView";
import AllTasksEditor from "./AllTasksEditor";
import { RoleButton, PermissionGate } from "./components/RoleBasedAccess";
import { FaUser, FaChartBar, FaList, FaPlus, FaChevronLeft, FaChevronRight, FaCog, FaChild, FaHistory } from "react-icons/fa";
import packageJson from "../package.json";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const { user, isLoading: authLoading } = useAuth();
  const { family, currentMember } = useFamily();
  const { getPendingVerifications, getTasks } = useTasks();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showTaskVerification, setShowTaskVerification] = useState(false);
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Show auth modal if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      setShowAuthModal(true);
    }
  }, [authLoading, user]);

  if (authLoading) {
    return <div>Laster...</div>;
  }

  if (!user) {
    return (
      <AuthModal 
        open={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
      />
    );
  }

  // If user is logged in but has no family, show family setup
  if (user && (!family || !currentMember)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Velkommen til Fantastic Task!</h2>
        <p>Du må enten opprette en familie eller bli med i en eksisterende familie for å komme i gang.</p>
        <AuthModal 
          open={true} 
          onClose={() => {}} 
          showFamilySetup={true}
        />
      </div>
    );
  }

  // Get pending verifications for notification badge
  const pendingVerifications = getPendingVerifications();
  const pendingCount = pendingVerifications.length;

  return (
    <div style={{ minHeight: "100vh", padding: "1rem" }}>
      {/* Top bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Profile circle */}
          <div style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: currentMember.avatar_color || "#82bcf4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            fontSize: 22,
          }}>
            {currentMember.nickname[0].toUpperCase()}
          </div>
          {/* Points display */}
          <div style={{ 
            padding: "0.25rem 0.75rem", 
            background: "#eaf1fb", 
            borderRadius: "1rem",
            fontWeight: 600
          }}>
            {currentMember.points_balance} poeng
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setShowProfileModal(true)}
            title="Bytt profil"
            style={{ 
              width: 48, 
              height: 48, 
              borderRadius: "50%", 
              padding: 0, 
              fontSize: 24, 
              background: "#eaf1fb", 
              color: "#297", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              minWidth: "48px",
              minHeight: "48px"
            }}
          >
            <FaUser />
          </button>
          <button
            onClick={() => setShowStats(true)}
            title="Statistikk"
            style={{ 
              width: 48, 
              height: 48, 
              borderRadius: "50%", 
              padding: 0, 
              fontSize: 24, 
              background: "#eaf1fb", 
              color: "#297", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              minWidth: "48px",
              minHeight: "48px"
            }}
          >
            <FaChartBar />
          </button>
          <PermissionGate permission="edit_tasks">
            <button
              onClick={() => setShowAllTasks(true)}
              title="Alle oppgaver"
              style={{ 
                width: 48, 
                height: 48, 
                borderRadius: "50%", 
                padding: 0, 
                fontSize: 24, 
                background: "#eaf1fb", 
                color: "#297", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                border: "none",
                cursor: "pointer",
                minWidth: "48px",
                minHeight: "48px"
              }}
            >
              <FaList />
            </button>
          </PermissionGate>
          
          <PermissionGate permission="view_all_stats">
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowTaskVerification(true)}
                title="Verifiser barns oppgaver"
                style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: "50%", 
                  padding: 0, 
                  fontSize: 22, 
                  background: "#17a2b8", 
                  color: "white", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <FaChild />
              </button>
              {pendingCount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  backgroundColor: '#dc3545',
                  color: 'white',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  {pendingCount}
                </div>
              )}
            </div>
          </PermissionGate>
          
          <button
            onClick={() => setShowPointsHistory(true)}
            title="Poenghistorikk"
            style={{ 
              width: 44, 
              height: 44, 
              borderRadius: "50%", 
              padding: 0, 
              fontSize: 22, 
              background: "#eaf1fb", 
              color: "#297", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              border: "none",
              cursor: "pointer"
            }}
          >
            <FaHistory />
          </button>

          <RoleButton
            permission="manage_family"
            onClick={() => setShowAdminPanel(true)}
            title="Admin-panel"
            style={{ 
              width: 44, 
              height: 44, 
              borderRadius: "50%", 
              padding: 0, 
              fontSize: 22, 
              background: "#dc3545", 
              color: "white", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              border: "none",
              cursor: "pointer"
            }}
          >
            <FaCog />
          </RoleButton>
        </div>
      </div>

      {/* Task List */}
      <TaskList selectedDate={selectedDate} />

      {/* Date navigation */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 20, 
        margin: "32px 0",
        justifyContent: "center"
      }}>
        <button
          onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() - 1);
            setSelectedDate(d.toISOString().slice(0, 10));
          }}
          style={{
            background: "#82bcf4",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: 60,
            height: 60,
            fontSize: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px #0001",
            cursor: "pointer"
          }}
          aria-label="Forrige dag"
        >
          <FaChevronLeft />
        </button>
        <span style={{ 
          minWidth: 140, 
          textAlign: "center", 
          fontSize: 22, 
          fontWeight: 700 
        }}>
          {new Date(selectedDate).toLocaleDateString("no-NO", { 
            weekday: "long", 
            day: "2-digit", 
            month: "2-digit" 
          })}
        </span>
        <button
          onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() + 1);
            setSelectedDate(d.toISOString().slice(0, 10));
          }}
          style={{
            background: "#82bcf4",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: 60,
            height: 60,
            fontSize: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px #0001",
            cursor: "pointer"
          }}
          aria-label="Neste dag"
        >
          <FaChevronRight />
        </button>
        <RoleButton
          permission="edit_tasks"
          onClick={() => setShowAddModal(true)}
          aria-label="Legg til oppgave"
          style={{
            background: "#82bcf4",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: 60,
            height: 60,
            fontSize: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px #0001",
            cursor: "pointer"
          }}
        >
          <FaPlus />
        </RoleButton>
      </div>

      {/* Add Modal */}
      <PermissionGate permission="edit_tasks">
        <CreateTaskForm 
          open={showAddModal} 
          onClose={() => setShowAddModal(false)}
        />
      </PermissionGate>

      {/* Profile Modal */}
      <Modal open={showProfileModal} onClose={() => setShowProfileModal(false)}>
        <ProfileSelector
          onClose={() => setShowProfileModal(false)}
        />
      </Modal>

      {/* Stats Modal */}
      {showStats && (
        <StatsView onClose={() => setShowStats(false)} />
      )}

      {/* All Tasks Modal */}
      <PermissionGate permission="edit_tasks">
        <Modal open={showAllTasks} onClose={() => setShowAllTasks(false)}>
          <AllTasksEditor
            tasks={getTasks()}
            currentMember={currentMember}
            onClose={() => setShowAllTasks(false)}
            onTaskUpdate={() => {}}
            onTaskDelete={() => {}}
            onTaskCreate={() => {}}
          />
        </Modal>
      </PermissionGate>

      {/* Admin Panel Modal */}
      <Modal open={showAdminPanel} onClose={() => setShowAdminPanel(false)}>
        <FamilyAdminPanel onClose={() => setShowAdminPanel(false)} />
      </Modal>

      {/* Task Verification Modal */}
      <TaskVerification
        open={showTaskVerification}
        onClose={() => setShowTaskVerification(false)}
      />

      {/* Points History Modal */}
      <PointsHistory
        memberId={currentMember?.id}
        open={showPointsHistory}
        onClose={() => setShowPointsHistory(false)}
      />

      {/* Version footer */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        fontSize: '0.8rem',
        color: '#6c757d',
        backgroundColor: '#f8f9fa',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem',
        border: '1px solid #dee2e6'
      }}>
        v{packageJson.version}
      </div>
    </div>
  );
}