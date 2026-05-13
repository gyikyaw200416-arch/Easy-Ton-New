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

  // Admin States
  const [targetId, setTargetId] = useState('');
  const [editBal, setEditBal] = useState('');
  const [editVip, setEditVip] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoValue, setPromoValue] = useState('');

  const fetchAllData = useCallback(async () => {
    // Fetch User
    let { data: uData } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (!uData) {
        await supabase.from('users').insert([{ id: user.id, balance: 0 }]);
    } else { setUser(uData); }

    // Fetch Tasks
    const { data: tData } = await supabase.from('global_tasks').select('*');
    if (tData) setTasks(tData);

    // Fetch Withdraw History
    const { data: wData } = await supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (wData) setWithdraws(wData);

    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchAllData();
    if (tg) { tg.ready(); tg.expand(); }
  }, [fetchAllData]);

  // --- Functions ---
  const handleAddTask = async () => {
    await supabase.from('global_tasks').insert([{ name: taskName, link: taskLink, type: subTab }]);
    alert("Task Added!"); setTaskName(''); setTaskLink(''); fetchAllData();
  };

  const handleDeleteTask = async (id) => {
    await supabase.from('global_tasks').delete().eq('id', id);
    fetchAllData();
  };

  const handleUpdateUser = async () => {
    await supabase.from('users').update({ balance: Number(editBal), is_vip: editVip }).eq('id', targetId);
    alert("User Updated Successfully! ✅");
    fetchAllData();
  };

  const handleWithdraw = async (amt) => {
    if (user.balance < amt) return alert("Insufficient Balance!");
    await supabase.from('withdrawals').insert([{ user_id: user.id, amount: amt, status: 'Pending' }]);
    await supabase.from('users').update({ balance: user.balance - amt }).eq('id', user.id);
    alert("Withdrawal Requested! Will success in 24h.");
    fetchAllData();
  };

  const styles = {
    container: { backgroundColor: '#facc15', minHeight: '100vh', padding: '15px', paddingBottom: '100px', fontFamily: 'sans-serif' },
    card: { background: '#fff', padding: '15px', borderRadius: '15px', border: '2px solid #000', marginBottom: '10px' },
    btn: { background: '#000', color: '#fff', padding: '10px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
    input: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #000', boxSizing: 'border-box' },
    bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', display: 'flex', justifyContent: 'space-around', padding: '10px' },
    navItem: (active) => ({ color: active ? '#facc15' : '#fff', textAlign: 'center', fontSize: '10px', fontWeight: 'bold' })
  };

  if (loading) return <div style={{textAlign:'center', marginTop:50}}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={{background:'#000', color:'#fff', padding:20, borderRadius:20, textAlign:'center', marginBottom:15}}>
         <small>TOTAL BALANCE</small>
         <h1>{user.balance.toFixed(4)} TON</h1>
         {user.is_vip && <span style={{color:'#facc15'}}>⭐ VIP MEMBER</span>}
      </div>

      {/* WATCH Button အပေါ်မှာ ထားပါ */}
      <button style={{...styles.btn, width:'100%', background:'red', marginBottom:15}}>📺 WATCH ADS & EARN</button>

      {/* Top Tabs */}
      {mainTab === 'earn' && (
        <div style={{display:'flex', gap:5, marginBottom:15}}>
          {['bot', 'social', 'reward', 'admin'].map(tab => (
            (tab !== 'admin' || user.id === ADMIN_ID) && 
            <button key={tab} onClick={()=>setSubTab(tab)} style={{flex:1, padding:8, fontSize:10, borderRadius:10, background:subTab===tab?'#000':'#fff', color:subTab===tab?'#fff':'#000', border:'2px solid #000', fontWeight:'bold'}}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Content Section */}
      <div style={{minHeight:'50vh'}}>
        {mainTab === 'earn' && (
          subTab === 'admin' ? (
            <div style={styles.card}>
              <h3>Admin Controls</h3>
              <input style={styles.input} placeholder="Target User UID" value={targetId} onChange={e=>setTargetId(e.target.value)} />
              <input style={styles.input} placeholder="New Balance" type="number" value={editBal} onChange={e=>setEditBal(e.target.value)} />
              <select style={styles.input} value={editVip} onChange={e=>setEditVip(e.target.value==='true')}>
                <option value="false">Standard</option>
                <option value="true">VIP ⭐</option>
              </select>
              <button style={{...styles.btn, width:'100%', background:'green'}} onClick={handleUpdateUser}>UPDATE USER</button>
              <hr/>
              <h4>Add Task to {subTab.toUpperCase()}</h4>
              <input style={styles.input} placeholder="Task Name" value={taskName} onChange={e=>setTaskName(e.target.value)} />
              <input style={styles.input} placeholder="Link" value={taskLink} onChange={e=>setTaskLink(e.target.value)} />
              <button style={{...styles.btn, width:'100%'}} onClick={handleAddTask}>ADD TASK</button>
            </div>
          ) : subTab === 'reward' ? (
            <div>
              <div style={styles.card}>
                <h4>Redeem Code</h4>
                <input style={styles.input} placeholder="Enter Code Here" />
                <button style={{...styles.btn, width:'100%'}}>REDEEM</button>
              </div>
              <div style={{...styles.card, textAlign:'center'}}>
                <h4>Lucky Spin</h4>
                <div style={{width:150, height:150, borderRadius:'50%', border:'5px solid #000', margin:'auto', background:'conic-gradient(red 0deg 90deg, blue 90deg 180deg, green 180deg 270deg, yellow 270deg 360deg)'}}></div>
                <button style={{...styles.btn, marginTop:10}}>SPIN NOW</button>
              </div>
            </div>
          ) : (
            tasks.filter(t => t.type === subTab).map(t => (
              <div key={t.id} style={styles.card}>
                <span>{t.name}</span>
                <div style={{float:'right'}}>
                  {user.id === ADMIN_ID && <button onClick={()=>handleDeleteTask(t.id)} style={{background:'none', border:'none', color:'red', marginRight:10}}>🗑️</button>}
                  <button onClick={()=>window.open(t.link)} style={styles.btn}>START</button>
                </div>
              </div>
            ))
          )
        )}

        {mainTab === 'invite' && (
          <div style={{...styles.card, textAlign:'center'}}>
            <h3>Invite Friends</h3>
            <p>Your Referral Link:</p>
            <code style={{background:'#eee', padding:5}}>https://t.me/your_bot?start={user.id}</code>
            <button style={{...styles.btn, width:'100%', marginTop:10}}>Copy Link</button>
          </div>
        )}

        {mainTab === 'withdraw' && (
          <div>
            <div style={styles.card}>
              <h4>Withdraw TON</h4>
              <input style={styles.input} placeholder="Wallet Address" />
              <input style={styles.input} placeholder="Amount" type="number" />
              <button onClick={()=>handleWithdraw(0.5)} style={{...styles.btn, width:'100%', background:'blue'}}>WITHDRAW NOW</button>
            </div>
            <h4>History</h4>
            {withdraws.map(w => (
              <div key={w.id} style={{...styles.card, fontSize:12}}>
                <span>{new Date(w.created_at).toLocaleDateString()} - {w.amount} TON</span>
                <b style={{float:'right', color: w.status==='Pending'?'orange':'green'}}>{w.status}</b>
              </div>
            ))}
          </div>
        )}

        {mainTab === 'profile' && (
          <div style={styles.card}>
            <h3>My Profile</h3>
            <p><b>User UID:</b> {user.id}</p>
            <p><b>Status:</b> {user.is_vip ? "VIP Member ⭐" : "Standard User"}</p>
            <p><b>Earnings:</b> {user.balance} TON</p>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
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
