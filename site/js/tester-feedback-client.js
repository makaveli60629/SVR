async function loadTesterFeedback(){const out=document.getElementById('out');try{const res=await fetch('/api/game/tester-feedback?limit=30');if(!res.ok) throw new Error('API not connected yet');out.textContent=JSON.stringify(await res.json(),null,2);}catch(err){out.textContent='Tester feedback backend not connected yet. Local game capture still works. '+err.message;}}
loadTesterFeedback();
