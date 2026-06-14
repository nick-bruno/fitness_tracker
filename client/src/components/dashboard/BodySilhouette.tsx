import { useState, useRef } from 'react';
import type { MuscleVolumeSummary } from '../../types';

interface Props {
  summary: MuscleVolumeSummary[];
}

const MUSCLE_TO_REGION: Record<string, string> = {
  'Upper Pec': 'chest', 'Mid/Sternal Pec': 'chest', 'Lower Pec': 'chest',
  'Lats': 'lats', 'Mid Traps / Rhomboids': 'traps', 'Lower Traps': 'traps', 'Teres Major': 'lats',
  'Front Delt': 'front-delt', 'Side Delt': 'front-delt', 'Rear Delt': 'rear-delt',
  'Biceps Long Head': 'biceps', 'Biceps Short Head': 'biceps', 'Brachialis': 'biceps',
  'Triceps Long Head': 'triceps', 'Triceps Lateral Head': 'triceps',
  'Forearms': 'forearms',
  'Quads - Rectus Femoris': 'quads', 'Quads - Vastus Lateralis': 'quads', 'Quads - VMO': 'quads',
  'Hamstrings - Biceps Femoris': 'hamstrings', 'Hamstrings - Semitendinosus': 'hamstrings',
  'Glutes - Gluteus Maximus': 'glutes', 'Glutes - Gluteus Medius': 'glutes',
  'Calves': 'calves',
  'Rectus Abdominis': 'abs', 'Obliques': 'obliques', 'Transverse Abdominis': 'abs',
};

const REGION_LABELS: Record<string, string> = {
  'chest': 'Chest',
  'front-delt': 'Front & Side Delts',
  'rear-delt': 'Rear Delts',
  'biceps': 'Biceps',
  'triceps': 'Triceps',
  'forearms': 'Forearms',
  'abs': 'Abs',
  'obliques': 'Obliques',
  'lats': 'Lats',
  'traps': 'Traps & Rhomboids',
  'quads': 'Quads',
  'hamstrings': 'Hamstrings',
  'glutes': 'Glutes',
  'calves': 'Calves',
};

type RegionInfo = { sets: number; lastTrained: string | null };

function buildRegions(summary: MuscleVolumeSummary[]): Map<string, RegionInfo> {
  const map = new Map<string, RegionInfo>();
  for (const m of summary) {
    const region = MUSCLE_TO_REGION[m.muscle_group_name];
    if (!region) continue;
    const cur = map.get(region);
    if (!cur) {
      map.set(region, { sets: m.total_sets, lastTrained: m.last_trained_date });
    } else {
      const curMs = cur.lastTrained ? new Date(cur.lastTrained).getTime() : 0;
      const newMs = m.last_trained_date ? new Date(m.last_trained_date).getTime() : 0;
      map.set(region, {
        sets: cur.sets + m.total_sets,
        lastTrained: newMs > curMs ? m.last_trained_date : cur.lastTrained,
      });
    }
  }
  return map;
}

function getColor(info: RegionInfo | undefined): string {
  if (!info || info.sets === 0 || !info.lastTrained) return '#1e293b';
  const days = (Date.now() - new Date(info.lastTrained).getTime()) / 86400000;
  if (days <= 1) return '#991b1b';
  if (days <= 2) return '#9a3412';
  if (days <= 4) return '#854d0e';
  return '#166534';
}

function getStroke(info: RegionInfo | undefined): string {
  if (!info || info.sets === 0 || !info.lastTrained) return '#334155';
  const days = (Date.now() - new Date(info.lastTrained).getTime()) / 86400000;
  if (days <= 1) return '#f87171';
  if (days <= 2) return '#fb923c';
  if (days <= 4) return '#facc15';
  return '#4ade80';
}

function getDetail(info: RegionInfo | undefined): string {
  if (!info || info.sets === 0 || !info.lastTrained) return 'Not trained this week';
  const days = (Date.now() - new Date(info.lastTrained).getTime()) / 86400000;
  const ago = days < 1 ? 'today' : days < 2 ? 'yesterday' : `${Math.floor(days)}d ago`;
  return `${info.sets} sets · last trained ${ago}`;
}

