// chat.js: weather assistant, outfit advisor, activity feasibility

function getOutfitSuggestion(locName, dateStr, hiC, loC, condDesc, windKmh) {
  const hi  = unit === 'C' ? hiC  : cToF(hiC);
  const lo  = unit === 'C' ? loC  : cToF(loC);
  const avg = (hi + lo) / 2;
  const U   = unit === 'C' ? '°C' : '°F';
  const isF = unit === 'F';

  const desc = (condDesc || '').toLowerCase();
  const isRainy    = desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower');
  const isSnowy    = desc.includes('snow') || desc.includes('sleet') || desc.includes('ice');
  const isStormy   = desc.includes('thunder') || desc.includes('storm');
  const isFoggy    = desc.includes('fog') || desc.includes('mist');
  const isClear    = desc.includes('clear') || desc.includes('sunny');
  const isWindy    = windKmh != null && windKmh > 30;
  const isVeryWindy = windKmh != null && windKmh > 55;

  const freezing = isF ? avg < 32  : avg < 0;
  const veryCold = isF ? avg < 45  : avg < 7;
  const cold     = isF ? avg < 55  : avg < 13;
  const cool     = isF ? avg < 65  : avg < 18;
  const mild     = isF ? avg < 75  : avg < 24;
  const warm     = isF ? avg < 85  : avg < 29;

  let morning, midday, evening;
  const extras = [];

  if (freezing || isSnowy) {
    morning = `❄️ Bundle up — it's freezing out there (${lo.toFixed(0)}${U} this morning). Thermal base layer, heavy insulated coat, waterproof boots, gloves, hat, and scarf are all essential.`;
    midday  = `🌨 Even at the peak of the day (${hi.toFixed(0)}${U}), it's still frigid. Keep all your layers on and make sure everything is waterproof if you're heading outside.`;
    evening = `🌙 Evening drops back to ${lo.toFixed(0)}${U} — don't let your guard down. Stay fully bundled up.`;
  } else if (veryCold) {
    morning = `🧥 Cold morning (around ${lo.toFixed(0)}${U}). Layer up: warm sweater or fleece under a heavy jacket, thick socks, and closed-toe shoes or boots.`;
    midday  = `🧤 High of ${hi.toFixed(0)}${U} — a bit warmer but still cold. Keep your coat; unzip if you warm up indoors.`;
    evening = `🌙 Drops back to ${lo.toFixed(0)}${U} after sunset — keep your jacket on for the evening.`;
  } else if (cold) {
    morning = `🧣 Cool start (${lo.toFixed(0)}${U}). A medium-weight jacket over a long-sleeve shirt works well. Jeans or thicker pants are a smart choice.`;
    midday  = `🧤 It reaches ${hi.toFixed(0)}${U} — still jacket weather, but you might be comfortable unzipping or going to a lighter layer indoors.`;
    evening = `🌙 Cools back down to ${lo.toFixed(0)}${U} — make sure you have that jacket handy for the evening.`;
  } else if (cool) {
    morning = `🌤 Crisp morning (${lo.toFixed(0)}${U}). A light jacket or hoodie over a t-shirt is perfect — you may not need it by midday.`;
    midday  = `🌥 Warms up to ${hi.toFixed(0)}${U} — you'll likely want to ditch the jacket. A long-sleeve or light sweater should be comfortable.`;
    evening = `🌙 Dips to ${lo.toFixed(0)}${U} as the sun sets — bring that jacket out again if you're staying out late.`;
  } else if (mild) {
    morning = `😊 Comfortable morning (${lo.toFixed(0)}${U}). A light layer like a denim jacket or long-sleeve top is all you need — and you probably won't need it long.`;
    midday  = `🌈 A lovely ${hi.toFixed(0)}${U} at midday — t-shirt or light blouse weather. If you started with a layer, stash it in your bag.`;
    evening = `🌙 Still pleasant at ${lo.toFixed(0)}${U}. A light cardigan is a good idea if you're out after dark.`;
  } else if (warm) {
    morning = `☀️ Already warm this morning (${lo.toFixed(0)}${U}). Go straight for light, breathable clothes — a t-shirt and shorts or a light dress.`;
    midday  = `🌞 Heats up to ${hi.toFixed(0)}${U} — linen, cotton, or moisture-wicking fabrics are your best friends. Stay in the shade when you can.`;
    evening = `🌙 Still warm at ${lo.toFixed(0)}${U} in the evening — no need to change. You're comfortable in whatever you wore during the day.`;
  } else {
    morning = `🔥 It's going to be a hot one — already ${lo.toFixed(0)}${U} in the morning. Go as light as possible from the start.`;
    midday  = `🔥 Peaks at ${hi.toFixed(0)}${U} — wear the lightest, most breathable clothing you have. Stay hydrated and seek shade.`;
    evening = `🌙 Still hot at ${lo.toFixed(0)}${U} in the evening. Keep it light and stay cool.`;
  }

  if (isStormy)      extras.push('⛈️ Thunderstorms expected — bring a sturdy umbrella and waterproof outer layer. Try to stay indoors during peak storm hours.');
  else if (isRainy)  extras.push('🌧️ Rain in the forecast — a waterproof jacket or raincoat is a must. Pack a compact umbrella and go for waterproof shoes.');
  else if (isSnowy)  extras.push('❄️ Snow or icy conditions — waterproof boots with good grip are essential to avoid slipping. Cover your head and ears.');

  if (isVeryWindy)   extras.push('💨 Very strong winds — a windproof outer layer is essential. Avoid loose accessories that could blow away.');
  else if (isWindy)  extras.push('💨 It\'s going to be breezy — a wind-resistant jacket will make a noticeable difference even if temps seem mild.');

  if (isFoggy)       extras.push('🌫️ Foggy out there — wear something visible (brighter colors) if you\'re walking or biking, and drive carefully.');
  if (isClear && !cold && !veryCold && !freezing) extras.push('😎 Clear skies — sunglasses and sunscreen are a smart move if you\'ll be outside for a stretch.');

  const dateFmt = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'});
  let out = `Here's what to wear in ${locName} on ${dateFmt}:\n\n`;
  out += `🌅 Morning\n${morning}\n\n`;
  out += `☀️ Midday\n${midday}\n\n`;
  out += `🌙 Evening\n${evening}`;
  if (extras.length) out += `\n\n📌 Things to note:\n` + extras.map(e => `• ${e}`).join('\n');
  return out;
}

// ─── Outfit followup Chatbot (uses live forecast context) ───────────────
// Browser pages cannot call OpenAI directly (CORS). These replies stay local and stay aware of the same day’s numbers you just loaded.
function outfitWeatherSummary(ctx) {
  const { resolvedAddress, dateStr, tempmax, tempmin, conditions, windspeed, precip, precipprob } = ctx;
  const dateFmt = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'});
  let w = `Location: ${resolvedAddress} (${dateFmt})\nForecast: high ${disp(tempmax)}, low ${disp(tempmin)} · ${conditions || '—'}`;
  if (windspeed != null) w += ` · wind ${windDisp(windspeed)}`;
  if (precip != null && precip > 0.1) w += ` · precip ${precipDisp(precip)}`;
  if (precipprob != null) w += ` · rain chance ~${precipprob.toFixed(0)}%`;
  return w;
}

const ASSISTANT_META = '\n<<<META>>>\n';

function stripTrailingChoiceQuestion(t) {
  let s = t.replace(/\n/g, ' ').trim();
  s = s.replace(/\.\s*(which|what|how)\b[\s\S]*$/i, '');
  s = s.replace(/\s+(which|what)\s+(one|jacket|coat|layer)\b[\s\S]*$/i, '');
  s = s.replace(/\s+should\s+i\s+(bring|wear|pick|choose)\b[\s\S]*$/i, '');
  return s.replace(/\s+/g, ' ').trim();
}

