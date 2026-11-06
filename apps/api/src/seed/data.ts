import type { Via } from '@small-web/shared';

// Everything the seed writes is defined here as plain data. Nothing is random and nothing reads the clock.

export interface SeedPerson {
  id: string;
  name: string;
}
export interface SeedSite {
  address: string;
  title: string;
  authorId: string;
  html: string;
}

export const PEOPLE: SeedPerson[] = [
  { id: 'mara', name: 'Mara Quill' },
  { id: 'dev', name: 'Dev Okafor' },
  { id: 'iris', name: 'Iris Lindqvist' },
  { id: 'noor', name: 'Noor Haddad' },
  { id: 'sam', name: 'Sam Rivera' },
];

// Links to these appear in the pages, but no site lives here: they lead to "Nowhere".
export const DEAD_ADDRESSES = [
  'lanternfish.zz',
  'wreckdiving.zz',
  'old-pier.zz',
  'foghorn.zz',
  'sandcastle.zz',
  'ropewalk.zz',
];

export const SITES: SeedSite[] = [
  {
    address: 'tidepool.zz',
    title: 'Tidepool Notes',
    authorId: 'mara',
    html: `
<h1>Tidepool Notes</h1>
<p>A tidepool is a small world that the sea forgets twice a day. When the water pulls back, <strong>anemones</strong> fold their tentacles into jelly buttons, hermit crabs sprint between shadows, and limpets clamp to the rock with a grip that would embarrass most glues.</p>
<p>I have counted the residents of one rocky shelf for eleven summers. The colony near the northern lip has doubled in size, while the purple urchins have not moved a single centimetre. Step carefully: the green film on the lower stones is slicker than ice.</p>
<h2>Where to read next</h2>
<ul>
  <li>Offshore, the <a href="kelpforest.zz">kelp forest</a> feeds almost everything you will find in these pools.</li>
  <li>To know when the shelf will be bare, learn <a href="tidetables.zz">how the tide tables work</a>.</li>
  <li>Further up the coast the water turns brackish in the <a href="saltmarsh.zz">salt marsh</a>.</li>
  <li>Dev keeps a daily <a href="harbourlog.zz">harbour log</a> that mentions the pools now and then.</li>
</ul>
<p style="color:#5b6b73">Rumour says a <a href="lanternfish.zz">lanternfish</a> was once stranded here. I have never found it.</p>`,
  },
  {
    address: 'kelpforest.zz',
    title: 'The Kelp Forest',
    authorId: 'mara',
    html: `
<h1>The Kelp Forest</h1>
<p>Giant kelp can grow half a metre in a single day, which makes it the fastest plant in the sea. It does not have roots. A knot of tangled fingers called a <em>holdfast</em> grips the rock, and everything above it is simply blade, stipe and gas-filled float reaching for the light.</p>
<p>The canopy, thick enough to block the sun, shelters a whole city. Sea otters wrap themselves in kelp so they do not drift away while they sleep. Juvenile rockfish hide between the stipes. When the otters disappear, the urchins multiply and strip the forest down to bare stone, an <em>urchin barren</em> that can last for decades.</p>
<p>Winter storms rip whole plants loose and wash them onto the beach, where they feed the creatures of the <a href="tidepool.zz">tidepools</a>. See the <a href="stormwatch.zz">storm watch</a> for the dates of the big blows. Divers who once explored a <a href="wreckdiving.zz">wreck</a> beyond the outer canopy tell me the kelp is thinning there.</p>`,
  },
  {
    address: 'saltmarsh.zz',
    title: 'Salt Marsh Diary',
    authorId: 'mara',
    html: `
<h1>Salt Marsh Diary</h1>
<p>The marsh smells of sulphur and sun-warmed mud, and I have come to love it. Stiff blades of cordgrass stand in water that is neither river nor sea but something in between: brackish, shallow and full of small lives.</p>
<p>At low tide the fiddler crabs come out by the thousand, the males waving one oversized claw like a flag. A grey heron stalks the creek edge at dawn, so still it seems to be part of the reed. When the highest <a href="tidetables.zz">spring tides</a> arrive, the whole marsh floods and every burrow disappears for an hour.</p>
<p>The marsh is also a barrier. It soaks up storm water and keeps the village dry. If you walk here, bring boots, and keep to the boardwalk. For something rockier, the <a href="tidepool.zz">tidepools</a> are a short drive south, and the boats are moored at the <a href="harbourlog.zz">harbour</a>.</p>`,
  },
  {
    address: 'harbourlog.zz',
    title: 'Harbour Log',
    authorId: 'dev',
    html: `
<h1>Harbour Log</h1>
<p>A running record kept by the harbourmaster's assistant. Nothing here is official; it is simply what happened on the water.</p>
<h2>Monday</h2>
<p>Fog until ten. The morning ferry sat at its mooring for forty minutes and the gulls were furious about it. The <em>Persephone</em> came in just after noon with a full hold of herring, and the quay smelled of salt and diesel for the rest of the day.</p>
<h2>Tuesday</h2>
<p>Clear and cold. Two new mooring chains were laid off the south wall. Someone left a very bad knot on the visitors' pontoon; see <a href="knotcraft.zz">knotcraft</a> for how it should have been tied. At dusk the beam from the <a href="lighthouse.zz">lighthouse</a> swept across the water exactly on time.</p>
<h2>Wednesday</h2>
<p>High water at seven fifteen, which matters if you are moving anything heavy; the <a href="tidetables.zz">tide tables</a> explain why. The old <a href="old-pier.zz">pier</a> is still closed.</p>`,
  },
  {
    address: 'tidetables.zz',
    title: 'Understanding the Tides',
    authorId: 'dev',
    html: `
<h1>Understanding the Tides</h1>
<p>The moon pulls on the ocean, and the ocean answers by piling up on the side nearest the moon and, less obviously, on the side farthest from it. As the Earth turns beneath those two bulges, most coasts see two high tides and two low tides a day. Because the moon moves too, the cycle takes about twelve hours and twenty-five minutes rather than twelve.</p>
<p>Twice a month, at new moon and full moon, the sun and moon line up and their pulls add together. These are <strong>spring tides</strong>: the highest highs and the lowest lows. Between them, at the quarter moons, the pulls partly cancel and we get gentle <strong>neap tides</strong>.</p>
<p>A tide table is just a prediction for one harbour. It cannot know about the weather. A deep low-pressure system can raise the sea by a metre, which is why a storm surge on top of a spring tide is the thing coastal towns fear; read about it at <a href="stormwatch.zz">storm watch</a>.</p>
<p>Related: <a href="tidepool.zz">tidepools</a> only appear at low water, the <a href="saltmarsh.zz">marsh</a> floods at high water, and the <a href="harbourlog.zz">harbour log</a> notes each day's times.</p>`,
  },
  {
    address: 'lighthouse.zz',
    title: 'Lighthouse Keepers',
    authorId: 'dev',
    html: `
<h1>Lighthouse Keepers</h1>
<p>Before automation, every lighthouse had a keeper, and every keeper had a routine that never changed. At dusk the oil lamp was lit and its wick trimmed. All night someone climbed the spiral stair to wind the clockwork that turned the lens, and at dawn the brass was polished and the log was written up.</p>
<p>The heart of the tower is the Fresnel lens: rings of glass prisms that bend a small flame into a single powerful beam. A good lens can be seen for twenty miles. In thick weather the lamp was not enough, and the keeper would sound the <a href="foghorn.zz">foghorn</a> every thirty seconds, sometimes for days.</p>
<p>The last keeper here left decades ago, but the beam still sweeps the bay; you can see it from the <a href="harbourlog.zz">harbour</a>. Keepers were the first to know when the weather turned, and their notes helped shape the warnings now collected at <a href="stormwatch.zz">storm watch</a>.</p>`,
  },
  {
    address: 'seaglass.zz',
    title: 'Sea Glass Collector',
    authorId: 'iris',
    html: `
<h1>Sea Glass Collector</h1>
<p>Sea glass begins as litter: a bottle, a jar, the stopper of a lamp. The sea tumbles it for decades until the sharp edges are gone and the surface turns frosted and soft, like a sweet. The colour tells you what it used to be.</p>
<p>White, green and brown are common because most bottles were those colours. Cobalt blue is rare; it once held medicine and milk of magnesia. Orange and red are rarer still, and a true red piece will make a collector go quiet. The best hunting is just after a storm, an hour before low tide, when the beach has been turned over.</p>
<p>I keep my finds in jars on the windowsill, sorted by shade. Some of my frames hold pieces strung with <a href="driftwood.zz">driftwood</a>. If you want to understand why the beach changes so much between visits, read about the <a href="stormwatch.zz">storms</a>. For a different treasure hunt, try the <a href="tidepool.zz">tidepools</a>, and please do not take anything alive.</p>
<p>I once built an elaborate <a href="sandcastle.zz">sandcastle</a> decorated entirely with green glass. The tide took it in an hour.</p>`,
  },
  {
    address: 'driftwood.zz',
    title: 'Driftwood & Fire',
    authorId: 'iris',
    html: `
<h1>Driftwood &amp; Fire</h1>
<p>Wood that has spent years in the sea comes out bleached silver and so light that a whole branch can be lifted with two fingers. The salt draws the colour out; the waves polish the grain until it looks carved. Every piece has a shape the sea chose.</p>
<p>People make sculptures from it, mirrors, shelves, whole gates. Joining it takes patience, because the wood is brittle and often cracked. A good lashing holds better than a nail, and I learned mine from <a href="knotcraft.zz">knotcraft</a>.</p>
<p>A word of warning about burning it: driftwood soaked in salt burns with strange blue and green flames and gives off fumes that can irritate the lungs and rust a chimney. Burn it outdoors, and only a little at a time.</p>
<p>The best finds come after a blow; check the <a href="stormwatch.zz">storm watch</a> and then walk the high tide line. Pieces of <a href="seaglass.zz">sea glass</a> often turn up in the same places.</p>`,
  },
  {
    address: 'knotcraft.zz',
    title: 'Knotcraft',
    authorId: 'noor',
    html: `
<h1>Knotcraft</h1>
<p>A good knot is a promise made to a rope. It must hold under load and still come undone when you ask. Four knots will carry you through most of life afloat.</p>
<ul>
  <li><strong>Bowline</strong>: a fixed loop that never slips and never jams. The rabbit comes out of the hole, goes around the tree, and back down the hole.</li>
  <li><strong>Clove hitch</strong>: two turns around a post, quick to tie and quick to adjust.</li>
  <li><strong>Sheet bend</strong>: joins two ropes, even when they are different thicknesses.</li>
  <li><strong>Reef knot</strong>: right over left, left over right. Fine for bundles; never trust it with a life.</li>
</ul>
<p>Beyond knots there is the splice, which weaves rope back into itself so cleanly that the join is stronger than the line. Old sailors made theirs in the rope walk, a long shed where cordage was twisted; the <a href="ropewalk.zz">ropewalk</a> pages I wanted to link have not been written yet.</p>
<p>You will see my work all over the <a href="harbourlog.zz">harbour</a>. Lashings and ties also suit <a href="driftwood.zz">driftwood</a> furniture, and the keepers at the <a href="lighthouse.zz">lighthouse</a> tied everything down before a gale.</p>`,
  },
  {
    address: 'stormwatch.zz',
    title: 'Storm Watch',
    authorId: 'noor',
    html: `
<h1>Storm Watch</h1>
<p>Long before the sky changes, the barometer knows. A glass that falls slowly means weather coming; a glass that drops fast means a gale within hours. I check mine every morning and write the number in the margin of the almanac.</p>
<p>Wind is measured on the Beaufort scale, from a calm that lets smoke rise straight up to a hurricane that tears roofs away. Force eight is a gale: whole trees sway and walking becomes hard work. A squall is shorter and nastier, arriving from a clear sky with a wall of rain.</p>
<p>The worst danger on this coast is not the wind itself but the surge. When low pressure lifts the sea and a gale pushes it ashore, a spring tide becomes a flood. Study the <a href="tidetables.zz">tide tables</a> before you trust a calm morning.</p>
<p>Storms also reshape everything we love here: they tear loose the <a href="kelpforest.zz">kelp</a>, test the beam of the <a href="lighthouse.zz">lighthouse</a>, and keep the boats tied up in the <a href="harbourlog.zz">harbour</a>.</p>`,
  },
];

