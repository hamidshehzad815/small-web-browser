import type { LucideIcon } from 'lucide-react';
import { CircleSlash, TriangleAlert } from 'lucide-react';

interface Action {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

interface NoticeProps {
  tone: 'error' | 'nowhere';
  title: string;
  body: string;
  action?: Action;
  secondary?: Action[];
}

const TONES: Record<NoticeProps['tone'], { icon: LucideIcon; ring: string; text: string }> = {
  error: { icon: TriangleAlert, ring: 'bg-red-50 text-red-700', text: 'text-red-700' },
  nowhere: { icon: CircleSlash, ring: 'bg-stone-100 text-stone-600', text: 'text-stone-600' },
};

/** A full-pane message for the states a page can be in other than "shown". */
export function Notice({ tone, title, body, action, secondary = [] }: NoticeProps) {
  const { icon: Icon, ring } = TONES[tone];
  const buttons = [...(action ? [{ ...action, primary: true }] : []), ...secondary];
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-6">
      <div className="max-w-md text-center">
        <div
          className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-full ${ring}`}
        >
          <Icon className="size-6" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold text-stone-900">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">{body}</p>
        {buttons.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {buttons.map((button) => (
              <button
                key={button.label}
                type="button"
                onClick={button.onClick}
                className={
                  button.primary
                    ? 'rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700'
                    : 'rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700'
                }
              >
                {button.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