function extractWardrobePhrase(q) {
  const t = stripTrailingChoiceQuestion(q);
  const patterns = [
    /(?:i(?:'ve|\s+have)\s+got|i\s+got|i\s+(?:only\s+)?have|i\s+own)\s+(.+)/i,
    /(?:in\s+my\s+closet|wardrobe\s*:|closet\s*:)\s*:?\s*(.+)$/i,
    /^\s*(?:bring|pack)\b(?:\s+with\s+me)?\s*:?\s*(.+)$/i,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m && m[1].trim()) return m[1].trim();
  }
  return '';
}

function parseClothingItems(s) {
  const normalized = String(s).replace(/,\s*and\s+/gi, ', ');
  return normalized.split(/,|;/).map(x => x.replace(/^[\s\-•]+|[\s\-•]+$/g, '').replace(/^(and|or)\s+/i, '').trim()).filter(Boolean);
}

const CLOTHING_RE = /shirt|pants|jean|jacket|coat|shoe|boot|sneaker|dress|skirt|hoodie|sweater|cardigan|shorts|tee|t-shirt|blazer|parka|puffer|down|fleece|umbrella|rain|waterproof|shell|layers|scarf|hat|gloves|tank|top|chinos|leggings|socks|windbreaker|thicker|thin/i;

function itemWearTips(item, ctx) {
  const low = ctx.tempmin, hi = ctx.tempmax;
  const avg = (low != null && hi != null) ? (low + hi) / 2 : (hi ?? low ?? 15);
  const cond = (ctx.conditions || '').toLowerCase();
  const rainy = cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower') || (ctx.precipprob != null && ctx.precipprob > 40);
  const windy = ctx.windspeed != null && ctx.windspeed > 30;
  const i = item.toLowerCase();
  const tips = [];
  if (/umbrella|raincoat|shell|waterproof|gore-tex|poncho/i.test(i) && rainy) tips.push('Strong match for wet conditions—keep it within reach.');
  if (/umbrella|raincoat/i.test(i) && !rainy) tips.push('Rain looks less certain; still fine as a just-in-case item.');
  if (/sneaker|trainer|canvas/i.test(i) && rainy) tips.push('Fabric sneakers soak easily—waterproof boots or a spare pair helps if you’ll walk a lot.');
  if (/sandal|flip|open\s*toe/i.test(i)) {
    if ((unit === 'C' && avg < 13) || (unit === 'F' && avg < 55)) tips.push('Likely too chilly for open shoes for long stretches.');
    else tips.push('OK if you stay dry and skip long rough walks.');
  }
  if (/denim|jean/i.test(i)) {
    if (rainy) tips.push('Denim holds water—pair with your most weatherproof outer layer.');
    if ((unit === 'C' && avg < 5) || (unit === 'F' && avg < 41)) tips.push('Cold in jeans alone—add thermals or fleece underneath.');
  }
  if (/hoodie|fleece|sweater|cardigan|pullover/i.test(i)) {
    if ((unit === 'C' && avg > 22) || (unit === 'F' && avg > 72)) tips.push('Can feel warm at the daily high—easy to remove beats overheating.');
    else tips.push('Good mid-layer for today’s temperature swing.');
  }
  if (/jacket|coat|parka|puffer|bomber|blazer|windbreaker/i.test(i)) {
    if ((unit === 'C' && avg < 10) || (unit === 'F' && avg < 50)) tips.push('Outer layer makes sense; zip up when wind picks up.');
    if ((unit === 'C' && avg > 26) || (unit === 'F' && avg > 79)) tips.push('Might feel heavy at the peak—fine for cold offices/transit, peel if you’re outside in the heat.');
  }
  if (/shorts/i.test(i)) {
    if ((unit === 'C' && avg < 18) || (unit === 'F' && avg < 65)) tips.push('Shorts may be uncomfortable morning/evening—check the low.');
  }
  if (windy && /linen|thin\s+shirt|light\s+shirt/i.test(i)) tips.push('Wind cuts through light weave—add a denser layer or shell.');
  return tips.length ? tips : ['Use it as one layer in a stack you can add/remove across the day.'];
}

function generateActivitiesReply(ctx) {
  const cond   = (ctx.conditions || '').toLowerCase();
  const lo = ctx.tempmin, hi = ctx.tempmax;
  const avg    = (lo != null && hi != null) ? (lo + hi) / 2 : 18;
  const avgC   = unit === 'F' ? (avg - 32) * 5/9 : avg;
  const rainy  = cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower') || (ctx.precipprob != null && ctx.precipprob > 50);
  const storm  = cond.includes('thunder') || cond.includes('lightning');
  const snowy  = cond.includes('snow') || cond.includes('sleet');
  const isHot  = avgC >= 28;
  const isWarm = avgC >= 18 && avgC < 28;
  const isCool = avgC >= 10 && avgC < 18;
  const isCold = avgC < 10;
  const isFrz  = hi != null ? (unit === 'F' ? (hi - 32)*5/9 : hi) < 0 : false;
  const windy  = ctx.windspeed != null && ctx.windspeed > 30;

  let outdoor = [], indoor = [], notes = [];

  if (storm) {
    indoor  = ['Movie theater or streaming at home', 'Museum, art gallery, or aquarium', 'Bowling, arcade, or escape room', 'Coffee shop or restaurant', 'Indoor climbing gym'];
    notes.push('⛈️ Thunderstorms in the forecast — skip outdoor plans until it clears. Check live radar before heading anywhere exposed.');
  } else if (snowy && isFrz) {
    outdoor = ['Winter walk (bundle up, grippy shoes)', 'Skiing or snowboarding if near a resort', 'Sledding or snowball fights', 'Photography — snow scenes look great'];
    indoor  = ['Hot drink at a café', 'Museum or gallery', 'Cooking or baking at home', 'Gym workout', 'Movie or board games'];
    notes.push('❄️ Snow and freezing temps — waterproof boots with grip are a must for anything outside.');
  } else if (rainy) {
    outdoor = ['Short walk between showers (rain jacket + umbrella)', 'Covered farmer\'s market', 'Drive-through scenic route'];
    indoor  = ['Café, bookstore, or library', 'Museum, gallery, or aquarium', 'Bowling, arcade, or cinema', 'Cooking class or try a new recipe', 'Indoor pool or climbing gym'];
    notes.push('🌧️ Rain in the forecast — have a backup plan and check the hourly if timing matters.');
  } else if (isHot) {
    outdoor = ['Early morning run or walk (before 9am)', 'Pool, lake, or beach', 'Shaded trail or park with tree cover', 'Outdoor café in the shade (evening)'];
    indoor  = ['Air-conditioned museum or mall', 'Movie theater', 'Indoor gym or yoga studio'];
    notes.push('🔆 Very hot — save outdoor activity for early morning or after 6pm. Hydrate and take shade breaks.');
  } else if (isWarm) {
    outdoor = ['Walk, run, or bike a local route', 'Picnic in the park', 'Outdoor café or patio lunch', 'Hiking a local trail', 'Sports or frisbee in the park'];
    indoor  = ['Museum or gallery if you want A/C', 'Coffee shop or coworking'];
    notes.push('😊 Great weather to be outside — bring a light layer for when the temperature dips later.');
  } else if (isCool) {
    outdoor = ['Hike or trail walk (perfect cool temps)', 'Walk or jog — cool air is great for cardio', 'Outdoor market or festival', 'Cycling if not too windy'];
    indoor  = ['Coffee shop or bookstore', 'Museum or art gallery', 'Indoor workout'];
    notes.push('🌤 Cool and pleasant — great for anything active.');
  } else {
    outdoor = ['Bundled-up walk or light hike', 'Outdoor winter market if there is one', 'Quick errands or coffee to go'];
    indoor  = ['Gym, yoga studio, or indoor pool', 'Museum, gallery, or cinema', 'Café, bookstore, or library', 'Cook a warm meal at home'];
    notes.push('🧥 Cold out — dress properly and you\'re fine for short outdoor stints.');
  }

  if (windy && !storm) notes.push(`💨 It's windy (${windDisp(ctx.windspeed)}) — exposed activities like cycling and open trails will be more challenging.`);

  let reply = `Here are some ideas for ${disp(lo)}–${disp(hi)}, ${ctx.conditions || 'current conditions'}:\n\n`;
  if (outdoor.length) reply += `🌿 Outside:\n${outdoor.map(a => `• ${a}`).join('\n')}\n\n`;
  if (indoor.length)  reply += `🏠 Inside:\n${indoor.map(a => `• ${a}`).join('\n')}`;
  if (notes.length)   reply += `\n\n${notes.join('\n')}`;
  return reply + ASSISTANT_META + outfitWeatherSummary(ctx);
}

function generateOutfitScopeReply(ctx) {
  const body = `I'm not sure what you're looking for — I'm built around the weather forecast you loaded, so I do best with questions like:\n\n• "What should I wear today?"\n• "Is it a good day for a run / hike / picnic?"\n• "I have a hoodie, rain shell, and jeans — what works best?"\n• "Explain what's going on with this weather"\n• "What are some good activity ideas for today?"\n\nWhat would you like to know?`;
  return body + ASSISTANT_META + outfitWeatherSummary(ctx);
}

function isLocalOutfitOrActivityIntent(q) {
  const t = q.toLowerCase();
  return /\b(should i (wear|bring)|what to wear|what should i wear|i have |i got |i('ve| have) got|which (one|jacket|coat|layer)|activities|things to do|what to do|plan for today|outfit|layers for|wardrobe|what('?s| is) good to wear|dress for|how (should i|do i) dress)\b/i.test(t);
}

function answerActivityFeasibility(q, ctx) {
  const t = q.toLowerCase();

  // Wide-net detection for natural phrasing
  const isActivityQ =
    /\b(should|can|could|would|will)\s+(even\s+)?(i|we|you)\b/.test(t) ||
    /\b(will|can|could)\s+i\s+(get|have|develop|suffer)\b/.test(t) ||
    /\bis\s+(today|it|this|the weather)\s+(good|great|bad|ok|okay|fine|safe|ideal|perfect|terrible|worth it|too much|too hot|too cold)\b/.test(t) ||
    /\b(good|great|bad|ok|okay|fine|worth|safe|ideal|perfect|terrible|too\s+hot|too\s+cold)\s+(day\s+for|for|to)\b/.test(t) ||
    /\b(thinking|planning|want|going)\s+(of|to|about)\s+\w/.test(t) ||
    /\b(go\s+outside|head\s+out|outdoor|outdoors|outside\s+today|at\s+the\s+beach|on\s+the\s+pond|on\s+the\s+lake|at\s+the\s+park|in\s+the\s+park|leave\s+the\s+house|go\s+out\b|hang\s*(out|ing)|\berrands?\b)\b/.test(t) ||
    /\b(hike|hiking|run|running|jog|jogging|bike|biking|cycling|swim|swimming|golf|tennis|soccer|football|basketball|picnic|bbq|barbecue|grill|camp|camping|fish|fishing|ski|skiing|snowboard|skate|skating|kayak|surf|surfing|sail|sailing|garden|gardening|mow|mowing|drive|driving|walk|walking|stroll|workout|exercise|yoga|tan|tanning|sunbathe|sunbathing|beach|heat\s+stroke|sunstroke|uv|sun\s+exposure|park|hang\s+out|hangout|friends|leave\s+the\s+house|go\s+out|store|errand|outside)\b/.test(t);

  if (!isActivityQ) return null;

  const cond   = (ctx.conditions || '').toLowerCase();
  const lo = ctx.tempmin, hi = ctx.tempmax;
  const wind   = ctx.windspeed;
  const pp     = ctx.precipprob;
  const precip = ctx.precip;

  const avg  = (lo != null && hi != null) ? (lo + hi) / 2 : 18;
  const avgC = unit === 'F' ? (avg - 32) * 5/9 : avg;
  const hiC  = hi != null ? (unit === 'F' ? (hi - 32) * 5/9 : hi) : null;

  const isStorm     = /thunder|lightning|severe|tornado/.test(cond);
  const isHeavyRain = /heavy rain|downpour/.test(cond) || (precip != null && precip > 15);
  const isRain      = cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower');
  const isOvercast  = cond.includes('overcast') || (cond.includes('cloud') && !cond.includes('partly'));
  const isSnow      = cond.includes('snow') || cond.includes('sleet') || cond.includes('blizzard');
  const isFog       = cond.includes('fog') || cond.includes('mist');
  const isVeryWindy = wind != null && wind > 55;
  const isWindy     = wind != null && wind > 30;
  const isFreezing  = hiC != null && hiC < 0;
  const isCold      = avgC < 10;
  const isCool      = avgC >= 10 && avgC < 18;
  const isWarm      = avgC >= 18 && avgC < 28;
  const isHot       = avgC >= 28;
  const isVeryHot   = avgC >= 35;

  let act = null;
  // Ice-specific FIRST, then general
  if      (/\b(ice\s*fish(ing)?|ice-fish(ing)?)\b/.test(t))                    act = 'ice fishing';
  else if (/\b(ice\s*skat|pond\s*skat|lake\s*skat|skat(e|ing)\s+(on|at|in)\s+(the\s+)?(pond|lake|river|ice))\b/.test(t)) act = 'ice skating';
  else if (/\bskat(e|ing|ed|er)\b/.test(t))                                     act = 'ice skating';
  else if (/\b(tan(ning)?|sunbath(e|ing)|beach\s+day|at\s+the\s+beach|go(ing)?\s+to\s+the\s+beach)\b/.test(t)) act = 'tanning or beach';
  else if (/\b(heat\s*stroke|sun\s*stroke|heat\s*exhaustion|uv\s*(index|level|ray|condition|too\s+much)|too\s+much\s+sun|sun\s+exposure|sunburn)\b/.test(t)) act = 'sun safety';
  else if (/\b(run|jog|jogg|jogging|running)\b/.test(t))                        act = 'running';
  else if (/\b(hike|hiking|trail)\b/.test(t))                                   act = 'hiking';
  else if (/\b(bike|biking|cycling|cycle|bicycle)\b/.test(t))                   act = 'cycling';
  else if (/\b(swim|swimming|pool|open.water)\b/.test(t))                       act = 'swimming';
  else if (/\bgolf\b/.test(t))                                                   act = 'golf';
  else if (/\btennis\b/.test(t))                                                 act = 'tennis';
  else if (/\b(soccer|football|frisbee|rugby|lacrosse)\b/.test(t))              act = 'outdoor sports';
  else if (/\b(picnic|bbq|barbecue|grill|cookout)\b/.test(t))                   act = 'a picnic or BBQ';
  else if (/\b(camp|camping|campfire)\b/.test(t))                                act = 'camping';
  else if (/\b(fish|fishing|angling)\b/.test(t))                                act = 'fishing';
  else if (/\b(ski|skiing|snowboard|snowboarding)\b/.test(t))                   act = 'skiing';
  else if (/\b(kayak|canoe|paddle|rowing)\b/.test(t))                           act = 'kayaking';
  else if (/\b(surf|surfing)\b/.test(t))                                         act = 'surfing';
  else if (/\b(sail|sailing|boating)\b/.test(t))                                act = 'sailing';
  else if (/\b(garden|gardening|mow|mowing|yard\s*work|lawn)\b/.test(t))       act = 'yard work';
  else if (/\b(drive|driving|road\s*trip)\b/.test(t))                           act = 'driving';
  else if (/\b(walk|walking|stroll|dog\s*walk)\b/.test(t))                      act = 'a walk';
  else if (/\b(workout|work\s*out|exercise|outdoor\s*workout|yoga)\b/.test(t))  act = 'an outdoor workout';
  else if (/\b(wedding|ceremony|outdoor\s*event|outdoor\s*party)\b/.test(t))    act = 'an outdoor event';
  else if (/\b(go\s+outside|head\s+out|outside\s+today|outdoor\s+plans|leave\s+the\s+house|go\s+out\b|\bpark\b|hang\s*out|hangout|\bstore\b|\berrands?\b)\b/.test(t)) act = 'going outside';
  if (!act) return null;

  const tempRange = `${disp(lo)}–${disp(hi)}`;
  const windStr   = wind != null ? `winds ${windDisp(wind)}` : 'light winds';
  const rainStr   = pp   != null ? `${pp.toFixed(0)}% rain chance` : '';
  const summary   = [ctx.conditions, tempRange, windStr, rainStr].filter(Boolean).join(' · ');
  let verdict = '', tips = [], rating = '';

  if (isStorm) {
    return `📋 Activity check — **${act}**\nForecast: ${summary}\n\n🔴 Not recommended — thunderstorms make outdoor activity unsafe. Wait for it to fully pass and check live radar before heading out.`;
  }

  if (act === 'running') {
    if (isVeryHot)                     { rating = '🟡 High heat risk';           verdict = `Very hot running conditions. Go early morning or after sunset, shorten your distance, wear light breathable clothes, and hydrate before/during/after.`; }
    else if (isHot)                    { rating = '🟡 Warm run';                 verdict = `Warm but totally runnable. Bring water, dodge midday heat, and wear moisture-wicking fabric.`; }
    else if (isWarm)                   { rating = '🟢 Good conditions';          verdict = `Nice running weather. Light clothes and a water bottle — you're set.`; }
    else if (isCool)                   { rating = '🟢 Great conditions';         verdict = `Cool temps are ideal for running. A light jacket you can tie around your waist works great.`; }
    else if (isFreezing && avgC < -20) { rating = '🔴 Dangerously cold';         verdict = `At ${disp(lo)}–${disp(hi)}, running outside is genuinely dangerous. Frostbite can occur in minutes and breathing this air can damage your lungs. Use a treadmill today.`; }
    else if (isFreezing)               { rating = '🔴 Too cold to run safely';   verdict = `Sub-freezing (${disp(lo)}–${disp(hi)}) — running outside is not recommended. Frostbite risk and icy paths make this a treadmill day.`; }
    else if (isCold)                   { rating = '🟡 Cold run';                 verdict = `Cold but very runnable for most people. Gloves, a hat, and a moisture-wicking base layer make a big difference.`; }
    if (isHeavyRain) tips.push('Heavy rain makes surfaces slippery — the treadmill is a legitimate call today');
    else if (isRain) tips.push('Light rain: a water-resistant layer helps, expect wet shoes');
    if (isVeryWindy) tips.push(`Strong winds (${windDisp(wind)}) — run into the wind on the way out for a tailwind home`);
    if (isSnow) tips.push('Snow or ice on paths: shorten your stride and slow down');
  }
  else if (act === 'hiking') {
    if (isVeryHot)                     { rating = '🟡 Start at sunrise';          verdict = `Very hot for hiking. Go at first light, bring 2x the water you think you need, pick shaded trails, and turn back if dizzy.`; }
    else if (isHot)                    { rating = '🟡 Warm hike';                 verdict = `Warm conditions — hat, sunscreen, plenty of water, and pace yourself on climbs.`; }
    else if (isWarm || isCool)         { rating = '🟢 Great conditions';          verdict = `Excellent hiking weather. Comfortable temps so you can focus on the trail.`; }
    else if (isFreezing && avgC < -20) { rating = '🔴 Dangerously cold';          verdict = `At ${disp(lo)}–${disp(hi)}, hiking is genuinely dangerous. Frostbite and hypothermia risk are extreme.`; }
    else if (isFreezing)               { rating = '🔴 Too cold to hike safely';   verdict = `Sub-freezing (${disp(lo)}–${disp(hi)}) requires serious gear: microspikes, full insulating layers, waterproof shell. Tell someone your plan.`; }
    else if (isCold)                   { rating = '🟡 Cold hike';                 verdict = `Cold but hikeable. Layer up, bring an extra insulating layer, and wear waterproof boots.`; }
    if (isRain) tips.push('Rain: waterproof boots and jacket essential — muddy trails will be slippery');
    if (isSnow) tips.push('Snow: check trail conditions ahead — packed vs fresh powder changes difficulty dramatically');
    if (isVeryWindy) tips.push(`Very strong winds (${windDisp(wind)}) at elevation can be dangerous — avoid exposed ridgelines`);
    if (isFog) tips.push('Fog reduces trail visibility — stay on marked paths and have an offline map');
  }
  else if (act === 'cycling') {
    if (isHeavyRain)                   { rating = '🟡 Not ideal';                 verdict = `Heavy rain means poor visibility and slick roads. A rest day is reasonable.`; }
    else if (isRain)                   { rating = '🟡 Wet ride';                  verdict = `Light rain is manageable. Fenders, waterproof jacket, and lights are key. Watch slippery painted lines.`; }
    else if (isVeryHot)                { rating = '🟡 Heat ride';                 verdict = `Hot cycling — go early or late and carry more water than usual.`; }
    else if (isWarm || isCool)         { rating = '🟢 Good conditions';           verdict = `Solid conditions for a ride. A light wind layer in your pocket is worth it for descents.`; }
    else if (isFreezing)               { rating = '🔴 Dangerously icy';           verdict = `Sub-freezing (${disp(lo)}–${disp(hi)}) means black ice on roads — cycling outside is genuinely dangerous. Use a stationary bike today.`; }
    else if (isCold)                   { rating = '🟡 Cold ride';                 verdict = `Cold cycling: thermal bib, gloves, and a wind shell are key.`; }
    if (isVeryWindy) tips.push(`Strong crosswinds (${windDisp(wind)}) can push you sideways — consider a sheltered route`);
    else if (isWindy) tips.push(`Headwinds of ${windDisp(wind)} — ride into the wind first for a tailwind home`);
  }
  else if (act === 'swimming') {
    if (isVeryHot || isHot)            { rating = '🟢 Perfect swim day';          verdict = `Hot weather makes this ideal for the pool or beach. Sunscreen, hydration, shade breaks.`; }
    else if (isWarm)                   { rating = '🟢 Good swim weather';         verdict = `Pleasant conditions in and out of the water.`; }
    else if (isCool)                   { rating = '🟡 Cool air';                  verdict = `A heated pool is comfortable; open-water will feel cold getting in and out.`; }
    else if (isCold || isFreezing)     { rating = '🟡 Cold conditions';           verdict = `Cold outdoor swimming is uncomfortable or risky. Heated indoor pool is the smart call.`; }
    if (/thunder|lightning/.test(cond)) tips.push('⚠️ Never swim outdoors during lightning — clear the water immediately');
  }
  else if (act === 'golf') {
    if (isHeavyRain)                   { rating = '🔴 Course likely closed';      verdict = `Heavy rain will waterlog the course. Check before driving out.`; }
    else if (isRain)                   { rating = '🟡 Wet round';                 verdict = `Light rain golf is possible with waterproofs, but expect softer greens.`; }
    else if (isVeryHot)                { rating = '🟡 Heat round';                verdict = `Very hot — book a cart, plenty of water, and tee off early.`; }
    else if (isWarm || isCool)         { rating = '🟢 Good golf weather';         verdict = `Decent conditions. Light layers if it's on the cooler side.`; }
    else if (isCold)                   { rating = '🟡 Cold round';                verdict = `Chilly golf — hand warmers, extra layer, and the ball flies shorter in cold air.`; }
    if (isVeryWindy) tips.push(`Strong winds (${windDisp(wind)}) — club up and expect lateral movement`);
    else if (isWindy) tips.push(`Breezy (${windDisp(wind)}) — factor wind into every club selection`);
  }
  else if (act === 'a picnic or BBQ') {
    if (isHeavyRain || (isRain && pp != null && pp > 65)) { rating = '🔴 Rain will ruin it'; verdict = `High rain probability — move it indoors or reschedule.`; }
    else if (isRain)                   { rating = '🟡 Rain possible';             verdict = `Some rain chance — have a covered backup and recheck closer to the time.`; }
    else if (isVeryHot)                { rating = '🟡 Hot but doable';            verdict = `Very hot — set up in the shade, cold drinks, avoid peak sun (noon–3pm).`; }
    else if (isWarm || isCool)         { rating = '🟢 Great conditions';          verdict = `Excellent outdoor eating weather. Enjoy!`; }
    else if (isFreezing)               { rating = '🔴 No — way too cold';         verdict = `At ${disp(lo)}–${disp(hi)}, an outdoor picnic is not realistic. Everything will freeze. Stay inside.`; }
    else if (isCold)                   { rating = '🟡 Chilly but possible';       verdict = `Cold — a fire pit or patio heater makes a big difference. Layer up.`; }
    if (isVeryWindy) tips.push(`Strong winds (${windDisp(wind)}) — use a sheltered spot, everything will blow around`);
  }
  else if (act === 'camping') {
    if (isHeavyRain)                   { rating = '🟡 Wet camping';               verdict = `Heavy rain camping needs a bomber waterproof tent. Make sure your shelter is solid.`; }
    else if (isRain)                   { rating = '🟡 Light rain camping';        verdict = `Manageable with a good tent and rain layers. Campfires will be tough.`; }
    else if (isWarm || isCool)         { rating = '🟢 Good camping weather';      verdict = `Solid conditions. Pack extra layers — temps drop more than expected after dark.`; }
    else if (isCold || isFreezing)     { rating = '🟡 Cold camping';              verdict = `Needs a sleeping bag rated below the expected overnight low, insulating pad, and warm layers.`; }
    if (isVeryWindy) tips.push(`Very strong winds (${windDisp(wind)}) — stake every tent peg and avoid camping under large trees`);
  }
  else if (act === 'ice fishing') {
    if (!isFreezing && !isCold)        { rating = '🔴 Wrong conditions';          verdict = `At ${disp(lo)}–${disp(hi)}, it's too warm for ice fishing — there's no safe ice in these temps. This is regular open-water fishing weather, not ice fishing weather.`; }
    else if (isFreezing)               { rating = '🟡 Check ice thickness';       verdict = `Freezing temps are required for ice fishing, but always verify ice thickness before going out (4+ inches minimum for walking). Check local ice reports and never go alone.`; }
    else                               { rating = '🟡 Borderline';                verdict = `It's cold but not consistently freezing — ice may be thin or unstable. Check local ice conditions carefully before heading out.`; }
    if (isVeryWindy) tips.push(`Strong winds (${windDisp(wind)}) on open ice are brutal — wind chill will be extreme`);
  }
  else if (act === 'ice skating') {
    if (!isFreezing && !isCold)        { rating = '🔴 No ice in this weather';    verdict = `At ${disp(lo)}–${disp(hi)}, it's too warm for natural ice on ponds or lakes — any ice will be thin or already melting. For skating, you need an indoor rink today.`; }
    else if (isFreezing)               { rating = '🟡 Check ice conditions';      verdict = `Cold enough for ice to form, but always verify thickness before skating on natural ice (4+ inches minimum for a single person). Indoor rinks are always the safer option.`; }
    else                               { rating = '🟡 Marginal';                  verdict = `Cool but not consistently freezing — natural pond or lake ice is unlikely to be safe. Stick to an indoor rink.`; }
    if (isVeryWindy) tips.push(`Very windy (${windDisp(wind)}) — wind chill on open ice is brutal`);
  }
  else if (act === 'skiing') {
    if (!isSnow && !isFreezing && !isCold) { rating = '🔴 Wrong conditions'; verdict = `Not ski weather — you need snow and cold. Check the resort's snow report.`; }
    else if (isSnow && isFreezing)     { rating = '🟢 Good ski conditions';       verdict = `Snow and cold — classic ski weather. Check the resort's trail status.`; }
    else if (isCold)                   { rating = '🟢 Ski weather';               verdict = `Cold and clear is great for skiing. Layer up especially on the lifts.`; }
    if (isVeryWindy) tips.push(`Strong winds (${windDisp(wind)}) may close high-altitude lifts — check with the resort`);
  }
  else if (act === 'driving') {
    if (isHeavyRain)                   { rating = '🟡 Reduce speed';              verdict = `Heavy rain reduces visibility and hydroplaning risk. Slow down and increase following distance.`; }
    else if (isSnow && isFreezing)     { rating = '🟡 Hazardous roads';           verdict = `Snow and ice — allow 3x normal stopping distance and check road conditions before leaving.`; }
    else if (isFog)                    { rating = '🟡 Low visibility';            verdict = `Fog can cut visibility dramatically. Use low beams, slow down, increase following distance.`; }
    else                               { rating = '🟢 Normal conditions';         verdict = `No major weather concerns for driving today.`; }
    if (isVeryWindy) tips.push(`Very strong crosswinds (${windDisp(wind)}) can push high-profile vehicles — grip the wheel on open roads`);
  }
  else if (act === 'yard work') {
    if (isHeavyRain)                   { rating = '🔴 Skip it';                   verdict = `Heavy rain makes yard work pointless — soil is waterlogged and mowing wet grass damages the lawn.`; }
    else if (isRain)                   { rating = '🟡 Wait if you can';           verdict = `Wet grass is harder to mow and soil sticks to tools.`; }
    else if (isVeryHot)                { rating = '🟡 Early morning only';        verdict = `Too hot at midday — get out before 9am or after 6pm.`; }
    else if (isWarm || isCool)         { rating = '🟢 Great conditions';          verdict = `Good weather for yard work.`; }
    else if (isFreezing)               { rating = '🔴 Ground is frozen';          verdict = `Sub-freezing (${disp(lo)}–${disp(hi)}) — the ground is frozen solid. Most yard tasks are impossible.`; }
    else if (isCold)                   { rating = '🟡 Cold but workable';         verdict = `The work will warm you up. Frozen ground makes digging harder but mowing and raking are fine.`; }
    if (isVeryWindy) tips.push(`Strong winds (${windDisp(wind)}) — skip leaf blowing or raking until it calms down`);
  }
  else if (act === 'a walk') {
    if (isVeryHot)                     { rating = '🟡 Early/late only';           verdict = `Too hot midday — go morning or evening, bring water, stick to shade.`; }
    else if (isHot)                    { rating = '🟡 Warm walk';                 verdict = `Warm out. Water bottle, hat, shaded route.`; }
    else if (isWarm || isCool)         { rating = '🟢 Perfect walking weather';   verdict = `Great conditions for a walk. Get out there.`; }
    else if (isFreezing)               { rating = '🔴 Too cold for a walk';       verdict = `Sub-freezing (${disp(lo)}–${disp(hi)}) — keep outdoor time very short, cover all exposed skin, wear grippy waterproof boots.`; }
    else if (isCold)                   { rating = '🟡 Wrap up';                   verdict = `Cold but very walkable with a good jacket, hat, and gloves.`; }
    if (isHeavyRain) tips.push('Heavy rain — umbrella or rain jacket essential');
    else if (isRain) tips.push("Light rain — a compact umbrella or hooded jacket and you're good");
    if (isVeryWindy) tips.push(`Very gusty (${windDisp(wind)}) — a windproof layer makes a big difference`);
  }
  else if (act === 'an outdoor workout') {
    if (isVeryHot)                     { rating = '🟡 High heat risk';            verdict = `Exercising in extreme heat is dangerous. Go very early or late and hydrate aggressively.`; }
    else if (isWarm || isCool)         { rating = '🟢 Good conditions';           verdict = `Comfortable for outdoor exercise.`; }
    else if (isFreezing)               { rating = '🔴 Too cold for outdoor workout'; verdict = `Sub-freezing (${disp(lo)}–${disp(hi)}) — muscles seize up fast and sweating in this cold can be dangerous. Work out inside today.`; }
    else if (isCold)                   { rating = '🟡 Cold workout';              verdict = `Cold outdoor workouts are fine with proper layering. Warm up inside first.`; }
    if (isRain) tips.push('Rain: non-slip footwear matters more when surfaces are wet');
  }
  else if (act === 'an outdoor event') {
    if (isHeavyRain)                   { rating = '🟡 Shelter needed';            verdict = `Heavy rain will impact the event — a tent or covered venue is essential.`; }
    else if (isRain)                   { rating = '🟡 Have a backup';             verdict = `Some rain risk — have umbrellas or a covered area ready.`; }
    else if (isWarm || isCool)         { rating = '🟢 Good conditions';           verdict = `Comfortable outdoor event weather.`; }
    else if (isCold)                   { rating = '🟡 Chilly event';              verdict = `Cold — plan for heaters or fire pits, let guests know to dress warmly.`; }
    if (isVeryWindy) tips.push(`Strong winds (${windDisp(wind)}) — secure any tents, signage, and decorations`);
  }
  else if (act === 'tanning or beach') {
    if (isStorm)                       { rating = '🔴 Stay off the beach';        verdict = `Thunderstorms make beach trips dangerous. Stay off the water and away from open sandy areas until it fully clears.`; }
    else if (isHeavyRain)              { rating = '🔴 Not today';                 verdict = `Heavy rain — not a beach or tanning day.`; }
    else if (isVeryHot)                { rating = '🟡 Hot but risky';             verdict = `It's very hot (${disp(lo)}–${disp(hi)}) — tanning and beach time are possible but take it seriously. Sunscreen SPF 30+ is essential, limit midday exposure (10am–4pm), stay hydrated, and take shade breaks. Overheating and sunburn risk are real.`; }
    else if (isHot || isWarm)          { rating = '🟢 Good beach/tan weather';    verdict = `Nice conditions for the beach or some sun. Sunscreen is still a must even on partly cloudy days — UV gets through clouds. Bring water and take breaks in the shade.`; }
    else if (isCool)                   { rating = '🟡 Cool for a beach day';      verdict = `It's on the cooler side (${disp(lo)}–${disp(hi)}) — tanning will be slow and you may feel cold in the breeze. Doable if you're committed, but not ideal beach weather.`; }
    else if (isCold || isFreezing)     { rating = '🔴 Too cold for the beach';    verdict = `At ${disp(lo)}–${disp(hi)}, beach time or tanning outside is not comfortable or effective. Save it for a warmer day.`; }
    if (isRain) tips.push('Rain reduces UV but not to zero — sunscreen still matters');
    if (isVeryWindy) tips.push(`Strong winds (${windDisp(wind)}) on the beach — sand will blow everywhere and it may feel much colder than the temperature suggests`);
  }
  else if (act === 'sun safety') {
    const avgC2 = unit === 'F' ? (((ctx.tempmax??18)+(ctx.tempmin??18))/2 - 32)*5/9 : ((ctx.tempmax??18)+(ctx.tempmin??18))/2;
    if (isVeryHot || avgC2 >= 30)      { rating = '🟡 Real heat risk today';      verdict = `At ${disp(ctx.tempmin)}–${disp(ctx.tempmax)}, heat exhaustion and heat stroke are genuine risks for extended outdoor exposure. Drink water before you're thirsty, stay in shade during peak hours (10am–4pm), wear light loose clothing, and know the signs: heavy sweating, dizziness, nausea. If someone stops sweating but feels hot — that's heat stroke, get help immediately.`; }
    else if (isHot || isWarm)          { rating = '🟡 Moderate sun caution';      verdict = `Warm and sunny conditions today. UV can be significant even when it doesn't feel extreme — wear sunscreen (SPF 30+), reapply every 2 hours outdoors, and stay hydrated. Heat stroke risk is low at these temps for healthy adults doing normal activity.`; }
    else if (isCool || isCold)         { rating = '✅ Low heat risk';              verdict = `Cool temps mean heat stroke is not a concern today. UV can still reach you on clear days though — sunscreen is worth it if you're out for hours, especially at altitude or near water.`; }
    else                               { rating = '✅ Low heat risk';              verdict = `No significant heat or UV risk in these conditions. Stay hydrated as a general rule.`; }
    if (isOvercast) tips.push('Overcast skies block some UV but not all — sunscreen still recommended for long outdoor exposure');
  }
  else if (act === 'going outside') {
    if (isVeryHot)                     { rating = '🟡 Limit exposure';            verdict = `Very hot (${tempRange}). Limit time outside during peak hours and stay hydrated.`; }
    else if (isHeavyRain)              { rating = '🟡 Wet out there';             verdict = `Heavy rain — rain jacket and waterproof shoes if you're out for long.`; }
    else if (isWarm || isCool)         { rating = '🟢 Nice day';                  verdict = `Good conditions to be outside.`; }
    else if (isFreezing)               { rating = '🔴 Very cold';                 verdict = `Sub-freezing (${tempRange}) — minimize time outside and cover all exposed skin.`; }
    else if (isCold)                   { rating = '🟡 Bundle up';                 verdict = `Cold today — layers, hat, and gloves.`; }
    else                               { rating = '✅ Go for it';                  verdict = `Nothing alarming in the forecast. Dress for the temp and get out.`; }
  }

  if (!verdict) return null;

  const actTitle = act.charAt(0).toUpperCase() + act.slice(1);
  let response = `📋 **${actTitle}** — ${rating}\nForecast: ${summary}\n\n${verdict}`;
  if (tips.length) response += '\n\n💡 Tips:\n' + tips.map(tip => `• ${tip}`).join('\n');
  return response;
}

function buildWeatherEducationReply(q) {
  const t = q.toLowerCase();
  if (isLocalOutfitOrActivityIntent(q)) return null;

  const rules = [
    {
      test: () => /jet\s*stream|jetstream/.test(t) || (/jet/.test(t) && /stream/.test(t)) || (/dip|dips|trough|ridge|rossby/i.test(t) && /jet/.test(t)),
      text: `The jet stream is a narrow ribbon of very strong winds high in the atmosphere (often along the boundary between cold air to the north and warmer air to the south). It doesn’t run in a straight line: it makes big north–south bends called Rossby waves.

When that ribbon dips south over your part of the world (a trough), weather systems can pull much colder air down from the Arctic or Canada. When it bulges north (a ridge), milder air can spread farther north than usual. So a “dip” in the jet stream is often when you hear about a cold blast—even though your backyard temperature comes from many details, that large pattern is a classic reason cold air reaches mid-latitudes.

(This is general meteorology. Your loaded forecast below is still the practical snapshot for dressing and plans.)`,
    },
    {
      test: () => /polar\s*vortex/.test(t),
      text: `The polar vortex is a large area of low pressure and cold air that normally stays near the poles. Sometimes pieces of that circulation stretch or shift, allowing very cold air to spill much farther south than usual. News often says “the polar vortex” when a chunk of Arctic air affects the U.S. or Europe.

(General idea—not a replacement for a full forecast; use the numbers below for today.)`,
    },
    {
      test: () => /high\s*pressure/.test(t) && /low\s*pressure/.test(t),
      text: `High pressure (an anticyclone) is associated with sinking air, which often suppresses clouds and brings calmer, fairer weather. Low pressure means rising air, cloud formation, and more unsettled or stormy conditions. Around highs in the Northern Hemisphere, winds tend to blow clockwise at the surface; around lows, counterclockwise.

(General pattern—your loaded forecast tells you what’s actually expected today.)`,
    },
    {
      test: () => /\bcold\s*front\b/.test(t),
      text: `A cold front is the leading edge of a colder air mass pushing under warmer air. Along it you often get a wind shift, a temperature drop, and sometimes a band of clouds, showers, or thunderstorms as the warm air is lifted. The sharper the contrast, the more dramatic the weather can be.

(Conceptual—local timing and intensity come from the forecast below.)`,
    },
    {
      test: () => /\bwarm\s*front\b/.test(t),
      text: `A warm front is the boundary where warmer, often moister air slides up over cooler air ahead of it. Clouds and light-to-moderate precipitation are common along and ahead of it; freezing rain or ice can happen if the surface is still cold while warm air rides overhead.

(General meteorology—your panel shows what’s expected for your selected day.)`,
    },
    {
      test: () => /high\s*pressure|anticyclone/.test(t) && !/low\s*pressure/.test(t),
      text: `High pressure (an anticyclone) usually means sinking air, which tends to suppress clouds and give calmer, fair weather—though in winter it can also trap cold air near the ground (sometimes with fog or temperature inversions). Winds often flow clockwise around highs in the Northern Hemisphere.

(Broad pattern—hourly conditions still come from your forecast.)`,
    },
    {
      test: () => /low\s*pressure|cyclone\b/.test(t) && !/high\s*pressure/.test(t),
      text: `Low pressure means air is rising. Rising air cools and can form clouds and precipitation, so lows are often linked to storms, wind, and unsettled weather. Winds tend to blow counterclockwise around lows in the Northern Hemisphere.

(Conceptual background—use the loaded data for what to expect where you are.)`,
    },
    {
      test: () => /dew\s*point/.test(t) && /humid|relative|difference|vs|versus/.test(t),
      text: `Relative humidity tells you how full the air is relative to the maximum it could hold at that temperature—it changes when temperature changes. Dew point is the temperature air would need to cool to for dew to form; it’s a direct measure of moisture in the air. Two days with the same humidity can feel different if dew points differ; high dew point usually feels muggier.

(Handy for comfort—your outfit logic still uses the forecast we loaded.)`,
    },
    {
      test: () => /^what (is|'s)\s+(relative\s+)?humidity\b/i.test(q.trim()) || (/\bhumidity\b/.test(t) && /what (is|does|means)/.test(t)),
      text: `Relative humidity is the amount of water vapor in the air compared to the maximum it could hold at that temperature, shown as a percent. It’s not the whole story for “mugginess”—dew point often tracks comfort better because hot air can hold more moisture.

(General definition—local “feels like” still comes from the forecast.)`,
    },
    {
      test: () => /thunderstorm|lightning/i.test(t) && /(why|how|cause|form)/.test(t),
      text: `Thunderstorms build when warm, moist air rises quickly (updrafts), forming tall clouds. Inside, ice particles collide and charge separation can produce lightning; thunder is the sound of rapidly heated air expanding. Wind shear, fronts, or mountain lift can organize stronger storms.

(Short version—severe weather needs official watches/warnings, not this app.)`,
    },
    {
      test: () => /(why|how).*(rain|precip|snow).*(form|fall)|rain.*form|precipitation.*form/.test(t),
      text: `Rain and snow form when air rises and cools until water vapor condenses into cloud droplets or ice crystals. If those grow heavy enough, they fall. Snow reaches the ground when the column stays cold enough; sometimes warm layers aloft melt snow into rain near the surface.

(Physics in a nutshell—amounts and type for your day are in the forecast below.)`,
    },
    {
      test: () => /coriolis|why.*(storms?|hurricanes?).*spin|spin.*hemisphere/i.test(t),
      text: `The Coriolis effect comes from Earth’s rotation: moving air appears to curve. In the Northern Hemisphere, large-scale flows tend to turn right, which helps give low-pressure systems their counterclockwise spin and highs their clockwise flow. It’s weak for small distances but matters for synoptic-scale weather.

(Intro-level—your local wind still comes from the forecast.)`,
    },
    {
      test: () => /el\s*ni[ñn]o|la\s*ni[ñn]a|enso/i.test(t),
      text: `El Niño and La Niña are opposite phases of a slow oscillation in tropical Pacific ocean temperatures. They nudge global weather patterns (e.g., jet stream position, drought/wet odds in some regions) over months—not day-to-day city forecasts, but useful for seasonal outlooks.

(Climate pattern—today’s numbers below are still what we use for outfits.)`,
    },
  ];

  for (const r of rules) {
    try {
      if (r.test()) return r.text;
    } catch (_) {}
  }

  const looksConceptual = /^(why|how|what causes|explain|what is the (difference|meaning))\b/i.test(q.trim()) ||
    /\b(why|how does|what causes)\s+\w/.test(t);
  const weatherScience = /jet|stream|front|pressure|humidity|dew|cloud|rain|snow|storm|thunder|lightning|tornado|hurricane|climate|atmosphere|arctic|tropical|wind pattern|weather pattern|meteorolog|forecasting|latitude|troposphere/i.test(t);
  if (looksConceptual && weatherScience && !/should i wear|what to wear|bring a jacket|outfit for/i.test(t)) {
    return `That’s a real meteorology question. This app only has short, built-in blurbs on a handful of topics (jet stream, fronts, pressure, humidity, storms, etc.). For deeper or niche answers, try NOAA’s JetStream school, a university “intro to meteorology” resource, or a textbook.

Your loaded forecast at the bottom is still the right reference for clothing and activities today—not the same thing as global dynamics, but both are “weather.”`;
  }

  return null;
}

function isForecastAnchoredMeteorologyAsk(q) {
  if (isLocalOutfitOrActivityIntent(q)) return false;
  const t = q.toLowerCase();
  const refsNumbers = /(this|the|my)\s+(weather\s+)?forecast|these\s+(numbers|temps|temperatures)|loaded\s+(forecast|data)|the\s+numbers\s+(below|above)|in\s+the\s+panel|for\s+this\s+weather|this\s+weather\s+pattern/.test(t);
  const wantsMeta = /\bmeteorolog|synoptic|science\s+tip|general\s+(tip|tips|note|notes|advice)|\binsights?\b|\bany\s+other\b|\bwhat\s+else\b|tip(s)?\s+(for|about|on|from)|notes?\s+on\s+the\s+forecast|explain\s+(this|the)\s+(forecast|weather|pattern)/.test(t);
  const basedOn = /\bbased\s+on\b/.test(t) && /forecast|weather|these|numbers/.test(t);
  if (refsNumbers && (wantsMeta || basedOn)) return true;
  if (basedOn && wantsMeta) return true;
  if (wantsMeta && refsNumbers) return true;
  return false;
}

function isLocalWeatherExplainerAsk(q) {
  if (isLocalOutfitOrActivityIntent(q)) return false;
  if (isForecastAnchoredMeteorologyAsk(q)) return true;
  const t = q.toLowerCase();
  const localCue = /(this|the|my)\s+(weather|forecast|area|region|city|location|place|snapshot)|\bhere\b|right\s+now|today|loaded|below|panel|these\s+numbers|these\s+temps|this\s+weather|my\s+area|outside\s+here|where\s+i\s+(am|live)/.test(t);
  const wx = /\bweather\b|forecast|cold|hot|warm|chill|humid|rain|snow|wind|storm|cloud|pressure|pattern|conditions|temperature|freez|drizzle|shower|thunder|fog|hail|ice/.test(t);
  const wantsNarrative = /explain|describe|what\s+('?s|is)\s+(going on|happening)|talk\s+me\s+through|what\s+kind\s+of|what\s+does\s+this|tell\s+me\s+about|why\s+is\s+it|why\s+are\s+we|how\s+(bad|cold|hot|windy|wet)|insight|summary|overview|breakdown|science\s+behind|understand|going\s+on\s+with|experiencing|what\s+.*\s+pattern|pattern\s+.*\s+(here|now|today)/i.test(t);
  if (wx && wantsNarrative && (localCue || /\b(why|how)\b/.test(t))) return true;
  if (wx && /(what|how)\s+.*\s+(weather|conditions|forecast|like\s+outside)/.test(t) && localCue) return true;
  return false;
}

function generateLocalWeatherExplainer(ctx) {
  const place = ctx.resolvedAddress || 'this location';
  const dateStr = ctx.dateStr;
  const dateFmt = dateStr
    ? new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})
    : '';
  const lo = ctx.tempmin, hi = ctx.tempmax;
  const spread = (lo != null && hi != null) ? Math.abs(hi - lo) : null;
  const condRaw = ctx.conditions || '—';
  const cond = condRaw.replace(/\b\w/g, c => c.toUpperCase());
  const condL = condRaw.toLowerCase();
  const pp = ctx.precipprob;
  const precip = ctx.precip;
  const wind = ctx.windspeed;

  const tags = [];
  if (hi != null && hi < -18) tags.push('very cold air');
  else if (hi != null && hi < 0) tags.push('below-freezing temperatures');
  else if (hi != null && hi < 10) tags.push('cool to cold conditions');
  if (spread != null && spread < 4 && hi != null && hi < 8) tags.push('a small day–night temperature range');
  if (spread != null && spread > 12) tags.push('a wide swing between morning and afternoon');
  if ((pp != null && pp > 50) || /rain|drizzle|shower|snow|sleet/.test(condL)) tags.push('moisture in play');
  if (wind != null && wind > 30) tags.push('strong wind');
  else if (wind != null && wind > 15) tags.push('breezy conditions');
  if (/clear|sunny|mainly clear/.test(condL)) tags.push('plenty of clear sky');
  if (/overcast|cloud/.test(condL)) tags.push('lots of cloud cover');
  const tagStr = tags.length ? tags.join(', ') : 'conditions driven by the large-scale pattern for that day';

  let opening = `For ${place}`;
  if (dateFmt) opening += ` on ${dateFmt}`;
  opening += `, the snapshot you loaded describes ${cond} with a low near ${disp(lo)} and a high near ${disp(hi)}. In plain terms, that’s ${tagStr}.`;

  const tips = [];
  if (lo != null && hi != null && hi < -20) {
    tips.push(`Very cold air (${disp(lo)} to ${disp(hi)}) is usually dry; any breeze sharply increases frostbite risk on exposed skin.`);
  } else if (lo != null && hi != null && hi < 0) {
    tips.push(`With the whole day below freezing, frozen precip or icy patches are more likely than plain rain—watch steps and roads after any melt–refreeze.`);
  }
  if (spread != null && spread < 5 && hi != null && hi < 8) {
    tips.push(`When the high and low sit only a few degrees apart, you’re often under a steady airmass or persistent cloud, or the winter sun is too weak to warm things much—don’t expect a big afternoon “thaw” unless the pattern shifts.`);
  }
  if (spread != null && spread > 12) {
    tips.push(`A wide spread (${disp(lo)} to ${disp(hi)}) often means clear nights cooling the air fast, or a changing airmass—dress in layers you can add or remove.`);
  }
  if (wind != null && wind > 35) {
    tips.push(`Wind around ${windDisp(wind)} adds wind chill: the same number on the thermometer can feel much colder.`);
  } else if (wind != null && wind > 18) {
    tips.push(`Wind at ${windDisp(wind)} still matters for comfort when it’s cold—small changes in breeze change how it feels.`);
  }
  if (pp != null && pp > 55) {
    tips.push(`Precipitation chances near ${pp.toFixed(0)}% mean rising air and moisture are lined up; hourly timing can still differ from the daily summary.`);
  } else if (precip != null && precip > 2 && pp != null && pp > 15) {
    tips.push(`About ${precipDisp(precip)} in the daily total can still affect travel and traction, especially near freezing.`);
  }
  if (/clear|mainly clear|sunny/.test(condL)) {
    tips.push(`Clear skies let heat escape overnight (radiational cooling), which can widen the daily range unless wind mixes the air.`);
  } else if (/overcast|cloud|fog/.test(condL)) {
    tips.push(`Cloud cover limits how far temperatures can fall at night and can make the day feel steadier, temperature-wise.`);
  }
  if (tips.length === 0) {
    tips.push(`What you see locally still sits inside bigger systems—jet stream dips, fronts, and highs/lows hundreds of miles away all nudge the hour-by-hour reality on the ground.`);
  }

  return `Local weather snapshot (from your loaded forecast, not a live forecaster):\n\n${opening}\n\n${tips.slice(0, 6).join('\n\n')}`;
}

function isPickOneQuestion(q) {
  return /\bwhich\s+(one|jacket|coat|layer|piece|option)\b|\bwhich\s+should\s+i\b|\bwhat\s+should\s+i\s+(bring|wear|pick)\b|\bbest\s+(one|choice|jacket|layer)\b|\bpick\s+(one|between)|\bonly\s+bring\s+one\b|\bshould\s+i\s+bring\b/i.test(q);
}

function generatePickOneReply(items, ctx) {
  const lo = ctx.tempmin, hi = ctx.tempmax;
  const spread = (lo != null && hi != null) ? Math.abs(hi - lo) : 0;
  const cond = (ctx.conditions || '').toLowerCase();
  const rainy = cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower') || (ctx.precipprob != null && ctx.precipprob > 40);
  const bigSwing = (unit === 'C' && spread >= 8) || (unit === 'F' && spread >= 15);

  const pick = re => items.find(s => re.test(s.toLowerCase()));
  const waterproof = pick(/waterproof|water[- ]?resist|rain\s*shell|\bshell\b|poncho/);
  const puffer = pick(/\bpuffer|down\b|insulated/);
  const hoodieHeavy = pick(/hoodie|thicker|heavy|fleece|sweatshirt/);

  const parts = [];

  if (rainy && waterproof) {
    parts.push(`Short answer: bring your ${waterproof} if you can only take one. Rain is enough of a factor that staying dry matters more than maximum warmth.`);
    if (hoodieHeavy) parts.push(`You can wear something lighter underneath; the ${hoodieHeavy} is backup warmth if it’s cold after the rain.`);
    if (puffer && !hoodieHeavy) parts.push(`The ${puffer} is less useful while it’s wet unless you keep it under the shell—on its own it won’t keep rain out.`);
  } else if (bigSwing) {
    const shellIsLight = waterproof && /thin|light|packable/i.test(waterproof);
    if (shellIsLight) {
      parts.push(`Short answer: bring your ${waterproof}. You’re swinging from about ${disp(lo)} to ${disp(hi)}—a lighter shell stays tolerable near the high, and you can add a sweater or hoodie underneath for the cold starts and ends.`);
      if (puffer) parts.push(`Treat the ${puffer} as optional: great if you’ll be outside at dawn/dusk or not moving much; skip it if you need one jacket for the whole day including the warmest hours.`);
    } else if (hoodieHeavy) {
      parts.push(`Short answer: your ${hoodieHeavy} is the most flexible single jacket—warm for the cold parts (${disp(lo)}), and you can unzip or lighten base layers when it climbs toward ${disp(hi)}.`);
      if (waterproof) parts.push(`If rain shows up, layer the ${waterproof} on top instead of swapping your whole outfit.`);
      if (puffer && !waterproof) parts.push(`The ${puffer} runs hot at ${disp(hi)} unless you’re only out in the cold hours—prefer the hoodie-style jacket for an all-day carry.`);
    } else if (waterproof) {
      parts.push(`Short answer: take the ${waterproof} and plan layers underneath for ${disp(lo)}; it’s usually easier to adjust under a shell than to lug one very warm coat through ${disp(hi)}.`);
    }
    if (puffer && !parts.some(p => p.includes(puffer))) {
      parts.push(`The ${puffer} is best for early morning / late evening or standing still; at the daily high (${disp(hi)}) it can feel heavy if you’re outside all day.`);
    }
    if (!parts.length) {
      parts.push(`With a wide range from ${disp(lo)} to ${disp(hi)}, favor the option you can adjust (zip/layer) over the warmest single coat unless you’ll only be out in the cold hours.`);
    }
  } else if (puffer && (unit === 'C' ? (lo ?? 0) < 8 : (lo ?? 0) < 46)) {
    parts.push(`Short answer: the ${puffer} is a strong pick—lows are chilly and you won’t fight the forecast as much as with a thin shell alone.`);
  } else {
    parts.push(`Short answer: among what you listed, take the one that matches the “worst” hour you’ll be outside (coldest + wettest). If it’s dry, bias toward comfort at ${disp(lo)}; if wet, bias toward the most waterproof piece.`);
  }

  const body = parts.join('\n\n');
  return body + ASSISTANT_META + outfitWeatherSummary(ctx);
}

function generateWardrobeReply(q, ctx) {
  const phrase = extractWardrobePhrase(q);
  const stripped = stripTrailingChoiceQuestion(q);
  const fromCommas = (stripped.match(/,/g) || []).length >= 1 ? stripped : '';
  const items = parseClothingItems(phrase || fromCommas || stripped);
  const clothingish = items.filter(s => CLOTHING_RE.test(s));
  const useItems = clothingish.length ? clothingish : items;

  if (!useItems.length) {
    const body = `List what you have using commas, for example: "black jeans, hoodie, rain shell, boots". I’ll map each piece to today’s ${disp(ctx.tempmax)} high / ${disp(ctx.tempmin)} low and conditions.`;
    return body + ASSISTANT_META + outfitWeatherSummary(ctx);
  }

  if (isPickOneQuestion(q) && useItems.length >= 2) {
    return generatePickOneReply(useItems, ctx);
  }

  const bullets = useItems.slice(0, 12).map(it => `• ${it}: ${itemWearTips(it, ctx)[0]}`);
  let out = `Here’s how each piece lines up with the forecast:\n\n`;
  out += bullets.join('\n');
  if (useItems.length > 12) out += '\n\n(Showing the first 12 items—send another message if you want more.)';
  out += `\n\nStacking order: breathable base → warmth mid → wind/rain outer. Peel at the warmest part of the day (${disp(ctx.tempmax)}).`;
  return out + ASSISTANT_META + outfitWeatherSummary(ctx);
}

function generateOutfitFollowup(q, ctx) {
  const lower = q.toLowerCase();

  // 1. Activity feasibility before wardrobe check so "thinking of going hiking" doesn't get parsed as clothing
  const earlyFeasibility = answerActivityFeasibility(q, ctx);
  if (earlyFeasibility) return earlyFeasibility + ASSISTANT_META + outfitWeatherSummary(ctx);

  // 2. Clothing items
  const phrase = extractWardrobePhrase(q);
  const stripped = stripTrailingChoiceQuestion(q);
  const commaList = (stripped.match(/,/g) || []).length >= 1;
  const itemsFromPhrase = phrase ? parseClothingItems(phrase) : [];
  const itemsFromStripped = commaList ? parseClothingItems(stripped) : [];
  const wardrobeish = phrase || (commaList && (itemsFromPhrase.length || itemsFromStripped.some(s => CLOTHING_RE.test(s))));
  if (wardrobeish) return generateWardrobeReply(q, ctx);

  // 3. General activity ideas
  const activityIdeasHit = (
    /\b(what\s+(should|can|could)\s+i\s+do)\b/i.test(q) ||
    /\b(which|what)\s+activities\s+(make|makes|would|might)\s+sense\b/i.test(q) ||
    /\bactivities\s+that\s+(make|makes|would)\s+sense\b/i.test(q) ||
    /\bwhat\s+(are|is)\s+(good|fun|some|great|nice|cool)\s+(activities|things|plans|ideas|stuff)\b/i.test(q) ||
    /\b(things|stuff|activities|ideas)\s+to\s+do\b/i.test(q) ||
    /\b(activity|activities)\s+ideas?\b/i.test(q) ||
    /\b(fun|plans?)\s+(today|for today|this weather|in this weather)\b/i.test(q) ||
    /\bhow\s+should\s+i\s+spend\b/i.test(q) ||
    /\bwhat\s+to\s+do\s+(today|outside|in this weather)\b/i.test(q) ||
    /\bsuggest\s+(something|activities|plans|ideas)\b/i.test(q) ||
    /\bany\s+(good\s+)?(ideas|suggestions|recommendations)\b/i.test(q) ||
    /\bgood\s+(activities|things|stuff)\s+(to do|for today|in this weather)\b/i.test(q)
  );
  if (activityIdeasHit) return generateActivitiesReply(ctx);

  // 4. Weather education
  const weatherEdu = buildWeatherEducationReply(q);
  if (weatherEdu) return weatherEdu + ASSISTANT_META + outfitWeatherSummary(ctx);

  // 5. Local weather explainer
  if (isLocalWeatherExplainerAsk(q)) {
    return generateLocalWeatherExplainer(ctx) + ASSISTANT_META + outfitWeatherSummary(ctx);
  }

  // 6. Greeting 
  const isGreeting = /^(hi|hey|hello|what'?s up|sup|yo|howdy|good (morning|afternoon|evening))[!?.]*$/i.test(q.trim());
  if (isGreeting) {
    const body = `Hey! I'm your weather assistant for ${ctx.resolvedAddress || 'your loaded location'}. Ask me anything — what to wear, whether it's a good day for a specific activity, or what's going on with the weather.`;
    return body + ASSISTANT_META + outfitWeatherSummary(ctx);
  }

  // 7. Simple weather questions
  const simpleWeatherQ = /(is it|will it|is there|how (cold|hot|warm|windy|rainy|wet|bad)|what('?s| is) the (temperature|temp|high|low|wind|rain|forecast)|is\s+(rain|snow|wind|storm)\s+expected)/i.test(lower);
  if (simpleWeatherQ) {
    return generateLocalWeatherExplainer(ctx) + ASSISTANT_META + outfitWeatherSummary(ctx);
  }

  return generateOutfitScopeReply(ctx);
}

function appendOutfitChat(role, content) {
  const thread = document.getElementById('ai-thread');
  if (!thread) return;
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg-' + role;
  if (role === 'assistant') {
    const idx = content.indexOf(ASSISTANT_META);
    if (idx >= 0) {
      const body = content.slice(0, idx).trim();
      const meta = content.slice(idx + ASSISTANT_META.length).trim();
      const bodyEl = document.createElement('div');
      bodyEl.className = 'assistant-body';
      bodyEl.style.whiteSpace = 'pre-wrap';
      bodyEl.textContent = body;
      div.appendChild(bodyEl);
      const metaEl = document.createElement('div');
      metaEl.className = 'assistant-meta';
      metaEl.textContent = meta;
      div.appendChild(metaEl);
    } else {
      div.textContent = content;
    }
  } else {
    div.textContent = content;
  }
  thread.appendChild(div);
  thread.scrollTop = thread.scrollHeight;
}

function clearOutfitThread() {
  const thread = document.getElementById('ai-thread');
  if (thread) thread.innerHTML = '';
}

/** Re-run the opening outfit message when C/F changes */
function refreshOutfitMainSuggestion() {
  if (!outfitChatContext) return;
  const panel = document.getElementById('ai-panel');
  const el = document.getElementById('ai-response');
  if (!el || !panel || panel.style.display === 'none') return;
  const c = outfitChatContext;
  el.textContent = getOutfitSuggestion(
    c.resolvedAddress,
    c.dateStr,
    c.tempmax,
    c.tempmin,
    c.conditions,
    c.windspeed
  );
  el.classList.add('loaded');
}

function sendOutfitFollowup() {
  const input = document.getElementById('ai-followup-input');
  const btn = document.getElementById('ai-followup-send');
  if (!input || !outfitChatContext) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  appendOutfitChat('user', text);
  if (btn) btn.disabled = true;
  setTimeout(() => {
    try {
      appendOutfitChat('assistant', generateOutfitFollowup(text, outfitChatContext));
    } finally {
      if (btn) btn.disabled = false;
    }
  }, 160);
}

