export function clampDueDay(dueDay: number, year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate();
  return Math.min(Math.max(1, dueDay), lastDay);
}

export function getSaoPauloDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
  };
}

function dateAtUtcNoon(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function computeNextDueAt(dueDay: number, reference = new Date()) {
  const { year, month, day } = getSaoPauloDateParts(reference);
  const thisMonthDay = clampDueDay(dueDay, year, month);

  if (thisMonthDay > day) {
    return dateAtUtcNoon(year, month, thisMonthDay);
  }

  let nextMonth = month + 1;
  let nextYear = year;

  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  const nextMonthDay = clampDueDay(dueDay, nextYear, nextMonth);
  return dateAtUtcNoon(nextYear, nextMonth, nextMonthDay);
}

export function formatDueMonthLabel(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    month: "long",
    year: "numeric",
  }).format(value);
}

export function formatDueDate(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

/** Valor para `<input type="date">` no fuso de São Paulo. */
export function toDateInputValue(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function parseDateInputValue(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    throw new Error("Data de vencimento inválida.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error("Data de vencimento inválida.");
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error("Data de vencimento inválida.");
  }

  return dateAtUtcNoon(year, month, day);
}

export function getDueUrgency(date: Date | string): "overdue" | "soon" | null {
  const value = typeof date === "string" ? new Date(date) : date;
  const dueParts = getSaoPauloDateParts(value);
  const todayParts = getSaoPauloDateParts();
  const dueTime = dateAtUtcNoon(dueParts.year, dueParts.month, dueParts.day).getTime();
  const todayTime = dateAtUtcNoon(todayParts.year, todayParts.month, todayParts.day).getTime();
  const diffDays = Math.round((dueTime - todayTime) / 86400000);

  if (diffDays < 0) return "overdue";
  if (diffDays <= 5) return "soon";
  return null;
}

export function daysUntilDue(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  const dueParts = getSaoPauloDateParts(value);
  const todayParts = getSaoPauloDateParts();
  const dueTime = dateAtUtcNoon(dueParts.year, dueParts.month, dueParts.day).getTime();
  const todayTime = dateAtUtcNoon(todayParts.year, todayParts.month, todayParts.day).getTime();
  return Math.round((dueTime - todayTime) / 86400000);
}

export function groupUsersByDueQueue<
  T extends { id: number; nextDueAt: Date | string },
>(users: T[]) {
  const sorted = [...users].sort((left, right) => {
    const leftTime = new Date(left.nextDueAt).getTime();
    const rightTime = new Date(right.nextDueAt).getTime();
    if (leftTime !== rightTime) return leftTime - rightTime;
    return left.id - right.id;
  });

  const groups = new Map<string, Array<T & { queuePosition: number; positionInGroup: number }>>();
  let queuePosition = 0;

  for (const user of sorted) {
    const label = formatDueMonthLabel(user.nextDueAt);
    const bucket = groups.get(label) ?? [];
    queuePosition += 1;
    bucket.push({
      ...user,
      queuePosition,
      positionInGroup: bucket.length + 1,
    });
    groups.set(label, bucket);
  }

  return Array.from(groups.entries()).map(([label, groupUsers]) => ({
    label,
    users: groupUsers,
  }));
}
