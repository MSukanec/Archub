import { ReactNode } from 'react';

interface ArchubLayoutProps {
  children: ReactNode;
}

export default function ArchubLayout({ children }: ArchubLayoutProps) {
  return (
    <div className="min-h-screen bg-red-600">
      {children}
    </div>
  );
}