import Head from 'next/head';

export default function TestPage() {
  return (
    <>
      <Head>
        <title>Framework Health Check</title>
      </Head>
      <div style={{ padding: '2rem', fontSize: '1.5rem', textAlign: 'center' }}>
        it works ✅
      </div>
    </>
  );
}
