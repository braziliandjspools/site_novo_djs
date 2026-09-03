/** Dias da semana em pt-BR (Domingo = 0). */
export const WEEKDAY_SHORT_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
export const WEEKDAY_LONG_PT = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
] as const;

export const MONTH_SHORT_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

export const MONTH_LONG_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

export type CalendarDay = {
  date: Date;
  day: number;
  weekday: number;
  weekdayShort: string;
  isToday: boolean;
  iso: string;
};

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Pack SEMANA 01 = dias 1–7 do mês, SEMANA 02 = 8–14, etc. */
export function getPackWeekDayRange(
  year: number,
  month: number,
  weekNumber: number,
  now: Date = new Date(),
): CalendarDay[] {
  if (!Number.isInteger(weekNumber) || weekNumber < 1) return [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDay = (weekNumber - 1) * 7 + 1;
  if (startDay > daysInMonth) return [];

  const today = startOfLocalDay(now);
  const days: CalendarDay[] = [];

  for (let day = startDay; day < startDay + 7 && day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    const weekday = date.getDay();
    days.push({
      date,
      day,
      weekday,
      weekdayShort: WEEKDAY_SHORT_PT[weekday],
      isToday: sameLocalDay(date, today),
      iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    });
  }

  return days;
}

export function formatPackWeekRangeLabel(days: CalendarDay[]): string {
  if (days.length === 0) return "";
  const first = days[0];
  const last = days[days.length - 1];
  const monthShort = MONTH_SHORT_PT[first.date.getMonth()];
  if (first.day === last.day) return `${first.day} ${monthShort}`;
  return `${first.day}–${last.day} ${monthShort}`;
}

export function isCurrentPackWeek(
  year: number,
  month: number,
  weekNumber: number,
  now: Date = new Date(),
) {
  if (now.getFullYear() !== year || now.getMonth() + 1 !== month) return false;
  const day = now.getDate();
  const start = (weekNumber - 1) * 7 + 1;
  const end = start + 6;
  return day >= start && day <= end;
}

export function formatLiveCalendarTitle(now: Date = new Date()) {
  const weekday = WEEKDAY_LONG_PT[now.getDay()];
  const month = MONTH_LONG_PT[now.getMonth()];
  return `${weekday}, ${now.getDate()} de ${month} de ${now.getFullYear()}`;
}

export function formatLiveClock(now: Date = new Date()) {
  return now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
