import { NextResponse } from 'next/server';
export const apiUrl=process.env.API_URL||'http://localhost:3001/v1';
const secure=process.env.NODE_ENV==='production';
export function setTokens(response:NextResponse,data:{accessToken:string;refreshToken:string}){
 response.cookies.set('accessToken',data.accessToken,{httpOnly:true,sameSite:'lax',secure,path:'/',maxAge:15*60});
 response.cookies.set('refreshToken',data.refreshToken,{httpOnly:true,sameSite:'lax',secure,path:'/',maxAge:7*24*3600});
}
export function clearTokens(response:NextResponse){
 response.cookies.set('accessToken','',{httpOnly:true,path:'/',maxAge:0});
 response.cookies.set('refreshToken','',{httpOnly:true,path:'/',maxAge:0});
}
export async function jsonSafe(r:Response){const txt=await r.text();try{return txt?JSON.parse(txt):{}}catch{return {error:'Resposta inválida da API'}}}
