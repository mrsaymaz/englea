/* Picture gates: small inline line drawings for concrete vocabulary. No image downloads.
   Each entry is SVG markup for a 64 × 64 viewBox. Strokes use currentColor; class "a" is a soft accent fill. */
(function(root){
  'use strict';
  const P={
    // School and classroom
    flag:'<path d="M16 58V8"/><path class="a" d="M16 10h32l-7 9 7 9H16z"/>',
    chess:'<path class="a" d="M18 52h28l-3-10c6-6 6-18-2-26l-6 3-1-11c-10 2-17 10-17 22 0 6 4 9 5 12l-4 2z"/><path d="M14 58h36M20 36l8-6"/><circle cx="30" cy="22" r="2"/>',
    notebook:'<rect class="a" x="16" y="8" width="34" height="48" rx="3"/><path d="M24 8v48M30 20h14M30 28h14M30 36h10"/><path d="M12 16h8M12 26h8M12 36h8M12 46h8"/>',
    desk:'<path class="a" d="M8 24h48v8H8z"/><path d="M12 32v24M52 32v24M36 32v14h16"/><path d="M40 39h8"/>',
    eraser:'<path class="a" d="M14 42 34 14l18 12-20 28z"/><path d="M24 28l18 12"/><path d="M10 56h44"/>',
    ruler:'<rect class="a" x="6" y="24" width="52" height="16" rx="2"/><path d="M14 24v7M22 24v5M30 24v7M38 24v5M46 24v7M54 24v5"/>',
    scissors:'<circle class="a" cx="18" cy="46" r="7"/><circle class="a" cx="46" cy="46" r="7"/><path d="M23 41 46 8M41 41 18 8"/>',
    glue:'<path class="a" d="M20 24h24v32H20z"/><path d="M24 24v-8h16v8M28 16l4-8 4 8"/><path d="M24 36h16"/>',
    bookshelf:'<rect x="10" y="6" width="44" height="52" rx="2"/><path d="M10 32h44"/><path class="a" d="M15 12h6v20h-6zM23 15h6v17h-6zM33 11l6 1-3 20-6-1zM16 38h6v20h-6zM24 40h12v18H24z"/>',
    // Clothes and body
    gloves:'<path class="a" d="M14 56V30l-4-10c-1-3 3-5 5-2l4 8V12c0-3 5-3 5 0v14-18c0-3 5-3 5 0v18-14c0-3 5-3 5 0v26l-2 18z"/><path d="M14 50h18"/><path class="a" d="M38 56V40l3-8c1-3 5-2 4 1l-2 7 4-14c1-3 5-2 4 1l-1 6 3-4c2-2 5 0 3 3l-6 14v10z"/>',
    scarf:'<path class="a" d="M12 12c12 8 28 8 40 0l-2 12c-12 6-24 6-36 0z"/><path class="a" d="M34 24l6 30-8 2-6-30"/><path d="M33 56l1 4M37 55l2 4M32 44l7-2"/>',
    belt:'<rect class="a" x="4" y="26" width="56" height="12" rx="3"/><rect x="24" y="22" width="16" height="20" rx="2"/><path d="M32 26v12"/><path d="M48 32h0M54 32h0"/>',
    boots:'<path class="a" d="M10 8h16v32l14 8c4 2 4 8 0 8H10z"/><path d="M10 48h30"/><path class="a" d="M38 8h12v24l8 6v18H38z" opacity=".6"/>',
    sunglasses:'<path d="M4 24h56"/><path class="a" d="M8 24h20l-2 12c-1 5-14 5-16 0zM36 24h20l-2 12c-1 5-14 5-16 0z"/><path d="M28 28c2-2 6-2 8 0"/>',
    raincoat:'<path class="a" d="M24 8h16l14 14-6 6-4-4v34H20V24l-4 4-6-6z"/><path d="M32 8v50M28 32h0M28 42h0"/><path d="M24 8c0 6 16 6 16 0"/>',
    teeth:'<path class="a" d="M8 26c8-10 40-10 48 0-4 8-8 26-14 26-4 0-4-12-10-12s-6 12-10 12c-6 0-10-18-14-26z"/><path d="M22 22v12M32 21v13M42 22v12"/>',
    trainers:'<path class="a" d="M6 46c0-8 2-14 6-20l10 4 6-8c4 6 10 10 20 12 6 1 10 5 10 12v4H6z"/><path d="M6 52h52M24 32l4 4M30 30l4 4"/>',
    bracelet:'<ellipse class="a" cx="32" cy="34" rx="22" ry="14"/><ellipse cx="32" cy="34" rx="15" ry="8"/><circle cx="32" cy="20" r="3"/><circle cx="18" cy="24" r="2.5"/><circle cx="46" cy="24" r="2.5"/>',
    necklace:'<path d="M12 8c0 20 8 30 20 30s20-10 20-30"/><path class="a" d="M32 38l8 8-8 12-8-12z"/>',
    wallet:'<rect class="a" x="8" y="16" width="48" height="36" rx="4"/><path d="M40 28h16v12H40a6 6 0 0 1 0-12z"/><circle cx="42" cy="34" r="2"/><path d="M12 16l26-8 4 8"/>',
    heart:'<path class="a" d="M32 54 10 32C2 24 8 10 20 10c6 0 10 4 12 8 2-4 6-8 12-8 12 0 18 14 10 22z"/>',
    moustache:'<path class="a" d="M32 30c-6-8-14-8-18-2-3 5-8 6-10 3 1 9 12 13 20 8 4-2 6-5 8-9 2 4 4 7 8 9 8 5 19 1 20-8-2 3-7 2-10-3-4-6-12-6-18 2z"/>',
    // Hobbies, family life, objects
    tent:'<path class="a" d="M6 52 32 12l26 40z"/><path d="M32 12v40M24 52l8-14 8 14"/><path d="M4 52h56"/>',
    guitar:'<path class="a" d="M22 34c-8-2-16 4-14 12s12 12 18 6c4 2 10-2 8-8 4-6-2-12-12-10z"/><path d="M27 37 52 12M48 8l8 8"/><circle cx="22" cy="44" r="3"/>',
    camera:'<rect class="a" x="6" y="18" width="52" height="34" rx="5"/><path d="M22 18l4-8h12l4 8"/><circle cx="32" cy="35" r="10"/><circle cx="32" cy="35" r="4"/><path d="M48 25h4"/>',
    puzzle:'<path class="a" d="M10 10h16c-2-6 10-6 8 0h16v16c6-2 6 10 0 8v16H34c2 6-10 6-8 0H10V34c-6 2-6-10 0-8z"/>',
    hammock:'<path d="M6 8v50M58 8v50"/><path class="a" d="M8 20c6 22 42 22 48 0-12 8-36 8-48 0z"/>',
    balloon:'<path class="a" d="M32 6c11 0 18 8 18 18 0 12-10 20-18 22-8-2-18-10-18-22C14 14 21 6 32 6z"/><path d="M30 46h4l-2 4c4 4-4 6 0 10"/>',
    candle:'<rect class="a" x="24" y="26" width="16" height="30" rx="2"/><path d="M32 26v-5"/><path class="a" d="M32 8c5 6 5 12 0 13-5-1-5-7 0-13z"/><path d="M18 58h28"/>',
    medal:'<path d="M22 6l10 20 10-20"/><circle class="a" cx="32" cy="42" r="14"/><path d="M32 34l2.5 5 5.5.8-4 3.8 1 5.4-5-2.7-5 2.7 1-5.4-4-3.8 5.5-.8z"/>',
    remote:'<rect class="a" x="22" y="6" width="20" height="52" rx="6"/><circle cx="32" cy="16" r="3"/><path d="M27 28h0M37 28h0M27 36h0M37 36h0M27 44h0M37 44h0"/>',
    screen:'<rect class="a" x="6" y="10" width="52" height="34" rx="3"/><path d="M24 54h16M32 44v10"/>',
    bin:'<path class="a" d="M16 18h32l-4 38H20z"/><path d="M12 18h40M26 18v-6h12v6M26 28v20M38 28v20"/>',
    tap:'<path class="a" d="M10 22h26v10H10z"/><path d="M36 26h10c4 0 6 3 6 7v5"/><path d="M20 22v-8M14 14h12"/><path d="M52 44c-2 3-2 5 0 7 2-2 2-4 0-7z"/>',
    parcel:'<path class="a" d="M8 20 32 8l24 12v26L32 58 8 46z"/><path d="M8 20l24 12 24-12M32 32v26M20 14l24 12"/>',
    // Food and kitchen
    soup:'<path class="a" d="M8 30h48c0 14-10 22-24 22S8 44 8 30z"/><path d="M4 30h56M24 12c-3 4 3 8 0 12M32 10c-3 4 3 8 0 12M40 12c-3 4 3 8 0 12"/>',
    fork:'<path d="M32 30v28M22 6v14c0 6 4 10 10 10s10-4 10-10V6M32 6v16M27 6v14M37 6v14"/>',
    spoon:'<ellipse class="a" cx="32" cy="18" rx="10" ry="13"/><path d="M32 31v27"/>',
    garlic:'<path class="a" d="M32 14c-14 6-24 16-22 28 2 10 12 14 22 14s20-4 22-14c2-12-8-22-22-28z"/><path d="M32 14V6M26 22c-6 10-6 22 0 32M38 22c6 10 6 22 0 32M32 18v38"/>',
    oven:'<rect class="a" x="8" y="8" width="48" height="50" rx="3"/><path d="M8 20h48"/><rect x="16" y="28" width="32" height="22" rx="2"/><path d="M16 14h0M26 14h0M36 14h0M46 14h4"/>',
    grater:'<path class="a" d="M18 16h28l6 42H12z"/><path d="M26 16V8h12v8"/><path d="M22 28h4M32 28h4M38 36h4M24 40h4M30 46h4M20 50h4M40 48h4"/>',
    whisk:'<path d="M32 34v24"/><path class="a" d="M32 34C18 26 20 6 32 6s14 20 0 28z"/><path d="M32 34c-6-8-6-24 0-28M32 34c6-8 6-24 0-28"/>',
    tablespoon:'<ellipse class="a" cx="24" cy="22" rx="10" ry="14" transform="rotate(-30 24 22)"/><path d="M30 32l22 24"/>',
    // Animals
    lion:'<circle class="a" cx="32" cy="30" r="22"/><circle cx="32" cy="32" r="13"/><path d="M27 29h0M37 29h0M29 37l3 2 3-2M32 34v5"/>',
    fox:'<path class="a" d="M10 8l10 14h24L54 8l-2 26-20 22-20-22z"/><path d="M24 32h0M40 32h0M28 44l4 4 4-4"/>',
    bear:'<circle class="a" cx="16" cy="16" r="7"/><circle class="a" cx="48" cy="16" r="7"/><circle class="a" cx="32" cy="34" r="20"/><ellipse cx="32" cy="42" rx="8" ry="6"/><path d="M25 30h0M39 30h0M32 40v3"/>',
    camel:'<path class="a" d="M10 38c2-10 6-16 11-16s6 6 8 6 4-10 9-10 6 8 7 12h5l3-10c1-3 7-3 8 1l-2 7-4 2-3 8H10z"/><path d="M14 38v18M22 38v18M38 38v18M46 38v18M56 18h0"/>',
    dolphin:'<path class="a" d="M6 40c10-18 30-24 48-14l6-2-4 8c-4 10-18 18-34 14l-8 8 2-10c-4-2-8-2-10-4z"/><path d="M30 26l6-10 2 12"/><path d="M48 30h0"/>',
    whale:'<path class="a" d="M6 34c0-12 14-18 30-16 14 2 20 12 18 22-2 8-14 12-28 10-12-2-20-8-20-16z"/><path d="M54 30l6-8-2 12 4 8-8-4M20 30h0M10 40c8 2 20 2 30-2"/><path d="M28 12c0-4 4-4 4 0M32 12c0-4 4-4 4 0"/>',
    penguin:'<path class="a" d="M32 4c11 0 15 11 15 24v16c0 9-7 14-15 14s-15-5-15-14V28C17 15 21 4 32 4z"/><path d="M32 18c5 0 7 8 7 14v12c0 5-3 8-7 8s-7-3-7-8V32c0-6 2-14 7-14z"/><path d="M17 30 9 42M47 30l8 12M27 13h0M37 13h0M24 58h7M33 58h7"/><path d="M29 17h6l-3 4z" fill="currentColor"/>',
    turtle:'<path class="a" d="M12 40c0-14 10-22 22-22s22 8 22 22z"/><path d="M12 40h44M22 22l6 18M42 22l-6 18M34 18v22"/><path d="M56 34c4-2 6 0 6 3s-2 5-6 3M16 40v8M48 40v8"/>',
    snake:'<path class="a" d="M10 52c0-8 8-10 16-10s14-2 14-8-6-8-12-8-12-4-12-10 6-8 14-8h10c6 0 8 6 4 8"/><path d="M50 10l6-2M50 10l6 3"/><path d="M44 8h0"/>',
    monkey:'<circle class="a" cx="12" cy="28" r="7"/><circle class="a" cx="52" cy="28" r="7"/><circle class="a" cx="32" cy="30" r="18"/><path d="M22 32c0-8 4-10 10-6 6-4 10-2 10 6 0 8-4 12-10 12s-10-4-10-12z"/><path d="M27 30h0M37 30h0M28 38c2 2 6 2 8 0"/>',
    giraffe:'<path class="a" d="M16 58V40c0-4 4-6 10-6h8l4-22c0-4 2-6 6-6h6l4 4-6 2-4 28v18"/><path d="M42 6l-1-4M47 6l1-4M16 58h0M26 58V46M44 58V46"/><circle cx="24" cy="42" r="2"/><circle cx="36" cy="44" r="2"/><circle cx="41" cy="30" r="2"/><circle cx="43" cy="18" r="2"/>',
    feather:'<path class="a" d="M50 6C30 8 16 22 14 46l4 4C40 48 54 32 50 6z"/><path d="M8 58 42 18M20 40h12M24 32h12"/>',
    // Places and nature
    bridge:'<path d="M4 26h56M4 40h56"/><path class="a" d="M4 40c10-14 18-14 28 0 10-14 18-14 28 0v6H4z"/><path d="M14 26v10M24 26v8M40 26v8M50 26v10"/>',
    hospital:'<rect class="a" x="10" y="14" width="44" height="44"/><path d="M28 22h8v8h8v8h-8v8h-8v-8h-8v-8h8z"/><path d="M26 58v-8h12v8"/>',
    'traffic lights':'<rect class="a" x="22" y="4" width="20" height="42" rx="4"/><circle cx="32" cy="13" r="4"/><circle cx="32" cy="25" r="4"/><circle cx="32" cy="37" r="4"/><path d="M32 46v14"/>',
    skyscraper:'<path class="a" d="M22 58V12l10-6 10 6v46z"/><path d="M8 58V30h14M42 34h14v24"/><path d="M28 18h0M36 18h0M28 26h0M36 26h0M28 34h0M36 34h0M28 42h0M36 42h0M4 58h56"/>',
    mountain:'<path class="a" d="M4 54 24 16l10 16 8-10 18 32z"/><path d="M18 28l6-4 4 4M4 54h56"/>',
    waterfall:'<path class="a" d="M4 14h20v30H4zM40 14h20v30H40z"/><path d="M24 12v34M30 12v36M36 12v36M40 12v34"/><path d="M10 54c6-6 38-6 44 0M16 60c8-3 24-3 32 0"/><path d="M4 14h56"/>',
    island:'<path class="a" d="M8 46c8-6 40-6 48 0z"/><path d="M32 42c0-10 2-18 6-24M38 18c-4-6-12-6-16 0M38 18c2-6 10-8 14-4M38 18c-2 6 2 12 8 12"/><path d="M4 54c6-3 10-3 14 0s10 3 14 0 10-3 14 0 8 3 14 0"/>',
    cave:'<path class="a" d="M4 54C8 26 20 10 36 12s24 22 24 42z"/><path d="M20 54c0-14 6-22 14-22s14 8 14 22"/>',
    volcano:'<path class="a" d="M6 56l18-30h16l18 30z"/><path d="M24 26c2-6 14-6 16 0M28 18c-2-6 2-10 6-8 2-4 8-2 6 4"/><path d="M30 26l-4 10M36 26l2 8"/>',
    tornado:'<path d="M6 10h52M10 20h44M16 30h32M22 40h20M26 48h12M30 56h6"/><path class="a" d="M6 10h52l-26 48z" opacity=".35"/>',
    lightning:'<path class="a" d="M36 4 14 36h16l-6 24 26-36H34z"/>',
    crescent:'<path class="a" d="M40 8a24 24 0 1 0 14 40A20 20 0 1 1 40 8z"/>',
    moon:'<path class="a" d="M40 8a24 24 0 1 0 14 40A20 20 0 1 1 40 8z"/><path d="M50 12h0M56 22h0"/>',
    star:'<path class="a" d="M32 6l7.6 16.4 17.9 2.1-13.2 12.3 3.5 17.7L32 45.8l-15.8 8.7 3.5-17.7L6.5 24.5l17.9-2.1z"/>',
    planet:'<circle class="a" cx="32" cy="32" r="16"/><ellipse cx="32" cy="32" rx="28" ry="9" transform="rotate(-18 32 32)"/>',
    comet:'<circle class="a" cx="44" cy="20" r="9"/><path d="M37 26 8 52M38 30 16 56M34 22 6 40"/>',
    telescope:'<path class="a" d="M8 30 46 10l4 10-38 20z"/><path d="M30 30l-10 26M30 30l10 26M30 30v26M46 10l4-2 4 10-4 2"/>',
    satellite:'<rect class="a" x="26" y="26" width="12" height="12" transform="rotate(45 32 32)"/><path class="a" d="M6 22 18 10l10 10-12 12zM36 44l12-12 10 10-12 12z"/><path d="M38 26l8-8M50 18a10 10 0 0 0-4-4"/>',
    astronaut:'<circle class="a" cx="32" cy="20" r="13"/><rect x="24" y="14" width="16" height="10" rx="4"/><path class="a" d="M18 58V42c0-6 6-10 14-10s14 4 14 10v16"/><path d="M26 44h12v8H26z"/>',
    rocket:'<path class="a" d="M32 4c10 8 12 22 8 38H24c-4-16-2-30 8-38z"/><circle cx="32" cy="22" r="5"/><path d="M24 34l-8 10v6l8-4M40 34l8 10v6l-8-4M28 46c0 6 2 10 4 12 2-2 4-6 4-12"/>',
    robot:'<rect class="a" x="14" y="18" width="36" height="28" rx="5"/><circle cx="25" cy="30" r="4"/><circle cx="39" cy="30" r="4"/><path d="M26 40h12M32 18V8M28 8h8M8 26v12M56 26v12M22 46v10M42 46v10"/>',
    // Home
    mirror:'<ellipse class="a" cx="32" cy="26" rx="16" ry="20"/><path d="M26 18l8-6M24 26l12-10M32 46v12M22 58h20"/>',
    pillow:'<path class="a" d="M8 20c8-6 40-6 48 0 4 8 4 16 0 24-8 6-40 6-48 0-4-8-4-16 0-24z"/><path d="M8 20l-4-4M56 20l4-4M8 44l-4 4M56 44l4 4"/>',
    sink:'<path class="a" d="M8 34h48l-4 14H12z"/><path d="M28 34V22c0-6 8-6 8 0M24 22h8M32 48v10M20 58h24"/>',
    refrigerator:'<rect class="a" x="16" y="4" width="32" height="56" rx="4"/><path d="M16 24h32M22 12v6M22 30v12"/>',
    roof:'<path class="a" d="M4 32 32 8l28 24h-8L32 16 12 32z"/><path d="M14 32v24h36V32M42 14v-6h6v12"/><path d="M28 56V42h8v14"/>',
    // Transport
    tram:'<rect class="a" x="8" y="18" width="48" height="30" rx="5"/><path d="M8 32h48M18 18v14M32 18v14M46 18v14M22 8l10 10 10-10M16 48v6M48 48v6M4 56h56"/>',
    ferry:'<path class="a" d="M4 40h56l-8 12H12z"/><path d="M14 40V28h32v12M20 28v-8h20v8M24 34h0M32 34h0M40 34h0"/><path d="M4 58c6-3 10-3 14 0s10 3 14 0 10-3 14 0 8 3 14 0"/>',
    lorry:'<rect class="a" x="4" y="16" width="36" height="28" rx="2"/><path class="a" d="M40 24h12l8 10v10H40z"/><circle cx="16" cy="48" r="5"/><circle cx="48" cy="48" r="5"/><path d="M44 30h8"/>',
    motorcycle:'<circle class="a" cx="14" cy="44" r="9"/><circle class="a" cx="50" cy="44" r="9"/><path d="M14 44l12-14h14l10 14M40 30l-4-12h8M26 30l-4-6h-8"/>',
    van:'<path class="a" d="M4 46V20c0-2 2-4 4-4h32l12 12 8 4v14z"/><circle cx="16" cy="48" r="5"/><circle cx="48" cy="48" r="5"/><path d="M40 16v14h20M24 18v12"/>',
    wheel:'<circle class="a" cx="32" cy="32" r="24"/><circle cx="32" cy="32" r="6"/><path d="M32 8v18M32 38v18M8 32h18M38 32h18M15 15l13 13M36 36l13 13M49 15 36 28M28 36 15 49"/>',
    // Travel
    suitcase:'<rect class="a" x="8" y="18" width="48" height="36" rx="4"/><path d="M24 18v-6h16v6M20 18v36M44 18v36"/>',
    ticket:'<path class="a" d="M6 18h52v8a6 6 0 0 0 0 12v8H6v-8a6 6 0 0 0 0-12z"/><path d="M42 18v28" stroke-dasharray="3 4"/><path d="M14 28h20M14 36h14"/>',
    sandcastle:'<path class="a" d="M10 54V30h8v-6h6v6h4V18h8v12h4v-6h6v6h8v24z"/><path d="M28 54V44c0-4 8-4 8 0v10M32 18V8l8 4-8 3"/>',
    seashell:'<path class="a" d="M32 8 8 34c4 14 44 14 48 0z"/><path d="M32 8 20 46M32 8v40M32 8l12 38M24 50h16"/>',
    passport:'<rect class="a" x="14" y="6" width="36" height="52" rx="3"/><circle cx="32" cy="28" r="9"/><path d="M23 28h18M32 19c-4 6-4 12 0 18M32 19c4 6 4 12 0 18M22 46h20"/>',
    backpack:'<path class="a" d="M14 56V26c0-10 8-16 18-16s18 6 18 16v30z"/><path d="M26 10V6h12v4M20 40h24v16H20zM14 30h-4v20M50 30h4v20"/>',
    castle:'<path class="a" d="M8 58V20h8v6h6v-6h8v6h4v-6h8v6h6v-6h8v38z"/><path d="M26 58V44c0-6 12-6 12 0v14M16 36h0M48 36h0"/>',
    mosque:'<path class="a" d="M18 34c0-10 6-16 14-20 8 4 14 10 14 20z"/><path d="M14 58V34h36v24M8 58V18l2-6 2 6v40M52 58V18l2-6 2 6v40M32 14V8M26 58v-10c0-6 12-6 12 0v10"/>',
    // Sports and adventure
    helmet:'<path class="a" d="M8 40c0-16 10-28 24-28s24 12 24 28z"/><path d="M8 40h50v6H8zM28 12v28M18 24l-4 8"/>',
    rope:'<path class="a" d="M32 10c14 0 22 8 22 18s-10 16-22 16-20-6-20-14 8-12 18-12 14 4 14 8-4 6-10 6-8-2-8-4"/><path d="M12 30v18c0 4 4 8 10 8"/>',
    paddle:'<path d="M18 46 46 18"/><path class="a" d="M46 18c2-8 10-14 14-10s-2 12-10 14zM18 46c-2 8-10 14-14 10s2-12 10-14z"/>',
    parachute:'<path class="a" d="M6 28C6 14 18 6 32 6s26 8 26 22c-4-4-8-4-13 0-4-4-9-4-13 0-4-4-9-4-13 0-5-4-9-4-13 0z"/><path d="M6 28l22 18M58 28 36 46M19 28l10 18M45 28 35 46"/><rect x="26" y="46" width="12" height="12" rx="3"/>',
    // Tools and devices
    microscope:'<path d="M14 58h36M24 58V50h20M38 50c6-4 8-12 4-18"/><path class="a" d="M26 8h8l4 24-6 2-8-24z"/><path d="M32 36l-4 6h14M22 28l-6 2"/>',
    'test tube':'<path class="a" d="M24 8v40c0 6 4 10 8 10s8-4 8-10V8"/><path d="M20 8h24M24 34h16"/>',
    beaker:'<path class="a" d="M18 8v18L8 54c-1 3 1 4 4 4h40c3 0 5-1 4-4L46 26V8"/><path d="M14 8h36M16 40h32M38 16h8M38 22h8"/>',
    mop:'<path d="M40 6 26 40"/><path class="a" d="M14 40h24l6 18H8z"/><path d="M16 46l-2 12M24 46v12M32 46l2 12"/>',
    iron:'<path class="a" d="M6 46c0-12 10-20 26-20h22l4 20z"/><path d="M24 26v-8h26l4 8M16 38h0M24 38h0M32 38h0"/>',
    receiver:'<path class="a" d="M14 6c-6 4-8 12-4 22 6 14 14 24 28 30 8 3 14 0 18-6l-10-10-8 4c-6-4-12-10-16-18l4-8z"/>',
    password:'<rect class="a" x="12" y="28" width="40" height="30" rx="4"/><path d="M20 28v-8c0-8 6-12 12-12s12 4 12 12v8M32 40v8"/><circle cx="32" cy="40" r="3"/>',
    link:'<path class="a" d="M26 38l-6 6c-4 4-10 4-12 0-4-4-4-8 0-12l8-8c4-4 10-4 12 0"/><path class="a" d="M38 26l6-6c4-4 10-4 12 0 4 4 4 8 0 12l-8 8c-4 4-10 4-12 0"/><path d="M24 40l16-16"/>',
    bookmark:'<path class="a" d="M18 6h28v52L32 46 18 58z"/>'
  };
  // Vocabulary keys that share a drawing.
  const alias={'remote control':'remote','teaspoon':'tablespoon','spacecraft':'rocket','rocket':'rocket','spoon':'spoon','sunglass':'sunglasses','glove':'gloves','boot':'boots','trainer':'trainers'};
  const lookalike=[['moon','crescent'],['tablespoon','teaspoon','spoon'],['rocket','spacecraft'],['screen','remote control'],['planet','star','comet'],['lorry','van'],['tram','ferry']];
  function similar(a,b){const x=String(a).toLowerCase(),y=String(b).toLowerCase();return x===y||lookalike.some(g=>g.includes(x)&&g.includes(y));}
  function key(word){const k=String(word||'').trim().toLowerCase();if(P[k])return k;if(alias[k]&&P[alias[k]])return alias[k];return '';}
  function has(word){return Boolean(key(word));}
  function svg(word,label){
    const k=key(word);if(!k)return '';
    const title=String(label||'Picture').replace(/[<>&"]/g,'');
    return `<svg class="picture-gate-art" viewBox="0 0 64 64" role="img" aria-label="${title}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${P[k]}</svg>`;
  }
  const api=Object.freeze({has,svg,key,similar,words:Object.freeze(Object.keys(P))});
  if(typeof module==='object'&&module.exports)module.exports=api;else root.RunnerPictures=api;
})(typeof globalThis!=='undefined'?globalThis:this);
