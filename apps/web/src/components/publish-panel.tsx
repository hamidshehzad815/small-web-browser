'use client';

import { useState, type FormEvent } from 'react';
import { parseAddress, type PageShown, type PersonDto } from '@small-web/shared';
import { errorMessage, publishSite } from '@/lib/api';

interface PublishPanelProps {
  people: PersonDto[];
  defaultAuthorId: string;
  initialAddress: string;
  onPublished: (page: PageShown) => void;
}

const EXAMPLE_HTML = `<h1>My first page</h1>
<p>Hello from the small web. This page links to <a href="tidepool.zz">the tidepools</a>
and to a place that does not exist yet: <a href="nowhere-yet.zz">nowhere-yet.zz</a>.</p>`;

// For showing that containment works: every line here tries to do something it must not be able to do.
const HOSTILE_HTML = `<h1>A perfectly innocent page</h1>
<script>document.body.innerHTML = 'defaced'; alert('script ran');</script>
<img src="x" onerror="alert('onerror ran')">
<iframe src="https://example.com"></iframe>
<p onclick="alert('click handler ran')" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:red">
  If you can read this, the page could not cover the browser.
</p>
<p><a href="javascript:alert('link ran')">a javascript: link</a> and
<a href="https://example.com">an outside link</a> become plain text.</p>
<form action="https://example.com"><input name="stolen"><button>Send</button></form>`;

const input =
  'mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/25';

export function PublishPanel({
  people,
  defaultAuthorId,
  initialAddress,
  onPublished,
}: PublishPanelProps) {
  const [authorId, setAuthorId] = useState(defaultAuthorId);
  const [address, setAddress] = useState(initialAddress);
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = address.trim() === '' ? null : parseAddress(address);
  const addressHint =
    parsed && !parsed.ok ? 'Addresses look like name.zz: letters, digits and hyphens.' : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onPublished(await publishSite({ address, title, html, authorId }));
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 p-4">
      <p className="text-sm leading-6 text-stone-600">
        Give your page an address and some HTML. Scripts, images, forms and outside links are
        removed; links to other <span className="font-mono">.zz</span> addresses are kept.
      </p>

      <label className="block text-sm font-medium text-stone-800">
        Publishing as
        <select value={authorId} onChange={(e) => setAuthorId(e.target.value)} className={input}>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-stone-800">
        Address
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="mypage.zz"
          autoCapitalize="off"
          spellCheck={false}
          aria-invalid={addressHint !== null}
          className={`${input} font-mono`}
          required
        />
        {addressHint && (
          <span className="mt-1 block text-xs font-normal text-red-700">{addressHint}</span>
        )}
      </label>

      <label className="block text-sm font-medium text-stone-800">
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          className={input}
          required
        />
      </label>

      <label className="block text-sm font-medium text-stone-800">
        <span className="flex items-baseline justify-between">
          Page HTML
          <span className="space-x-3 text-xs font-normal">
            <button
              type="button"
              className="text-teal-800 underline"
              onClick={() => setHtml(EXAMPLE_HTML)}
            >
              Insert example
            </button>
            <button
              type="button"
              className="text-teal-800 underline"
              onClick={() => setHtml(HOSTILE_HTML)}
            >
              Hostile example
            </button>
          </span>
        </span>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={11}
          spellCheck={false}
          className={`${input} font-mono text-xs leading-5`}
          required
        />
      </label>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-teal-700 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        {busy ? 'Publishing…' : 'Publish'}
      </button>
    </form>
  );
}
