import React, { useState } from 'react'
import { useTasks } from '../hooks/useTasks.jsx'
import { useFamily } from '../hooks/useFamily.jsx'

const DateDebugger = ({ selectedDate }) => {
  const { completeTask, getTasks, taskAssignments, taskCompletions } = useTasks()
  const { currentMember } = useFamily()
  const [debugInfo, setDebugInfo] = useState('')

  const testCompletion = async () => {
    // Use the first available task instead of a fake ID
    const { getTasks } = useTasks()
    const tasks = getTasks()
    if (tasks.length === 0) {
      setDebugInfo('No tasks available for testing')
      return
    }
    
    const testTaskId = tasks[0].id // Use real task ID
    const completionDate = new Date(selectedDate)
    completionDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds())

    const completionData = {
      task_id: testTaskId,
      assignment_id: null,
      completed_by: currentMember.id,
      completed_at: completionDate.toISOString(),
      points_awarded: 1,
      comment: 'Debug test completion'
    }

    const debugLog = {
      step1_selectedDate: selectedDate,
      step1_selectedDateType: typeof selectedDate,
      step2_newDateFromSelected: new Date(selectedDate).toISOString(),
      step3_completionDateFinal: completionDate.toISOString(),
      step4_todayForComparison: new Date().toISOString(),
      step5_completionData: completionData,
      step6_datesMatch: completionData.completed_at.startsWith(selectedDate),
      step7_taskUsed: testTaskId
    }

    setDebugInfo(JSON.stringify(debugLog, null, 2))

    console.log('🐛 DateDebugger Full Trace:', debugLog)
    
    try {
      const result = await completeTask(completionData)
      
      // After completion, check what the task looks like in the list
      setTimeout(() => {
        const { taskCompletions } = useTasks()
        const todaysCompletions = taskCompletions.filter(c => 
          c.completed_at && c.completed_at.startsWith(new Date().toISOString().slice(0, 10))
        )
        const yesterdaysCompletions = taskCompletions.filter(c => 
          c.completed_at && c.completed_at.startsWith(selectedDate)
        )
        
        setDebugInfo(prev => prev + 
          '\n\nRESULT:\n' + JSON.stringify(result, null, 2) +
          '\n\nCOMPLETIONS CHECK:\n' +
          'Today completions: ' + todaysCompletions.length + '\n' +
          'Yesterday completions: ' + yesterdaysCompletions.length + '\n' +
          'All completions: ' + JSON.stringify(taskCompletions.slice(0, 3), null, 2)
        )
      }, 1000)
      
      setDebugInfo(prev => prev + '\n\nRESULT:\n' + JSON.stringify(result, null, 2))
    } catch (error) {
      setDebugInfo(prev => prev + '\n\nERROR:\n' + error.message)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: '100px',
      right: '10px',
      background: 'white',
      border: '2px solid red',
      padding: '1rem',
      maxWidth: '400px',
      maxHeight: '500px',
      overflow: 'auto',
      zIndex: 1000,
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h3 style={{ color: 'red', margin: '0 0 10px 0' }}>DATE DEBUGGER</h3>
      <p><strong>Selected Date:</strong> {selectedDate}</p>
      <p><strong>Today:</strong> {new Date().toISOString().slice(0, 10)}</p>
      <p><strong>Is Different Date:</strong> {selectedDate !== new Date().toISOString().slice(0, 10) ? 'YES' : 'NO'}</p>
      <p><strong>Mode:</strong> {import.meta.env.VITE_LOCAL_TEST_USER === 'true' ? 'TEST MODE' : 'DATABASE MODE'}</p>
      
      <button 
        onClick={testCompletion}
        style={{
          background: 'red',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          cursor: 'pointer',
          marginBottom: '10px'
        }}
      >
        TEST COMPLETION
      </button>
      
      <button 
        onClick={() => {
          const assignmentsForDate = taskAssignments.filter(a => 
            a.due_date && a.due_date.startsWith(selectedDate)
          )
          const completionsForDate = taskCompletions.filter(c => 
            c.completed_at && c.completed_at.startsWith(selectedDate)
          )
          
          setDebugInfo(JSON.stringify({
            selectedDate,
            assignmentsForDate: assignmentsForDate.length,
            completionsForDate: completionsForDate.length,
            assignments: assignmentsForDate.slice(0, 3),
            completions: completionsForDate.slice(0, 3)
          }, null, 2))
        }}
        style={{
          background: 'blue',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          cursor: 'pointer',
          marginBottom: '10px',
          marginLeft: '5px'
        }}
      >
        CHECK DATA
      </button>

      {debugInfo && (
        <pre style={{
          background: '#f5f5f5',
          padding: '10px',
          overflow: 'auto',
          maxHeight: '300px',
          fontSize: '10px'
        }}>
          {debugInfo}
        </pre>
      )}
    </div>
  )
}

export default DateDebugger