export const metadata = {
  title: 'Offre d\'emploi',
  description: 'Consultez et postulez à cette offre d\'emploi.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Offre d\'emploi',
  },
};

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
