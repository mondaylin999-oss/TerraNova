import type { Metadata } from 'next';
import './globals.css';
import './mobile.css';
export const metadata:Metadata={title:'TerraNova | Earth, in Perspective',description:'A real-time Earth monitoring platform powered by NASA satellite data.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
