const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1slB2qFrDkSp_4AsW7NGiADQju3TisakEWG-s1lGwAoho9gkAoz9enWZbAIEMT9eZww/exec';
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function handleRoster(request,fetcher=fetch){
    if(request.method!=='POST')return reply({status:'error',message:'Use POST.'},405);
    // Only this site's JSON requests are accepted; credentials never enter a URL or cache.
    if(!request.headers.get('content-type')?.includes('application/json'))return reply({status:'error',message:'JSON required.'},415);
    const origin=request.headers.get('origin');
    if(origin&&origin!==new URL(request.url).origin)return reply({status:'error',message:'Origin not allowed.'},403);
    let data;try{const raw=await request.text();if(raw.length>180000)return reply({status:'error',message:'Roster too large.'},413);data=JSON.parse(raw);}catch{return reply({status:'error',message:'Invalid request.'},400);}
    if(!['ROSTER_GET','ROSTER_SAVE'].includes(data?.type)||typeof data.pin!=='string'||!data.pin.trim()||data.pin.length>100)return reply({status:'error',message:'Enter your Teacher PIN.'},400);
    const payload={type:data.type,pin:data.pin.trim()};
    if(data.type==='ROSTER_SAVE'){payload.students=data.students;payload.revision=data.revision;}
    const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),20000);
    try{
        const upstream=await fetcher(SCRIPT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),redirect:'follow',signal:abort.signal});
        const result=await upstream.json();
        if(!upstream.ok||!['success','unauthorized','conflict','error'].includes(result?.status))throw Error('Unexpected response');
        if(result.status==='success'&&(!Array.isArray(result.students)||typeof result.revision!=='string'||!Number.isSafeInteger(result.version)))throw Error('Update Apps Script');
        if(result.status==='error'&&result.message==='Unknown record type')return reply({status:'error',message:'Update your Apps Script code and deploy a New version of the existing web app, then Reload online.'});
        return reply(result);
    }catch{return reply({status:'error',message:'Could not confirm the roster request. Check your connection and the Apps Script deployment, then Reload online before retrying.'},502);}
    finally{clearTimeout(timer);}
}
export default request=>handleRoster(request);
