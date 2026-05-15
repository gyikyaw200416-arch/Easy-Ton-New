import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const tg = window.Telegram?.WebApp;
const supabase = createClient(
  "https://bysgzzqyubtgvdghldec.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c2d6enF5dWJ0Z3ZkZ2hsZGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzM4ODQsImV4cCI6MjA5MzUwOTg4NH0.-4JDl5X--fNYrRyuaOzyUXz0FaJpIxNSLLzcjGrlavQ"
);
const ADMIN_ID = "1793453606"; 
const DEPOSIT_ADDRESS = "UQDasFrJo7PrMaJcRFivcBVVnhWNQxYG-y32EN0ZeQPRSOp9";

const AD_LINKS = [
  "https://data527.click/a674e1237b7e268eb5f6/ff9984d88d/?placementName=default",
  "https://www.profitablecpmratenetwork.com/pmi0yt9u?key=3580805003ccb6983acba9b61b6cb7e2"
];

function App() {
  const [mainTab, setMainTab] = useState('earn');
  const [subTab, setSubTab] = useState('bot');
  const [user, setUser] = useState({ 
    id: tg?.initDataUnsafe?.user?.id?.toString() || "1793453606", 
    balance: 0, 
    is_vip: false, 
    completed_tasks: [], 
    last_spin: 0,
    vip_spin_chances: 0 // New field for admin-granted spins
  });
  
  const [tasks, setTasks] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [invites, setInvites] = useState([]);
  const [rankList, setRankList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [withdrawAddr, setWithdrawAddr] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  
  // Spin States
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAdDone, setIsAdDone] = useState(false); // Track if ad is finished
  const [spinRotation, setSpinRotation] = useState(0); 
  const [vipSpinRotation, setVipSpinRotation] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(0);

  // Admin States
  const [targetId, setTargetId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [userWithdraws, setUserWithdraws] = useState([]);
  const [editBal, setEditBal] = useState('');
  const [editVip, setEditVip] = useState(false);
  const [addVipSpins, setAddVipSpins] = useState(0); // Admin input for spins
  const [taskName, setTaskName] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [taskType, setTaskType] = useState('bot');

  // --- AD ENGINE STATES ---
  const [isAdWatching, setIsAdWatching] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  const [pendingAction, setPendingAction] = useState(null);
  const currentAdUrl = useRef(AD_LINKS[0]);
  const adToggle = useRef(0);

  const spinOptions = [
    { amt: 0.00009, color: '#007AFF', label: 'Blue' },   
    { amt: 0.0005, color: '#8B4513', label: 'Brown' },    
    { amt: 0.0001, color: '#FF3B30', label: 'Red' },     
    { amt: 0.0007, color: '#000080', label: 'Navy Blue' }, 
    { amt: 0.0002, color: '#FFD60A', label: 'Yellow' },  
    { amt: 0.0008, color: '#006400', label: 'Dark Green' }, 
    { amt: 0.0003, color: '#34C759', label: 'Green' },   
    { amt: 0.0006, color: '#191970', label: 'Midnight Blue' }, 
    { amt: 0.00004, color: '#000000', label: 'Black' },  
    { amt: 0.00008, color: '#FF9500', label: 'Orange' }, 
    { amt: 0.00007, color: '#AF52DE', label: 'Purple' }, 
    { amt: 0.0009, color: '#FF2D55', label: 'Pink' },    
    { amt: 0.001, color: '#FFFFFF', label: 'White' }     
  ];

  const vipSpinOptions = [
    { amt: 0.02, color: '#000000', label: 'Black' },
    { amt: 0.05, color: '#8B4513', label: 'Brown' },
    { amt: 0.11, color: '#34C759', label: 'Green' },
    { amt: 0.008, color: '#FFD700', label: 'Gold' }, 
    { amt: 0.15, color: '#FFFFFF', label: 'White' },
    { amt: 0.01, color: '#AF52DE', label: 'Purple' },
    { amt: 0.04, color: '#FFD60A', label: 'Yellow' },
    { amt: 0.14, color: '#FF3B30', label: 'Red' },
    { amt: 0.08, color: '#007AFF', label: 'Blue' },
    { amt: 0.04, color: '#006400', label: 'Dark Green' },
    { amt: 0.12, color: '#191970', label: 'Navy Blue' }
  ];

  const fetchAllData = useCallback(async () => {
    let { data: uData } = await supabase.from('users').select('*').eq('id', user.id).single();
    
    if (!uData) {
        const startParam = tg?.initDataUnsafe?.start_param;
        if (startParam && startParam !== user.id) {
            const { data: inviter } = await supabase.from('users').select('balance').eq('id', startParam).single();
            if (inviter) {
                await supabase.from('users').update({ balance: inviter.balance + 0.005 }).eq('id', startParam);
            }
        }
        const { data: newUser } = await supabase.from('users').insert([{ 
            id: user.id, balance: 0, invited_by: startParam, completed_tasks: [], last_spin: 0, vip_spin_chances: 0
        }]).select().single();
        uData = newUser;
    }
    
    const sanitizedUser = {
        ...uData,
        completed_tasks: uData.completed_tasks ? uData.completed_tasks.map(String) : []
    };
    setUser(sanitizedUser);
    
    const waitTime = 1 * 60 * 60 * 1000; 
    const diff = waitTime - (Date.now() - (uData.last_spin || 0));
    setTimeLeft(diff > 0 ? diff : 0);

    const { data: tData } = await supabase.from('global_tasks').select('*');
    if (tData) setTasks(tData);

    const { data: rData } = await supabase.from('users').select('id, balance').order('balance', { ascending: false }).limit(50);
    if (rData) setRankList(rData);

    const { data: wData } = await supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (wData) setWithdraws(wData);

    const { data: iData } = await supabase.from('users').select('id, balance').eq('invited_by', user.id);
    if (iData) setInvites(iData);

    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => setTimeLeft(prev => prev > 1000 ? prev - 1000 : 0), 1000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // --- AD LOGIC ---
  const triggerAd = (duration, callback) => {
    if (user.id === ADMIN_ID) return callback(); 
    const selectedAd = AD_LINKS[adToggle.current % 2];
    adToggle.current += 1;
    window.open(selectedAd, '_blank');
    currentAdUrl.current = selectedAd;
    setIsAdWatching(true);
    setAdTimer(duration);
    setPendingAction(() => callback);
  };

  const handleGlobalClick = (e) => {
    if (isAdWatching && adTimer > 0) {
      e.preventDefault();
      e.stopPropagation();
      alert(`Watch the full time ${adTimer}s‼️`);
      window.open(currentAdUrl.current, '_blank');
    }
  };

  useEffect(() => {
    let timer;
    if (isAdWatching && adTimer > 0) {
      timer = setInterval(() => setAdTimer(prev => prev - 1), 1000);
    } else if (adTimer === 0 && isAdWatching) {
      setIsAdWatching(false);
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    }
    return () => clearInterval(timer);
  }, [isAdWatching, adTimer, pendingAction]);

  const handleWatchAds = () => {
    triggerAd(30, async () => {
      const reward = user.is_vip ? 0.0008 : 0.0003; 
      const newBalance = user.balance + reward;
      await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
      setUser(prev => ({ ...prev, balance: newBalance }));
      alert(`Ad complete! Reward: +${reward} TON ✅`);
      fetchAllData();
    });
  };

  // Modified Spin Logic: Ad first, then button click to spin
  const prepareSpin = (type) => {
    if (user.id !== ADMIN_ID && timeLeft > 0) return alert("Cooldown active!");
    if (type === 'vip' && user.vip_spin_chances <= 0) return alert("No VIP spins available! Contact Admin or Deposit.");
    
    triggerAd(20, () => {
      setIsAdDone(true);
      alert("Ad Finished! Now tap 'START SPIN' to play! 🎡");
    });
  };

  const startSpinExecution = async (type = 'normal') => {
    if (isSpinning) return;
    setIsSpinning(true);
    setIsAdDone(false);

    const options = type === 'vip' ? vipSpinOptions : spinOptions;
    const randomIndex = Math.floor(Math.random() * options.length);
    const segmentAngle = 360 / options.length;
    const extraSpins = 3600; 
    const currentRot = type === 'vip' ? vipSpinRotation : spinRotation;
    const currentRotationBase = currentRot - (currentRot % 360);
    const finalRotation = currentRotationBase + extraSpins + (360 - (randomIndex * segmentAngle));
    
    if(type === 'vip') setVipSpinRotation(finalRotation);
    else setSpinRotation(finalRotation);

    setTimeout(async () => {
      const winner = options[randomIndex];
      const newBalance = user.balance + winner.amt;
      const now = Date.now();
      
      const updateData = { balance: newBalance, last_spin: now };
      if (type === 'vip') updateData.vip_spin_chances = user.vip_spin_chances - 1;

      await supabase.from('users').update(updateData).eq('id', user.id);
      alert(`Landed on ${winner.label}! +${winner.amt} TON ✅`);
      setIsSpinning(false);
      fetchAllData();
    }, 4000);
  };

  const handleStartTask = (task) => {
    const taskIdStr = String(task.id);
    if (user.completed_tasks?.includes(taskIdStr)) return;
    window.open(task.link, '_blank');
    triggerAd(20, async () => { 
        const currentTasks = user.completed_tasks ? [...user.completed_tasks] : [];
        if (currentTasks.includes(taskIdStr)) return; 
        const taskReward = 0.001; 
        const newBalance = (user.balance || 0) + taskReward;
        const updatedCompletedTasks = [...currentTasks, taskIdStr];
        setUser(prev => ({ ...prev, balance: newBalance, completed_tasks: updatedCompletedTasks }));
        await supabase.from('users').update({ balance: newBalance, completed_tasks: updatedCompletedTasks }).eq('id', user.id);
        alert(`Task Verified! +${taskReward} TON Added ✅`); 
        setTimeout(() => fetchAllData(), 500);
    });
  };

  const handleWithdraw = () => {
    triggerAd(20, async () => {
        const amt = Number(withdrawAmt);
        if (amt < 0.1) return alert("Minimum withdrawal is 0.1 TON");
        if (amt > user.balance) return alert("Insufficient balance!");
        const currentDate = new Date().toISOString();
        await supabase.from('withdrawals').insert([{ 
            user_id: user.id, amount: amt, address: withdrawAddr, status: 'Pending', created_at: currentDate 
        }]);
        const newBalance = user.balance - amt;
        await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
        setUser(prev => ({ ...prev, balance: newBalance }));
        alert("Withdrawal Request Pending! ✅"); 
        fetchAllData();
    });
  };

  // ADMIN: Manage User Spins
  const handleCheckUser = async () => {
    if (!targetId) return;
    const { data: userData } = await supabase.from('users').select('*').eq('id', targetId).single();
    if (userData) { 
        setSearchedUser(userData); setEditBal(userData.balance); setEditVip(userData.is_vip);
        const { data: wData } = await supabase.from('withdrawals').select('*').eq('user_id', targetId).eq('status', 'Pending');
        setUserWithdraws(wData || []);
    } else { alert("User Not Found!"); }
  };

  const handleUpdateUser = async () => {
    const updatedFields = { 
        balance: Number(editBal), 
        is_vip: editVip,
        vip_spin_chances: (searchedUser.vip_spin_chances || 0) + Number(addVipSpins)
    };
    const { error } = await supabase.from('users').update(updatedFields).eq('id', targetId);
    if (!error) { 
        alert("User Data & Spins Updated! ✅"); 
        setAddVipSpins(0);
        handleCheckUser(); 
        fetchAllData(); 
    }
  };

  const approveWithdraw = async (wId) => {
    await supabase.from('withdrawals').update({ status: 'Success' }).eq('id', wId);
    alert("Withdrawal marked as Successful! ✅");
    handleCheckUser();
  };

  const styles = {
    container: { backgroundColor: '#facc15', minHeight: '100vh', padding: '15px', paddingBottom: '100px', fontFamily: 'sans-serif', position: 'relative' },
    card: { background: '#fff', padding: '15px', borderRadius: '15px', border: '2px solid #000', marginBottom: '10px', overflow: 'hidden' },
    btn: { background: '#000', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
    input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #000', boxSizing: 'border-box' },
    bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', display: 'flex', justifyContent: 'space-around', padding: '10px', zIndex: 100 },
    navItem: (active) => ({ color: active ? '#facc15' : '#fff', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flex: 1, cursor: 'pointer' }),
    copyBtn: { background: '#eee', border: '1px solid #000', fontSize: '10px', padding: '4px 8px', marginLeft: '5px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    wheelWrapper: { position: 'relative', width: 220, height: 220, margin: '20px auto' },
    // Arrow positioned at roughly 45 degrees as requested
    wheelArrow: { position: 'absolute', top: 5, right: 15, transform: 'rotate(45deg)', width: 0, height: 0, borderLeft: '15px solid transparent', borderRight: '15px solid transparent', borderTop: '30px solid #000', zIndex: 10 },
    wheel: (rotation, options) => ({ width: '100%', height: '100%', borderRadius: '50%', border: '5px solid #000', background: `conic-gradient(${options.map((o, i) => `${o.color} ${i * (360/options.length)}deg ${(i+1) * (360/options.length)}deg`).join(', ')})`, transition: 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)', transform: `rotate(${rotation}deg)` }),
    dot: (color) => ({ height: 10, width: 10, backgroundColor: color, borderRadius: '50%', display: 'inline-block', marginRight: 5, border: '1px solid #000' }),
    depositBox: { background: '#f8f9fa', padding: '10px', borderRadius: '10px', border: '1px solid #ddd', marginTop: '15px', textAlign: 'left', fontSize: '12px' }
  };

  if (loading) return <div style={{textAlign:'center', marginTop:50, fontWeight:'bold'}}>LOADING...</div>;

  return (
    <div style={styles.container} onClick={handleGlobalClick}>
      
      <div style={{background:'#000', color:'#fff', padding:20, borderRadius:20, textAlign:'center', marginBottom:15, border: '2px solid #fff'}}>
         <small style={{opacity:0.7}}>MY TOTAL BALANCE</small>
         <h1 style={{margin:'5px 0', fontSize:32}}>{user.balance.toFixed(5)} TON</h1>
         {user.is_vip && <span style={{color:'#facc15', fontSize:12, fontWeight:'bold'}}>⭐ VIP MEMBER</span>}
         <div style={{fontSize:10, marginTop:5}}>Available VIP Spins: {user.vip_spin_chances || 0}</div>
      </div>

      <button onClick={handleWatchAds} style={{...styles.btn, width:'100%', background:'linear-gradient(to right, #ff416c, #ff4b2b)', marginBottom:15, height:50, fontSize:16, border:'2px solid #000'}}>
        📺 WATCH ADS & EARN (30s)
      </button>

      {mainTab === 'earn' && (
        <div style={{display:'flex', gap:5, marginBottom:15}}>
          {['bot', 'social', 'spin', 'admin'].map(tab => (
            (tab !== 'admin' || user.id === ADMIN_ID) && 
            <button key={tab} onClick={() => { if(tab === 'admin') setSubTab(tab); else triggerAd(20, () => setSubTab(tab)); }} style={{flex:1, padding:10, fontSize:10, borderRadius:10, background:subTab===tab?'#000':'#fff', color:subTab===tab?'#fff':'#000', border:'2px solid #000', fontWeight:'bold'}}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <div style={{minHeight:'45vh'}}>
        {mainTab === 'earn' && (
          subTab === 'spin' ? (
              <>
                {/* LUCKY SPIN */}
                <div style={{...styles.card, textAlign:'center'}}>
                  <h3 style={{marginTop:0}}>🎡 LUCKY SPIN</h3>
                  <div style={styles.wheelWrapper}>
                    <div style={styles.wheelArrow}></div>
                    <div style={styles.wheel(spinRotation, spinOptions)}></div>
                  </div>
                  
                  {!isAdDone ? (
                    <button onClick={() => prepareSpin('normal')} style={{...styles.btn, width:'100%', background: (user.id !== ADMIN_ID && timeLeft > 0) ? '#ccc' : '#00d2ff'}} disabled={isSpinning || (user.id !== ADMIN_ID && timeLeft > 0)}>
                      { (user.id !== ADMIN_ID && timeLeft > 0) ? `WAIT ${Math.ceil(timeLeft/60000)} MIN` : 'WATCH AD TO SPIN'}
                    </button>
                  ) : (
                    <button onClick={() => startSpinExecution('normal')} style={{...styles.btn, width:'100%', background: '#34C759'}} disabled={isSpinning}>
                      {isSpinning ? 'SPINNING...' : '🚀 START SPIN NOW'}
                    </button>
                  )}

                  <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:5, marginTop:20, fontSize:10, textAlign:'left'}}>
                    {spinOptions.map((o,i) => <div key={i}><span style={styles.dot(o.color)}></span>{o.amt} TON</div>)}
                  </div>
                </div>

                {/* VIP LUCKY SPIN */}
                <div style={{...styles.card, textAlign:'center', marginTop:20}}>
                  <h3 style={{marginTop:0}}>🎡 VIP LUCKY SPIN</h3>
                  <p style={{fontSize:10, color:'orange'}}>Requires Admin Spin Chance</p>
                  <div style={styles.wheelWrapper}>
                    <div style={styles.wheelArrow}></div>
                    <div style={styles.wheel(vipSpinRotation, vipSpinOptions)}></div>
                  </div>

                  {!isAdDone ? (
                    <button onClick={() => prepareSpin('vip')} style={{...styles.btn, width:'100%', background: user.vip_spin_chances > 0 ? '#facc15' : '#ccc', color: '#000'}} disabled={isSpinning || user.vip_spin_chances <= 0}>
                      WATCH AD TO SPIN (Chances: {user.vip_spin_chances})
                    </button>
                  ) : (
                    <button onClick={() => startSpinExecution('vip')} style={{...styles.btn, width:'100%', background: '#34C759'}} disabled={isSpinning}>
                      {isSpinning ? 'SPINNING...' : '🚀 START VIP SPIN'}
                    </button>
                  )}

                  {/* Deposit Info */}
                  <div style={styles.depositBox}>
                    <p style={{margin:'0 0 5px 0', fontWeight:'bold', color:'#d97706'}}>To get VIP Spins, Deposit 0.1 TON per spin:</p>
                    <div style={{marginBottom: 5}}>
                      Addr: <code style={{fontSize:'10px'}}>{DEPOSIT_ADDRESS}</code>
                      <span style={styles.copyBtn} onClick={()=> {navigator.clipboard.writeText(DEPOSIT_ADDRESS); alert("Address Copied!");}}>COPY</span>
                    </div>
                    <div>
                      Memo: <code>{user.id}</code>
                      <span style={styles.copyBtn} onClick={()=> {navigator.clipboard.writeText(user.id); alert("Memo Copied!");}}>COPY</span>
                    </div>
                  </div>
                </div>
              </>
          ) : subTab === 'admin' ? (
            <div style={styles.card}>
              <h3 style={{marginTop:0}}>Admin Panel</h3>
              <input style={styles.input} placeholder="Search User UID" value={targetId} onChange={e=>setTargetId(e.target.value)} />
              <button style={{...styles.btn, width:'100%', marginBottom:10}} onClick={handleCheckUser}>CHECK USER</button>
              
              {searchedUser && (
                <div style={{background:'#f0f9ff', padding:15, borderRadius:10, border:'1px solid #000', marginBottom:10}}>
                  <p>UID: {searchedUser.id}</p>
                  <label style={{fontSize:11}}>Balance:</label>
                  <input style={styles.input} type="number" value={editBal} onChange={e=>setEditBal(e.target.value)} />
                  
                  <label style={{fontSize:11}}>Add VIP Spin Chances:</label>
                  <input style={styles.input} type="number" placeholder="Enter amount (e.g. 1)" value={addVipSpins} onChange={e=>setAddVipSpins(e.target.value)} />
                  
                  <select style={styles.input} value={editVip} onChange={e=>setEditVip(e.target.value === 'true')}>
                    <option value="false">Standard Account</option>
                    <option value="true">VIP Account ⭐</option>
                  </select>
                  <button style={{...styles.btn, width:'100%', background:'green', marginBottom:15}} onClick={handleUpdateUser}>SAVE CHANGES</button>
                  
                  {userWithdraws.map(w => (
                    <div key={w.id} style={{fontSize:11, marginBottom:10}}>
                        {w.amount} TON to {w.address.slice(0,10)}...
                        <button onClick={() => approveWithdraw(w.id)} style={{float:'right', background:'blue', color:'#fff', borderRadius:5, border:'none', padding:'3px 8px'}}>Approve</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Task List
            tasks.filter(t => t.type === subTab && !user.completed_tasks?.includes(String(t.id))).map(t => (
                <div key={t.id} style={styles.card}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{fontWeight:'bold', fontSize:14}}>{t.name}</span>
                      <button onClick={()=>handleStartTask(t)} style={{...styles.btn, padding:'8px 15px'}}>START</button>
                  </div>
                </div>
            ))
          )
        )}
        
        {/* Navigation Tabs (Invite, Rank, Withdraw, Profile) remain the same as previous version */}
        {mainTab === 'invite' && (
          <div style={{...styles.card, textAlign:'center'}}>
            <h3>Invite & Earn</h3>
            <p style={{color:'green', fontWeight:'bold'}}>Invite Friend: +0.005 TON Reward!</p>
            <div style={{background:'#eee', padding:15, borderRadius:10, wordBreak:'break-all', marginBottom:15}}>
                <code>t.me/EasyTONFree_Bot?start={user.id}</code>
            </div>
            <button onClick={() => {navigator.clipboard.writeText(`https://t.me/EasyTONFree_Bot?start=${user.id}`); alert("Referral link copied!");}} style={{...styles.btn, width:'100%'}}>COPY LINK</button>
          </div>
        )}

        {mainTab === 'rank' && (
          <div style={styles.card}>
            <h3 style={{textAlign:'center', marginTop:0}}>🏆 TOP 50 RANKINGS</h3>
            <table style={{width:'100%', fontSize:12, borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:'2px solid #000'}}><th align="left">User ID</th><th align="right">Amount</th></tr></thead>
              <tbody>
                {rankList.map((r, i) => (
                  <tr key={i} style={{borderBottom:'1px solid #eee', background: r.id === user.id ? '#fff9c4' : 'none'}}>
                    <td style={{padding:'10px 0'}}>{i+1}. {r.id}</td>
                    <td align="right" style={{color:'blue', fontWeight:'bold'}}>{r.balance.toFixed(4)} TON</td>
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
              <input style={styles.input} placeholder="Wallet Address" value={withdrawAddr} onChange={e=>setWithdrawAddr(e.target.value)} />
              <input style={styles.input} placeholder="Amount (Min 0.1)" type="number" value={withdrawAmt} onChange={e=>setWithdrawAmt(e.target.value)} />
              <button onClick={handleWithdraw} style={{...styles.btn, width:'100%', background:'#0052ff'}}>WITHDRAW</button>
            </div>
          </div>
        )}

        {mainTab === 'profile' && (
          <div style={{...styles.card, textAlign:'center'}}>
            <h3>Profile</h3>
            <div style={{textAlign:'left', background: '#f9f9f9', padding: 15, borderRadius: 10}}>
                <p><b>ID:</b> {user.id}</p>
                <p><b>Balance:</b> {user.balance.toFixed(5)} TON</p>
                <p><b>VIP Spins:</b> {user.vip_spin_chances}</p>
            </div>
          </div>
        )}
      </div>

      <div style={styles.bottomNav}>
        <div onClick={()=>triggerAd(20, () => setMainTab('earn'))} style={styles.navItem(mainTab==='earn')}>💰<br/>EARN</div>
        <div onClick={()=>triggerAd(20, () => setMainTab('invite'))} style={styles.navItem(mainTab==='invite')}>👥<br/>INVITE</div>
        <div onClick={()=>triggerAd(20, () => setMainTab('rank'))} style={styles.navItem(mainTab==='rank')}>🏆<br/>RANK</div>
        <div onClick={()=>triggerAd(20, () => setMainTab('withdraw'))} style={styles.navItem(mainTab==='withdraw')}>💳<br/>CASH</div>
        <div onClick={()=>triggerAd(20, () => setMainTab('profile'))} style={styles.navItem(mainTab==='profile')}>👤<br/>PROFILE</div>
      </div>
    </div>
  );
}

export default App;