const BG = '#0f172a';
const BG_S = '#1e293b';
const SW = 1;

export default function BodySilhouette({ summary }: Props) {
  const regions = buildRegions(summary);
  const f = (r: string) => getColor(regions.get(r));
  const s = (r: string) => getStroke(regions.get(r));

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ label: string; detail: string; x: number; y: number } | null>(null);

  const hp = (regionKey: string) => ({
    style: { cursor: 'pointer' } as React.CSSProperties,
    onMouseEnter: (e: React.MouseEvent<SVGElement>) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({
        label: REGION_LABELS[regionKey] ?? regionKey,
        detail: getDetail(regions.get(regionKey)),
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    onMouseMove: (e: React.MouseEvent<SVGElement>) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
    },
    onMouseLeave: () => setTooltip(null),
  });

  return (
    <div ref={wrapperRef} className="relative">
      {/*
        Front figure: centered at x=105
        Back figure:  centered at x=315  (offset +210)
        ViewBox: 0 0 420 540
        ─────────────────────────────────────────────
        Body proportions
          head r=26, center y=33
          shoulder span: ±46 from cx
          arm angle: ~15° outward (arm outer edge drifts ~8px by elbow)
          waist: ±30 from cx
          hip:   ±40 from cx
          thigh: ±22 from cx midline, gap of 6px at crotch
      */}
      <svg viewBox="0 0 420 540" className="mx-auto w-full max-w-md" aria-label="Body muscle heatmap">

        {/* ═══════════════════════════════════════
            FRONT VIEW  (cx = 105)
            ═══════════════════════════════════════ */}
        <text x="105" y="534" textAnchor="middle" fill="#475569" fontSize="11" fontFamily="sans-serif" letterSpacing="2">FRONT</text>

        {/* ── Body silhouette background ── */}
        {/* Head */}
        <circle cx="105" cy="33" r="26" fill={BG} stroke={BG_S} strokeWidth={SW}/>
        {/* Neck */}
        <path d="M 97,57 C 95,60 94,68 95,76 L 115,76 C 116,68 115,60 113,57 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>
        {/* Torso */}
        <path d="
          M 105,59
          C 100,59 95,62 91,68
          L 82,78
          C 70,80 58,86 52,96
          C 47,104 48,114 54,120
          L 60,122 L 64,124
          C 64,136 65,148 67,162
          C 68,176 70,190 70,204
          C 70,218 67,232 65,244
          L 63,268
          L 96,272 L 96,268
          C 94,250 92,234 92,218
          C 92,206 97,196 105,194
          C 113,196 118,206 118,218
          C 118,234 116,250 114,268
          L 114,272 L 147,268
          L 145,244
          C 143,232 140,218 140,204
          C 140,190 142,176 143,162
          C 145,148 146,136 146,124
          L 150,122 L 156,120
          C 162,114 163,104 158,96
          C 152,86 140,80 128,78
          L 119,68
          C 115,62 110,59 105,59 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>
        {/* Left arm */}
        <path d="
          M 54,102 C 50,108 46,118 44,130
          L 38,214 C 36,224 37,234 39,242
          L 35,316 C 34,324 38,330 44,331
          L 54,331 C 60,330 64,324 63,316
          L 59,242 C 62,234 63,224 62,214
          L 66,130 C 66,120 64,110 60,104 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>
        {/* Right arm */}
        <path d="
          M 156,104 C 146,110 144,120 144,130
          L 148,214 C 147,224 148,234 151,242
          L 147,316 C 146,324 150,330 156,331
          L 166,331 C 172,330 176,324 175,316
          L 171,242 C 173,234 174,224 172,214
          L 166,130 C 164,118 160,108 156,102 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>
        {/* Left leg */}
        <path d="
          M 65,272 C 59,274 53,282 51,296
          L 47,390 C 46,400 50,410 58,413
          L 52,412 C 49,418 48,430 50,448
          L 52,524 C 54,530 58,534 64,534
          L 78,534 C 84,532 87,527 85,520
          L 83,448 C 86,430 85,418 82,412
          L 76,413 C 84,410 88,400 87,390
          L 83,296 C 81,282 75,274 68,272 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>
        {/* Right leg */}
        <path d="
          M 145,272 C 135,274 129,282 127,296
          L 123,390 C 122,400 126,410 134,413
          L 128,412 C 125,418 124,430 126,448
          L 128,520 C 127,527 130,532 136,534
          L 150,534 C 156,534 160,530 162,524
          L 164,448 C 166,430 165,418 162,412
          L 156,413 C 164,410 168,400 167,390
          L 163,296 C 161,282 155,274 148,272 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>

        {/* ── Muscle regions ── */}

        {/* Front delts — rounded caps sitting on shoulder joint */}
        <path d="M 65,80 C 57,78 48,82 43,90 C 38,98 39,110 44,118 C 49,126 58,130 66,128 C 70,127 73,122 73,116 L 72,88 C 70,82 68,80 65,80 Z"
          fill={f('front-delt')} stroke={s('front-delt')} strokeWidth={SW} {...hp('front-delt')}/>
        <path d="M 145,80 C 142,80 140,82 138,88 L 137,116 C 137,122 140,127 144,128 C 152,130 161,126 166,118 C 171,110 172,98 167,90 C 162,82 153,78 145,80 Z"
          fill={f('front-delt')} stroke={s('front-delt')} strokeWidth={SW} {...hp('front-delt')}/>

        {/* Chest — fan-shape from sternum, clavicular and sternal heads */}
        <path d="M 105,78 L 78,78 C 62,80 57,94 60,114 C 63,128 74,140 105,142 Z"
          fill={f('chest')} stroke={s('chest')} strokeWidth={SW} {...hp('chest')}/>
        <path d="M 105,78 L 132,78 C 148,80 153,94 150,114 C 147,128 136,140 105,142 Z"
          fill={f('chest')} stroke={s('chest')} strokeWidth={SW} {...hp('chest')}/>

        {/* Biceps — elongated teardrop on front of upper arm */}
        <path d="M 44,126 C 40,130 37,140 36,154 L 36,198 C 36,208 40,216 46,219 L 55,219 C 61,216 65,208 64,198 L 63,154 C 62,140 60,130 55,126 C 51,122 47,122 44,126 Z"
          fill={f('biceps')} stroke={s('biceps')} strokeWidth={SW} {...hp('biceps')}/>
        <path d="M 166,126 C 163,122 159,122 155,126 C 150,130 148,140 147,154 L 146,198 C 145,208 149,216 155,219 L 164,219 C 170,216 174,208 174,198 L 174,154 C 173,140 170,130 166,126 Z"
          fill={f('biceps')} stroke={s('biceps')} strokeWidth={SW} {...hp('biceps')}/>

        {/* Forearms — tapered, wider at elbow end */}
        <path d="M 37,223 C 33,228 31,240 32,256 L 34,314 C 35,322 39,328 45,328 L 53,328 C 59,328 63,322 63,314 L 65,256 C 66,240 64,228 60,223 C 55,219 41,219 37,223 Z"
          fill={f('forearms')} stroke={s('forearms')} strokeWidth={SW} {...hp('forearms')}/>
        <path d="M 150,219 C 146,219 145,219 145,223 C 141,228 139,240 140,256 L 142,314 C 142,322 146,328 152,328 L 160,328 C 166,328 170,322 171,314 L 173,256 C 174,240 172,228 168,223 C 164,219 154,219 150,219 Z"
          fill={f('forearms')} stroke={s('forearms')} strokeWidth={SW} {...hp('forearms')}/>

        {/* Abs — tall oval, slight taper top to bottom */}
        <path d="M 92,142 C 87,146 84,158 84,172 L 84,232 C 84,244 88,254 98,257 L 112,257 C 122,254 126,244 126,232 L 126,172 C 126,158 123,146 118,142 C 113,138 97,138 92,142 Z"
          fill={f('abs')} stroke={s('abs')} strokeWidth={SW} {...hp('abs')}/>

        {/* Obliques — diagonal wedge on torso sides */}
        <path d="M 64,140 C 59,144 55,156 54,170 L 53,216 C 53,230 57,244 66,252 L 84,257 L 84,142 Z"
          fill={f('obliques')} stroke={s('obliques')} strokeWidth={SW} {...hp('obliques')}/>
        <path d="M 146,140 L 126,142 L 126,257 L 144,252 C 153,244 157,230 157,216 L 156,170 C 155,156 151,144 146,140 Z"
          fill={f('obliques')} stroke={s('obliques')} strokeWidth={SW} {...hp('obliques')}/>

        {/* Hip / pelvis bridge (neutral) */}
        <path d="M 53,258 C 53,264 56,270 64,272 L 96,274 L 96,270 C 94,264 96,260 105,258 C 114,260 116,264 114,270 L 114,274 L 146,272 C 154,270 157,264 157,258 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>

        {/* Quads — rounded thigh with natural taper */}
        <path d="M 65,276 C 59,278 53,288 51,304 L 48,392 C 47,404 52,414 62,416 L 78,416 C 88,414 93,402 92,390 L 90,304 C 90,288 85,276 78,274 C 73,272 69,274 65,276 Z"
          fill={f('quads')} stroke={s('quads')} strokeWidth={SW} {...hp('quads')}/>
        <path d="M 145,276 C 141,274 137,272 132,274 C 125,276 120,288 120,304 L 118,390 C 117,402 122,414 132,416 L 148,416 C 158,414 163,404 162,392 L 159,304 C 157,288 151,278 145,276 Z"
          fill={f('quads')} stroke={s('quads')} strokeWidth={SW} {...hp('quads')}/>

        {/* Shins (neutral) */}
        <path d="M 52,420 C 49,426 48,440 50,458 L 52,526 C 54,532 58,535 64,535 L 78,535 C 84,535 87,530 86,523 L 84,458 C 86,440 85,426 82,420 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>
        <path d="M 128,420 C 125,426 124,440 126,458 L 128,523 C 127,530 130,535 136,535 L 150,535 C 156,535 160,532 162,526 L 164,458 C 166,440 165,426 162,420 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>

        {/* Hands (neutral) */}
        <path d="M 32,318 C 30,322 30,330 34,334 L 52,334 C 56,334 60,328 60,322 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>
        <path d="M 150,322 C 150,328 154,334 158,334 L 176,334 C 180,330 180,322 178,318 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>


        {/* ═══════════════════════════════════════
            BACK VIEW  (cx = 315, offset +210)
            ═══════════════════════════════════════ */}
        <text x="315" y="534" textAnchor="middle" fill="#475569" fontSize="11" fontFamily="sans-serif" letterSpacing="2">BACK</text>

        {/* ── Body silhouette background ── */}
        <circle cx="315" cy="33" r="26" fill={BG} stroke={BG_S} strokeWidth={SW}/>
        <path d="M 307,57 C 305,60 304,68 305,76 L 325,76 C 326,68 325,60 323,57 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>
        {/* Torso back */}
        <path d="
          M 315,59
          C 310,59 305,62 301,68 L 292,78
          C 280,80 268,86 262,96
          C 257,104 258,114 264,120
          L 270,122 L 274,124
          C 274,136 275,148 277,162
          C 278,176 280,190 280,204
          C 280,218 277,232 275,244 L 273,268
          L 306,272 L 306,268
          C 304,250 302,234 302,218
          C 302,206 307,196 315,194
          C 323,196 328,206 328,218
          C 328,234 326,250 324,268
          L 324,272 L 357,268 L 355,244
          C 353,232 350,218 350,204
          C 350,190 352,176 353,162
          C 355,148 356,136 356,124
          L 360,122 L 366,120
          C 372,114 373,104 368,96
          C 362,86 350,80 338,78 L 329,68
          C 325,62 320,59 315,59 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>
        {/* Left arm back */}
        <path d="
          M 264,102 C 254,110 252,120 252,130
          L 256,214 C 255,224 256,234 258,242
          L 254,316 C 253,324 257,330 263,331
          L 273,331 C 279,330 283,324 282,316
          L 278,242 C 281,234 282,224 281,214
          L 285,130 C 285,120 283,110 278,104 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>
        {/* Right arm back */}
        <path d="
          M 366,104 C 347,110 345,120 345,130
          L 349,214 C 348,224 349,234 352,242
          L 348,316 C 347,324 351,330 357,331
          L 367,331 C 373,330 377,324 376,316
          L 372,242 C 375,234 376,224 375,214
          L 379,130 C 379,120 376,108 366,102 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>
        {/* Left leg back */}
        <path d="
          M 275,272 C 269,274 263,282 261,296
          L 257,390 C 256,400 260,410 268,413
          L 262,412 C 259,418 258,430 260,448
          L 262,524 C 264,530 268,534 274,534
          L 288,534 C 294,532 297,527 295,520
          L 293,448 C 296,430 295,418 292,412
          L 286,413 C 294,410 298,400 297,390
          L 293,296 C 291,282 285,274 278,272 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>
        {/* Right leg back */}
        <path d="
          M 355,272 C 348,274 342,282 337,296
          L 333,390 C 332,400 336,410 344,413
          L 338,412 C 335,418 334,430 336,448
          L 338,520 C 337,527 340,532 346,534
          L 360,534 C 366,534 370,530 372,524
          L 374,448 C 376,430 375,418 372,412
          L 366,413 C 374,410 378,400 377,390
          L 373,296 C 371,282 365,274 358,272 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>

        {/* ── Muscle regions ── */}

        {/* Rear delts */}
        <path d="M 275,80 C 267,78 258,82 253,90 C 248,98 249,110 254,118 C 259,126 268,130 276,128 C 280,127 283,122 283,116 L 282,88 C 280,82 278,80 275,80 Z"
          fill={f('rear-delt')} stroke={s('rear-delt')} strokeWidth={SW} {...hp('rear-delt')}/>
        <path d="M 355,80 C 352,80 350,82 348,88 L 347,116 C 347,122 350,127 354,128 C 362,130 371,126 376,118 C 381,110 382,98 377,90 C 372,82 363,78 355,80 Z"
          fill={f('rear-delt')} stroke={s('rear-delt')} strokeWidth={SW} {...hp('rear-delt')}/>

        {/* Traps — large diamond covering upper back */}
        <path d="M 315,65 L 278,80 C 266,84 262,96 268,108 C 272,118 284,128 315,132 C 346,128 358,118 362,108 C 368,96 364,84 352,80 Z"
          fill={f('traps')} stroke={s('traps')} strokeWidth={SW} {...hp('traps')}/>

        {/* Triceps — horseshoe on back of upper arm */}
        <path d="M 254,126 C 250,130 247,140 246,154 L 246,198 C 246,208 250,216 256,219 L 265,219 C 271,216 275,208 274,198 L 273,154 C 272,140 270,130 265,126 C 261,122 257,122 254,126 Z"
          fill={f('triceps')} stroke={s('triceps')} strokeWidth={SW} {...hp('triceps')}/>
        <path d="M 376,126 C 373,122 369,122 365,126 C 360,130 358,140 357,154 L 356,198 C 355,208 359,216 365,219 L 374,219 C 380,216 384,208 384,198 L 384,154 C 383,140 380,130 376,126 Z"
          fill={f('triceps')} stroke={s('triceps')} strokeWidth={SW} {...hp('triceps')}/>

        {/* Forearms back */}
        <path d="M 247,223 C 243,228 241,240 242,256 L 244,314 C 245,322 249,328 255,328 L 263,328 C 269,328 273,322 273,314 L 275,256 C 276,240 274,228 270,223 C 265,219 251,219 247,223 Z"
          fill={f('forearms')} stroke={s('forearms')} strokeWidth={SW} {...hp('forearms')}/>
        <path d="M 360,219 C 356,219 345,219 341,223 C 337,228 335,240 336,256 L 338,314 C 338,322 342,328 348,328 L 356,328 C 362,328 366,322 367,314 L 369,256 C 370,240 368,228 364,223 C 360,219 360,219 360,219 Z"
          fill={f('forearms')} stroke={s('forearms')} strokeWidth={SW} {...hp('forearms')}/>

        {/* Lats — V-shape flaring from armpit to waist */}
        <path d="M 257,122 C 252,126 248,136 248,148 L 252,202 C 253,216 258,228 268,236 L 284,242 L 284,124 C 278,120 264,118 257,122 Z"
          fill={f('lats')} stroke={s('lats')} strokeWidth={SW} {...hp('lats')}/>
        <path d="M 373,122 C 366,118 352,120 346,124 L 346,242 L 362,236 C 372,228 377,216 378,202 L 382,148 C 382,136 378,126 373,122 Z"
          fill={f('lats')} stroke={s('lats')} strokeWidth={SW} {...hp('lats')}/>

        {/* Mid back (rhomboids / mid traps) */}
        <path d="M 284,124 L 346,124 L 346,236 C 334,242 315,244 315,244 C 315,244 296,242 284,236 Z"
          fill={f('traps')} stroke={s('traps')} strokeWidth={SW} {...hp('traps')}/>

        {/* Lower back */}
        <path d="M 284,238 C 284,238 296,244 315,244 C 334,244 346,238 346,238 L 344,272 C 334,278 315,280 315,280 C 315,280 296,278 286,272 Z"
          fill={f('lats')} stroke={s('lats')} strokeWidth={SW} {...hp('lats')}/>

        {/* Hip back (neutral bridge) */}
        <path d="M 273,268 C 273,268 286,280 315,280 C 344,280 357,268 357,268 L 355,274 C 345,282 315,284 315,284 C 315,284 285,282 275,274 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>

        {/* Glutes — large rounded shapes */}
        <path d="M 275,276 C 269,278 263,288 261,304 L 259,348 C 259,362 265,374 277,378 L 299,380 C 307,378 313,370 314,360 L 315,284 Z"
          fill={f('glutes')} stroke={s('glutes')} strokeWidth={SW} {...hp('glutes')}/>
        <path d="M 315,284 L 316,360 C 317,370 323,378 331,380 L 353,378 C 365,374 371,362 371,348 L 369,304 C 367,288 361,278 355,276 Z"
          fill={f('glutes')} stroke={s('glutes')} strokeWidth={SW} {...hp('glutes')}/>

        {/* Hamstrings — oval on back of thigh */}
        <path d="M 261,382 C 256,386 253,398 254,414 L 256,418 C 255,424 256,436 258,448 L 261,420 C 269,416 279,416 287,420 L 290,418 L 291,414 C 292,398 289,386 284,382 C 278,378 266,378 261,382 Z"
          fill={f('hamstrings')} stroke={s('hamstrings')} strokeWidth={SW} {...hp('hamstrings')}/>
        <path d="M 346,382 C 341,378 329,378 323,382 C 318,386 315,398 316,414 L 317,418 L 320,420 C 328,416 338,416 346,420 L 349,448 C 351,436 352,424 351,418 L 354,414 C 355,398 352,386 346,382 Z"
          fill={f('hamstrings')} stroke={s('hamstrings')} strokeWidth={SW} {...hp('hamstrings')}/>

        {/* Calves — diamond/heart shape on back of lower leg */}
        <path d="M 260,452 C 256,458 255,470 258,486 C 261,500 268,510 275,514 C 282,518 290,516 293,508 C 296,500 295,486 292,472 C 290,460 286,452 280,450 C 274,448 263,448 260,452 Z"
          fill={f('calves')} stroke={s('calves')} strokeWidth={SW} {...hp('calves')}/>
        <path d="M 350,452 C 347,448 336,448 330,450 C 324,452 320,460 318,472 C 315,486 314,500 317,508 C 320,516 328,518 335,514 C 342,510 349,500 352,486 C 355,470 354,458 350,452 Z"
          fill={f('calves')} stroke={s('calves')} strokeWidth={SW} {...hp('calves')}/>

        {/* Hands back (neutral) */}
        <path d="M 242,318 C 240,322 240,330 244,334 L 262,334 C 266,334 270,328 270,322 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>
        <path d="M 360,322 C 360,328 364,334 368,334 L 386,334 C 390,330 390,322 388,318 Z"
          fill={BG} stroke={BG_S} strokeWidth={SW}/>

      </svg>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 shadow-xl"
          style={{ left: tooltip.x + 14, top: tooltip.y - 12 }}
        >
          <p className="text-sm font-semibold text-gray-100">{tooltip.label}</p>
          <p className="mt-0.5 text-xs text-gray-400">{tooltip.detail}</p>
        </div>
      )}
    </div>
  );
}
