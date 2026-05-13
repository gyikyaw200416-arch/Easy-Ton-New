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
  const [spinResult, setSpinResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Admin States
  const [targetId, setTargetId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [checkSuccess, setCheckSuccess] = useState(false);
  const [editBal, setEditBal] = useState('');
  const [editVip, setEditVip] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [taskType, setTaskType] = useState('bot');
  const [adminPromoCode, setAdminPromoCode] = useState('');
  const [adminPromoValue, setAdminPromoValue] = useState('');

  // Spin Options Configuration
  const spinOptions = [
    { amt: 0.00009, color: '#0000FF', label: 'Blue' },
    { amt: 0.0001, color: '#FF0000', label: 'Red' },
    { amt: 0.0002, color: '#FFFF00', label: 'Yellow' },
    { amt: 0.0003, color: '#008000', label: 'Green' },
    { amt: 0.00004, color: '#000000', label: 'Black' },
    { amt: 0.00008, color: '#FFA500', label: 'Orange' },
    { amt: 0.00007, color: '#800080', label: 'Purple' },
    { amt: 0.0009, color: '#FFC0CB', label: 'Pink' },
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

    // Timer Logic
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

  // Handle Functions
  const handleWatchAds = async () => {
    const reward = user.is_vip ? 0.0008 : 0.0003;
    await supabase.from('users').update({ balance: user.balance + reward }).eq('id', user.id);
    alert(`Success! Earned ${reward} TON ✅`);
    fetchAllData();
  };

  const handleSpin = async () => {
    if (timeLeft > 0) return alert("Please wait for the next spin!");
    setIsSpinning(true);
    setTimeout(async () => {
      const winner = spinOptions[Math.floor(Math.random() * spinOptions.length)];
      await supabase.from('users').update({ balance: user.balance + winner.amt, last_spin: Date.now() }).eq('id', user.id);
      setSpinResult(winner);
      setIsSpinning(false);
      fetchAllData();
    }, 3000);
  };

  const handleRedeemPromo = async () => {
    const { data: promo } = await supabase.from('promo_codes').select('*').eq('code', promoCodeInput).single();
    if (!promo) return alert("Invalid Reward Code!");
    if (promo.used_by?.includes(user.id)) return alert("Code already used!");

    const updatedUsedBy = [...(promo.used_by || []), user.id];
    await supabase.from('promo_codes').update({ used_by: updatedUsedBy }).eq('code', promoCodeInput);
    await supabase.from('users').update({ balance: user.balance + 0.0005 }).eq('id', user.id);
    alert("Reward 0.0005 TON Claimed! ✅");
    setPromoCodeInput('');
    fetchAllData();
  };

  const handleCheckUser = async () => {
    if (!targetId) return;
    const { data } = await supabase.from('users').select('*').eq('id', targetId).single();
    if (data) { setSearchedUser(data); setEditBal(data.balance); setEditVip(data.is_vip); setCheckSuccess(true); }
    else alert("User Not Found!");
  };

  const handleUpdateUser = async () => {
    await supabase.from('users').update({ balance: Number(editBal), is_vip: editVip }).eq('id', targetId);
    alert("User Data Updated! ✅");
    handleCheckUser(); fetchAllData();
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

  const getRankReward = (index) => {
    const rewards = [30, 20, 10, 8, 6, 5, 5, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1, 1, 1, 0.9, 0.9, 0.9, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.4, 0.4, 0.4, 0.4, 0.3, 0.3, 0.3];
    return rewards[index] || 0.1;
  };

  const styles = {
    container: { backgroundColor: '#facc15', minHeight: '100vh', padding: '15px', paddingBottom: '100px', fontFamily: 'sans-serif' },
    card: { background: '#fff', padding: '15px', borderRadius: '15px', border: '2px solid #000', marginBottom: '10px' },
    btn: { background: '#000', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
    input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #000', boxSizing: 'border-box' },
    bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', display: 'flex', justifyContent: 'space-around', padding: '10px', zIndex: 100 },
    navItem: (active) => ({ color: active ? '#facc15' : '#fff', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flex: 1 }),
    dot: (c) => ({ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c, marginRight: 8, border: '1px solid #000' })
  };

  return (
    <div style={styles.container}>
      {/* Balance Header */}
      <div style={{background:'#000', color:'#fff', padding:20, borderRadius:20, textAlign:'center', marginBottom:15, border: '2px solid #fff'}}>
         <small style={{opacity:0.7}}>MY TOTAL BALANCE</small>
         <h1 style={{margin:'5px 0', fontSize:32}}>{user.balance.toFixed(5)} TON</h1>
         {user.is_vip && <span style={{color:'#facc15', fontSize:12, fontWeight:'bold'}}>⭐ VIP MEMBER</span>}
      </div>

      <div style={{textAlign:'center', marginBottom:8}}>
         <small style={{fontWeight:'bold'}}>Normal: 0.0003 | <span style={{color:'red'}}>VIP: 0.0008</span></small>
      </div>
      <button onClick={handleWatchAds} style={{...styles.btn, width:'100%', background:'linear-gradient(to right, #ff416c, #ff4b2b)', marginBottom:15, height:50, fontSize:16, border:'2px solid #000'}}>
        📺 WATCH ADS & EARN
      </button>

      {/* Main Tabs */}
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
                <p style={{fontSize:11}}>Spin every 2 hours! Only one code per claim.</p>
                
                <div style={{
                  width: 130, height: 130, borderRadius: '50%', border: '4px solid #000', margin: '15px auto',
                  background: isSpinning ? 'conic-gradient(red, yellow, green, blue, purple, white, pink, orange, black)' : (spinResult?.color || '#eee'),
                  transition: isSpinning ? 'transform 0.5s infinite linear' : 'none'
                }}></div>

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

              <div style={styles.card}>
                <h4 style={{marginTop:0}}>🎁 REDEEM CODE</h4>
                <input style={styles.input} placeholder="Enter Reward Code" value={promoCodeInput} onChange={e=>setPromoCodeInput(e.target.value)} />
                <button onClick={handleRedeemPromo} style={{...styles.btn, width:'100%', background:'#ff9900'}}>CLAIM 0.0005 TON</button>
              </div>
            </div>
          ) : subTab === 'admin' ? (
            <div style={styles.card}>
              <h3 style={{marginTop:0}}>Admin Panel</h3>
              <input style={styles.input} placeholder="Search User UID" value={targetId} onChange={e=>setTargetId(e.target.value)} />
              <button style={{...styles.btn, width:'100%'}} onClick={handleCheckUser}>CHECK USER</button>
              {checkSuccess && searchedUser && (
                <div style={{background:'#f0f9ff', padding:10, borderRadius:10, marginTop:10, border:'1px solid #000'}}>
                  <p><b>Bal:</b> {searchedUser.balance} | <b>VIP:</b> {searchedUser.is_vip ? 'Yes' : 'No'}</p>
                  <input style={styles.input} placeholder="New Balance" type="number" value={editBal} onChange={e=>setEditBal(e.target.value)} />
                  <select style={styles.input} value={editVip} onChange={e=>setEditVip(e.target.value==='true')}>
                    <option value="false">Standard</option><option value="true">VIP ⭐</option>
                  </select>
                  <button style={{...styles.btn, width:'100%', background:'green'}} onClick={handleUpdateUser}>UPDATE</button>
                </div>
              )}
              <hr/>
              <h4>Add Task</h4>
              <input style={styles.input} placeholder="Name" value={taskName} onChange={e=>setTaskName(e.target.value)} />
              <input style={styles.input} placeholder="Link" value={taskLink} onChange={e=>setTaskLink(e.target.value)} />
              <select style={styles.input} value={taskType} onChange={e=>setTaskType(e.target.value)}>
                <option value="bot">Bot</option><option value="social">Social</option>
              </select>
              <button style={{...styles.btn, width:'100%'}} onClick={async ()=>{await supabase.from('global_tasks').insert([{name:taskName, link:taskLink, type:taskType}]); alert("Added!"); fetchAllData();}}>ADD TASK</button>
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
                    <td align="right" style={{color:'blue', fontWeight:'bold'}}>{getRankReward(i)} TON</td>
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
                <p style={{fontSize:11}}>Address: UQDasFrJo7PrMaJcRFivcBVVnhWNQxYG-y32EN0ZeQPRSOp9</p>
                <p style={{fontSize:11}}>Memo: {user.id}</p>
            </div>
            <div style={styles.card}>
              <h4>Withdraw TON</h4>
              <input style={styles.input} placeholder="TON Address" value={withdrawAddr} onChange={e=>setWithdrawAddr(e.target.value)} />
              <input style={styles.input} placeholder="Amount (Min 0.1)" type="number" value={withdrawAmt} onChange={e=>setWithdrawAmt(e.target.value)} />
              <button onClick={handleWithdraw} style={{...styles.btn, width:'100%', background:'#0052ff'}}>WITHDRAW</button>
            </div>
            <h4 style={{marginLeft: 10}}>History</h4>
            {withdraws.map((w,i) => <div key={i} style={styles.card}>{w.amount} TON - {w.status}</div>)}
          </div>
        )}

        {mainTab === 'profile' && (
          <div style={{...styles.card, textAlign:'center'}}>
            <h3>Profile</h3>
            <div style={{textAlign:'left', marginBottom:20, background: '#f9f9f9', padding: 15, borderRadius: 10}}>
                <p><b>ID:</b> {user.id}</p>
                <p><b>Balance:</b> {user.balance.toFixed(5)} TON</p>
                <p><b>Status:</b> {user.is_vip ? "VIP ⭐" : "Standard"}</p>
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
