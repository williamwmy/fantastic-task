import React, { useState, useMemo } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaSearch, FaCopy } from 'react-icons/fa';
import { useTasks } from './hooks/useTasks.jsx';
import CreateTaskForm from './components/CreateTaskForm';
import Modal from './components/Modal';

const AllTasksEditor = ({ 
  tasks, 
  currentMember, 
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate 
}) => {
  const [editingTask, setEditingTask] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [sortBy, setSortBy] = useState('name');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const { updateTask, deleteTask, createTask } = useTasks();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Check permissions
  const canEdit = currentMember.role === 'admin' || currentMember.role === 'member';
  const canDelete = currentMember.role === 'admin' || currentMember.role === 'member';

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Status filter
      if (filterStatus === 'active' && !task.is_active) return false;
      if (filterStatus === 'inactive' && task.is_active) return false;
      
      // Search filter
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'points':
          return b.points - a.points;
        case 'updated':
          return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, filterStatus, searchTerm, sortBy]);

  const handleSaveTask = async (taskId, updatedData) => {
    try {
      setError(null);
      const { error: updateError } = await updateTask(taskId, updatedData);
      if (updateError) {
        setError('Kunne ikke oppdatere oppgave: ' + updateError.message);
        return;
      }
      setEditingTask(null);
      setSuccess('Oppgave oppdatert!');
      onTaskUpdate && onTaskUpdate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Noe gikk galt ved oppdatering av oppgave');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setError(null);
      const { error: deleteError } = await deleteTask(taskId);
      if (deleteError) {
        setError('Kunne ikke slette oppgave: ' + deleteError.message);
        return;
      }
      setDeleteConfirm(null);
      setSuccess('Oppgave slettet!');
      onTaskDelete && onTaskDelete();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Noe gikk galt ved sletting av oppgave');
    }
  };

  const handleDuplicateTask = async (task) => {
    const newTask = {
      title: `${task.title} (kopi)`,
      description: task.description,
      points: task.points,
      estimated_minutes: task.estimated_minutes,
      recurring_days: task.recurring_days,
      is_active: task.is_active
    };
    
    try {
      setError(null);
      const { error: createError } = await createTask(newTask);
      if (createError) {
        setError('Kunne ikke duplisere oppgave: ' + createError.message);
        return;
      }
      setSuccess('Oppgave duplisert!');
      onTaskCreate && onTaskCreate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error duplicating task:', error);
      setError('Noe gikk galt ved duplisering av oppgave');
    }
  };

  const getDayName = (dayNum) => {
    const days = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
    return days[dayNum];
  };

  return (
    <div style={{ maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
      {/* Error/Success Messages */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '0.75rem',
          borderRadius: '0.25rem',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          color: '#155724',
          padding: '0.75rem',
          borderRadius: '0.25rem',
          marginBottom: '1rem'
        }}>
          {success}
        </div>
      )}
      {/* Header with filters */}
      <div style={{ marginBottom: '1rem' }}>
        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <FaSearch style={{ 
            position: 'absolute', 
            left: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#999'
          }} />
          <input
            type="text"
            placeholder="Søk oppgaver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.5rem 0.5rem 2rem',
              border: '1px solid #ddd',
              borderRadius: '0.5rem',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* Filters and sorting */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
          >
            <option value="all">Alle oppgaver</option>
            <option value="active">Aktive</option>
            <option value="inactive">Inaktive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
          >
            <option value="name">Sorter etter navn</option>
            <option value="points">Sorter etter poeng</option>
            <option value="updated">Sorter etter endret</option>
          </select>

          {canEdit && (
            <button
              onClick={() => setShowCreateForm(true)}
              aria-label="Opprett ny oppgave"
              style={{
                marginLeft: 'auto',
                padding: '0.5rem 1rem',
                background: '#0056b3',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <FaPlus /> Ny oppgave
            </button>
          )}
        </div>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredTasks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>
            {searchTerm ? 'Ingen oppgaver funnet' : 'Ingen oppgaver enda'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                isEditing={editingTask === task.id}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={() => setEditingTask(task.id)}
                onCancelEdit={() => setEditingTask(null)}
                onSave={(data) => handleSaveTask(task.id, data)}
                onDelete={() => setDeleteConfirm(task.id)}
                onDuplicate={() => handleDuplicateTask(task)}
                getDayName={getDayName}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create task form modal */}
      <CreateTaskForm
        open={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          // Refresh tasks by calling parent callback
          onTaskCreate && onTaskCreate();
        }}
      />

      {/* Delete confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} hideCloseButton={true}>
        <h3>Bekreft sletting</h3>
        <p>Er du sikker på at du vil slette denne oppgaven?</p>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          Dette vil også slette all historikk knyttet til oppgaven.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            onClick={() => handleDeleteTask(deleteConfirm)}
            style={{
              padding: '0.5rem 1rem',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Slett
          </button>
          <button
            onClick={() => setDeleteConfirm(null)}
            style={{
              padding: '0.5rem 1rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Avbryt
          </button>
        </div>
      </Modal>

      {/* Footer */}
      <div style={{ 
        borderTop: '1px solid #eee', 
        paddingTop: '1rem', 
        marginTop: '1rem',
        textAlign: 'center'
      }}>
        <span style={{ color: '#666' }}>
          {filteredTasks.length} av {tasks.length} oppgaver
        </span>
      </div>
    </div>
  );
};

