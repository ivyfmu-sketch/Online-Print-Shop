import './globals.css';
import Link from 'next/link';
export const metadata = { title: 'Online Print Shop', description: 'Secure print ordering with UPI payments and automatic printing' };
export default function RootLayout({ children }) { return <html lang="en"><body><nav className="nav"><Link className="brand" href="/">PrintShop Pro</Link><div className="navlinks"><Link href="/upload">Upload</Link><Link href="/dashboard">User Dashboard</Link><Link href="/admin">Admin</Link><Link href="/login">Login</Link></div></nav>{children}</body></html>; }
