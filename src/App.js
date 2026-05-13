import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const tg = window.Telegram?.WebApp;
const supabase = createClient(
  "https://bysgzzqyubtgvdghldec.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c2d6enF5dWJ0Z3ZkZ2hsZGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzM4ODQsImV4cCI6MjA5MzUwOTg4NH0.-4JDl5X--fNYrRyuaOzyUXz0FaJpIxNSLLzcjGrlavQ"
);
const ADMIN_ID = "1793453606"; 

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
    const newBalance = user.balance + reward;
    await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
    setUser(prev => ({ ...prev, balance: newBalance }));
    alert(`Success! Earned ${reward} TON ✅`);
    fetchAllData();
  };

  const handleSpin = async () => {
    if (user.id !== ADMIN_ID && timeLeft > 0) return alert("Please wait for the 2-hour cooldown!");
    if (isSpinning) return;

    setIsSpinning(true);
    const randomIndex = Math.floor(Math.random() * spinOptions.length);
    const segmentAngle = 360 / spinOptions.length;
    
    // CALCULATING ROTATION:
    // 1. ExtraSpins: 10 full rotations for effect.
    // 2. (360 - (randomIndex * segmentAngle)): Centers the selected slice.
    // 3. -90: Adjusts because the CSS arrow is at 12 o'clock (0 degrees starts at 3 o'clock).
    const extraSpins = 3600; 
    const currentRotationBase = spinRotation - (spinRotation % 360);
    const finalRotation = currentRotationBase + extraSpins + (360 - (randomIndex * segmentAngle)) - 90;
    
    setSpinRotation(finalRotation);

    setTimeout(async () => {
      const winner = spinOptions[randomIndex];
      const newBalance = Number((user.balance + winner.amt).toFixed(7));
      const now = Date.now();
      
      const { error } = await supabase.from('users').update({ 
        balance: newBalance, 
        last_spin: now 
      }).eq('id', user.id);
      
      if (!error) {
        setUser(prev => ({ ...prev, balance: newBalance, last_spin: now }));
        alert(`Wheel landed on ${winner.label}! Added ${winner.amt} TON ✅`);
      } else {
        alert("Database Error!");
      }
      setIsSpinning(false);
      fetchAllData();
    }, 4000);
  };

  const handleRedeemPromo = async () => {
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
  };

  const handleCheckUser = async () => {
    if (!targetId) return;
    const { data: userData } = await supabase.from('users').select('*').eq('id', targetId).single();
    const { data: withdrawData } = await supabase.from('withdrawals').select('*').eq('user_id', targetId).eq('status', 'Pending');
    
    if (userData) { 
        setSearchedUser(userData); 
        setEditBal(userData.balance); 
        setEditVip(userData.is_vip); 
        setUserWithdraws(withdrawData || []);
    } else {
        alert("User Not Found!");
    }
  };

  const handleUpdateUser = async () => {
    const updatedFields = { 
        balance: Number(editBal), 
        is_vip: editVip 
    };
    const { error } = await supabase.from('users').update(updatedFields).eq('id', targetId);
    
    if (!error) {
        alert("User Data Updated! ✅");
        setSearchedUser(prev => ({ ...prev, ...updatedFields }));
        if (targetId === user.id) {
            setUser(prev => ({ ...prev, ...updatedFields }));
        }
        fetchAllData(); 
    } else {
        alert("Update Failed!");
    }
  };

  const approveWithdraw = async (wId) => {
    await supabase.from('withdrawals').update({ status: 'Success' }).eq('id', wId);
    alert("Withdrawal marked as Success! ✅");
    handleCheckUser();
  };

  const handleStartTask = async (task) => {
    window.open(task.link);
    if (!user.completed_tasks?.includes(task.id)) {
        const updatedTasks = [...(user.completed_tasks || []), task.id];
        const newBalance = user.balance + 0.001;
        await supabase.from('users').update({ balance: newBalance, completed_tasks: updatedTasks }).eq('id', user.id);
        setUser(prev => ({ ...prev, balance: newBalance, completed_tasks: updatedTasks }));
        alert("0.001 TON Added! ✅"); fetchAllData();
    }
  };

  const handleWithdraw = async () => {
    const amt = Number(withdrawAmt);
    if (amt < 0.1) return alert("Minimum 0.1 TON");
    if (amt > user.balance) return alert("Insufficient Balance!");
    
    const currentDate = new Date().toISOString();
    await supabase.from('withdrawals').insert([{ 
        user_id: user.id, 
        amount: amt, 
        address: withdrawAddr, 
        status: 'Pending',
        created_at: currentDate 
    }]);
    
    const newBalance = user.balance - amt;
    await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
    setUser(prev => ({ ...prev, balance: newBalance }));
    alert("Withdrawal Requested! ✅"); fetchAllData();
  };

  const styles = {
    container: { backgroundColor: '#facc15', minHeight: '100vh', padding: '15px', paddingBottom: '100px', fontFamily: 'sans-serif' },
    card: { background: '#fff', padding: '15px', borderRadius: '15px', border: '2px solid #000', marginBottom: '10px' },
    btn: { background: '#000', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
    input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #000', boxSizing: 'border-box' },
    bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', display: 'flex', justifyContent: 'space-around', padding: '10px', zIndex: 100 },
    navItem: (active) => ({ color: active ? '#facc15' : '#fff', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flex: 1, cursor: 'pointer' }),
    dot: (c) => ({ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c, marginRight: 8, border: '1px solid #000' }),
    copyBtn: { background: '#eee', border: '1px solid #000', fontSize: '10px', padding: '2px 6px', marginLeft: '5px', borderRadius: '5px', cursor: 'pointer' },
    wheelWrapper: { position: 'relative', width: 220, height: 220, margin: '20px auto' },
    wheelArrow: { 
        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', 
        width: 0, height: 0, borderLeft: '15px solid transparent', borderRight: '15px solid transparent', 
        borderTop: '30px solid #000', zIndex: 10 
    },
    wheel: {
        width: '100%', height: '100%', borderRadius: '50%', border: '5px solid #000',
        background: `conic-gradient(${spinOptions.map((o, i) => `${o.color} ${i * (360/spinOptions.length)}deg ${(i+1) * (360/spinOptions.length)}deg`).join(', ')})`,
        transition: 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)',
        transform: `rotate(${spinRotation}deg)`
    },
    watchText: { textAlign: 'center', marginBottom: 10, fontWeight: 'bold', fontSize: 13 }
  };

  if (loading) return <div style={{textAlign:'center', marginTop:50, fontWeight:'bold'}}>LOADING...</div>;

  return (
    <div style={styles.container}>
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

                <button onClick={handleSpin} style={{...styles.btn, width:'100%', background: (user.id !== ADMIN_ID && timeLeft > 0) ? '#ccc' : '#00d2ff'}} disabled={isSpinning || (user.id !== ADMIN_ID && timeLeft > 0)}>
                  {isSpinning ? 'SPINNING...' : (user.id !== ADMIN_ID && timeLeft > 0) ? `WAIT ${Math.ceil(timeLeft/60000)} MIN` : 'SPIN NOW'}
                </button>
                
                <div style={{textAlign:'left', marginTop:20, fontSize:11, display:'grid', gridTemplateColumns:'1fr 1fr'}}>
                  {spinOptions.map((o,i) => (
                    <div key={i} style={{marginBottom:4}}>
                      <span style={styles.dot(o.color)}></span> {o.amt}
                    </div>
                  ))}
                </div>
              </div>
              <div style={styles.card}>
                <h4 style={{marginTop:0}}>🎁 REDEEM CODE</h4>
                <input style={styles.input} placeholder="Enter Reward Code" value={promoCodeInput} onChange={e=>setPromoCodeInput(e.target.value)} />
                <button onClick={handleRedeemPromo} style={{...styles.btn, width:'100%', background:'#ff9900'}}>CLAIM REWARD</button>
              </div>
            </div>
          ) : subTab === 'admin' ? (
            <div style={styles.card}>
              <h3 style={{marginTop:0}}>Admin Panel</h3>
              <input style={styles.input} placeholder="Search User UID" value={targetId} onChange={e=>setTargetId(e.target.value)} />
              <button style={{...styles.btn, width:'100%', marginBottom:10}} onClick={handleCheckUser}>CHECK USER</button>
              
              {searchedUser && (
                <div style={{background:'#f0f9ff', padding:15, borderRadius:10, border:'1px solid #000', marginBottom:10}}>
                  <p><b>User Found:</b> {searchedUser.id}</p>
                  <p>Current Bal: {searchedUser.balance} | VIP: {searchedUser.is_vip ? 'Yes' : 'No'}</p>
                  <hr/>
                  <label style={{fontSize:12, fontWeight:'bold'}}>Edit Balance:</label>
                  <input style={styles.input} type="number" value={editBal} onChange={e=>setEditBal(e.target.value)} />
                  
                  <label style={{fontSize:12, fontWeight:'bold'}}>VIP Status:</label>
                  <select style={styles.input} value={editVip} onChange={e=>setEditVip(e.target.value === 'true')}>
                    <option value="false">Standard</option>
                    <option value="true">VIP ⭐</option>
                  </select>
                  
                  <button style={{...styles.btn, width:'100%', background:'green', marginBottom:15}} onClick={handleUpdateUser}>UPDATE DATA</button>
                  
                  {userWithdraws.length > 0 && (
                    <div style={{background:'#fff', padding:10, borderRadius:8, border:'1px solid #ddd'}}>
                        <h4 style={{margin:'0 0 10px 0'}}>Pending Withdrawals</h4>
                        {userWithdraws.map(w => (
                            <div key={w.id} style={{fontSize:11, marginBottom:10, paddingBottom:5, borderBottom:'1px solid #eee'}}>
                                {w.amount} TON to {w.address.slice(0,10)}...
                                <button onClick={() => approveWithdraw(w.id)} style={{float:'right', background:'blue', color:'#fff', border:'none', padding:'4px 8px', borderRadius:5}}>Success</button>
                            </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
              <hr/>
              <h4>Create Reward Code</h4>
              <input style={styles.input} placeholder="Code Name" value={adminPromoCode} onChange={e=>setAdminPromoCode(e.target.value)} />
              <input style={styles.input} placeholder="TON Value" type="number" value={adminPromoValue} onChange={e=>setAdminPromoValue(e.target.value)} />
              <button style={{...styles.btn, width:'100%', background:'#ff9900', marginBottom:15}} onClick={async ()=>{
                await supabase.from('promo_codes').insert([{code:adminPromoCode, value:Number(adminPromoValue), used_by:[]}]);
                alert("Promo Code Created!");
              }}>CREATE PROMO</button>
              <hr/>
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
            {invites.map((inv, i) => <div key={i} style={{fontSize:11, padding:5, borderBottom:'1px solid #eee'}}>User ID: {inv.id} <b style={{float:'right', color:'green'}}>+0.001 ✅</b></div>)}
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
            <div style={{...styles.card, border: '2px solid gold', background: '#fffcf0'}}>
                <h4 style={{margin:0, color: '#b8860b'}}>💎 UPGRADE VIP (1 TON)</h4>
                <p style={{fontSize:11}}>Address: UQDasFrJo7PrMaJcRFivcBVVnhWNQxYG-y32EN0ZeQPRSOp9 
                  <span style={styles.copyBtn} onClick={()=> {navigator.clipboard.writeText('UQDasFrJo7PrMaJcRFivcBVVnhWNQxYG-y32EN0ZeQPRSOp9'); alert("Copied!");}}>COPY</span>
                </p>
                <p style={{fontSize:11}}>Memo: {user.id} 
                  <span style={styles.copyBtn} onClick={()=> {navigator.clipboard.writeText(user.id); alert("Copied!");}}>COPY</span>
                </p>
            </div>
            <div style={styles.card}>
              <h4>Withdraw TON</h4>
              <input style={styles.input} placeholder="TON Address" value={withdrawAddr} onChange={e=>setWithdrawAddr(e.target.value)} />
              <input style={styles.input} placeholder="Amount (Min 0.1)" type="number" value={withdrawAmt} onChange={e=>setWithdrawAmt(e.target.value)} />
              <button onClick={handleWithdraw} style={{...styles.btn, width:'100%', background:'#0052ff'}}>WITHDRAW</button>
            </div>
            <h4 style={{marginLeft: 10}}>History</h4>
            {withdraws.map((w,i) => (
              <div key={i} style={{...styles.card, fontSize:13}}>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <span>{w.amount} TON</span>
                  <span style={{color: w.status === 'Success' ? 'green' : 'orange', fontWeight:'bold'}}>{w.status}</span>
                </div>
                <small style={{color:'#888'}}>{new Date(w.created_at).toLocaleString()}</small>
              </div>
            ))}
          </div>
        )}

        {mainTab === 'profile' && (
          <div style={{...styles.card, textAlign:'center'}}>
            <h3>Profile</h3>
            <div style={{textAlign:'left', marginBottom:20, background: '#f9f9f9', padding: 15, borderRadius: 10}}>
                <p><b>ID:</b> {user.id}</p>
                <p><b>Balance:</b> {user.balance.toFixed(5)} TON</p>
                <p><b>Status:</b> {user.is_vip ? <span style={{color: '#28a745', fontWeight: 'bold'}}>VIP ⭐</span> : "Standard User"}</p>
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
