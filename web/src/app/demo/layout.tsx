export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{
        background: '#2c3e50',
        color: '#fff',
        textAlign: 'center' as const,
        padding: '8px 16px',
        fontSize: '0.8125rem',
        fontWeight: 500,
        letterSpacing: '0.5px',
      }}>
        DEMO MODE — Sample data only
      </div>
      {children}
    </>
  );
}
