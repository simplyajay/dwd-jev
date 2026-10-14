import { useMatches } from "@tanstack/react-router";

/** Top bar showing the current page's title (a route's `staticData.title`). */
export function AppHeader() {
  const title = useMatches({
    select: (matches) => matches.findLast((match) => match.staticData.title)?.staticData.title,
  });

  return (
    <header className="flex h-14 shrink-0 items-center border-b px-6">
      <h1 className="truncate font-semibold text-lg">{title}</h1>
    </header>
  );
}
