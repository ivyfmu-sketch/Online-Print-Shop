'use client';
import { useEffect,useState } from 'react';
import { api } from '../../lib/api';
export default function Dashboard(){const[orders,setOrders]=useState([]);useEffect(()=>{api('/orders').then(d=>setOrders(d.orders)).catch(()=>location.href='/login')},[]);return <main className="container"><h1>User dashboard</h1><table className="table panel"><thead><tr><th>Order</th><th>File</th><th>Amount</th><th>Payment</th><th>Print</th><th>Status</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td>{o.id.slice(0,8)}</td><td>{o.original_name}</td><td>₹{o.amount}</td><td><span className={`badge ${o.payment_status==='success'?'ok':''}`}>{o.payment_status}</span></td><td>{o.print_status}</td><td>{o.status}</td></tr>)}</tbody></table></main>}
