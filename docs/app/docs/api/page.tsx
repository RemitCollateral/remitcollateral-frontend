export default function ApiPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
        <h1 style={{ margin: 0 }}>MergeLabs Docs</h1>
      </nav>
      
      <main>
        <h1>API Reference</h1>
        
        <h2>@astronlabs/notify</h2>
        <h3>StellarNotify</h3>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
{`new StellarNotify(config: NotifyConfig)

Methods:
- onTransfer(contractId: string, callback: EventCallback): () => void
- onEvent(contractId: string, eventName: string, callback: EventCallback): () => void
- destroy(): void`}
        </pre>

        <h2>@astronlabs/hooks</h2>
        <h3>useFreighter</h3>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
{`const { connect, disconnect, publicKey, connected } = useFreighter()`}
        </pre>
        
        <h3>useSendPayment</h3>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
{`const { send, loading, error, result } = useSendPayment()

// Usage
await send({ destination: 'G...', amount: '10' })`}
        </pre>

        <h3>useContractCall</h3>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
{`const { call, loading, error, result } = useContractCall()

// Usage
await call({
  contractId: 'C...',
  function: 'transfer',
  args: [...]
})`}
        </pre>

        <h2>@astronlabs/forms</h2>
        <h3>SendPaymentForm</h3>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
{`<SendPaymentForm onSuccess={handleSuccess}>
  {({ handleSubmit, loading, values, onChange }) => (
    <form onSubmit={handleSubmit}>
      <input name="destination" value={values.destination} onChange={onChange} />
      <input name="amount" value={values.amount} onChange={onChange} />
      <button type="submit" disabled={loading}>Send</button>
    </form>
  )}
</SendPaymentForm>`}
        </pre>
      </main>
    </div>
  );
}
