// Australian date/time formatting utilities

export function formatAustralianDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";

  try {
    const date = new Date(dateString);

    // Format: "15 Feb 2026, 3:42 PM"
    const day = date.getDate();
    const month = date.toLocaleDateString("en-AU", { month: "short" });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });

    return `${day} ${month} ${year}, ${time}`;
  } catch {
    return "—";
  }
}

export function formatAustralianDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";

  try {
    const date = new Date(dateString);

    // Format: "15 Feb 2026"
    const day = date.getDate();
    const month = date.toLocaleDateString("en-AU", { month: "short" });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  } catch {
    return "—";
  }
}
