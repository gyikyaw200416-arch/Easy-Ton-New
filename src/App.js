import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const tg = window.Telegram?.WebApp;
const supabase = createClient(
  "https://bysgzzqyubtgvdghldec.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c2d6enF5dWJ0Z3ZkZ2hsZGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzM4ODQsImV4cCI6MjA5MzUwOTg4NH0.-4JDl5X--fNYrRyuaOzyUXz0FaJpIxNSLLzcjGrlavQ"
);
const ADMIN_ID = "1793453606"; 

// Ad URLs
const ADS = [
  "https://data527.click/a674e1237b7e268eb5f6/ff9984d88d/?placementName=default",
  "https://www.profitablecpmratenetwork.com/pmi0yt9u?key=3580805003ccb6983acba9b61b6cb7e2"
];

function App() {
  // Core States
  const [mainTab, setMainTab] = useState('earn');
  const [subTab, setSubTab] = useState('bot');
  const [user, setUser] = useState({ 
    id: tg?.initDataUnsafe?.user?.id?.toString() || "1793453606", 
    balance: 0, 
    is_vip: false, 
    completed_tasks: [], 
    last_spin: 0 
  });
  
  const [tasks, setTasks] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [invites, setInvites] = useState([]);
  const [rankList, setRankList] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NEW AD STATES ---
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [adCallback, setAdCallback] = useState(null);

  // Transaction States
  const [withdrawAddr, setWithdrawAddr] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  
  // Spin States
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(0);

  // Admin States
  const [targetId, setTargetId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [userWithdraws, setUserWithdraws] = useState([]);
  const [editBal, setEditBal] = useState('');
  const [editVip, setEditVip] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [taskType, setTaskType] = useState('bot');
  const [adminPromoCode, setAdminPromoCode] = useState('');
  const [adminPromoValue, setAdminPromoValue] = useState('');

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

  // --- AD ENGINE ---
  const triggerAd = (seconds, callback) => {
    setAdTimer(seconds);
    setAdCallback(() => callback);
    setShowAdOverlay(true);
    window.open(ADS[currentAdIndex], '_blank');
    setCurrentAdIndex((prev) => (prev + 1) % ADS.length); // Toggle between the two ad sources
  };

  useEffect(() => {
    let timer;
    if (showAdOverlay && adTimer > 0) {
      timer = setInterval(() => {
        setAdTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showAdOverlay, adTimer]);

  const closeAdAndExecute = () => {
    if (adTimer > 0) return; // Still locked
    setShowAdOverlay(false);
    if (adCallback) {
      adCallback();
      setAdCallback(null);
    }
  };

  // --- NAVIGATION LOCK ---
  const handleTabChange = (type, value) => {
    triggerAd(20, () => {
      if (type === 'main') setMainTab(value);
      else setSubTab(value);
    });
  };

  // --- CORE DATA FETCHING ---
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

  // --- TASK HANDLERS ---
  const handleWatchAds = () => {
    triggerAd(30, async () => {
      const reward = user.is_vip ? 0.0008 : 0.0003;
      const newBalance = user.balance + reward;
      const { error } = await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
      if(!error) {
          setUser(prev => ({ ...prev, balance: newBalance }));
          alert(`Success! Earned ${reward} TON ✅`);
      }
      fetchAllData();
    });
  };

  const handleSpin = async () => {
    if (user.id !== ADMIN_ID && timeLeft > 0) return alert("Please wait for the 2-hour cooldown!");
    if (isSpinning) return;
    
    triggerAd(20, () => {
      setIsSpinning(true);
      const randomIndex = Math.floor(Math.random() * spinOptions.length);
      const segmentAngle = 360 / spinOptions.length;
      const extraSpins = 3600; 
      const currentRotationBase = spinRotation - (spinRotation % 360);
      const finalRotation = currentRotationBase + extraSpins + (360 - (randomIndex * segmentAngle));
      setSpinRotation(finalRotation);

      setTimeout(async () => {
        const winner = spinOptions[randomIndex];
        const newBalance = user.balance + winner.amt;
        const now = Date.now();
        const { error } = await supabase.from('users').update({ balance: newBalance, last_spin: now }).eq('id', user.id);
        if (!error) {
          setUser(prev => ({ ...prev, balance: newBalance, last_spin: now }));
          alert(`Wheel landed on ${winner.label}! Added ${winner.amt} TON ✅`);
        }
        setIsSpinning(false);
        fetchAllData();
      }, 4000);
    });
  };

  const handleRedeemPromo = () => {
    triggerAd(20, async () => {
      const { data: promo } = await supabase.from('promo_codes').select('*').eq('code', promoCodeInput).single();
      if (!promo) return alert("Invalid Reward Code!");
      if (promo.used_by?.includes(user.id)) return alert("Code already used!");
      const updatedUsedBy = [...(promo.used_by || []), user.id];
      const newBalance = user.balance + promo.value;
      await supabase.from('promo_codes').update({ used_by: updatedUsedBy }).eq('code', promoCodeInput);
      await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
      setUser(prev => ({ ...prev, balance: newBalance }));
      alert(`Reward ${promo.value} TON Claimed! ✅`);
      setPromoCodeInput('');
      fetchAllData();
    });
  };

  const handleStartTask = async (task) => {
    window.open(task.link);
    triggerAd(20, async () => {
      if (!user.completed_tasks?.includes(task.id)) {
          const updatedTasks = [...(user.completed_tasks || []), task.id];
          const newBalance = user.balance + 0.001; // Specific requirement: 0.001 TON
          await supabase.from('users').update({ balance: newBalance, completed_tasks: updatedTasks }).eq('id', user.id);
          setUser(prev => ({ ...prev, balance: newBalance, completed_tasks: updatedTasks }));
          alert("0.001 TON Added! ✅"); 
          fetchAllData();
      }
    });
  };

  const handleWithdraw = () => {
    triggerAd(20, async () => {
      const amt = Number(withdrawAmt);
      if (amt < 0.1) return alert("Minimum 0.1 TON");
      if (amt > user.balance) return alert("Insufficient Balance!");
      const currentDate = new Date().toISOString();
      await supabase.from('withdrawals').insert([{ user_id: user.id, amount: amt, address: withdrawAddr, status: 'Pending', created_at: currentDate }]);
      const newBalance = user.balance - amt;
      await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
      setUser(prev => ({ ...prev, balance: newBalance }));
      alert("Withdrawal Requested! ✅"); 
      fetchAllData();
    });
  };

  // --- ADMIN FUNCTIONS (No Ads for Admin Tools) ---
  const handleCheckUser = async () => {
    if (!targetId) return;
    const { data: userData } = await supabase.from('users').select('*').eq('id', targetId).single();
    const { data: withdrawData } = await supabase.from('withdrawals').select('*').eq('user_id', targetId).eq('status', 'Pending');
    if (userData) { 
        setSearchedUser(userData); 
        setEditBal(userData.balance); 
        setEditVip(userData.is_vip); 
        setUserWithdraws(withdrawData || []);
    } else alert("User Not Found!");
  };

  const handleUpdateUser = async () => {
    const updatedFields = { balance: Number(editBal), is_vip: editVip };
    const { error } = await supabase.from('users').update(updatedFields).eq('id', targetId);
    if (!error) {
        alert("User Data Updated! ✅");
        if (targetId === user.id) setUser(prev => ({ ...prev, ...updatedFields }));
        fetchAllData(); 
    }
  };

  const approveWithdraw = async (wId) => {
    await supabase.from('withdrawals').update({ status: 'Success' }).eq('id', wId);
    alert("Withdrawal marked as Success! ✅");
    handleCheckUser();
  };

  const styles = {
    container: { backgroundColor: '#facc15', minHeight: '100vh', padding: '15px', paddingBottom: '100px', fontFamily: 'sans-serif', position:'relative' },
    card: { background: '#fff', padding: '15px', borderRadius: '15px', border: '2px solid #000', marginBottom: '10px' },
    btn: { background: '#000', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
    input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #000', boxSizing: 'border-box' },
    bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', display: 'flex', justifyContent: 'space-around', padding: '10px', zIndex: 100 },
    navItem: (active) => ({ color: active ? '#facc15' : '#fff', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flex: 1, cursor: 'pointer' }),
    dot: (c) => ({ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c, marginRight: 8, border: '1px solid #000' }),
    copyBtn: { background: '#eee', border: '1px solid #000', fontSize: '10px', padding: '2px 6px', marginLeft: '5px', borderRadius: '5px', cursor: 'pointer' },
    wheelWrapper: { position: 'relative', width: 220, height: 220, margin: '20px auto' },
    wheelArrow: { position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '15px solid transparent', borderRight: '15px solid transparent', borderTop: '30px solid #000', zIndex: 10 },
    wheel: { width: '100%', height: '100%', borderRadius: '50%', border: '5px solid #000', background: `conic-gradient(${spinOptions.map((o, i) => `${o.color} ${i * (360/spinOptions.length)}deg ${(i+1) * (360/spinOptions.length)}deg`).join(', ')})`, transition: 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)', transform: `rotate(${spinRotation}deg)` },
    watchText: { textAlign: 'center', marginBottom: 10, fontWeight: 'bold', fontSize: 13 },
    adOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff', textAlign: 'center', padding: 20 },
    adTimerCircle: { width: 80, height: 80, borderRadius: '50%', border: '4px solid #facc15', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 30, fontWeight: 'bold', marginBottom: 20 }
  };

  if (loading) return <div style={{textAlign:'center', marginTop:50, fontWeight:'bold'}}>LOADING...</div>;

  return (
    <div style={styles.container}>
      
      {/* --- AD OVERLAY UI --- */}
      {showAdOverlay && (
        <div style={styles.adOverlay}>
          <h2 style={{color: '#facc15'}}>ADVERTISING LOADING</h2>
          <p>Please wait for the timer to finish</p>
          <div style={styles.adTimerCircle}>{adTimer}</div>
          <p style={{fontSize: 12, opacity: 0.7}}>DO NOT CLOSE THE ADS PAGE UNTIL FINISHED</p>
          <button 
            onClick={closeAdAndExecute} 
            style={{...styles.btn, background: adTimer > 0 ? '#444' : '#facc15', color: adTimer > 0 ? '#888' : '#000', width: '80%', marginTop: 20}}
            disabled={adTimer > 0}
          >
            {adTimer > 0 ? 'PLEASE WAIT...' : 'CLOSE & CONTINUE'}
          </button>
        </div>
      )}

      {/* Header / Balance */}
      <div style={{background:'#000', color:'#fff', padding:20, borderRadius:20, textAlign:'center', marginBottom:15, border: '2px solid #fff'}}>
         <small style={{opacity:0.7}}>MY TOTAL BALANCE</small>
         <h1 style={{margin:'5px 0', fontSize:32}}>{user.balance.toFixed(5)} TON</h1>
         {user.is_vip && <span style={{color:'#facc15', fontSize:12, fontWeight:'bold'}}>⭐ VIP MEMBER</span>}
      </div>

      <div style={styles.watchText}>
        <span style={{ color: !user.is_vip ? '#28a745' : '#888' }}>Standard: 0.0003</span> | 
        <span style={{ color: user.is_vip ? '#28a745' : '#888' }}> VIP: 0.0008</span>
      </div>

      <button onClick={handleWatchAds} style={{...styles.btn, width:'100%', background:'linear-gradient(to right, #ff416c, #ff4b2b)', marginBottom:15, height:50, fontSize:16, border:'2px solid #000'}}>
        📺 WATCH ADS & EARN (30s)
      </button>

      {/* Earn Sub-Tabs */}
      {mainTab === 'earn' && (
        <div style={{display:'flex', gap:5, marginBottom:15}}>
          {['bot', 'social', 'reward', 'admin'].map(tab => (
            (tab !== 'admin' || user.id === ADMIN_ID) && 
            <button key={tab} onClick={()=>handleTabChange('sub', tab)} style={{flex:1, padding:10, fontSize:10, borderRadius:10, background:subTab===tab?'#000':'#fff', color:subTab===tab?'#fff':'#000', border:'2px solid #000', fontWeight:'bold'}}>
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
                <div style={styles.wheelWrapper}>
                    <div style={styles.wheelArrow}></div>
                    <div style={styles.wheel}></div>
                </div>
                <button onClick={handleSpin} style={{...styles.btn, width:'100%', background: (user.id !== ADMIN_ID && timeLeft > 0) ? '#ccc' : '#00d2ff'}} disabled={isSpinning || (user.id !== ADMIN_ID && timeLeft > 0)}>
                  {isSpinning ? 'SPINNING...' : (user.id !== ADMIN_ID && timeLeft > 0) ? `WAIT ${Math.ceil(timeLeft/60000)} MIN` : 'SPIN NOW'}
                </button>
              </div>
              <div style={styles.card}>
                <h4>🎁 REDEEM CODE</h4>
                <input style={styles.input} placeholder="Enter Code" value={promoCodeInput} onChange={e=>setPromoCodeInput(e.target.value)} />
                <button onClick={handleRedeemPromo} style={{...styles.btn, width:'100%', background:'#ff9900'}}>CLAIM</button>
              </div>
            </div>
          ) : subTab === 'admin' ? (
            <div style={styles.card}>
              <h3>Admin Panel</h3>
              <input style={styles.input} placeholder="UID" value={targetId} onChange={e=>setTargetId(e.target.value)} />
              <button style={{...styles.btn, width:'100%', marginBottom:10}} onClick={handleCheckUser}>CHECK USER</button>
              {searchedUser && (
                <div style={{padding: 10, background:'#f0f9ff', borderRadius: 10, border: '1px solid #000'}}>
                  <p>ID: {searchedUser.id}</p>
                  <input style={styles.input} type="number" value={editBal} onChange={e=>setEditBal(e.target.value)} />
                  <select style={styles.input} value={editVip} onChange={e=>setEditVip(e.target.value === 'true')}>
                    <option value="false">Standard</option>
                    <option value="true">VIP ⭐</option>
                  </select>
                  <button style={{...styles.btn, width:'100%', background:'green'}} onClick={handleUpdateUser}>UPDATE</button>
                  {userWithdraws.map(w => (
                    <button key={w.id} onClick={() => approveWithdraw(w.id)} style={{...styles.btn, background:'blue', width:'100%', marginTop:5}}>Approve {w.amount} TON</button>
                  ))}
                </div>
              )}
              <hr/>
              <input style={styles.input} placeholder="Promo Code" value={adminPromoCode} onChange={e=>setAdminPromoCode(e.target.value)} />
              <input style={styles.input} placeholder="Value" type="number" value={adminPromoValue} onChange={e=>setAdminPromoValue(e.target.value)} />
              <button style={{...styles.btn, width:'100%', background:'#ff9900'}} onClick={async ()=>{
                await supabase.from('promo_codes').insert([{code:adminPromoCode, value:Number(adminPromoValue), used_by:[]}]);
                alert("Promo Created!");
              }}>CREATE PROMO</button>
              <hr/>
              <input style={styles.input} placeholder="Task Name" value={taskName} onChange={e=>setTaskName(e.target.value)} />
              <input style={styles.input} placeholder="Task Link" value={taskLink} onChange={e=>setTaskLink(e.target.value)} />
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
            <p>0.001 TON per referral</p>
            <code>https://t.me/EasyTONFree_Bot?start={user.id}</code>
            <button onClick={() => {navigator.clipboard.writeText(`https://t.me/EasyTONFree_Bot?start=${user.id}`); alert("Copied!");}} style={{...styles.btn, width:'100%', marginTop:10}}>COPY LINK</button>
            <h4 style={{textAlign:'left', marginTop: 20}}>Referrals: {invites.length}</h4>
            {invites.map((inv, i) => <div key={i} style={{fontSize:11, padding:5, borderBottom:'1px solid #eee'}}>ID: {inv.id}</div>)}
          </div>
        )}

        {mainTab === 'rank' && (
          <div style={styles.card}>
             <h3 style={{textAlign:'center'}}>🏆 TOP RANKINGS</h3>
             <table style={{width:'100%', fontSize:12}}>
               <thead><tr><th align="left">ID</th><th align="right">TON</th></tr></thead>
               <tbody>
                 {rankList.map((r, i) => <tr key={i}><td style={{padding:5}}>{i+1}. {r.id}</td><td align="right"><b>{r.balance.toFixed(4)}</b></td></tr>)}
               </tbody>
             </table>
          </div>
        )}

        {mainTab === 'withdraw' && (
          <div>
            <div style={{...styles.card, border: '2px solid gold'}}>
                <h4 style={{margin:0}}>💎 VIP UPGRADE (1 TON)</h4>
                <p style={{fontSize:10}}>UQDasFrJo7PrMaJcRFivcBVVnhWNQxYG-y32EN0ZeQPRSOp9</p>
                <p style={{fontSize:10}}>Memo: {user.id}</p>
            </div>
            <div style={styles.card}>
              <h4>Withdraw TON</h4>
              <input style={styles.input} placeholder="Address" value={withdrawAddr} onChange={e=>setWithdrawAddr(e.target.value)} />
              <input style={styles.input} placeholder="Amount (Min 0.1)" type="number" value={withdrawAmt} onChange={e=>setWithdrawAmt(e.target.value)} />
              <button onClick={handleWithdraw} style={{...styles.btn, width:'100%', background:'#0052ff'}}>WITHDRAW</button>
            </div>
            {withdraws.map((w,i) => (
              <div key={i} style={{...styles.card, fontSize:12}}>
                {w.amount} TON | {w.status} | {new Date(w.created_at).toLocaleDateString()}
              </div>
            ))}
          </div>
        )}

        {mainTab === 'profile' && (
          <div style={{...styles.card, textAlign:'center'}}>
            <h3>Profile</h3>
            <p>ID: {user.id}</p>
            <p>Balance: {user.balance.toFixed(5)} TON</p>
            <p>Status: {user.is_vip ? "VIP ⭐" : "Standard User"}</p>
            <button onClick={()=>window.open("https://t.me/EasyTonHelp_Bot")} style={{...styles.btn, width:'100%', background:'#0088cc'}}>SUPPORT</button>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={styles.bottomNav}>
        <div onClick={()=>handleTabChange('main', 'earn')} style={styles.navItem(mainTab==='earn')}>💰<br/>EARN</div>
        <div onClick={()=>handleTabChange('main', 'invite')} style={styles.navItem(mainTab==='invite')}>👥<br/>INVITE</div>
        <div onClick={()=>handleTabChange('main', 'rank')} style={styles.navItem(mainTab==='rank')}>🏆<br/>RANK</div>
        <div onClick={()=>handleTabChange('main', 'withdraw')} style={styles.navItem(mainTab==='withdraw')}>💳<br/>CASH</div>
        <div onClick={()=>handleTabChange('main', 'profile')} style={styles.navItem(mainTab==='profile')}>👤<br/>PROFILE</div>
      </div>
    </div>
  );
}

export default App;
