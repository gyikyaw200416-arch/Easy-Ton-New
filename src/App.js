import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const tg = window.Telegram?.WebApp;
const supabase = createClient(
  "https://bysgzzqyubtgvdghldec.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c2d6enF5dWJ0Z3ZkZ2hsZGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzM4ODQsImV4cCI6MjA5MzUwOTg4NH0.-4JDl5X--fNYrRyuaOzyUXz0FaJpIxNSLLzcjGrlavQ"
);
const ADMIN_ID = "1793453606"; 

function App() {
  const [mainTab, setMainTab] = useState('earn');
  const [subTab, setSubTab] = useState('bot');
  const [user, setUser] = useState({ id: tg?.initDataUnsafe?.user?.id?.toString() || "1793453606", balance: 0, is_vip: false });
  const [tasks, setTasks] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin & Input States
  const [targetId, setTargetId] = useState('');
  const [editBal, setEditBal] = useState('');
  const [editVip, setEditVip] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [taskType, setTaskType] = useState('bot');

  const fetchAllData = useCallback(async () => {
    let { data: uData } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (!uData) {
        await supabase.from('users').insert([{ id: user.id, balance: 0 }]);
    } else { setUser(uData); }

    const { data: tData } = await supabase.from('global_tasks').select('*');
    if (tData) setTasks(tData);

    const { data: wData } = await supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (wData) setWithdraws(wData);

    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchAllData();
    if (tg) { tg.ready(); tg.expand(); }
  }, [fetchAllData]);

  // --- Core Functions ---
  const handleWatchAds = async () => {
    const reward = user.is_vip ? 0.0008 : 0.0003;
    const newBal = user.balance + reward;
    await supabase.from('users').update({ balance: newBal }).eq('id', user.id);
    alert(`Success! You earned ${reward} TON ✅`);
    fetchAllData();
  };

  const handleAddTask = async () => {
    if (!taskName || !taskLink) return alert("Please fill all fields");
    await supabase.from('global_tasks').insert([{ name: taskName, link: taskLink, type: taskType }]);
    alert("Task Added Successfully! ✅");
    setTaskName(''); setTaskLink('');
    fetchAllData();
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm("Delete this task?")) {
      await supabase.from('global_tasks').delete().eq('id', id);
      fetchAllData();
    }
  };

  const handleUpdateUser = async () => {
    await supabase.from('users').update({ balance: Number(editBal), is_vip: editVip }).eq('id', targetId);
    alert("User Updated Successfully! ✅");
    fetchAllData();
  };

  const styles = {
    container: { backgroundColor: '#facc15', minHeight: '100vh', padding: '15px', paddingBottom: '100px', fontFamily: 'sans-serif' },
    card: { background: '#fff', padding: '12px', borderRadius: '15px', border: '2px solid #000', marginBottom: '10px' },
    btn: { background: '#000', color: '#fff', padding: '10px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
    input: { width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #000', boxSizing: 'border-box' },
    bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', display: 'flex', justifyContent: 'space-around', padding: '10px', zIndex: 100 },
    navItem: (active) => ({ color: active ? '#facc15' : '#fff', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flex: 1 })
  };

  if (loading) return <div style={{textAlign:'center', marginTop:50}}>Loading...</div>;

  return (
    <div style={styles.container}>
      {/* Wallet Header */}
      <div style={{background:'#000', color:'#fff', padding:20, borderRadius:20, textAlign:'center', marginBottom:15}}>
         <small style={{opacity:0.7}}>MY BALANCE</small>
         <h1 style={{margin:'5px 0'}}>{user.balance.toFixed(5)} TON</h1>
         {user.is_vip && <span style={{color:'#facc15', fontSize:12, fontWeight:'bold'}}>⭐ VIP MEMBER</span>}
      </div>

      {/* WATCH ADS BUTTON */}
      <button onClick={handleWatchAds} style={{...styles.btn, width:'100%', background:'linear-gradient(to right, #ff0000, #cc0000)', marginBottom:15, height:50, fontSize:16}}>
        📺 WATCH ADS & EARN
      </button>

      {/* Earn Tabs */}
      {mainTab === 'earn' && (
        <div style={{display:'flex', gap:5, marginBottom:15}}>
          {['bot', 'social', 'reward', 'admin'].map(tab => (
            (tab !== 'admin' || user.id === ADMIN_ID) && 
            <button key={tab} onClick={()=>setSubTab(tab)} style={{flex:1, padding:8, fontSize:10, borderRadius:8, background:subTab===tab?'#000':'#fff', color:subTab===tab?'#fff':'#000', border:'2px solid #000', fontWeight:'bold'}}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div style={{minHeight:'45vh'}}>
        {mainTab === 'earn' && (
          subTab === 'admin' ? (
            <div style={styles.card}>
              <h4 style={{marginTop:0}}>Admin Panel</h4>
              <input style={styles.input} placeholder="User UID" value={targetId} onChange={e=>setTargetId(e.target.value)} />
              <input style={styles.input} placeholder="New Balance" type="number" value={editBal} onChange={e=>setEditBal(e.target.value)} />
              <select style={styles.input} value={editVip} onChange={e=>setEditVip(e.target.value==='true')}>
                <option value="false">Standard</option>
                <option value="true">VIP Member ⭐</option>
              </select>
              <button style={{...styles.btn, width:'100%', background:'green'}} onClick={handleUpdateUser}>SAVE USER DATA</button>
              <hr style={{margin:'15px 0'}}/>
              <h4>Add New Task</h4>
              <input style={styles.input} placeholder="Task Name" value={taskName} onChange={e=>setTaskName(e.target.value)} />
              <input style={styles.input} placeholder="Task Link" value={taskLink} onChange={e=>setTaskLink(e.target.value)} />
              <select style={styles.input} value={taskType} onChange={e=>setTaskType(e.target.value)}>
                <option value="bot">Bot Task</option>
                <option value="social">Social Task</option>
                <option value="reward">Reward Task</option>
              </select>
              <button style={{...styles.btn, width:'100%'}} onClick={handleAddTask}>ADD TASK</button>
            </div>
          ) : subTab === 'reward' ? (
            <div>
              <div style={styles.card}>
                <h4>Redeem Code</h4>
                <input style={styles.input} placeholder="Enter Code" />
                <button style={{...styles.btn, width:'100%'}}>REDEEM</button>
              </div>
              <div style={{...styles.card, textAlign:'center'}}>
                <h4>Lucky Spin</h4>
                <div style={{width:120, height:120, borderRadius:'50%', border:'5px solid #000', margin:'10px auto', background:'conic-gradient(red 0 36deg, blue 36deg 72deg, green 72deg 108deg, yellow 108deg 144deg, purple 144deg 180deg, orange 180deg 216deg, pink 216deg 252deg, cyan 252deg 288deg, brown 288deg 324deg, grey 324deg 360deg)'}}></div>
                <button style={{...styles.btn, width:'80%'}}>SPIN NOW</button>
              </div>
              {/* Admin tasks in reward */}
              {tasks.filter(t => t.type === 'reward').map(t => (
                <div key={t.id} style={styles.card}>
                  <span>{t.name}</span>
                  <div style={{float:'right'}}>
                    {user.id === ADMIN_ID && <button onClick={()=>handleDeleteTask(t.id)} style={{background:'none', border:'none', color:'red', marginRight:10}}>🗑️</button>}
                    <button onClick={()=>window.open(t.link)} style={styles.btn}>GO</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            tasks.filter(t => t.type === subTab).map(t => (
              <div key={t.id} style={styles.card}>
                <span style={{fontWeight:'bold'}}>{t.name}</span>
                <div style={{float:'right'}}>
                  {user.id === ADMIN_ID && <button onClick={()=>handleDeleteTask(t.id)} style={{background:'none', border:'none', color:'red', marginRight:10, fontSize:18}}>🗑️</button>}
                  <button onClick={()=>window.open(t.link)} style={{...styles.btn, padding:'5px 15px'}}>START</button>
                </div>
              </div>
            ))
          )
        )}

        {mainTab === 'invite' && (
          <div style={{...styles.card, textAlign:'center'}}>
            <h3 style={{marginTop:0}}>Invite Friends</h3>
            <p style={{fontSize:14}}>Share your link to earn more TON!</p>
            <div style={{background:'#eee', padding:15, borderRadius:10, wordBreak:'break-all', marginBottom:15, border:'1px dashed #000'}}>
              <code>https://t.me/EasyTONFree_Bot?start={user.id}</code>
            </div>
            <button onClick={() => {navigator.clipboard.writeText(`https://t.me/EasyTONFree_Bot?start=${user.id}`); alert("Copied!");}} style={{...styles.btn, width:'100%'}}>COPY LINK</button>
          </div>
        )}

        {mainTab === 'withdraw' && (
          <div>
            <div style={styles.card}>
              <h4>Withdrawal</h4>
              <input style={styles.input} placeholder="Wallet Address" />
              <input style={styles.input} placeholder="Amount (Min 0.5)" type="number" />
              <button style={{...styles.btn, width:'100%', background:'#0052ff'}}>WITHDRAW TON</button>
            </div>
            <h4 style={{paddingLeft:10}}>History</h4>
            {withdraws.length > 0 ? withdraws.map(w => (
              <div key={w.id} style={{...styles.card, fontSize:12}}>
                <span>{new Date(w.created_at).toLocaleDateString()} - {w.amount} TON</span>
                <b style={{float:'right', color: w.status==='Pending'?'orange':'green'}}>{w.status}</b>
              </div>
            )) : <p style={{textAlign:'center', opacity:0.6}}>No history found</p>}
          </div>
        )}

        {mainTab === 'profile' && (
          <div style={styles.card}>
            <h3 style={{marginTop:0}}>User Profile</h3>
            <div style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #eee'}}>
              <span>User ID:</span> <b>{user.id}</b>
            </div>
            <div style={{display:'flex', justifyContent:'space-around', marginTop:15}}>
               <div style={{textAlign:'center'}}>
                 <small>Status</small><br/><b>{user.is_vip ? "VIP ⭐" : "Standard"}</b>
               </div>
               <div style={{textAlign:'center'}}>
                 <small>Earnings</small><br/><b>{user.balance.toFixed(4)}</b>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Bottom Navigation */}
      <div style={styles.bottomNav}>
        <div onClick={()=>setMainTab('earn')} style={styles.navItem(mainTab==='earn')}>💰<br/>EARN</div>
        <div onClick={()=>setMainTab('invite')} style={styles.navItem(mainTab==='invite')}>👥<br/>INVITE</div>
        <div onClick={()=>setMainTab('rank')} style={styles.navItem(mainTab==='rank')}>🏆<br/>RANK</div>
        <div onClick={()=>setMainTab('withdraw')} style={styles.navItem(mainTab==='withdraw')}>💳<br/>WITHDRAW</div>
        <div onClick={()=>setMainTab('profile')} style={styles.navItem(mainTab==='profile')}>👤<br/>PROFILE</div>
      </div>
    </div>
  );
}

export default App;
