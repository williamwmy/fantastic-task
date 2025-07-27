import React, { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth.jsx";
import { useFamily } from "./hooks/useFamily.jsx";
import { useTasks } from "./hooks/useTasks.jsx";
import ProfileSelector from "./components/ProfileSelector";
import TaskList from "./components/TaskList";
import Modal from "./components/Modal";
import FamilyAdminPanel from "./components/FamilyAdminPanel";
import TaskVerification from "./components/TaskVerification";
import PointsHistory from "./components/PointsHistory";
import CreateTaskForm from "./components/CreateTaskForm";
import StatsView from "./components/StatsView";
import AllTasksEditor from "./AllTasksEditor";
import LoginPage from "./components/LoginPage";
import FamilySetupPage from "./components/FamilySetupPage";
import { RoleButton, PermissionGate } from "./components/RoleBasedAccess";
import { FaUser, FaChartBar, FaList, FaPlus, FaChevronLeft, FaChevronRight, FaCog, FaChild, FaHistory } from "react-icons/fa";
import packageJson from "../package.json";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const { user, isLoading: authLoading } = useAuth();
  const { family, currentMember } = useFamily();
  const { getPendingVerifications, getTasks, loadTaskData } = useTasks();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showTaskVerification, setShowTaskVerification] = useState(false);
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr());


  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #d0e6fa 0%, #f8e8ee 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#82bcf4',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          animation: 'pulse 2s infinite'
        }}>
          <FaList size={40} color="white" />
        </div>
        <div style={{
          fontSize: '1.2rem',
          color: '#495057',
          fontWeight: 500
        }}>
          Laster Fantastic Task...
        </div>
        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // If user is logged in but has no family, show family setup
  if (user && (!family || !currentMember)) {
    return <FamilySetupPage initialMode="create-family" />;
  }

  // Get pending verifications for notification badge
  const pendingVerifications = getPendingVerifications();
  const pendingCount = pendingVerifications.length;

  return (
    <div style={{ 
      minHeight: "100vh", 
      padding: "0.5rem",
      maxWidth: "100vw",
      overflowX: "hidden"
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
        flexWrap: "wrap",
        gap: "0.5rem"
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.5rem",
          minWidth: "0", // Allow flex item to shrink
          flex: "1 1 auto"
        }}>
          {/* Profile circle */}
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: currentMember.avatar_color || "#82bcf4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            fontSize: 18,
            flexShrink: 0
          }}>
            {currentMember.nickname[0].toUpperCase()}
          </div>
          {/* Points display */}
          <div style={{ 
            padding: "0.25rem 0.5rem", 
            background: "#6c757d", 
            borderRadius: "1rem",
            fontWeight: 600,
            fontSize: "0.875rem",
            whiteSpace: "nowrap"
          }}>
            {currentMember.points_balance} poeng
          </div>
        </div>
        
        <div style={{ 
          display: "flex", 
          gap: "0.25rem",
          flexWrap: "wrap",
          justifyContent: "flex-end"
        }}>
          <button
            onClick={() => setShowProfileModal(true)}
            title="Bytt profil"
            style={{ 
              width: 36, 
              height: 36, 
              borderRadius: "50%", 
              padding: 0, 
              fontSize: 16, 
              background: "#6c757d", 
              color: "white", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            <FaUser />
          </button>
          <button
            onClick={() => setShowStats(true)}
            title="Statistikk"
            style={{ 
              width: 36, 
              height: 36, 
              borderRadius: "50%", 
              padding: 0, 
              fontSize: 16, 
              background: "#6c757d", 
              color: "white", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            <FaChartBar />
          </button>
          <PermissionGate permission="edit_tasks" fallback={null}>
            <button
              onClick={() => setShowAllTasks(true)}
              title="Alle oppgaver"
              style={{ 
                width: 36, 
                height: 36, 
                borderRadius: "50%", 
                padding: 0, 
                fontSize: 16, 
                background: "#6c757d", 
                color: "white", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                border: "none",
                cursor: "pointer",
                flexShrink: 0
              }}
            >
              <FaList />
            </button>
          </PermissionGate>
          
          <PermissionGate permission="view_all_stats" fallback={null}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setShowTaskVerification(true)}
                title="Verifiser barns oppgaver"
                style={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: "50%", 
                  padding: 0, 
                  fontSize: 16, 
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
                  top: -4,
                  right: -4,
                  backgroundColor: '#dc3545',
                  color: 'white',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
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
              width: 36, 
              height: 36, 
              borderRadius: "50%", 
              padding: 0, 
              fontSize: 16, 
              background: "#6c757d", 
              color: "white", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            <FaHistory />
          </button>

          <RoleButton
            permission="manage_family"
            onClick={() => setShowAdminPanel(true)}
            title="Admin-panel"
            style={{ 
              width: 36, 
              height: 36, 
              borderRadius: "50%", 
              padding: 0, 
              fontSize: 16, 
              background: "#dc3545", 
              color: "white", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              flexShrink: 0
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
        gap: "0.5rem", 
        margin: "1rem 0",
        justifyContent: "center",
        flexWrap: "wrap"
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
            width: 48,
            height: 48,
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px #0001",
            cursor: "pointer",
            flexShrink: 0
          }}
          aria-label="Forrige dag"
        >
          <FaChevronLeft />
        </button>
        <span style={{ 
          minWidth: "120px", 
          textAlign: "center", 
          fontSize: "1rem", 
          fontWeight: 700,
          padding: "0.5rem",
          whiteSpace: "nowrap"
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
            width: 48,
            height: 48,
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px #0001",
            cursor: "pointer",
            flexShrink: 0
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
            width: 48,
            height: 48,
            fontSize: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px #0001",
            cursor: "pointer",
            flexShrink: 0
          }}
        >
          <FaPlus />
        </RoleButton>
      </div>

      {/* Add Modal */}
      <PermissionGate permission="edit_tasks" fallback={null}>
        <CreateTaskForm 
          open={showAddModal} 
          onClose={() => setShowAddModal(false)}
        />
      </PermissionGate>

      {/* Profile Modal */}
      <Modal 
        open={showProfileModal} 
        onClose={() => setShowProfileModal(false)}
        title="Familiemedlemmer"
        subtitle="Bytt mellom familiemedlemmer"
        icon={<FaUser />}
      >
        <ProfileSelector />
      </Modal>

      {/* Stats Modal */}
      <StatsView 
        open={showStats} 
        onClose={() => setShowStats(false)} 
      />

      {/* All Tasks Modal */}
      <PermissionGate permission="edit_tasks" fallback={null}>
        <Modal 
          open={showAllTasks} 
          onClose={() => setShowAllTasks(false)}
          title="Alle oppgaver"
          subtitle="Rediger og administrer familiens oppgaver"
          icon={<FaList />}
        >
          <AllTasksEditor
            tasks={getTasks()}
            currentMember={currentMember}
            onTaskUpdate={() => loadTaskData && loadTaskData()}
            onTaskDelete={() => loadTaskData && loadTaskData()}
            onTaskCreate={() => loadTaskData && loadTaskData()}
          />
        </Modal>
      </PermissionGate>

      {/* Admin Panel Modal */}
      <Modal 
        open={showAdminPanel} 
        onClose={() => setShowAdminPanel(false)}
        title="Admin-panel"
        subtitle="Administrer familie og innstillinger"
        icon={<FaCog />}
      >
        <FamilyAdminPanel />
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