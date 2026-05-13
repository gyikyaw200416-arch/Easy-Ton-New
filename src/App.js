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

  // Spin & Reward States
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [rewardCode, setRewardCode] = useState('');

  // Admin States
  const [targetId, setTargetId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [editBal, setEditBal] = useState('');

  const spinOptions = [
    { amt: 0.00009, color: '#00bfff', label: 'Blue' },
    { amt: 0.0001, color: '#ff0000', label: 'Red' },
    { amt: 0.0002, color: '#ffff00', label: 'Yellow' },
    { amt: 0.0003, color: '#00ff00', label: 'Green' },
    { amt: 0.0004, color: '#000000', label: 'Black' },
    { amt: 0.00005, color: '#ffa500', label: 'Orange' },
    { amt: 0.00007, color: '#800080', label: 'Purple' }
  ];

  const fetchAllData = useCallback(async () => {
    let { data: uData } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (!uData) {
        const startParam = tg?.initDataUnsafe?.start_param;
        const { data: newUser } = await supabase.from('users').insert([{ id: user.id, balance: 0, invited_by: startParam, completed_tasks: [], last_spin: 0 }]).select().single();
        uData = newUser;
    }
    setUser(uData);
    
    // Timer Logic for Spin
    const now = Date.now();
    const waitTime = 2 * 60 * 60 * 1000; // 2 Hours
    const diff = waitTime - (now - (uData.last_spin || 0));
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
    const timer = setInterval(() => {
        setTimeLeft(prev => (prev > 1000 ? prev - 1000 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchAllData]);

  const handleWatchAds = async () => {
    const reward = user.is_vip ? 0.0008 : 0.0003;
    await supabase.from('users').update({ balance: user.balance + reward }).eq('id', user.id);
    alert(`Ads Reward Added: ${reward} TON ✅`);
    fetchAllData();
  };

  const handleSpin = async () => {
    if (timeLeft > 0) return alert("Please wait for the next spin!");
    setIsSpinning(true);
    
    setTimeout(async () => {
        const random = spinOptions[Math.floor(Math.random() * spinOptions.length)];
        const newBalance = user.balance + random.amt;
        const now = Date.now();
        
        await supabase.from('users').update({ balance: newBalance, last_spin: now }).eq('id', user.id);
        setSpinResult(random);
        setIsSpinning(false);
        fetchAllData();
    }, 3000);
  };

  const handleClaimReward = async () => {
    const { data: promo } = await supabase.from('promo_codes').select('*').eq('code', rewardCode).single();
    if (!promo) return alert("Invalid Reward Code!");
    if (promo.used_by?.includes(user.id)) return alert("You already used this code!");

    const updatedUsedBy = [...(promo.used_by || []), user.id];
    await supabase.from('promo_codes').update({ used_by: updatedUsedBy }).eq('code', rewardCode);
    await supabase.from('users').update({ balance: user.balance + 0.0005 }).eq('id', user.id);
    
    alert("Reward 0.0005 TON Claimed! ✅");
    setRewardCode('');
    fetchAllData();
  };

  const formatTime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const styles = {
    container: { backgroundColor: '#facc15', minHeight: '100vh', padding: '15px', paddingBottom: '100px', fontFamily: 'sans-serif' },
    card: { background: '#fff', padding: '15px', borderRadius: '15px', border: '2px solid #000', marginBottom: '10px' },
    btn: { background: '#000', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },
    input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #000', boxSizing: 'border-box' },
    bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', display: 'flex', justifyContent: 'space-around', padding: '10px', zIndex: 100 },
    navItem: (active) => ({ color: active ? '#facc15' : '#fff', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flex: 1 }),
    dot: (color) => ({ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: color, marginRight: '8px' })
  };

  if (loading) return <div style={{textAlign:'center', marginTop:50, fontWeight:'bold'}}>INITIALIZING...</div>;

  return (
    <div style={styles.container}>
      {/* Balance Header */}
      <div style={{background:'#000', color:'#fff', padding:20, borderRadius:20, textAlign:'center', marginBottom:15, border: '2px solid #fff'}}>
         <small style={{opacity:0.7}}>MY TON BALANCE</small>
         <h1 style={{margin:'5px 0', fontSize:32}}>{user.balance.toFixed(5)}</h1>
         {user.is_vip && <span style={{color:'#facc15', fontSize:12, fontWeight:'bold'}}>⭐ VIP MEMBER ACTIVATED</span>}
      </div>

      <div style={{textAlign:'center', marginBottom:10}}>
         <small style={{fontWeight:'bold'}}>Normal: 0.0003 | <span style={{color:'red'}}>VIP: 0.0008</span></small>
      </div>
      <button onClick={handleWatchAds} style={{...styles.btn, width:'100%', background:'linear-gradient(to right, #ff416c, #ff4b2b)', marginBottom:15, height:50, fontSize:16, border:'2px solid #000'}}>
        📺 WATCH ADS & EARN
      </button>

      {/* Tabs */}
      {mainTab === 'earn' && (
        <div style={{display:'flex', gap:5, marginBottom:15, overflowX: 'auto'}}>
          {['bot', 'reward', 'spin', 'admin'].map(tab => (
            (tab !== 'admin' || user.id === ADMIN_ID) && 
            <button key={tab} onClick={()=>setSubTab(tab)} style={{flex:1, padding:10, fontSize:11, borderRadius:10, background:subTab===tab?'#000':'#fff', color:subTab===tab?'#fff':'#000', border:'2px solid #000', fontWeight:'bold', whiteSpace: 'nowrap'}}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <div style={{minHeight:'45vh'}}>
        {mainTab === 'earn' && subTab === 'spin' && (
          <div style={{...styles.card, textAlign:'center'}}>
            <h3>🎡 Lucky Color Spin</h3>
            <p style={{fontSize:12, color: '#666'}}>Spin every 2 hours to win TON!</p>
            
            <div style={{margin: '20px 0', position: 'relative'}}>
                <div style={{
                    width: 150, height: 150, borderRadius: '50%', border: '5px solid #000', margin: 'auto',
                    background: `conic-gradient(${spinOptions.map((o,i)=> `${o.color} ${i*(360/7)}deg ${(i+1)*(360/7)}deg`).join(',')})`,
                    transition: isSpinning ? 'transform 3s cubic-bezier(0.1, 0, 0.1, 1)' : 'none',
                    transform: isSpinning ? 'rotate(1440deg)' : 'rotate(0deg)'
                }}></div>
            </div>

            {timeLeft > 0 ? (
                <button style={{...styles.btn, width:'100%', background: '#ccc', cursor: 'not-allowed'}} disabled>
                    ⏳ Next spin in: {formatTime(timeLeft)}
                </button>
            ) : (
                <button onClick={handleSpin} style={{...styles.btn, width:'100%', background: '#00d2ff'}} disabled={isSpinning}>
                    {isSpinning ? 'SPINNING...' : 'SPIN NOW'}
                </button>
            )}

            {spinResult && !isSpinning && (
                <div style={{marginTop: 15, padding: 10, background: '#f0f0f0', borderRadius: 10}}>
                    You won: <b style={{color: spinResult.color === '#000000' ? '#000' : spinResult.color}}>{spinResult.amt} TON</b>
                </div>
            )}

            <div style={{textAlign: 'left', marginTop: 20, fontSize: 12}}>
                {spinOptions.map((o,i)=>(
                    <div key={i} style={{marginBottom: 5}}>
                        <span style={styles.dot(o.color)}></span> {o.amt} TON ({o.label})
                    </div>
                ))}
            </div>
          </div>
        )}

        {mainTab === 'earn' && subTab === 'reward' && (
          <div style={styles.card}>
            <h3>🎁 Reward Codes</h3>
            <p style={{fontSize:12}}>Enter your special reward code to get 0.0005 TON instantly.</p>
            <input style={styles.input} placeholder="Enter Code Here" value={rewardCode} onChange={e=>setRewardCode(e.target.value)} />
            <button onClick={handleClaimReward} style={{...styles.btn, width:'100%', background: '#ff9900'}}>CLAIM 0.0005 TON</button>
            <div style={{marginTop: 15, fontSize: 11, color: '#ff0000'}}>
                * Each code can be used only once per user.
            </div>
          </div>
        )}

        {mainTab === 'earn' && subTab === 'bot' && (
          tasks.filter(t => t.type === 'bot' && !user.completed_tasks?.includes(t.id)).map(t => (
            <div key={t.id} style={styles.card}>
              <span style={{fontWeight:'bold'}}>{t.name} <small style={{color:'green'}}>(+0.001 TON)</small></span>
              <button onClick={()=>handleStartTask(t)} style={{...styles.btn, float:'right', padding:'8px 15px'}}>START</button>
            </div>
          ))
        )}

        {/* Invite, Rank, Cash, Profile maintain English */}
        {mainTab === 'invite' && (
           <div style={{...styles.card, textAlign:'center'}}>
             <h3>Invite Friends</h3>
             <p style={{color:'green', fontWeight:'bold'}}>Get 0.001 TON per referral</p>
             <div style={{background:'#eee', padding:10, borderRadius:10, wordBreak:'break-all', marginBottom:10}}>
                <code>https://t.me/EasyTONFree_Bot?start={user.id}</code>
             </div>
             <button onClick={() => {navigator.clipboard.writeText(`https://t.me/EasyTONFree_Bot?start=${user.id}`); alert("Link Copied!");}} style={{...styles.btn, width:'100%'}}>COPY LINK</button>
             <h4 style={{marginTop:20}}>History ({invites.length})</h4>
             {invites.map((inv, i) => <div key={i} style={{fontSize:12, padding:8, borderBottom:'1px solid #eee'}}>User ID: {inv.id} <b style={{float:'right', color:'green'}}>+0.001 ✅</b></div>)}
           </div>
        )}

        {mainTab === 'rank' && (
          <div style={styles.card}>
            <h3 style={{textAlign:'center', marginTop:0}}>🏆 GLOBAL RANKING</h3>
            <table style={{width:'100%', fontSize:12, borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:'2px solid #000'}}><th align="left">No</th><th align="left">User ID</th><th align="right">Prize</th></tr></thead>
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
           <div style={styles.card}>
             <h3>Withdraw Cash</h3>
             <input style={styles.input} placeholder="TON Address" value={withdrawAddr} onChange={e=>setWithdrawAddr(e.target.value)} />
             <input style={styles.input} placeholder="Amount (Min 0.1)" type="number" value={withdrawAmt} onChange={e=>setWithdrawAmt(e.target.value)} />
             <button onClick={handleWithdraw} style={{...styles.btn, width:'100%', background:'#0052ff'}}>SUBMIT</button>
             <h4 style={{marginTop: 20}}>Recent Withdrawals</h4>
             {withdraws.map((w,i) => <div key={i} style={{fontSize:11, borderBottom:'1px solid #eee', padding:'5px 0'}}>{w.amount} TON - {w.status}</div>)}
           </div>
        )}

        {mainTab === 'profile' && (
           <div style={{...styles.card, textAlign:'center'}}>
             <h3>User Settings</h3>
             <div style={{textAlign:'left', marginBottom:20}}>
                <p><b>ID:</b> {user.id}</p>
                <p><b>Balance:</b> {user.balance.toFixed(5)} TON</p>
                <p><b>Type:</b> {user.is_vip ? "VIP Member" : "Standard"}</p>
             </div>
             <button onClick={()=>window.open("https://t.me/EasyTonHelp_Bot")} style={{...styles.btn, width:'100%', background:'#0088cc'}}>LIVE SUPPORT</button>
           </div>
        )}
      </div>

      {/* Admin Panel (Special Check) */}
      {mainTab === 'earn' && subTab === 'admin' && user.id === ADMIN_ID && (
        <div style={styles.card}>
          <h4>Admin Dashboard</h4>
          <input style={styles.input} placeholder="Search User ID" value={targetId} onChange={e=>setTargetId(e.target.value)} />
          <button style={{...styles.btn, width:'100%', background: 'green'}} onClick={async () => {
             const { data } = await supabase.from('users').select('*').eq('id', targetId).single();
             if(data) { setSearchedUser(data); setEditBal(data.balance); alert("User Found! ✅"); }
             else alert("User not found!");
          }}>SEARCH USER</button>
          
          {searchedUser && (
            <div style={{marginTop: 15, padding: 10, background: '#f9f9f9', borderRadius: 10}}>
                <p>Balance: {searchedUser.balance} TON</p>
                <input style={styles.input} type="number" value={editBal} onChange={e=>setEditBal(e.target.value)} />
                <button style={{...styles.btn, width:'100%'}} onClick={async () => {
                    await supabase.from('users').update({ balance: Number(editBal) }).eq('id', targetId);
                    alert("Updated!"); fetchAllData();
                }}>UPDATE BALANCE</button>
            </div>
          )}
        </div>
      )}

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
