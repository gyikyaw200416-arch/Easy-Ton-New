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

  // Inputs
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [withdrawAddr, setWithdrawAddr] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  
  // Admin States
  const [targetId, setTargetId] = useState('');
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

    // 2. Global Tasks
    const { data: tData } = await supabase.from('global_tasks').select('*');
    if (tData) setTasks(tData);

    // 3. Rankings (Top 50)
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

  // --- Functions ---
  const handleWatchAds = async () => {
    const reward = user.is_vip ? 0.0008 : 0.0003;
    await supabase.from('users').update({ balance: user.balance + reward }).eq('id', user.id);
    alert(`Success! Earned ${reward} TON ✅`);
    fetchAllData();
  };

  const handleStartTask = async (task) => {
    window.open(task.link);
    if (!user.completed_tasks?.includes(task.id)) {
        const updatedTasks = [...(user.completed_tasks || []), task.id];
        await supabase.from('users').update({ 
            balance: user.balance + 0.001,
            completed_tasks: updatedTasks 
        }).eq('id', user.id);
        alert("0.001 TON Reward Added! ✅");
        fetchAllData();
    }
  };

  const handleRedeemPromo = async () => {
    const { data: promo } = await supabase.from('promo_codes').select('*').eq('code', promoCodeInput).single();
    if (!promo) return alert("Invalid Code!");
    
    // Check if user used it already (assuming used_by column exists as array)
    if (promo.used_by?.includes(user.id)) return alert("You already used this code!");

    const updatedUsedBy = [...(promo.used_by || []), user.id];
    await supabase.from('promo_codes').update({ used_by: updatedUsedBy }).eq('code', promoCodeInput);
    await supabase.from('users').update({ balance: user.balance + promo.value }).eq('id', user.id);
    
    alert(`Reward ${promo.value} TON Claimed! ✅`);
    setPromoCodeInput('');
    fetchAllData();
  };

  const handleWithdraw = async () => {
    const amt = Number(withdrawAmt);
    if (amt < 0.1) return alert("Minimum withdrawal is 0.1 TON");
    if (amt > user.balance) return alert("Insufficient Balance!");
    
    await supabase.from('withdrawals').insert([{ user_id: user.id, amount: amt, address: withdrawAddr, status: 'Pending' }]);
    await supabase.from('users').update({ balance: user.balance - amt }).eq('id', user.id);
    alert("Withdrawal Request Submitted! ✅");
    setWithdrawAmt(''); setWithdrawAddr('');
    fetchAllData();
  };

  // --- Admin Functions ---
  const handleUpdateUser = async () => {
    await supabase.from('users').update({ balance: Number(editBal), is_vip: editVip }).eq('id', targetId);
    alert("Updated!"); fetchAllData();
  };

  const styles = {
    container: { backgroundColor: '#facc15', minHeight: '100vh', padding: '15px', paddingBottom: '100px', fontFamily: 'sans-serif' },
    card: { background: '#fff', padding: '12px', borderRadius: '15px', border: '2px solid #000', marginBottom: '10px' },
    btn: { background: '#000', color: '#fff', padding: '10px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
    input: { width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #000', boxSizing: 'border-box' },
    bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', display: 'flex', justifyContent: 'space-around', padding: '10px', zIndex: 100 },
    navItem: (active) => ({ color: active ? '#facc15' : '#fff', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flex: 1 }),
    badge: { background: 'red', color: '#fff', padding: '2px 6px', borderRadius: '5px', fontSize: '10px', marginLeft: '5px' }
  };

  const getRankReward = (index) => {
    const rewards = [30, 20, 10, 8, 6, 5, 5, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1, 1, 1];
    return rewards[index] || 0.5; // Top 19 then 0.5 TON
  };

  if (loading) return <div style={{textAlign:'center', marginTop:50}}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={{background:'#000', color:'#fff', padding:20, borderRadius:20, textAlign:'center', marginBottom:15}}>
         <small style={{opacity:0.7}}>AVAILABLE BALANCE</small>
         <h1 style={{margin:'5px 0'}}>{user.balance.toFixed(5)} TON</h1>
         {user.is_vip && <span style={{color:'#facc15', fontSize:12}}>⭐ VIP MEMBER</span>}
      </div>

      <button onClick={handleWatchAds} style={{...styles.btn, width:'100%', background:'red', marginBottom:15, height:50}}>📺 WATCH ADS & EARN</button>

      {mainTab === 'earn' && (
        <div style={{display:'flex', gap:5, marginBottom:15}}>
          {['bot', 'social', 'reward', 'admin'].map(tab => (
            (tab !== 'admin' || user.id === ADMIN_ID) && 
            <button key={tab} onClick={()=>setSubTab(tab)} style={{flex:1, padding:8, fontSize:10, borderRadius:8, background:subTab===tab?'#000':'#fff', color:subTab===tab?'#fff':'#000', border:'2px solid #000', fontWeight:'bold'}}>{tab.toUpperCase()}</button>
          ))}
        </div>
      )}

      <div style={{minHeight:'45vh'}}>
        {mainTab === 'earn' && (
          subTab === 'admin' ? (
            <div style={styles.card}>
              <h4>Admin Controls</h4>
              <input style={styles.input} placeholder="UID" value={targetId} onChange={e=>setTargetId(e.target.value)} />
              <input style={styles.input} placeholder="Balance" type="number" value={editBal} onChange={e=>setEditBal(e.target.value)} />
              <select style={styles.input} value={editVip} onChange={e=>setEditVip(e.target.value==='true')}>
                <option value="false">Standard</option><option value="true">VIP ⭐</option>
              </select>
              <button style={{...styles.btn, width:'100%', background:'green'}} onClick={handleUpdateUser}>UPDATE</button>
              <hr/>
              <input style={styles.input} placeholder="Task Name" value={taskName} onChange={e=>setTaskName(e.target.value)} />
              <input style={styles.input} placeholder="Task Link" value={taskLink} onChange={e=>setTaskLink(e.target.value)} />
              <select style={styles.input} value={taskType} onChange={e=>setTaskType(e.target.value)}>
                <option value="bot">Bot</option><option value="social">Social</option><option value="reward">Reward</option>
              </select>
              <button style={{...styles.btn, width:'100%'}} onClick={async ()=>{await supabase.from('global_tasks').insert([{name:taskName, link:taskLink, type:taskType}]); alert("Added!"); fetchAllData();}}>ADD TASK</button>
            </div>
          ) : subTab === 'reward' ? (
            <div>
              <div style={styles.card}>
                <h4>Redeem Code (1 per ID)</h4>
                <input style={styles.input} placeholder="Enter Code" value={promoCodeInput} onChange={e=>setPromoCodeInput(e.target.value)} />
                <button onClick={handleRedeemPromo} style={{...styles.btn, width:'100%'}}>CLAIM</button>
              </div>
              <div style={{...styles.card, textAlign:'center'}}>
                <h4>Lucky Spin</h4>
                <div style={{width:100, height:100, borderRadius:'50%', border:'5px solid #000', margin:'auto', background:'conic-gradient(red 0 36deg, blue 36deg 72deg, green 72deg 108deg, yellow 108deg 144deg, purple 144deg 180deg, orange 180deg 216deg, pink 216deg 252deg, cyan 252deg 288deg, brown 288deg 324deg, grey 324deg 360deg)'}}></div>
                <button style={{...styles.btn, marginTop:10}}>SPIN</button>
              </div>
            </div>
          ) : (
            tasks.filter(t => t.type === subTab && !user.completed_tasks?.includes(t.id)).map(t => (
              <div key={t.id} style={styles.card}>
                <span>{t.name} <span style={{color:'green'}}>+0.001 TON</span></span>
                <button onClick={()=>handleStartTask(t)} style={{...styles.btn, float:'right', padding:'5px 15px'}}>START</button>
              </div>
            ))
          )
        )}

        {mainTab === 'invite' && (
          <div style={{...styles.card, textAlign:'center'}}>
            <h3>Invite Friends</h3>
            <p style={{color:'green', fontWeight:'bold'}}>+0.001 TON Per Referral</p>
            <div style={{background:'#eee', padding:10, borderRadius:8, fontSize:10, marginBottom:10}}>https://t.me/EasyTONFree_Bot?start={user.id}</div>
            <button onClick={() => {navigator.clipboard.writeText(`https://t.me/EasyTONFree_Bot?start=${user.id}`); alert("Copied!");}} style={{...styles.btn, width:'100%'}}>COPY LINK</button>
            <h4 style={{marginTop:20}}>History ({invites.length})</h4>
            {invites.map((inv, i) => <div key={i} style={{fontSize:12, borderBottom:'1px solid #eee', padding:5}}>Referral User ID: {inv.id} <span style={{color:'green', float:'right'}}>+0.001</span></div>)}
          </div>
        )}

        {mainTab === 'rank' && (
          <div style={styles.card}>
            <h3 style={{marginTop:0, textAlign:'center'}}>🏆 TOP 50 RANKINGS</h3>
            <table style={{width:'100%', fontSize:12, borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:'2px solid #000'}}><th align="left">Rank</th><th align="left">User UID</th><th align="right">Reward</th></tr></thead>
              <tbody>
                {rankList.map((r, i) => (
                  <tr key={i} style={{borderBottom:'1px solid #eee', background: r.id === user.id ? '#ffffcc' : 'none'}}>
                    <td padding="5px">{i+1}</td>
                    <td>{r.id} {r.id === user.id && "(Me)"}</td>
                    <td align="right" style={{color:'blue', fontWeight:'bold'}}>{getRankReward(i)} TON</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {mainTab === 'withdraw' && (
          <div>
            <div style={{...styles.card, background:'#fffcf0', border:'2px solid gold'}}>
                <h4 style={{margin:0}}>💎 BUY VIP (1 TON)</h4>
                <p style={{fontSize:10}}>Address: UQDasFrJo7PrMaJcRFivcBVVnhWNQxYG-y32EN0ZeQPRSOp9 <button onClick={()=>navigator.clipboard.writeText('UQDasFrJo7PrMaJcRFivcBVVnhWNQxYG-y32EN0ZeQPRSOp9')}>📋</button></p>
                <p style={{fontSize:10}}>Memo: {user.id} <button onClick={()=>navigator.clipboard.writeText(user.id)}>📋</button></p>
            </div>
            <div style={styles.card}>
              <h4>Withdraw (Min: 0.1)</h4>
              <input style={styles.input} placeholder="Wallet Address" value={withdrawAddr} onChange={e=>setWithdrawAddr(e.target.value)} />
              <input style={styles.input} placeholder="Amount" type="number" value={withdrawAmt} onChange={e=>setWithdrawAmt(e.target.value)} />
              <button onClick={handleWithdraw} style={{...styles.btn, width:'100%', background:'blue'}}>WITHDRAW</button>
            </div>
          </div>
        )}

        {mainTab === 'profile' && (
          <div style={{...styles.card, textAlign:'center'}}>
            <h3>User Profile</h3>
            <p>ID: {user.id}</p>
            <p>Balance: {user.balance.toFixed(4)} TON</p>
            <p>Status: {user.is_vip ? "VIP ⭐" : "Standard"}</p>
            <button onClick={()=>window.open("https://t.me/EasyTonHelp_Bot")} style={{...styles.btn, width:'100%', marginTop:20, background:'#0088cc'}}>💬 CONTACT SUPPORT</button>
          </div>
        )}
      </div>

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
