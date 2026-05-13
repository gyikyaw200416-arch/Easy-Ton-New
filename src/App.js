import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const tg = window.Telegram?.WebApp;
const supabase = createClient(
  "https://bysgzzqyubtgvdghldec.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c2d6enF5dWJ0Z3ZkZ2hsZGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzM4ODQsImV4cCI6MjA5MzUwOTg4NH0.-4JDl5X--fNYrRyuaOzyUXz0FaJpIxNSLLzcjGrlavQ"
);
const ADMIN_ID = "1793453606";

function App() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const myUid = tg?.initDataUnsafe?.user?.id?.toString() || "1793453606";

  useEffect(() => {
    fetchTasks();
    if (tg) { tg.ready(); tg.expand(); }
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase.from('global_tasks').select('*');
    if (data) setTasks(data);
  };

  const addTask = async () => {
    if (!taskName || !taskLink) return alert("Please fill all fields");
    await supabase.from('global_tasks').insert([{ name: taskName, link: taskLink }]);
    alert("Task Added Successfully!");
    setTaskName(''); setTaskLink('');
    fetchTasks();
  };

  const styles = {
    container: { backgroundColor: '#facc15', minHeight: '100vh', padding: '15px' },
    card: { background: '#fff', padding: '15px', borderRadius: '15px', border: '2px solid #000', marginBottom: '10px' },
    btn: { width: '100%', padding: '10px', background: '#000', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '10px' }
  };

  return (
    <div style={styles.container}>
      <div style={{ background: '#000', color: '#fff', padding: '20px', borderRadius: '15px', textAlign: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>EASY TON PRO</h2>
      </div>

      <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
        <button onClick={() => setActiveTab('tasks')} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: activeTab === 'tasks' ? '#000' : '#fff', color: activeTab === 'tasks' ? '#fff' : '#000', border: '2px solid #000' }}>TASKS</button>
        {myUid === ADMIN_ID && (
          <button onClick={() => setActiveTab('admin')} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: activeTab === 'admin' ? '#000' : '#fff', color: activeTab === 'admin' ? '#fff' : '#000', border: '2px solid #000' }}>ADMIN</button>
        )}
      </div>

      {activeTab === 'tasks' ? (
        <div>
          {tasks.length > 0 ? tasks.map(t => (
            <div key={t.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{t.name}</span>
                <button onClick={() => window.open(t.link)} style={{ background: '#000', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '5px' }}>START</button>
              </div>
            </div>
          )) : <div style={{ textAlign: 'center' }}>No tasks found</div>}
        </div>
      ) : (
        <div style={styles.card}>
          <h3>Add New Task</h3>
          <input placeholder="Task Name" value={taskName} onChange={e => setTaskName(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} />
          <input placeholder="Link" value={taskLink} onChange={e => setTaskLink(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} />
          <button onClick={addTask} style={{ ...styles.btn, background: '#16a34a' }}>ADD TASK</button>
        </div>
      )}
    </div>
  );
}
export default App;
