const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1slB2qFrDkSp_4AsW7NGiADQju3TisakEWG-s1lGwAoho9gkAoz9enWZbAIEMT9eZww/exec';
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function handleSession(request,fetcher=fetch){
 if(request.method!=='POST')return reply({status:'error',message:'Use POST.'},405);
 if(!request.headers.get('content-type')?.includes('application/json'))return reply({status:'error',message:'JSON required.'},415);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return reply({status:'error',message:'Origin not allowed.'},403);
 let data;try{const raw=await request.text();if(raw.length>900000)return reply({status:'error',message:'Record too large.'},413);data=JSON.parse(raw);}catch{return reply({status:'error',message:'Invalid JSON.'},400);}
 if(!['TEACHING_GET','TEACHING_SAVE','ISLAND_GET','FULL_SESSION','LEADERBOARD_FINAL','BATTLE_OUTCOME'].includes(data?.type)||typeof data.pin!=='string'||!data.pin.trim()||data.pin.length>100)return reply({status:'error',message:'Enter your Teacher PIN.'},400);
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),20000);
 try{
  if(data.type!=='ISLAND_GET'&&(data.islandProgress!==undefined||data.questionLog!==undefined)){
   const check=await fetcher(SCRIPT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'ISLAND_GET',className:data.className,pin:data.pin}),redirect:'follow',signal:abort.signal});
   const capability=await check.json();
   if(capability.status==='unauthorized')return reply(capability);
   if(!check.ok||capability.status!=='success'||!capability.islandProgress)return reply({status:'error',message:'Load islands first. Update Apps Script to v9.0.0 and deploy a New version of the existing web app if needed.'});
   const passport=Object.values(data.islandProgress||{}).some(levels=>Object.values(levels||{}).some(v=>v?.coinPercent!==undefined||v?.hardClear!==undefined));
   if(data.questionLog!==undefined&&capability.questionLogVersion!==1)return reply({status:'error',message:'Island Run answers are kept on this phone. Update Apps Script using GOOGLE-APPS-SCRIPT-v10.2.0.gs, deploy a New version of the existing web app, then save again.'});
   // v9.6.0: every student's contribution count needs the v9.6.0 script; an older script would keep only the top three.
   if(data.studentContributions?.everyone!==undefined&&capability.contributionsVersion!==1)return reply({status:'error',message:'Student contributions are kept on this phone. Update Apps Script using GOOGLE-APPS-SCRIPT-v10.2.0.gs, deploy a New version of the existing web app, then save again.'});
   // v9.7.0: navigator seals need the v9.7.0 script; an older one would silently drop them.
   if(Array.isArray(data.navigatorSeals)&&data.navigatorSeals.length&&capability.navigatorSealsVersion!==1)return reply({status:'error',message:'Navigator seals are kept on this phone. Update Apps Script using GOOGLE-APPS-SCRIPT-v10.2.0.gs, deploy a New version of the existing web app, then save again.'});
   if(passport&&capability.passportVersion!==1)return reply({status:'error',message:'Your passport is kept locally. Update Apps Script using GOOGLE-APPS-SCRIPT-v9.1.0.gs, then deploy a New version of the existing web app and retry this save.'});
  }
  const upstream=await fetcher(SCRIPT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),redirect:'follow',signal:abort.signal});
  const result=await upstream.json();
  if(!upstream.ok||!['success','unauthorized','conflict','error'].includes(result?.status))throw Error('Invalid response');
  if(result.status==='success'&&(data.type==='ISLAND_GET'||data.islandProgress!==undefined)&&(!result.islandProgress||typeof result.islandProgress!=='object'))return reply({status:'error',message:'Update Apps Script to v9.0.0 and deploy a New version of the existing web app.'});
  if(result.status==='success'&&data.type.startsWith('TEACHING_')&&(!result.content||!result.revision))return reply({status:'error',message:'Update Apps Script to v9.0.0.'});
  if(result.message==='Unknown record type')result.message='Update Apps Script to v9.0.0 and deploy a New version of the existing web app.';
  return reply(result);
 }catch{return reply({status:'error',message:'Could not confirm the save. Check your connection and retry; records with a session ID will not duplicate.',uncertain:true},502);}
 finally{clearTimeout(timer);}
}
export default request=>handleSession(request);
