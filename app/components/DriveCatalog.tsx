"use client";

import { useMemo, useState } from "react";
import { Disc3, Search, X } from "lucide-react";
import { CARD_COLORS } from "../lib/theme";

export const ALL_SERVICES = [
  "Mastermix",
  "Crooklyn Clan",
  "Promo Only",
  "Hyperz",
  "Transitions",
  "Dj City",
  "Club Killers",
  "Beatjunkies",
  "Bpm Supreme",
  "My Mp3 Pool",
  "Beatfreakz",
  "Redrums",
  "Hmc",
  "Crack 4 DJs",
  "Remix Planet",
  "Frp",
  "Dms",
  "Dmp",
  "Crate Connect",
  "Bootleg",
  "Da Throwbackz",
  "Heavy Hits",
  "Latin Remixes",
  "Dmc",
  "Mash Up",
  "Spin Back Promos",
  "Megatraxx Remixes",
  "Kuts",
  "8th Wonder",
  "Back To The Future",
  "Da Zone",
  "Beezo Beehive",
  "BPM Latino",
  "Cicana",
  "Crate Gang",
  "Plr",
  "X-Mix",
  "Doing The Damage",
  "Latin Throwback",
  "Jestei Pool",
  "Dmc Commercial Collection",
  "Cuba Remix",
  "America Remix",
  "Barbangerz",
  "Dale Mas Bajo",
  "Europa Remix",
  "Mixshow Tools",
  "Latin Box",
  "All In One Partybreaks And Remixes",
  "Dance",
  "Intensa",
  "Just Play",
  "Lmp",
  "Classic Beats",
  "Dj City Uk",
  "X-Mix Dance",
  "DDP",
  "AreYouKidy",
  "X-Mix Urban",
  "Neo",
  "Extended",
  "Bangerz Army",
  "MMP",
  "Retrotracks",
  "Club",
  "Unlimited Latin",
  "Lethal Weapon",
  "Beatport",
  "Rompe Discoteca",
  "Peru Remix",
  "Mixshow Ingredients",
  "UltraTraxx",
  "7Up Mixed Bag",
  "Partybreaks And Remixes",
  "ID",
  "RunderGround",
  "Cast DJ",
  "SickMix",
  "Dj Slick Extended Mixes",
  "12 Inch 80's",
  "Only For DJ Collections",
  "Super Eurobeat",
  "Full Tilt Remix",
  "Top Secret",
  "Mixx It",
  "Cuba Remixes",
  "Caribbean Sound Edits",
  "Mix Factor",
  "AV",
  "Starjack Remix Pack",
  "Christmas",
  "Platinum Pool",
  "Exclusive Grooves",
  "Dj Rukus Remix",
  "Remixed Records",
  "Hype Jams Mega",
  "Alternative Times",
  "WickedMix",
  "Soundeo",
  "Soundz For The People",
  "Cuban Pool",
  "Mass Pool",
  "Urban Zone",
  "9inch",
  "Razormaid",
  "The Most Wanted",
  "DJ Jeff",
  "Dance Classics",
  "Street Tracks",
  "Pop",
  "Hype Latino",
  "Danny Diggz Remix Pack",
  "914 Hit Squad",
  "DJC",
  "DJ Allan",
  "LDS",
  "The Hit List",
  "Halloween Pack",
  "The Goodfellas Remix Pack",
  "Mega Kutz",
  "Snip Hitz",
  "Collini Remix Pack",
  "Classic Party Rockers",
  "Party Bangaz",
  "Dj Hope Remix",
  "Chuck D & Mark-E",
  "This Is Are Hip-House",
  "Reeo Mix",
  "Hot Tracks",
  "Art Of Mix",
  "Club Killers Package",
  "Re-Edits",
  "Hot Mixes 4 Yah!",
  "Mtv Mash",
  "VDJ JD Remix Pack",
  "Anthem Kingz",
  "Extreme Remixes",
  "Street Club Hitz",
  "Track",
  "Alex Dynamix Remix Pack",
  "BeatBreaker Remix Pack",
  "Moombahton Megapack",
  "Segue Megapack",
  "Slam Edits",
  "Soca Megapack",
  "Wordplay Megapack",
  "Dj City Package",
  "Dms Package",
  "Deville Remix Pack",
  "Fat Wax",
  "James Hype Remix Pack",
  "Ultrasound Rare Remixes",
  "I Love Disco Diamonds",
  "Black",
  "Mega Vibe Remixes Series",
  "House Flash",
  "Peep",
  "Digitraxx",
  "DMC Latin",
  "Reggae",
  "TrakkAddixx",
  "DJ Mhark Remix Pack",
  "Chicken Scratch",
  "Platinum Series",
  "Fillin' Tha Gap",
  "iDJ Classics",
  "Mixaloop Acapella Loop",
  "Remixed Classix & Extended Versions",
  "Remixes",
  "Discotech",
  "MWTeam Magic Synth",
  "Alternative Mix Essential",
  "PeteDown Remix Pack",
  "Culture Shock",
  "Best Boogie Funk",
  "ERG",
  "Late Night Record Pool",
  "Totalmix",
  "80s",
  "Actimix Remix",
  "Blue Lagoon",
  "Latin DJ Tools",
  "Buko Ape Blends",
  "DJ Nasa Remix Pack",
  "DJ OD Remix Pack",
  "Rhythm Stick",
  "Street Mixx Deejays",
  "DJ OiO",
  "Dj Remix",
  "Elite Remix",
  "Fellaz Groove",
  "Method Mix",
  "Prolatinremix",
  "Radio",
  "Twisted Mix",
  "Ultimix",
  "Prime Cuts",
  "Urban Ragga",
  "Mixshow Megapack",
  "90s",
  "Country",
  "Beatstreet Vibes",
  "Hot & Dirty",
  "Mashup",
  "MixxShop Urban Series",
  "Smassh Remix Pack",
  "Party Jointz",
  "Remix Central",
  "Black Jam",
  "ABC Mix",
  "Ray Isaac Remixes",
  "Remember The 80ies",
  "Rivas Remix Pack",
  "Latin",
  "Latin Others",
  "Most Wanted Rare Remixes",
  "Wrexxshopremixes",
  "Wrexxshop Remixes",
  "Denoizer Traxx",
  "iDJPool",
  "Oldies",
  "Ximer Remix",
  "Ace Remix Service Collection",
  "Nothing But…",
  "Promix Street",
  "Break R Us",
  "Marinx X",
  "DJ Charts",
  "DMC Remixes",
  "Dvj Jarol Audio",
  "Flip Mix The Return",
  "Da Throw Backs",
  "Dj Club Tools",
  "Biggest Disco World",
  "Country Rhythm",
  "Future Heat",
  "Trap Megapack",
  "Twerk Megapack",
  "VA Short Cutz Megamixes",
  "VDJS Latinos",
  "Bad Boy Crew Remixes",
  "Deep Party Mix",
  "Blackline Bootie Pimps",
  "bpm",
  "F-Mix Extended",
  "Mixinit Remixes",
  "Promix Dance",
  "TrackPack For DJs",
  "Urban Beats Series",
  "Remixpool",
  "Black Special Remixes",
  "Future Mix",
  "Mega Vibe Basic Series",
  "Muzvizor",
  "Party Up",
  "SoA Remixes",
  "Knoxxville Remixes",
  "LPR",
  "Alternative Mix Series",
  "Dj Mon Old School Shortcutz",
  "Grand",
  "Dj Toto Remix",
  "Funkymix",
  "Remixes VIP",
  "Beat Snatchers",
  "Crate Diggaz",
  "Dj Drojan Remix",
  "Carrymix",
  "Djdannyfull Remix",
  "DJ Promotion",
  "Grand 12-Inches",
  "JyMiX Remixes",
  "Turbo Rock 'N' Beat",
  "Acapella Pack",
  "Classixx Mixx",
  "Dj Yan",
  "Don't Crush",
  "Eduardo Diaz Remix",
  "Freestyle Greatest Beats",
  "Latin Remix Kings",
  "Toneplay Pack",
  "Wh0 Remixes",
];

const TOP_SERVICES = ALL_SERVICES.slice(0, 30);

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
