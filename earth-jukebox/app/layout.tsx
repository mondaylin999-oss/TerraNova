import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Terra Nova | A new way to hear earth',description:'Listen to Myanmar climate with real NASA data. An accessible Earth science sonification experience.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
