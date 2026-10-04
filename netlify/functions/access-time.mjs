// Time is evaluated on the server; the browser's clock and timezone are ignored.
export function codesAt(epoch) {
  const trt=new Date(epoch+3*60*60*1000);
  const hhmm=String(trt.getUTCHours()).padStart(2,'0')+String(trt.getUTCMinutes()).padStart(2,'0');
  const shift=n=>[...hhmm].map(d=>(Number(d)+n+10)%10).join('');
  return {normal:shift(1),master:shift(-1)};
}
export async function handleAt(request,serverNow=Date.now()) {
  const headers={'Content-Type':'application/json','Cache-Control':'no-store, max-age=0','Netlify-CDN-Cache-Control':'no-store'};
  const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(request.method==='GET')return json({serverNow});
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  let code;try{code=(await request.json()).code;}catch{}
  const codes=codesAt(serverNow);
  const kind=typeof code==='string'&&/^\d{4}$/.test(code)?code===codes.master?'master':code===codes.normal?'normal':'invalid':'invalid';
  return json({serverNow,kind});
}
export default request=>handleAt(request);
