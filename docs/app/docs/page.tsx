export default function DocsHomePage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
        <h1 style={{ margin: 0 }}>MergeLabs Docs</h1>
        <div style={{ marginTop: '10px' }}>
          <a href="/docs" style={{ marginRight: '20px', color: '#0070f3' }}>Introduction</a>
          <a href="/docs/api" style={{ marginRight: '20px', color: '#0070f3' }}>API Reference</a>
          <a href="/docs/examples" style={{ marginRight: '20px', color: '#0070f3' }}>Examples</a>
          <a href="/docs/contributing" style={{ color: '#0070f3' }}>Contributing</a>
        </div>
      </nav>
      
      <main>
        <h1>Introduction</h1>
        <p style={{ fontSize: '18px', color: '#666', lineHeight: '1.6' }}>
          Building on Stellar means solving the same problems over and over — wallet connection, event listening, payment forms, testing mocks. MergeLabs solves them once so you can focus on your product.
        </p>

        <h2>What is MergeLabs?</h2>
        <p>
          MergeLabs is a TypeScript-first monorepo providing production-ready packages for the Stellar and Soroban blockchain ecosystem.
        </p>

        <h2>Packages</h2>
        <ul>
          <li><strong>@astronlabs/notify</strong> - Real-time Soroban event streaming with XDR decoding</li>
          <li><strong>@astronlabs/mock</strong> - Mock RPC, contracts, and wallets for testing</li>
          <li><strong>@astronlabs/hooks</strong> - React hooks for Stellar integration</li>
          <li><strong>@astronlabs/forms</strong> - Headless form components</li>
        </ul>

        <h2>Quick Start</h2>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
          <code>npm install @astronlabs/hooks @astronlabs/forms</code>
        </pre>

        <h2>Features</h2>
        <ul>
          <li>Real transaction building (not mocks)</li>
          <li>Production-tested with exponential backoff</li>
          <li>Type-safe APIs with full TypeScript support</li>
          <li>Freighter wallet integration</li>
        </ul>
      </main>
    </div>
  );
}
