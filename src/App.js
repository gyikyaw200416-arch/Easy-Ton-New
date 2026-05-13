import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const tg = window.Telegram?.WebApp;
const supabase = createClient(
  "https://bysgzzqyubtgvdghldec.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c2d6enF5dWJ0Z3ZkZ2hsZGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzM4ODQsImV4cCI6MjA5MzUwOTg4NH0.-4JDl5X--fNYrRyuaOzyUXz0FaJpIxNSLLzcjGrlavQ"
);
const ADMIN_ID = "1793453606"; // အစ်ကို့ ID

function App() {
  const [mainTab, setMainTab] = useState('earn'); // အောက်ခြေ Menu အတွက်
  const [subTab, setSubTab] = useState('bot'); // အပေါ်က Earn ထဲက Menu အတွက်
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
    if (!taskName || !taskLink) return alert("Fill all fields");
    await supabase.from('global_tasks').insert([{ name: taskName, link: taskLink, type: subTab }]);
    alert("Task Added!");
    setTaskName(''); setTaskLink('');
    fetchTasks();
  };

  const styles = {
    container: { backgroundColor: '#facc15', minHeight: '100vh', padding: '15px', paddingBottom: '80px', fontFamily: 'sans-serif' },
    header: { background: '#000', color: '#fff', padding: '15px', borderRadius: '15px', textAlign: 'center', marginBottom: '15px' },
    subNavItem: (active) => ({
      flex: 1, padding: '10px 5px', fontSize: '12px', borderRadius: '10px', 
      background: active ? '#000' : '#fff', color: active ? '#fff' : '#000', 
      border: '2px solid #000', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center'
    }),
    bottomNav: {
      position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', 
      display: 'flex', justifyContent: 'space-around', padding: '10px', borderTop: '2px solid #fff'
    },
    bottomNavItem: (active) => ({
      color: active ? '#facc15' : '#fff', fontSize: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold'
    }),
    card: { background: '#fff', padding: '15px', borderRadius: '15px', border: '2px solid #000', marginTop: '15px' }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>EASY TON PRO</h2>
      </div>

      {/* အပေါ်က Sub Tabs (Earn Menu ထဲမှာပဲ ပြမယ်) */}
      {mainTab === 'earn' && (
        <div style={{ display: 'flex', gap: '5px' }}>
          <div style={styles.subNavItem(subTab === 'bot')} onClick={() => setSubTab('bot')}>BOT</div>
          <div style={styles.subNavItem(subTab === 'social')} onClick={() => setSubTab('social')}>SOCIAL</div>
          <div style={styles.subNavItem(subTab === 'reward')} onClick={() => setSubTab('reward')}>REWARD</div>
          {/* Admin ID ဖြစ်မှသာ ADMIN Tab ကို ပြမယ် */}
          {myUid === ADMIN_ID && (
            <div style={styles.subNavItem(subTab === 'admin')} onClick={() => setSubTab('admin')}>ADMIN</div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ marginTop: '10px' }}>
        {mainTab === 'earn' && (
          <div>
            {subTab === 'admin' ? (
              <div style={styles.card}>
                <h3>Add Task to {subTab.toUpperCase()}</h3>
                <input placeholder="Task Name" value={taskName} onChange={e => setTaskName(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} />
                <input placeholder="Link" value={taskLink} onChange={e => setTaskLink(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} />
                <button onClick={addTask} style={{ width: '100%', padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>ADD TASK</button>
              </div>
            ) : (
              <div>
                {tasks.filter(t => t.type === subTab).length > 0 ? tasks.filter(t => t.type === subTab).map(t => (
                  <div key={t.id} style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{t.name}</strong>
                      <button onClick={() => window.open(t.link)} style={{ background: '#000', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '5px' }}>START</button>
                    </div>
                  </div>
                )) : <div style={{ textAlign: 'center', marginTop: '20px' }}>No {subTab} tasks found</div>}
              </div>
            )}
          </div>
        )}

        {mainTab === 'rank' && <div style={{textAlign:'center', padding:20}}>Rankings coming soon...</div>}
        {mainTab === 'withdraw' && <div style={{textAlign:'center', padding:20}}>Withdraw System coming soon...</div>}
        {mainTab === 'profile' && <div style={{textAlign:'center', padding:20}}>User Profile coming soon...</div>}
      </div>

      {/* အောက်ခြေ Persistent Navigation Bar */}
      <div style={styles.bottomNav}>
        <div style={styles.bottomNavItem(mainTab === 'earn')} onClick={() => setMainTab('earn')}>
          <div>💰</div><div>EARN</div>
        </div>
        <div style={styles.bottomNavItem(mainTab === 'rank')} onClick={() => setMainTab('rank')}>
          <div>🏆</div><div>RANK</div>
        </div>
        <div style={styles.bottomNavItem(mainTab === 'withdraw')} onClick={() => setMainTab('withdraw')}>
          <div>💳</div><div>WITHDRAW</div>
        </div>
        <div style={styles.bottomNavItem(mainTab === 'profile')} onClick={() => setMainTab('profile')}>
          <div>👤</div><div>PROFILE</div>
        </div>
      </div>
    </div>
  );
}

export default App;
