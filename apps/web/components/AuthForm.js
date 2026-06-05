'use client';
import { useState } from 'react';
import { api } from '../lib/api';
export default function AuthForm({ mode }) {
  const [form,setForm]=useState({name:'',email:'',password:''}); const [msg,setMsg]=useState('');
  async function submit(e){e.preventDefault();setMsg('');try{const data=await api(`/auth/${mode}`,{method:'POST',body:JSON.stringify(form)});localStorage.setItem('token',data.token);location.href=data.user.role==='admin'?'/admin':'/dashboard'}catch(err){setMsg(err.message)}}
  return <form className="form panel" onSubmit={submit}>{mode==='register'&&<input placeholder="Full name" required onChange={e=>setForm({...form,name:e.target.value})}/>}<input type="email" placeholder="Email" required onChange={e=>setForm({...form,email:e.target.value})}/><input type="password" placeholder="Password" required minLength="8" onChange={e=>setForm({...form,password:e.target.value})}/><button>{mode==='register'?'Create account':'Login'}</button>{mode==='login'&&<button className="secondary" type="button" onClick={()=>api('/auth/forgot-password',{method:'POST',body:JSON.stringify({email:form.email})}).then(()=>setMsg('Reset instructions sent if the account exists.'))}>Forgot password</button>}{msg&&<p className="muted">{msg}</p>}</form>
}
