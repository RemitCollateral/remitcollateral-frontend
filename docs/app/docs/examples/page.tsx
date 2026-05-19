export default function ExamplesPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
        <h1 style={{ margin: 0 }}>MergeLabs Docs</h1>
      </nav>
      
      <main>
        <h1>Examples</h1>
        
        <h2>Wallet Connection</h2>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
{`import { StellarProvider, useFreighter } from '@astronlabs/hooks';

function App() {
  return (
    <StellarProvider config={{
      network: 'testnet',
      rpcUrl: 'https://soroban-testnet.stellar.org',
    }}>
      <Wallet />
    </StellarProvider>
  );
}

function Wallet() {
  const { connect, publicKey, connected } = useFreighter();
  
  return connected ? (
    <p>Connected: {publicKey}</p>
  ) : (
    <button onClick={connect}>Connect Freighter</button>
  );
}`}
        </pre>

        <h2>Sending Payments</h2>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
{`import { useSendPayment } from '@astronlabs/hooks';

function PaymentForm() {
  const { send, loading, result } = useSendPayment();
  
  const handleSend = async () => {
    const result = await send({
      destination: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...',
      amount: '10',
      memo: 'Payment for services'
    });
    console.log('Transaction:', result.txHash);
  };
  
  return (
    <button onClick={handleSend} disabled={loading}>
      {loading ? 'Sending...' : 'Send 10 XLM'}
    </button>
  );
}`}
        </pre>

        <h2>Listening to Events</h2>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
{`import { StellarNotify } from '@astronlabs/notify';

const notify = new StellarNotify({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  network: 'testnet',
});

const unsubscribe = notify.onTransfer('CONTRACT_ID', (event) => {
  console.log('Transfer:', event.data);
});

// Cleanup
unsubscribe();
notify.destroy();`}
        </pre>
      </main>
    </div>
  );
}
