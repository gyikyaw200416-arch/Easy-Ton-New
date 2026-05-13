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
  const [user, setUser] = useState({ id: tg?.initDataUnsafe?.user?.id?.toString() || "1793453606", balance: 0, is_vip: false, completed_tasks: [], last_spin: 0 });
  const [tasks, setTasks] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [invites, setInvites] = useState([]);
  const [rankList, setRankList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Input & Spin States
  const [withdrawAddr, setWithdrawAddr] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // Admin States
  const [targetId, setTargetId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [targetUserWithdrawals, setTargetUserWithdrawals] = useState([]);
  const [checkSuccess, setCheckSuccess] = useState(false);
  const [editBal, setEditBal] = useState('');
  const [editVip, setEditVip] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [taskType, setTaskType] = useState('bot');
  const [adminPromoCode, setAdminPromoCode] = useState('');
  const [adminPromoValue, setAdminPromoValue] = useState('');

  const spinOptions = [
    { amt: 0.00009, color: '#007AFF', label: 'Blue' },
    { amt: 0.0001, color: '#FF3B30', label: 'Red' },
    { amt: 0.0002, color: '#FFD60A', label: 'Yellow' },
    { amt: 0.0003, color: '#34C759', label: 'Green' },
    { amt: 0.00004, color: '#000000', label: 'Black' },
    { amt: 0.00008, color: '#FF9500', label: 'Orange' },
    { amt: 0.00007, color: '#AF52DE', label: 'Purple' },
    { amt: 0.0009, color: '#FF2D55', label: 'Pink' },
    { amt: 0.001, color: '#FFFFFF', label: 'White' }
  ];

  const fetchAllData = useCallback(async () => {
    let { data: uData } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (!uData) {
        const startParam = tg?.initDataUnsafe?.start_param;
        const { data: newUser } = await supabase.from('users').insert([{ id: user.id, balance: 0, invited_by: startParam, completed_tasks: [], last_spin: 0 }]).select().single();
        uData = newUser;
    }
    setUser(uData);
    const waitTime = 2 * 60 * 60 * 1000;
    const diff = waitTime - (Date.now() - (uData.last_spin || 0));
    setTimeLeft(diff > 0 ? diff : 0);
    
    const { data: tData } = await supabase.from('global_tasks').select('*');
    if (tData) setTasks(tData);
    
    const { data: rData } = await supabase.from('users').select('id, balance').order('balance', { ascending: false }).limit(50);
    if (rData) setRankList(rData);
    
    const { data: wData } = await supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (wData) setWithdraws(wData);
    
    const { data: iData } = await supabase.from('users').select('id').eq('invited_by', user.id);
    if (iData) setInvites(iData);
    
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => setTimeLeft(prev => prev > 1000 ? prev - 1000 : 0), 1000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const handleWatchAds = async () => {
    const reward = user.is_vip ? 0.0008 : 0.0003;
    await supabase.from('users').update({ balance: user.balance + reward }).eq('id', user.id);
    alert(`Success! Earned ${reward} TON ✅`);
    fetchAllData();
  };

  const handleSpin = async () => {
    if (timeLeft > 0) return alert("Please wait for the next spin!");
    if (isSpinning) return;

    setIsSpinning(true);
    const randomIndex = Math.floor(Math.random() * spinOptions.length);
    const degreesPerOption = 360 / spinOptions.length;
    
    // Exact landing calculation
    const extraSpins = 360 * 5; 
    const landingPoint = 360 - (randomIndex * degreesPerOption);
    const newRotation = spinRotation + extraSpins + landingPoint;
    
    setSpinRotation(newRotation);

    setTimeout(async () => {
      const winner = spinOptions[randomIndex];
      const newBal = user.balance + winner.amt;
      await supabase.from('users').update({ balance: newBal, last_spin: Date.now() }).eq('id', user.id);
      setIsSpinning(false);
      fetchAllData();
      alert(`You won ${winner.amt} TON! 🎡`);
    }, 4000);
  };

  const handleCheckUser = async () => {
    if (!targetId) return;
    const { data } = await supabase.from('users').select('*').eq('id', targetId).single();
    if (data) { 
        setSearchedUser(data); 
        setEditBal(data.balance); 
        setEditVip(data.is_vip); 
        setCheckSuccess(true);
        // Load user's pending withdrawals
        const { data: wList } = await supabase.from('withdrawals').select('*').eq('user_id', targetId).eq('status', 'Pending');
        setTargetUserWithdrawals(wList || []);
    } else {
        alert("User Not Found!");
    }
  };

  const handleUpdateUser = async () => {
    await supabase.from('users').update({ balance: Number(editBal), is_vip: editVip }).eq('id', targetId);
    alert("User Data Updated! ✅");
    handleCheckUser(); 
    fetchAllData();
  };

  const handleApproveWithdrawal = async (wId) => {
    await supabase.from('withdrawals').update({ status: 'Success' }).eq('id', wId);
    alert("Withdrawal set to Success! ✅");
    handleCheckUser(); 
  };

  const handleStartTask = async (task) => {
    window.open(task.link);
    if (!user.completed_tasks?.includes(task.id)) {
        const updatedTasks = [...(user.completed_tasks || []), task.id];
        await supabase.from('users').update({ balance: user.balance + 0.001, completed_tasks: updatedTasks }).eq('id', user.id);
        alert("0.001 TON Added! ✅"); fetchAllData();
    }
  };

  const handleWithdraw = async () => {
    const amt = Number(withdrawAmt);
    if (amt < 0.1) return alert("Minimum 0.1 TON");
    if (amt > user.balance) return alert("Insufficient Balance!");
    await supabase.from('withdrawals').insert([{ user_id: user.id, amount: amt, address: withdrawAddr, status: 'Pending' }]);
    await supabase.from('users').update({ balance: user.balance - amt }).eq('id', user.id);
    alert("Withdrawal Requested! ✅"); fetchAllData();
  };

  const styles = {
    container: { backgroundColor: '#facc15', minHeight: '100vh', padding: '15px', paddingBottom: '100px', fontFamily: 'sans-serif' },
    card: { background: '#fff', padding: '15px', borderRadius: '15px', border: '2px solid #000', marginBottom: '10px' },
    btn: { background: '#000', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
    input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #000', boxSizing: 'border-box' },
    bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', display: 'flex', justifyContent: 'space-around', padding: '10px', zIndex: 100 },
    navItem: (active) => ({ color: active ? '#facc15' : '#fff', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flex: 1 }),
    dot: (c) => ({ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c, marginRight: 8, border: '1px solid #000' }),
    copyBtn: { background: '#eee', border: '1px solid #000', fontSize: '10px', padding: '2px 6px', marginLeft: '5px', borderRadius: '5px', cursor: 'pointer' },
    wheelWrapper: { position: 'relative', width: 200, height: 200, margin: '20px auto' },
    wheelArrow: { 
        position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)', 
        width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', 
        borderTop: '25px solid #000', zIndex: 5 
    },
    wheel: {
        width: '100%', height: '100%', borderRadius: '50%', border: '5px solid #000',
        background: `conic-gradient(${spinOptions.map((o, i) => `${o.color} ${i * (360/spinOptions.length)}deg ${(i+1) * (360/spinOptions.length)}deg`).join(', ')})`,
        transition: 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)',
        transform: `rotate(${spinRotation}deg)`
    }
  };

  if (loading) return <div style={{textAlign:'center', marginTop:50, fontWeight:'bold'}}>LOADING...</div>;

  return (
    <div style={styles.container}>
      <div style={{background:'#000', color:'#fff', padding:20, borderRadius:20, textAlign:'center', marginBottom:15, border: '2px solid #fff'}}>
         <small style={{opacity:0.7}}>MY TOTAL BALANCE</small>
         <h1 style={{margin:'5px 0', fontSize:32}}>{user.balance.toFixed(5)} TON</h1>
         {user.is_vip && <span style={{color:'#facc15', fontSize:12, fontWeight:'bold'}}>⭐ VIP MEMBER</span>}
      </div>

      <div style={{textAlign:'center', marginBottom:8}}>
         <small style={{fontWeight:'bold'}}>
            Normal: 0.0003 | <span style={{color: user.is_vip ? 'gold' : 'red'}}>{user.is_vip ? '👑 VIP: 0.0008' : 'VIP: 0.0008'}</span>
         </small>
      </div>
      <button onClick={handleWatchAds} style={{...styles.btn, width:'100%', background:'linear-gradient(to right, #ff416c, #ff4b2b)', marginBottom:15, height:50, fontSize:16, border:'2px solid #000'}}>
        📺 WATCH ADS & EARN
      </button>

      {mainTab === 'earn' && (
        <div style={{display:'flex', gap:5, marginBottom:15}}>
          {['bot', 'social', 'reward', 'admin'].map(tab => (
            (tab !== 'admin' || user.id === ADMIN_ID) && 
            <button key={tab} onClick={()=>setSubTab(tab)} style={{flex:1, padding:10, fontSize:10, borderRadius:10, background:subTab===tab?'#000':'#fff', color:subTab===tab?'#fff':'#000', border:'2px solid #000', fontWeight:'bold'}}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <div style={{minHeight:'45vh'}}>
        {mainTab === 'earn' && (
          subTab === 'reward' ? (
            <div>
              <div style={{...styles.card, textAlign:'center'}}>
                <h3 style={{marginTop:0}}>🎡 LUCKY SPIN</h3>
                <p style={{fontSize:11}}>Spin every 2 hours!</p>
                <div style={styles.wheelWrapper}>
                    <div style={styles.wheelArrow}></div>
                    <div style={styles.wheel}></div>
                </div>
                {timeLeft > 0 ? (
                  <button style={{...styles.btn, width:'100%', background:'#ccc'}} disabled>Wait: {Math.floor(timeLeft/60000)}m</button>
                ) : (
                  <button onClick={handleSpin} style={{...styles.btn, width:'100%', background:'#00d2ff'}} disabled={isSpinning}>
                    {isSpinning ? 'SPINNING...' : 'SPIN NOW'}
                  </button>
                )}
                <div style={{textAlign:'left', marginTop:20, fontSize:11}}>
                  {spinOptions.map((o,i) => (
                    <div key={i} style={{marginBottom:4}}>
                      <span style={styles.dot(o.color)}></span> {o.label}: <b>{o.amt} TON</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : subTab === 'admin' ? (
            <div style={styles.card}>
              <h3 style={{marginTop:0}}>Admin Panel</h3>
              <input style={styles.input} placeholder="Search User UID" value={targetId} onChange={e=>setTargetId(e.target.value)} />
              <button style={{...styles.btn, width:'100%', marginBottom:10}} onClick={handleCheckUser}>CHECK USER</button>
              {checkSuccess && searchedUser && (
                <div style={{background:'#f0f9ff', padding:10, borderRadius:10, border:'1px solid #000', marginBottom:10}}>
                  <p><b>Bal:</b> {searchedUser.balance} | <b>VIP:</b> {searchedUser.is_vip ? 'Yes' : 'No'}</p>
                  <input style={styles.input} placeholder="New Balance" type="number" value={editBal} onChange={e=>setEditBal(e.target.value)} />
                  <select style={styles.input} value={editVip.toString()} onChange={e=>setEditVip(e.target.value === 'true')}>
                    <option value="false">Standard User</option>
                    <option value="true">VIP ⭐ Member</option>
                  </select>
                  <button style={{...styles.btn, width:'100%', background:'green', marginBottom:15}} onClick={handleUpdateUser}>UPDATE USER</button>
                  
                  <h4>Withdraw Requests</h4>
                  {targetUserWithdrawals.map((w, i) => (
                    <div key={i} style={{fontSize:11, border:'1px solid #000', padding:10, borderRadius:8, marginBottom:5, background:'#fff'}}>
                        Amt: {w.amount} TON | Addr: {w.address.substring(0,10)}...
                        <button onClick={() => handleApproveWithdrawal(w.id)} style={{float:'right', background:'blue', color:'#fff', border:'none', padding:'4px 8px', borderRadius:5}}>SUCCESS</button>
                    </div>
                  ))}
                </div>
              )}
              <hr/>
              {/* Task and Promo Create Logic remains same */}
              <h4>Add Task</h4>
              <input style={styles.input} placeholder="Name" value={taskName} onChange={e=>setTaskName(e.target.value)} />
              <input style={styles.input} placeholder="Link" value={taskLink} onChange={e=>setTaskLink(e.target.value)} />
              <select style={styles.input} value={taskType} onChange={e=>setTaskType(e.target.value)}>
                <option value="bot">Bot</option><option value="social">Social</option>
              </select>
              <button style={{...styles.btn, width:'100%'}} onClick={async ()=>{
                await supabase.from('global_tasks').insert([{name:taskName, link:taskLink, type:taskType}]);
                alert("Task Added!"); fetchAllData();
              }}>ADD TASK</button>
            </div>
          ) : (
            tasks.filter(t => t.type === subTab && !user.completed_tasks?.includes(t.id)).map(t => (
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
            <p style={{color:'green', fontWeight:'bold'}}>Get 0.001 TON per referral!</p>
            <div style={{background:'#eee', padding:15, borderRadius:10, wordBreak:'break-all', marginBottom:15}}>
                <code>https://t.me/EasyTONFree_Bot?start={user.id}</code>
            </div>
            <button onClick={() => {navigator.clipboard.writeText(`https://t.me/EasyTONFree_Bot?start=${user.id}`); alert("Copied!");}} style={{...styles.btn, width:'100%'}}>COPY LINK</button>
            <h4 style={{marginTop:25, textAlign:'left'}}>History ({invites.length})</h4>
            {invites.map((inv, i) => <div key={i} style={{fontSize:11, padding:5, borderBottom:'1px solid #eee'}}>User: {inv.id} <b style={{float:'right', color:'green'}}>+0.001 ✅</b></div>)}
          </div>
        )}

        {mainTab === 'rank' && (
          <div style={styles.card}>
            <h3 style={{textAlign:'center', marginTop:0}}>🏆 TOP 50 RANKINGS</h3>
            <table style={{width:'100%', fontSize:12, borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:'2px solid #000'}}><th align="left">ID</th><th align="right">Amount</th></tr></thead>
              <tbody>
                {rankList.map((r, i) => (
                  <tr key={i} style={{borderBottom:'1px solid #eee', background: r.id === user.id ? '#fff9c4' : 'none'}}>
                    <td style={{padding:'10px 0'}}>{i+1}. {r.id}</td>
                    <td align="right" style={{color:'blue', fontWeight:'bold'}}>{(30 - i * 0.5).toFixed(1)} TON</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {mainTab === 'withdraw' && (
          <div>
            <div style={styles.card}>
              <h4>Withdraw TON</h4>
              <input style={styles.input} placeholder="TON Address" value={withdrawAddr} onChange={e=>setWithdrawAddr(e.target.value)} />
              <input style={styles.input} placeholder="Amount (Min 0.1)" type="number" value={withdrawAmt} onChange={e=>setWithdrawAmt(e.target.value)} />
              <button onClick={handleWithdraw} style={{...styles.btn, width:'100%', background:'#0052ff'}}>WITHDRAW</button>
            </div>
            <h4 style={{marginLeft: 10}}>History</h4>
            {withdraws.map((w,i) => <div key={i} style={styles.card}>{w.amount} TON - <span style={{color: w.status==='Success'?'green':'orange'}}>{w.status}</span></div>)}
          </div>
        )}

        {mainTab === 'profile' && (
          <div style={{...styles.card, textAlign:'center'}}>
            <h3>Profile</h3>
            <div style={{textAlign:'left', marginBottom:20, background: '#f9f9f9', padding: 15, borderRadius: 10}}>
                <p><b>ID:</b> {user.id}</p>
                <p><b>Balance:</b> {user.balance.toFixed(5)} TON</p>
                <p><b>Status:</b> {user.is_vip ? <span style={{color: '#facc15', fontWeight: 'bold'}}>VIP ⭐ Member</span> : "Standard User"}</p>
            </div>
            <button onClick={()=>window.open("https://t.me/EasyTonHelp_Bot")} style={{...styles.btn, width:'100%', background:'#0088cc'}}>SUPPORT</button>
          </div>
        )}
      </div>

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
