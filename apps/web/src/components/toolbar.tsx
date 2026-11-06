'use client';

import { useState, type RefObject } from 'react';
import type { PersonDto } from '@small-web/shared';
import { ArrowLeft, ArrowRight, History, Plus, RotateCw, Search } from 'lucide-react';

const iconButton =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-stone-700 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-700 disabled:pointer-events-none disabled:text-stone-300';
const field =
  'h-9 w-full rounded-full border border-transparent bg-stone-100 px-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25';

interface ToolbarProps {
  canBack: boolean;
  canForward: boolean;
  /** What the address bar shows when the person is not typing. */
  addressText: string;
  addressRef: RefObject<HTMLInputElement | null>;
  /** Returns a message if the typed address is not valid; nothing happens in that case. */
  onGo: (typed: string) => string | null;
  onSearch: (query: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  people: PersonDto[];
  personId: string;
  onSwitchPerson: (personId: string) => void;
  historyOpen: boolean;
  publishOpen: boolean;
  onToggleHistory: () => void;
  onTogglePublish: () => void;
}

export function Toolbar(props: ToolbarProps) {
  return (
    <header className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-stone-200 bg-white px-3 py-2">
      <div className="flex items-center" role="group" aria-label="Navigation">
        <button
          type="button"
          className={iconButton}
          onClick={props.onBack}
          disabled={!props.canBack}
          aria-label="Back"
          title="Back (Alt+←)"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          className={iconButton}
          onClick={props.onForward}
          disabled={!props.canForward}
          aria-label="Forward"
          title="Forward (Alt+→)"
        >
          <ArrowRight className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          className={iconButton}
          onClick={props.onReload}
          disabled={props.addressText === ''}
          aria-label="Reload"
          title="Reload"
        >
          <RotateCw className="size-[18px]" aria-hidden />
        </button>
      </div>

      <AddressBar value={props.addressText} inputRef={props.addressRef} onGo={props.onGo} />
      <SearchBox onSearch={props.onSearch} />

      <div className="ml-auto flex items-center gap-1">
        <label className="flex items-center gap-2 text-xs text-stone-500">
          <span className="hidden sm:inline">Browsing as</span>
          <select
            value={props.personId}
            onChange={(event) => props.onSwitchPerson(event.target.value)}
            aria-label="Browsing as"
            className="h-9 rounded-full border border-stone-200 bg-white px-3 text-sm text-stone-800 focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            {props.people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={`${iconButton} ${props.historyOpen ? 'bg-teal-50 text-teal-800' : ''}`}
          onClick={props.onToggleHistory}
          aria-label="History"
          aria-pressed={props.historyOpen}
          title="History"
        >
          <History className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={props.onTogglePublish}
          aria-pressed={props.publishOpen}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-teal-700 px-3.5 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          <Plus className="size-4" aria-hidden /> Publish
        </button>
      </div>
    </header>
  );
}

function AddressBar({
  value,
  inputRef,
  onGo,
}: {
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onGo: (typed: string) => string | null;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  return (
    <form
      role="search"
      aria-label="Address"
      className="relative min-w-48 flex-[2_1_16rem]"
      onSubmit={(event) => {
        event.preventDefault();
        const message = onGo(draft ?? value);
        setProblem(message);
        if (message === null) {
          setDraft(null);
          inputRef.current?.blur();
        }
      }}
    >
      <input
        ref={inputRef}
        value={draft ?? value}
        onChange={(event) => {
          setDraft(event.target.value);
          setProblem(null);
        }}
        onFocus={(event) => event.target.select()}
        onBlur={() => {
          setDraft(null);
          setProblem(null);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setDraft(null);
            setProblem(null);
            event.currentTarget.blur();
          }
        }}
        placeholder="Type an address, e.g. tidepool.zz"
        aria-label="Address"
        aria-invalid={problem !== null}
        aria-describedby={problem ? 'address-problem' : undefined}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className={`${field} font-mono ${problem ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}`}
      />
      {problem && (
        <p
          id="address-problem"
          role="alert"
          className="absolute left-3 top-full z-30 mt-1 rounded-md bg-red-600 px-2.5 py-1 text-xs text-white shadow"
        >
          {problem}
        </p>
      )}
    </form>
  );
}

function SearchBox({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');
  return (
    <form
      role="search"
      aria-label="Search all pages"
      className="relative min-w-40 flex-[1_1_12rem]"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = query.trim();
        if (trimmed !== '') onSearch(trimmed);
      }}
    >
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400"
        aria-hidden
      />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search every page"
        aria-label="Search every page"
        maxLength={100}
        className={`${field} pl-10`}
      />
    </form>
  );
}