// Task row component
const TaskRow = ({ 
  task, 
  isEditing, 
  canEdit, 
  canDelete, 
  onEdit, 
  onCancelEdit, 
  onSave, 
  onDelete, 
  onDuplicate,
  getDayName 
}) => {
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    points: task.points,
    estimated_minutes: task.estimated_minutes || 0,
    recurring_days: task.recurring_days || [],
    is_active: task.is_active
  });

  if (isEditing) {
    return (
      <div style={{
        padding: '1rem',
        border: '2px solid #82bcf4',
        borderRadius: '0.5rem',
        background: '#f8f9fa'
      }}>
        <input
          type="text"
          value={editData.title}
          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
          placeholder="Tittel"
          style={{
            width: '100%',
            padding: '0.5rem',
            marginBottom: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '0.25rem'
          }}
        />
        
        <textarea
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          placeholder="Beskrivelse (valgfritt)"
          style={{
            width: '100%',
            padding: '0.5rem',
            marginBottom: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '0.25rem',
            resize: 'vertical',
            minHeight: '60px'
          }}
        />
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
          <input
            type="number"
            value={editData.points}
            onChange={(e) => setEditData({ ...editData, points: parseInt(e.target.value) || 0 })}
            placeholder="Poeng"
            min="0"
            max="1000"
            style={{
              flex: 1,
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '0.25rem'
            }}
          />
          
          <input
            type="number"
            value={editData.estimated_minutes}
            onChange={(e) => setEditData({ ...editData, estimated_minutes: parseInt(e.target.value) || 0 })}
            placeholder="Minutter"
            min="0"
            max="480"
            style={{
              flex: 1,
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '0.25rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
            Gjentakende dager:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[0, 1, 2, 3, 4, 5, 6].map(day => (
              <label
                key={day}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  background: editData.recurring_days.includes(day) ? '#82bcf4' : '#6c757d',
                  color: 'white',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={editData.recurring_days.includes(day)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditData({ 
                        ...editData, 
                        recurring_days: [...editData.recurring_days, day].sort() 
                      });
                    } else {
                      setEditData({ 
                        ...editData, 
                        recurring_days: editData.recurring_days.filter(d => d !== day) 
                      });
                    }
                  }}
                  style={{ display: 'none' }}
                />
                {getDayName(day)}
              </label>
            ))}
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="checkbox"
            checked={editData.is_active}
            onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
          />
          Aktiv oppgave
        </label>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onSave(editData)}
            style={{
              padding: '0.5rem 1rem',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              cursor: 'pointer'
            }}
          >
            <FaSave /> Lagre
          </button>
          <button
            onClick={onCancelEdit}
            style={{
              padding: '0.5rem 1rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              cursor: 'pointer'
            }}
          >
            <FaTimes /> Avbryt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '1rem',
      border: '1px solid #eee',
      borderRadius: '0.5rem',
      opacity: task.is_active ? 1 : 0.6,
      background: task.is_active ? 'white' : '#f8f9fa'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>{task.title}</h4>
          {task.description && (
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              {task.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
            <span>{task.points} poeng</span>
            {task.estimated_minutes > 0 && (
              <span>{task.estimated_minutes} min</span>
            )}
            {task.recurring_days && task.recurring_days.length > 0 && (
              <span>
                {task.recurring_days.map(d => getDayName(d)).join(', ')}
              </span>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {canEdit && (
            <>
              <button
                onClick={onDuplicate}
                title="Dupliser oppgave"
                aria-label={`Dupliser oppgave: ${task.title}`}
                style={{
                  padding: '0.5rem',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                <FaCopy />
              </button>
              <button
                onClick={onEdit}
                title="Rediger oppgave"
                aria-label={`Rediger oppgave: ${task.title}`}
                style={{
                  padding: '0.5rem',
                  background: '#f39c12',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                <FaEdit />
              </button>
            </>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              title="Slett oppgave"
              aria-label={`Slett oppgave: ${task.title}`}
              style={{
                padding: '0.5rem',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              <FaTrash />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllTasksEditor;