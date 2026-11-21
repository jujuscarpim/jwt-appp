import {NextRequest,NextResponse} from 'next/server';
import {apiUrl,jsonSafe,setTokens,clearTokens} from '@/lib/session';
export const runtime='nodejs';
// Evita múltiplos refresh simultâneos dentro do mesmo processo de desenvolvimento.
const inflight=new Map<string,Promise<any>>();
async function getRotated(refreshToken:string){
 let promise=inflight.get(refreshToken);
 if(!promise){
  promise=(async()=>{const r=await fetch(`${apiUrl}/auth/refresh`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken}),cache:'no-store'});return {status:r.status,data:await jsonSafe(r)}})();
  inflight.set(refreshToken,promise);
  promise.finally(()=>setTimeout(()=>inflight.delete(refreshToken),2000)).catch(()=>{});
 }
 return promise;
}
async function handler(request:NextRequest,context:{params:Promise<{path:string[]}>}){
 const {path}=await context.params;
 const endpoint=path.join('/');
 const method=request.method;
 if(!/^(auth\/(login|logout|me)|user(?:\/.*)?|categories(?:\/.*)?|authors(?:\/.*)?|books(?:\/.*)?|readers(?:\/.*)?|loans(?:\/.*)?|reports\/dashboard)$/.test(endpoint))return NextResponse.json({error:'Rota inválida.'},{status:404});
 const cookie=request.cookies;
 let accessToken=cookie.get('accessToken')?.value;
 let refreshToken=cookie.get('refreshToken')?.value;
 const body=method!=='GET'&&method!=='HEAD'?await request.text():undefined;
 const destination=`${apiUrl}/${endpoint}${request.nextUrl.search}`;
 const forward=(token?:string)=>fetch(destination,{method,cache:'no-store',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body!==undefined?{body}: {})});
 try{
  if(endpoint==='auth/login'){
   const r=await forward();const data=await jsonSafe(r);
   const response=NextResponse.json(r.ok?data.user||{}:data,{status:r.status});
   if(r.ok&&data.accessToken&&data.refreshToken)setTokens(response,data);
   return response;
  }
  if(endpoint==='auth/logout'){
   if(accessToken)await fetch(`${apiUrl}/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({refreshToken})}).catch(()=>{});
   const response=NextResponse.json({message:'Sessão encerrada.'});clearTokens(response);return response;
  }
  if(!accessToken&&!refreshToken)return NextResponse.json({error:'Faça login novamente.'},{status:401});
  let r=await forward(accessToken);
  let rotated:any;
  if(r.status===401&&refreshToken){
   rotated=await getRotated(refreshToken);
   if(rotated.status===200&&rotated.data?.accessToken){
    accessToken=rotated.data.accessToken;
    r=await forward(accessToken);
   }else{
    const response=NextResponse.json({error:'Sessão expirada. Faça login novamente.'},{status:401});clearTokens(response);return response;
   }
  }
  const data=await jsonSafe(r);const response=NextResponse.json(data,{status:r.status===204?200:r.status});
  if(rotated?.data?.refreshToken)setTokens(response,rotated.data);
  return response;
 }catch(e){console.error('Proxy:',e);return NextResponse.json({error:'API indisponível. Verifique a porta 3001.'},{status:502});}
}
export {handler as GET,handler as POST,handler as PUT,handler as PATCH,handler as DELETE};
