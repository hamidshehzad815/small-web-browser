'use client';

import { useEffect, useState } from 'react';
import type { PersonDto } from '@small-web/shared';
import { Loader2 } from 'lucide-react';
import { errorMessage, getPeople } from '@/lib/api';
import { Browser } from './browser';
import { Notice } from './notice';

const STORAGE_KEY = 'small-web:person';

function remembered(people: PersonDto[]): string | null {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    return people.some((person) => person.id === id) ? id : null;
  } catch {
    return null; // storage can be blocked; the choice just isn't remembered
  }
}

export function BrowserApp() {
  const [people, setPeople] = useState<PersonDto[] | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getPeople()
      .then((list) => {
        if (cancelled) return;
        setPeople(list);
        setPersonId((current) => current ?? remembered(list) ?? list[0]?.id ?? null);
        setError(null);
      })
      .catch((failure: unknown) => {
        if (!cancelled) setError(errorMessage(failure));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function switchPerson(id: string) {
    setPersonId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // not remembered, still works
    }
  }

  const person = people?.find((candidate) => candidate.id === personId) ?? null;

  if (error && !people) {
    return (
      <div className="h-dvh bg-white">
        <Notice
          tone="error"
          title="The small web is unreachable"
          body={error}
          action={{ label: 'Try again', onClick: () => setAttempt((count) => count + 1) }}
        />
      </div>
    );
  }
  if (!people || !person) {
    return (
      <div className="flex h-dvh items-center justify-center gap-2 bg-white text-sm text-stone-500">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Loading…
      </div>
    );
  }
  if (people.length === 0) {
    return (
      <div className="h-dvh bg-white">
        <Notice
          tone="error"
          title="Nobody to browse as"
          body="The database has no people yet. Run the seed command, then reload."
        />
      </div>
    );
  }
  // `key` is the point: a different person gets a brand-new browser, never a mutated one.
  return <Browser key={person.id} person={person} people={people} onSwitchPerson={switchPerson} />;
}