// ---- browsing history ----------------------------------------------------------------------
// [minutes after the start of the hour, how they got there, target]. A target starting with "?" is
// a search for that query; anything else is an address. Unknown addresses become "Nowhere" visits.
export type Step = [minute: number, via: Via, target: string];

export const TRAILS: Record<string, Step[]> = {
  // Sam has been nearly everywhere: all ten sites, with repeats, backtracking and two searches.
  sam: [
    [0, 'typed', 'tidepool.zz'],
    [3, 'link', 'kelpforest.zz'],
    [6, 'link', 'saltmarsh.zz'],
    [8, 'back', 'kelpforest.zz'],
    [9, 'back', 'tidepool.zz'],
    [11, 'link', 'harbourlog.zz'],
    [14, 'link', 'tidetables.zz'],
    [17, 'link', 'lighthouse.zz'],
    [20, 'typed', 'seaglass.zz'],
    [23, 'link', 'driftwood.zz'],
    [26, 'link', 'knotcraft.zz'],
    [29, 'link', 'ropewalk.zz'],
    [30, 'back', 'knotcraft.zz'],
    [33, 'link', 'stormwatch.zz'],
    [36, 'typed', '?anemone'],
    [37, 'search', 'tidepool.zz'],
    [40, 'history', 'kelpforest.zz'],
    [44, 'typed', '?mooring'],
    [45, 'search', 'harbourlog.zz'],
    [50, 'history', 'tidepool.zz'],
    [55, 'link', 'tidetables.zz'],
    [58, 'typed', 'stormwatch.zz'],
  ],
  mara: [
    [0, 'typed', 'tidepool.zz'],
    [4, 'link', 'kelpforest.zz'],
    [8, 'link', 'stormwatch.zz'],
    [11, 'back', 'kelpforest.zz'],
    [13, 'back', 'tidepool.zz'],
    [17, 'link', 'saltmarsh.zz'],
    [22, 'typed', '?kelp'],
    [23, 'search', 'kelpforest.zz'],
    [30, 'typed', 'wreckdiving.zz'],
    [31, 'back', 'kelpforest.zz'],
    [38, 'history', 'tidepool.zz'],
    [44, 'typed', 'tidepool.zz'],
    [52, 'link', 'tidetables.zz'],
  ],
  dev: [
    [0, 'typed', 'harbourlog.zz'],
    [5, 'link', 'lighthouse.zz'],
    [9, 'link', 'foghorn.zz'],
    [10, 'back', 'lighthouse.zz'],
    [14, 'link', 'stormwatch.zz'],
    [19, 'back', 'lighthouse.zz'],
    [20, 'back', 'harbourlog.zz'],
    [27, 'typed', 'harbourlog.zz'],
    [33, 'link', 'tidetables.zz'],
    [41, 'typed', 'harbourlog.zz'],
    [47, 'link', 'knotcraft.zz'],
    [55, 'history', 'harbourlog.zz'],
  ],
  iris: [
    [2, 'typed', 'seaglass.zz'],
    [7, 'link', 'driftwood.zz'],
    [12, 'link', 'stormwatch.zz'],
    [16, 'back', 'driftwood.zz'],
    [18, 'back', 'seaglass.zz'],
    [24, 'typed', '?cobalt'],
    [25, 'search', 'seaglass.zz'],
    [34, 'link', 'sandcastle.zz'],
    [35, 'back', 'seaglass.zz'],
    [43, 'typed', 'tidepool.zz'],
    [49, 'link', 'kelpforest.zz'],
    [57, 'typed', 'seaglass.zz'],
  ],
  noor: [
    [1, 'typed', 'knotcraft.zz'],
    [6, 'link', 'harbourlog.zz'],
    [10, 'link', 'lighthouse.zz'],
    [13, 'back', 'harbourlog.zz'],
    [15, 'back', 'knotcraft.zz'],
    [21, 'link', 'ropewalk.zz'],
    [22, 'back', 'knotcraft.zz'],
    [29, 'typed', 'stormwatch.zz'],
    [36, 'link', 'tidetables.zz'],
    [40, 'typed', 'knotcraft.zz'],
    [46, 'typed', '?bowline'],
    [47, 'search', 'knotcraft.zz'],
    [56, 'link', 'driftwood.zz'],
  ],
};
