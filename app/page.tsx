'use client';
import {useState} from 'react';import {useRouter} from 'next/navigation';
export default function Login(){
 const [email,setEmail]=useState('admin@biblioteca.com'),[password,setPassword]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);const router=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError('');try{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok)throw Error(d.error||'Falha no login');router.push('/dashboard');router.refresh();}catch(e){setError(e instanceof Error?e.message:'Erro inesperado')}finally{setLoading(false)}}
 return <div className="login"><form onSubmit={submit} className="panel"><h1>📚 Biblioteca</h1><p className="muted">Entre para gerenciar o acervo</p>{error&&<div className="error">{error}</div>}<label>E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Senha<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn" style={{width:'100%'}} disabled={loading}>{loading?'Entrando...':'Entrar'}</button></form></div>;
}
