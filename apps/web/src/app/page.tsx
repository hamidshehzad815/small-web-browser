import { ADDRESS_TLD } from '@small-web/shared';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">The Small Web</h1>
      <p className="text-zinc-600">Addresses look like tidepool.{ADDRESS_TLD}</p>
    </main>
  );
}
