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
  const [user, setUser] = useState({ id: tg?.initDataUnsafe?.user?.id?.toString() || "1793453606", balance: 0, is_vip: false, completed_tasks: [] });
  const [tasks, setTasks] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [invites, setInvites] = useState([]);
  const [rankList, setRankList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Input States
  const [withdrawAddr, setWithdrawAddr] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  
  // Admin States
  const [targetId, setTargetId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null); // Admin က user စစ်ဖို့
  const [editBal, setEditBal] = useState('');
  const [editVip, setEditVip] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [taskType, setTaskType] = useState('bot');
  const [adminPromoCode, setAdminPromoCode] = useState('');
  const [adminPromoValue, setAdminPromoValue] = useState('');

  const fetchAllData = useCallback(async () => {
    // 1. User Logic
    let { data: uData } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (!uData) {
        const startParam = tg?.initDataUnsafe?.start_param;
        const { data: newUser } = await supabase.from('users').insert([{ id: user.id, balance: 0, invited_by: startParam, completed_tasks: [] }]).select().single();
        if (startParam && startParam !== user.id) {
            const { data: inviter } = await supabase.from('users').select('balance').eq('id', startParam).single();
            if (inviter) await supabase.from('users').update({ balance: inviter.balance + 0.001 }).eq('id', startParam);
        }
        uData = newUser;
    }
    setUser(uData);

    // 2. Tasks
    const { data: tData } = await supabase.from('global_tasks').select('*');
    if (tData) setTasks(tData);

    // 3. Rankings
    const { data: rData } = await supabase.from('users').select('id, balance').order('balance', { ascending: false }).limit(50);
    if (rData) setRankList(rData);

    // 4. History
    const { data: wData } = await supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (wData) setWithdraws(wData);
    const { data: iData } = await supabase.from('users').select('id').eq('invited_by', user.id);
    if (iData) setInvites(iData);

    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchAllData();
    if (tg) { tg.ready(); tg.expand(); }
  }, [fetchAllData]);

  // Admin: Search User by UID
  const handleCheckUser = async () => {
    if (!targetId) return;
    const { data, error } = await supabase.from('users').select('*').eq('id', targetId).single();
    if (data) {
      setSearchedUser(data);
      setEditBal(data.balance);
      setEditVip(data.is_vip);
    } else {
      alert("User not found!");
      setSearchedUser(null);
    }
  };

  const handleUpdateUser = async () => {
    await supabase.from('users').update({ balance: Number(editBal), is_vip: editVip }).eq('id', targetId);
    alert("User Updated Successfully!");
    handleCheckUser();
    fetchAllData();
  };

  const handleWatchAds = async () => {
    const reward = user.is_vip ? 0.0008 : 0.0003;
    await supabase.from('users').update({ balance: user.balance + reward }).eq('id', user.id);
    alert(`Success! Earned ${reward} TON ✅`);
    fetchAllData();
  };

  const handleStartTask = async (task) => {
    window.open(task.link);
    if (user.id !== ADMIN_ID && !user.completed_tasks?.includes(task.id)) {
        const updatedTasks = [...(user.completed_tasks || []), task.id];
        await supabase.from('users').update({ balance: user.balance + 0.001, completed_tasks: updatedTasks }).eq('id', user.id);
        alert("Task Complete! +0.001 TON Added ✅");
        fetchAllData();
    }
  };

  const handleWithdraw = async () => {
    const amt = Number(withdrawAmt);
    if (amt < 0.1) return alert("Minimum withdrawal is 0.1 TON");
    if (amt > user.balance) return alert("Insufficient balance!");
    await supabase.from('withdrawals').insert([{ user_id: user.id, amount: amt, address: withdrawAddr, status: 'Pending' }]);
    await supabase.from('users').update({ balance: user.balance - amt }).eq('id', user.id);
    alert("Withdrawal requested! ✅");
    setWithdrawAmt(''); setWithdrawAddr('');
    fetchAllData();
  };

  const getRankReward = (index) => {
    const rewards = [30, 20, 10, 8, 6, 5, 5, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1, 1, 1, 0.9, 0.9, 0.9, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.4, 0.4, 0.4, 0.4, 0.3, 0.3, 0.3];
    return rewards[index] || 0.1;
  };

  const styles = {
    container: { backgroundColor: '#facc15', minHeight: '100vh', padding: '15px', paddingBottom: '100px', fontFamily: 'sans-serif', color: '#000' },
    card: { background: '#fff', padding: '15px', borderRadius: '15px', border: '2px solid #000', marginBottom: '10px' },
    btn: { background: '#000', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
    input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #000', boxSizing: 'border-box' },
    bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', display: 'flex', justifyContent: 'space-around', padding: '10px', zIndex: 100 },
    navItem: (active) => ({ color: active ? '#facc15' : '#fff', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flex: 1 }),
    copyBtn: { background: '#eee', border: '1px solid #000', fontSize: '10px', padding: '4px 8px', marginLeft: '5px', borderRadius: '5px' }
  };

  if (loading) return <div style={{textAlign:'center', marginTop:50, fontWeight:'bold'}}>LOADING...</div>;

  return (
    <div style={styles.container}>
      {/* Wallet Header */}
      <div style={{background:'#000', color:'#fff', padding:20, borderRadius:20, textAlign:'center', marginBottom:15}}>
         <small style={{opacity:0.7, letterSpacing:1}}>TOTAL BALANCE</small>
         <h1 style={{margin:'5px 0', fontSize:32}}>{user.balance.toFixed(5)} TON</h1>
         {user.is_vip && <span style={{color:'#facc15', fontSize:12, fontWeight:'bold'}}>⭐ VIP MEMBER</span>}
      </div>

      <button onClick={handleWatchAds} style={{...styles.btn, width:'100%', background:'linear-gradient(to right, #ff416c, #ff4b2b)', marginBottom:15, height:50, fontSize:16, border:'2px solid #000'}}>
        📺 WATCH ADS & EARN
      </button>

      {/* Tabs */}
      {mainTab === 'earn' && (
        <div style={{display:'flex', gap:5, marginBottom:15}}>
          {['bot', 'social', 'reward', 'admin'].map(tab => (
            (tab !== 'admin' || user.id === ADMIN_ID) && 
            <button key={tab} onClick={()=>setSubTab(tab)} style={{flex:1, padding:10, fontSize:11, borderRadius:10, background:subTab===tab?'#000':'#fff', color:subTab===tab?'#fff':'#000', border:'2px solid #000', fontWeight:'bold'}}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <div style={{minHeight:'45vh'}}>
        {mainTab === 'earn' && (
          subTab === 'admin' ? (
            <div style={styles.card}>
              <h3 style={{marginTop:0}}>Admin Panel</h3>
              <div style={{display:'flex', gap:5}}>
                <input style={styles.input} placeholder="Search User UID" value={targetId} onChange={e=>setTargetId(e.target.value)} />
                <button style={{...styles.btn, height:45}} onClick={handleCheckUser}>CHECK</button>
              </div>

              {searchedUser && (
                <div style={{background:'#f9f9f9', padding:10, borderRadius:10, marginBottom:10, border:'1px solid #ddd'}}>
                  <p style={{margin:0, fontSize:12}}><b>Current Balance:</b> {searchedUser.balance} TON</p>
                  <p style={{margin:'5px 0', fontSize:12}}><b>Status:</b> {searchedUser.is_vip ? "VIP" : "Standard"}</p>
                  <hr/>
                  <input style={styles.input} placeholder="New Balance" type="number" value={editBal} onChange={e=>setEditBal(e.target.value)} />
                  <select style={styles.input} value={editVip} onChange={e=>setEditVip(e.target.value==='true')}>
                    <option value="false">Standard</option>
                    <option value="true">VIP Member</option>
                  </select>
                  <button style={{...styles.btn, width:'100%', background:'green'}} onClick={handleUpdateUser}>SAVE CHANGES</button>
                </div>
              )}
              
              <hr style={{margin:'15px 0'}}/>
              <h4>Add New Task</h4>
              <input style={styles.input} placeholder="Task Name" value={taskName} onChange={e=>setTaskName(e.target.value)} />
              <input style={styles.input} placeholder="Task Link" value={taskLink} onChange={e=>setTaskLink(e.target.value)} />
              <select style={styles.input} value={taskType} onChange={e=>setTaskType(e.target.value)}>
                <option value="bot">Bot Task</option>
                <option value="social">Social Task</option>
              </select>
              <button style={{...styles.btn, width:'100%'}} onClick={async ()=>{await supabase.from('global_tasks').insert([{name:taskName, link:taskLink, type:taskType}]); alert("Task Added!"); fetchAllData();}}>ADD TASK</button>
            </div>
          ) : subTab === 'reward' ? (
            <div style={styles.card}>
              <h4>Redeem Promo Code</h4>
              <input style={styles.input} placeholder="Enter Code" value={promoCodeInput} onChange={e=>setPromoCodeInput(e.target.value)} />
              <button onClick={async ()=>{
                 const { data: promo } = await supabase.from('promo_codes').select('*').eq('code', promoCodeInput).single();
                 if(!promo || promo.used_by?.includes(user.id)) return alert("Invalid or used code!");
                 await supabase.from('promo_codes').update({ used_by: [...(promo.used_by||[]), user.id] }).eq('code', promoCodeInput);
                 await supabase.from('users').update({ balance: user.balance + promo.value }).eq('id', user.id);
                 alert("Reward Claimed!"); fetchAllData();
              }} style={{...styles.btn, width:'100%'}}>CLAIM REWARD</button>
            </div>
          ) : (
            tasks.filter(t => t.type === subTab && (user.id === ADMIN_ID || !user.completed_tasks?.includes(t.id))).map(t => (
              <div key={t.id} style={styles.card}>
                <span style={{fontWeight:'bold'}}>{t.name} <small style={{color:'green'}}>(+0.001 TON)</small></span>
                <button onClick={()=>handleStartTask(t)} style={{...styles.btn, float:'right', padding:'8px 15px'}}>START</button>
              </div>
            ))
          )
        )}

        {mainTab === 'invite' && (
          <div style={{...styles.card, textAlign:'center'}}>
            <h3>Invite & Earn</h3>
            <p style={{color:'green', fontWeight:'bold'}}>Earn 0.001 TON per friend!</p>
            <div style={{background:'#f0f0f0', padding:15, borderRadius:10, wordBreak:'break-all', marginBottom:15, border:'1px dashed #000'}}>
              <code>https://t.me/EasyTONFree_Bot?start={user.id}</code>
            </div>
            <button onClick={() => {navigator.clipboard.writeText(`https://t.me/EasyTONFree_Bot?start=${user.id}`); alert("Link Copied!");}} style={{...styles.btn, width:'100%'}}>COPY REFERRAL LINK</button>
            <h4 style={{marginTop:20, textAlign:'left'}}>Invite History ({invites.length})</h4>
            {invites.map((inv, i) => <div key={i} style={{fontSize:12, padding:8, borderBottom:'1px solid #eee', textAlign:'left'}}>User ID: {inv.id} <b style={{float:'right', color:'green'}}>+0.001 ✅</b></div>)}
          </div>
        )}

        {mainTab === 'rank' && (
          <div style={styles.card}>
            <h3 style={{textAlign:'center', marginTop:0}}>🏆 GLOBAL RANKINGS</h3>
            <table style={{width:'100%', fontSize:12, borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:'2px solid #000'}}><th align="left">No</th><th align="left">UID</th><th align="right">Reward</th></tr></thead>
              <tbody>
                {rankList.map((r, i) => (
                  <tr key={i} style={{borderBottom:'1px solid #eee', background: r.id === user.id ? '#fff9c4' : 'none'}}>
                    <td style={{padding:'10px 0'}}>{i+1}</td>
                    <td>{r.id === user.id ? <b>{r.id} (Me)</b> : r.id}</td>
                    <td align="right" style={{color:'blue', fontWeight:'bold'}}>{getRankReward(i)} TON</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {mainTab === 'withdraw' && (
          <div>
            <div style={{...styles.card, border: '2px solid gold', background: '#fffdec'}}>
                <h4 style={{margin:0, color: '#b8860b'}}>💎 UPGRADE VIP (1 TON)</h4>
                <p style={{fontSize:11}}>Address: UQDasFrJo7PrMaJcRFivcBVVnhWNQxYG-y32EN0ZeQPRSOp9 <button style={styles.copyBtn} onClick={()=>navigator.clipboard.writeText('UQDasFrJo7PrMaJcRFivcBVVnhWNQxYG-y32EN0ZeQPRSOp9')}>COPY</button></p>
                <p style={{fontSize:11}}>Memo: {user.id} <button style={styles.copyBtn} onClick={()=>navigator.clipboard.writeText(user.id)}>COPY</button></p>
            </div>
            <div style={styles.card}>
              <h4>Withdraw Funds</h4>
              <input style={styles.input} placeholder="TON Wallet Address" value={withdrawAddr} onChange={e=>setWithdrawAddr(e.target.value)} />
              <input style={styles.input} placeholder="Amount (Min 0.1)" type="number" value={withdrawAmt} onChange={e=>setWithdrawAmt(e.target.value)} />
              <button onClick={handleWithdraw} style={{...styles.btn, width:'100%', background:'#0052ff'}}>SUBMIT WITHDRAWAL</button>
            </div>
          </div>
        )}

        {mainTab === 'profile' && (
          <div style={{...styles.card, textAlign:'center'}}>
            <h3 style={{marginTop:0}}>User Profile</h3>
            <div style={{textAlign:'left', marginBottom:20}}>
                <div style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #eee'}}>
                  <span>User ID:</span> <b>{user.id}</b>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #eee'}}>
                  <span>Balance:</span> <b>{user.balance.toFixed(5)} TON</b>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #eee'}}>
                  <span>Account:</span> <b>{user.is_vip ? "VIP ⭐" : "Standard"}</b>
                </div>
            </div>
            <button onClick={()=>window.open("https://t.me/EasyTonHelp_Bot")} style={{...styles.btn, width:'100%', background:'#0088cc'}}>💬 CONTACT SUPPORT</button>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={styles.bottomNav}>
        <div onClick={()=>setMainTab('earn')} style={styles.navItem(mainTab==='earn')}>💰<br/>EARN</div>
        <div onClick={()=>setMainTab('invite')} style={styles.navItem(mainTab==='invite')}>👥<br/>INVITE</div>
        <div onClick={()=>setMainTab('rank')} style={styles.navItem(mainTab==='rank')}>🏆<br/>RANK</div>
        <div onClick={()=>setMainTab('withdraw')} style={styles.navItem(mainTab==='withdraw')}>💳<br/>CASH</div>
        <div onClick={()=>setMainTab('profile')} style={styles.navItem(mainTab==='profile')}>👤<br/>PROFILE</div>
      </div>
    </div>
  );
}

export default App;
