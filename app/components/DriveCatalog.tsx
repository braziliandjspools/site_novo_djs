"use client";

import { useMemo, useState } from "react";
import { Disc3, Search, X } from "lucide-react";
import { CARD_COLORS } from "../lib/theme";

export const ALL_SERVICES = [
  "12 Inch 80's", "80s", "8th Wonder", "90s", "914 Hit Squad",
  "9inch", "Ace Remix Service Collection", "All In One Partybreaks And Remixes", "Alternative Mix Essential", "Alternative Mix Series",
  "Alternative Times", "Anthem Kingz", "AreYouKidy", "Art Of Mix", "Back To The Future",
  "Barbangerz", "Beat Snatchers", "Beatfreakz", "Beatjunkies", "Beatport",
  "Beezo", "Beehive", "Best Boogie Funk", "Biggest Disco World", "Black",
  "Black Jam", "Blackline Bootie Pimps", "Bootleg", "bpm", "Bpm Supreme",
  "Break R Us", "Buko Ape Blends", "Carrymix", "Cast DJ", "Chicken Scratch",
  "Christmas", "Cicana", "Classic Party Rockers", "Classixx Mixx", "Club",
  "Club Killers", "Club Killers Package", "Country", "Country Rhythm", "Crack 4 DJs",
  "Crate Connect", "Crate Diggaz", "Crate Gang", "Crooklyn Clan", "Cuba Remix",
  "Da Throw Backs", "Da Throwbackz", "Da Zone", "Dance", "Dance Classics",
  "DDP", "Denoizer Traxx", "Discotech", "DJ Allan", "Dj City",
  "Dj City Package", "Dj City Uk", "Dj Club Tools", "Dj Cosmo", "Dj Daff Remix",
  "Dj Drojan Remix", "Dj Hope Remix", "DJ Jeff", "Dj Meyker", "Dj Mon Old School Shortcutz",
  "DJ Promotion", "Dj Remix", "Dj Rukus Remix", "Dj Slick Extended Mixes", "Dj Toto Remix",
  "Dj Yan", "DJC", "Djdannyfull", "Djdannyfull Remix", "Djs Moombahton",
  "Dmc", "Dmc Commercial Collection", "Dmp", "Dms", "Dms Package",
  "Don't Crush", "Dvj Jarol Audio", "Eduardo Diaz Remix", "Europa Remix", "Exclusive Grooves",
  "Extended", "Extreme Remixes", "F-Mix Extended", "Fat Wax", "Fillin' Tha Gap",
  "Flip Mix The Return", "Freestyle Greatest Beats", "Frp", "Full Tilt Remix", "Funkymix",
  "Future Heat", "Future Mix", "Grand", "Grand 12-Inches", "Heavy Hits",
  "Hmc", "Hot & Dirty", "Hot Mixes 4 Yah!", "Hot Tracks", "Hype Jams Mega Hyperz",
  "I Love Disco Diamonds", "ID", "Just Play", "Kuts", "La Esencia Del Remix N",
  "Late Night Record Pool", "Latin", "Latin Remix Kings", "Lethal Weapon", "Lmp",
  "Marinx X", "Mash Up", "Mashup", "Mass Pool", "Mastermix",
  "Mega Kutz", "Mega Vibe Basic Series", "Mega Vibe Remixes Series", "Megatraxx Remixes", "Method Mix",
  "Mix Factor", "Mixaloop Acapella Loop", "Mixshow Ingredients", "Mixshow Tools", "Mixx It",
  "Mtv Mash", "Mundy Forever", "My Mp3 Pool", "Neo", "Oldies",
  "Other", "OzzMixx", "Party Bangaz", "Party Jointz", "Partybreaks And Remixes",
  "Platinum Series", "Plr", "Pop", "Prolatinremix", "Promix Dance",
  "Promix Street", "Promo Only", "Radio", "Re-Edits", "Redrums",
  "Reeo Mix", "Reggae", "Remix Central", "Remix Planet", "Remixed Classix & Extended Versions",
  "Remixes", "Retrotracks", "Snip Hitz", "Soundz For The People", "Spin Back Promos",
  "Street Club Hitz", "Street Mixx Deejays", "Street Tracks", "Top Secret", "Track",
  "TrackPack For DJs", "TrakkAddixx", "Transitions", "Turbo Rock 'N' Beat", "Ultimix",
  "UltraTraxx", "Urban Beats Series", "Urban Ragga", "Videos", "Wrexxshop Remixes",
  "Wrexxshopremixes", "X-Mix", "X-Mix Dance", "X-Mix Urban",
];

const TOP_SERVICES = [
  "Ultimix", "Funkymix", "Mastermix", "Dmc", "Club Killers",
  "Beatport", "Bpm Supreme", "DJ Allan", "Crooklyn Clan", "Hot Tracks",
  "Latin Remix Kings", "Lethal Weapon", "Party Bangaz", "Platinum Series", "Promo Only",
  "Remix Central", "Top Secret", "Urban Beats Series", "X-Mix", "Ace Remix Service Collection",
  "Beat Snatchers", "Best Boogie Funk", "Biggest Disco World", "Break R Us", "Chicken Scratch",
  "Country Rhythm", "Da Throwbackz", "Dance Classics", "Denoizer Traxx", "Discotech",
];

const LETTERS = ["Todos", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), "#"];

export function DriveCatalog() {
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState("Todos");
  const [showAll, setShowAll] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q ? ALL_SERVICES.filter((name) => name.toLowerCase().includes(q)) : showAll || letter !== "Todos" ? ALL_SERVICES : TOP_SERVICES;

    if (!q && letter !== "Todos") {
      list = ALL_SERVICES.filter((name) => {
        const first = name.trim()[0]?.toUpperCase() ?? "";
        if (letter === "#") return !/[A-Z]/.test(first);
        return first === letter;
      });
    }

    return list;
  }, [query, letter, showAll]);

  return (
    <div>
      <div className="relative mx-auto max-w-xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar pools e remix services..."
          className="w-full rounded-full border border-white/10 bg-[#282828] py-3 pl-11 pr-11 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#1DB954]/60"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            aria-label="Limpar pesquisa"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {LETTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setLetter(item);
              if (item !== "Todos") setShowAll(true);
            }}
            className={`min-w-8 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              letter === item ? "bg-[#009739] text-white" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <p className="text-center text-xs uppercase tracking-wider text-gray-500">
          {query || letter !== "Todos"
            ? `${results.length} resultado(s)`
            : showAll
              ? `${ALL_SERVICES.length} serviços no acervo`
              : `Top 30 · ${ALL_SERVICES.length}+ no acervo`}
        </p>
        {!query && letter === "Todos" && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="text-xs font-semibold uppercase tracking-wide text-[#FFDF00] hover:text-white"
          >
            {showAll ? "Ver top 30" : "Ver catálogo completo"}
          </button>
        )}
      </div>

      <div className="mt-8 grid max-h-[420px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((name, i) => {
          const colorKey = (["green", "yellow", "blue"] as const)[i % 3];
          const c = CARD_COLORS[colorKey];
          return (
            <div
              key={name}
              className={`flex items-center gap-3 rounded-xl border ${c.border} bg-white/[0.03] p-3 text-sm text-gray-200 transition-all hover:bg-white/[0.06]`}
            >
              <Disc3 className={`h-4 w-4 flex-shrink-0 ${c.text}`} />
              <span className="truncate">{name}</span>
            </div>
          );
        })}
        {results.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-gray-500">Nenhum serviço encontrado.</p>
        )}
      </div>
    </div>
  );
}
