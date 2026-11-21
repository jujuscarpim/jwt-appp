'use client';
import Link from 'next/link';import {usePathname,useRouter} from 'next/navigation';import {useEffect,useState} from 'react';
const nav=[['/dashboard','Painel'],['/dashboard/categorias','Categorias'],['/dashboard/autores','Autores'],['/dashboard/livros','Livros'],['/dashboard/leitores','Leitores'],['/dashboard/emprestimos','Empréstimos'],['/dashboard/atendentes','Atendentes']];
export default function Shell({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<any>(null),[ready,setReady]=useState(false);const router=useRouter(),path=usePathname();
 useEffect(()=>{fetch('/api/auth/me').then(async r=>{if(!r.ok){router.replace('/');return;}const u=await r.json();setUser(u);setReady(true)}).catch(()=>router.replace('/'))},[router]);
 async function logout(){await fetch('/api/auth/logout',{method:'POST'});router.replace('/');router.refresh()}
 if(!ready)return <p className="wrap">Validando sessão...</p>;
 return <><aside className="sidebar"><div className="logo">📚 Biblioteca</div><nav>{nav.filter(([url])=>user?.isAdmin||!['/dashboard/atendentes'].includes(url)).map(([url,title])=><Link className={url===path?'active':''} key={url} href={url}>{title}</Link>)}</nav></aside><div className="main"><div className="wrap"><div className="top"><div><strong>{user?.name}</strong> <small>({user?.isAdmin?'Administrador':'Atendente'})</small></div><button className="btn secondary" onClick={logout}>Sair</button></div>{children}</div></div></>;
}
