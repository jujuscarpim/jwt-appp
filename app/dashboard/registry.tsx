'use client';
import {useEffect,useState,useCallback} from 'react';

type Row=Record<string,any>;
type Field={key:string;label:string;type?:string;required?:boolean;options?:string};
const schemas:Record<string,{title:string;endpoint:string;fields:Field[];readonly?:boolean}>={
 categorias:{title:'Categorias',endpoint:'categories',fields:[{key:'name',label:'Nome',required:true},{key:'description',label:'Descrição'}]},
 autores:{title:'Autores',endpoint:'authors',fields:[{key:'name',label:'Nome',required:true},{key:'nationality',label:'Nacionalidade'},{key:'birthDate',label:'Nascimento',type:'date'}]},
 livros:{title:'Livros',endpoint:'books',fields:[{key:'title',label:'Título',required:true},{key:'isbn',label:'ISBN',required:true},{key:'year',label:'Ano',type:'number',required:true},{key:'totalCopies',label:'Exemplares',type:'number',required:true},{key:'categoryId',label:'Categoria',options:'categories',required:true},{key:'authorIds',label:'Autores',options:'authors',required:true}]},
 leitores:{title:'Leitores',endpoint:'readers',fields:[{key:'name',label:'Nome',required:true},{key:'cpf',label:'CPF',required:true},{key:'email',label:'E-mail',type:'email'},{key:'phone',label:'Telefone'}]},
 atendentes:{title:'Atendentes',endpoint:'user',fields:[{key:'name',label:'Nome',required:true},{key:'username',label:'Usuário',required:true},{key:'email',label:'E-mail',type:'email',required:true},{key:'password',label:'Senha (mínimo 6 caracteres)',type:'password'},{key:'isAdmin',label:'Administrador',type:'checkbox'}]}
};
async function request(path:string,method='GET',data?:any){
 const r=await fetch('/api/'+path,{method,headers:{'Content-Type':'application/json'},cache:'no-store',...(data!==undefined?{body:JSON.stringify(data)}:{})});
 const txt=await r.text();let json:any={};try{json=txt?JSON.parse(txt):{}}catch{throw Error('Resposta inválida da API')}
 if(!r.ok)throw Error(json.error||`HTTP ${r.status}`);return json;
}
const dateText=(date?:string)=>date?date.split('-').reverse().join('/'):'—';
export default function Registry({section}:{section:string}){
 const schema=schemas[section];const loans=section==='emprestimos';
 const endpoint=loans?'loans':schema?.endpoint;
 const [rows,setRows]=useState<Row[]>([]),[categories,setCategories]=useState<Row[]>([]),[authors,setAuthors]=useState<Row[]>([]),[readers,setReaders]=useState<Row[]>([]),[books,setBooks]=useState<Row[]>([]);
 const [form,setForm]=useState<Row>({}),[editId,setEditId]=useState<number|null>(null),[filter,setFilter]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const refresh=useCallback(async()=>{
  if(!endpoint)return;
  setLoading(true);try{
   const extra=loans?`?status=${encodeURIComponent(status)}`:'';
   const data=await request(endpoint+extra);
   if(!Array.isArray(data))throw Error('Resposta da listagem inválida.');
   setRows(data);
  }catch(e){setError((e as Error).message)}finally{setLoading(false)}
 },[endpoint,loans,status]);
 useEffect(()=>{refresh()},[refresh]);
 useEffect(()=>{if(!schema&&!loans)return;
  const needed=['categories','authors','books','readers'];
  Promise.all(needed.map(p=>request(p).catch(()=>[]))).then(([c,a,b,r])=>{setCategories(c);setAuthors(a);setBooks(b);setReaders(r)});
 },[section]);
 if(!schema&&!loans)return <div className="error">Página não encontrada.</div>;
 const fields=schema?.fields||[];
 function clear(){setForm({});setEditId(null)}
 function edit(row:Row){setEditId(row.id);const data={...row};if(section==='livros')data.authorIds=row.Authors?.map((a:Row)=>a.id)||[];if(section==='atendentes')data.password='';setForm(data);window.scrollTo({top:0,behavior:'smooth'});}
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setNotice('');setError('');try{
  let data={...form};
  if(loans){data={bookId:Number(form.bookId),readerId:Number(form.readerId)};}
  if(section==='livros'){
   data={...data,year:Number(data.year),totalCopies:Number(data.totalCopies),categoryId:Number(data.categoryId),authorIds:data.authorIds||[]};
  }
  if(section==='atendentes'&&editId&&!data.password)delete data.password;
  if(loans)await request('loans','POST',data);
  else if(editId)await request(endpoint+'/'+editId,'PUT',data);
  else await request(endpoint,'POST',data);
  clear();setNotice('Salvo com sucesso.');await refresh();
  if(['livros','autores','categorias','leitores'].includes(section)){
   const [c,a,b,r]=await Promise.all(['categories','authors','books','readers'].map(p=>request(p).catch(()=>[])));
   setCategories(c);setAuthors(a);setBooks(b);setReaders(r);
  }
 }catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 async function remove(row:Row){if(!confirm('Excluir este registro?'))return;try{setError('');await request(endpoint+'/'+row.id,'DELETE');setNotice('Registro excluído.');await refresh()}catch(e){setError((e as Error).message)}}
 async function giveBack(row:Row){if(!confirm('Registrar devolução do livro?'))return;try{setError('');const result=await request('loans/'+row.id+'/return','PATCH',{});setNotice(`Devolvido. Multa: R$ ${Number(result.fine||0).toFixed(2)}`);await refresh()}catch(e){setError((e as Error).message)}}
 async function toggleActive(row:Row){try{await request('user/'+row.id+'/active','PATCH',{active:!row.active});await refresh()}catch(e){setError((e as Error).message)}}
 function input(field:Field){
  const val=form[field.key]??(field.key==='authorIds'?[]:field.type==='checkbox'?false:'');
  const update=(v:any)=>setForm(prev=>({...prev,[field.key]:v}));
  if(field.key==='authorIds')return <div className="field" key={field.key}><label>{field.label}</label><div className="checkrow">{authors.map(a=><label key={a.id}><input type="checkbox" checked={(val as number[]).map(Number).includes(a.id)} onChange={e=>update(e.target.checked?[...(val as number[]),a.id]:(val as number[]).filter(x=>Number(x)!==a.id))}/>{a.name}</label>)}</div>{authors.length===0&&<small>Cadastre autores antes de criar livros.</small>}</div>;
  if(field.options){const options=field.options==='categories'?categories:authors;return <div className="field" key={field.key}><label>{field.label}</label><select value={val} required={field.required} onChange={e=>update(e.target.value)}><option value="">Selecione...</option>{options.map(option=><option value={option.id} key={option.id}>{option.name}</option>)}</select>{options.length===0&&<small>Cadastre opções primeiro.</small>}</div>}
  if(field.type==='checkbox')return <div className="field" key={field.key}><label><input style={{width:'auto'}} type="checkbox" checked={Boolean(val)} onChange={e=>update(e.target.checked)}/> {field.label}</label></div>;
  return <div className="field" key={field.key}><label>{field.label}</label><input type={field.type||'text'} min={field.type==='number'?0:undefined} required={field.required&&!(field.key==='password'&&editId!==null)} value={val} onChange={e=>update(e.target.value)}/></div>
 }
 const name=(r:Row)=>r.name||r.title||r.Reader?.name||`#${r.id}`;
 const filtered=rows.filter(row=>JSON.stringify(row).toLowerCase().includes(filter.toLowerCase()));
 return <><h1>{loans?'Empréstimos e devoluções':schema.title}</h1><p className="muted">Gerencie os registros diretamente no banco de dados.</p>
 {error&&<div className="error" role="alert">{error}</div>}{notice&&<div className="success" role="status">{notice}</div>}
 <section className="panel"><h2>{loans?'Novo empréstimo':editId?'Editar registro':'Novo cadastro'}</h2><form onSubmit={save}>
 {loans?<div className="formgrid"><div><label>Leitor</label><select required value={form.readerId||''} onChange={e=>setForm(p=>({...p,readerId:e.target.value}))}><option value="">Selecione...</option>{readers.map(r=><option key={r.id} value={r.id}>{r.name} — {r.cpf}</option>)}</select></div><div><label>Livro disponível</label><select required value={form.bookId||''} onChange={e=>setForm(p=>({...p,bookId:e.target.value}))}><option value="">Selecione...</option>{books.filter(b=>b.availableCopies>0).map(b=><option key={b.id} value={b.id}>{b.title} ({b.availableCopies} disponíveis)</option>)}</select></div></div>:
 <div className="formgrid">{fields.map(input)}</div>}
 <div className="actions"><button className="btn" disabled={busy}>{busy?'Salvando...':loans?'Registrar empréstimo':editId?'Salvar alterações':'Cadastrar'}</button>{editId&&<button type="button" className="btn secondary" onClick={clear}>Cancelar</button>}</div>
 </form></section>
 <section className="panel"><div className="top"><h2>Registros ({filtered.length})</h2><button className="btn secondary" onClick={refresh}>Atualizar</button></div>
 {loans?<div className="formgrid"><div><label>Filtrar por status</label><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todos</option><option value="ATIVO">Ativo</option><option value="ATRASADO">Atrasado</option><option value="DEVOLVIDO">Devolvido</option></select></div></div>:<div style={{marginBottom:15}}><input placeholder="Pesquisar registros..." value={filter} onChange={e=>setFilter(e.target.value)}/></div>}
 {loading?<p>Carregando...</p>:filtered.length===0?<p className="muted">Nenhum registro encontrado.</p>:<div className="tablewrap"><table><thead><tr>{loans?<><th>Livro</th><th>Leitor</th><th>Empréstimo</th><th>Prazo</th><th>Status</th><th>Multa</th></>:<><th>Registro</th><th>Detalhes</th><th>Informações</th></>}<th>Ações</th></tr></thead><tbody>{filtered.map(row=><tr key={row.id}>
 {loans?<><td>{row.Book?.title}</td><td>{row.Reader?.name}</td><td>{dateText(row.loanDate)}</td><td>{dateText(row.dueDate)}</td><td>{row.status}</td><td>R$ {Number(row.fine||0).toFixed(2)}</td></>:
 <><td><strong>{name(row)}</strong>{section==='atendentes'&&<p className="muted">{row.isAdmin?'Administrador':'Atendente'}</p>}</td><td>{section==='livros'?<>{row.isbn}<p className="muted">{row.Category?.name} · {row.Authors?.map((a:Row)=>a.name).join(', ')}</p></>:section==='autores'?`${row.nationality||'—'} · ${dateText(row.birthDate)}`:section==='categorias'?row.description:section==='leitores'?`${row.cpf} · ${row.email||''}`:`${row.email||''} · ${row.username||''}`}</td><td>{section==='livros'?`${row.availableCopies}/${row.totalCopies} disponíveis`:section==='atendentes'?(row.active?'Ativo':'Desativado'):''}</td></>}
 <td><div className="actions">{loans?(!row.returnDate&&<button className="btn" onClick={()=>giveBack(row)}>Devolver</button>):<><button className="btn secondary" onClick={()=>edit(row)}>Editar</button>{section==='atendentes'?<button className="btn secondary" onClick={()=>toggleActive(row)}>{row.active?'Desativar':'Ativar'}</button>:section!=='leitores'&&<button className="btn red" onClick={()=>remove(row)}>Excluir</button>}</>}</div></td>
 </tr>)}</tbody></table></div>}
 </section></>;
}
