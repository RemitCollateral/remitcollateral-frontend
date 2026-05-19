export default function ContributingPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
        <h1 style={{ margin: 0 }}>MergeLabs Docs</h1>
      </nav>
      
      <main>
        <h1>Contributing</h1>
        
        <p>We welcome contributions! Here's how to get started:</p>
        
        <h2>Development Setup</h2>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
{`# Clone the repository
git clone https://github.com/AstronLabs/MergeLabs.git
cd MergeLabs

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test`}
        </pre>

        <h2>Project Structure</h2>
        <ul>
          <li><code>packages/notify/</code> - Event streaming package</li>
          <li><code>packages/mock/</code> - Testing utilities</li>
          <li><code>packages/hooks/</code> - React hooks</li>
          <li><code>packages/forms/</code> - Form components</li>
          <li><code>docs/</code> - Documentation site</li>
        </ul>

        <h2>Submitting Changes</h2>
        <ol>
          <li>Fork the repository</li>
          <li>Create a feature branch: <code>git checkout -b feature/my-feature</code></li>
          <li>Make your changes</li>
          <li>Add tests if applicable</li>
          <li>Run the test suite: <code>pnpm test</code></li>
          <li>Commit your changes: <code>git commit -m "feat: add my feature"</code></li>
          <li>Push to your fork: <code>git push origin feature/my-feature</code></li>
          <li>Open a Pull Request</li>
        </ol>

        <h2>Code Style</h2>
        <ul>
          <li>We use TypeScript strict mode</li>
          <li>All public APIs must have JSDoc comments</li>
          <li>Follow existing code patterns</li>
          <li>Write meaningful commit messages</li>
        </ul>
      </main>
    </div>
  );
}
