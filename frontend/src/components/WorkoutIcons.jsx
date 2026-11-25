// WorkoutIcons.jsx: petrol line icons for the Workout Log (Yanna, week 7). They replace the
// emojis: plain SVG drawn with currentColor, so CSS gives them the accent colour.
// They are decoration only (aria-hidden): the dropdown next to them says the same in words.
//
//   <TypeIcon type="HIIT" />            one icon per workout type (lib/workoutTypes.js)
//   <EquipmentIcon equipment="Dumbbells" />  an icon per piece of equipment (dumbbell if unknown)
//   <GoalIcon type="calories" />            flame, stopwatch or dumbbell for the goal types

import { OTHER } from '../lib/workoutTypes';

function Svg({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

// ---------- the drawings ----------
const Person = () => (
  <Svg>
    <circle cx="12" cy="4.5" r="2.2" fill="currentColor" stroke="none" />
    <path d="M5 5l4 5h6l4-5" />
    <path d="M12 10v5" strokeWidth="3.4" />
    <path d="M10.5 15l-1.2 6.5M13.5 15l1.2 6.5" />
  </Svg>
);
const Heart = () => (
  <Svg>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />
    <path d="M6.5 12.5h3l1.5-2.5 2 4.5 1.5-2h3" />
  </Svg>
);
const Dumbbell = () => (
  <Svg>
    <path d="M6.5 7v10M17.5 7v10" strokeWidth="2.6" />
    <path d="M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
  </Svg>
);
const Barbell = () => (
  <Svg>
    <path d="M2.5 12h19" />
    <path d="M6 7.5v9M18 7.5v9" strokeWidth="2.6" />
    <path d="M8.5 9.5v5M15.5 9.5v5" />
  </Svg>
);
const Lightning = () => (
  <Svg>
    <path d="M13.5 2.5L5 13.5h6l-1.5 8 9-11.5h-6z" />
  </Svg>
);
const Stretch = () => (
  <Svg>
    <circle cx="9" cy="4.5" r="2" fill="currentColor" stroke="none" />
    <path d="M9.5 7.5l1.5 6-4 7.5M11 13.5l5 7" />
    <path d="M10 8.5L19 4" />
    <path d="M10.2 10L5 13" />
  </Svg>
);
// Balance & Stability: the yoga tree pose (one leg, the other foot at the knee, hands together above)
const TreePose = () => (
  <Svg>
    <circle cx="12" cy="5.4" r="1.9" fill="currentColor" stroke="none" />
    <path d="M12 9L7.8 2.2M12 9l4.2-6.8" />
    <path d="M12 8.6v6.6" strokeWidth="2.8" />
    <path d="M12 15.2V22" />
    <path d="M12 15.2l4.6 1.6-4.6 2.4" />
  </Svg>
);
const Kettlebell = () => (
  <Svg>
    <path d="M8.8 10.2V8.2a3.2 3.2 0 0 1 6.4 0v2" />
    <path d="M6 15.2a6 6 0 0 1 3-5.2h6a6 6 0 0 1 3 5.2c0 2.6-1 4.3-1.6 5.3H7.6C7 19.5 6 17.8 6 15.2z" />
  </Svg>
);
const Pencil = () => (
  <Svg>
    <path d="M4 20l1.2-4.4L16 4.8l3.2 3.2L8.4 18.8z" />
    <path d="M14 6.8l3.2 3.2" />
  </Svg>
);
const Runner = () => (
  <Svg>
    <circle cx="15" cy="4.2" r="2" fill="currentColor" stroke="none" />
    <path d="M13.5 7.5l-2.8 5.2 4 2.6-1.4 6" />
    <path d="M10.7 12.7L8.6 16.6 4.5 17.4" />
    <path d="M13.5 7.5l4 2.5 2 -1.5M13.5 7.5L9.6 8.4 7.8 11" />
  </Svg>
);
const Bike = () => (
  <Svg>
    <circle cx="6" cy="16" r="3.6" />
    <circle cx="18" cy="16" r="3.6" />
    <path d="M6 16l4-7h5.5L18 16M10 9l3.2 7H6M14.6 9l-.9-2.8h-2.2" />
  </Svg>
);
const Mat = () => (
  <Svg>
    <path d="M4 10.5h12.5M4 19.5h12.5M4 10.5v9" />
    <circle cx="16.5" cy="15" r="4.5" />
    <circle cx="16.5" cy="15" r="1.4" />
  </Svg>
);
const Rope = () => (
  <Svg>
    <path d="M5 3.5v5.5M19 3.5v5.5" strokeWidth="2.8" />
    <path d="M5 9c0 13 14 13 14 0" />
  </Svg>
);
const Band = () => (
  <Svg>
    <rect x="3.5" y="7" width="17" height="10" rx="5" />
    <rect x="7" y="9.6" width="10" height="4.8" rx="2.4" />
  </Svg>
);
const Ball = () => (
  <Svg>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.8 10c5 2 11.4 2 16.4 0M5 16.5c4.5-1.8 9.5-1.8 14 0" />
  </Svg>
);
const PullUpBar = () => (
  <Svg>
    <path d="M2.5 4.5h19M5 4.5v4M19 4.5v4" />
    <circle cx="12" cy="10" r="1.8" fill="currentColor" stroke="none" />
    <path d="M8.5 4.5l2 3.8h3l2-3.8M12 12.5v4.5M12 17l-1.6 4M12 17l1.6 4" />
  </Svg>
);
const Rowing = () => (
  <Svg>
    <path d="M4 5.5l13 9" strokeWidth="2.4" />
    <path d="M17 14.5l2.5 1.6" strokeWidth="3.4" />
    <path d="M2.5 19c2 1.6 3.8 1.6 5.8 0s3.8-1.6 5.8 0 3.8 1.6 5.8 0" />
  </Svg>
);

const Flame = () => (
  <Svg>
    <path d="M12 21.5c-3.9 0-6.8-2.7-6.8-6.4 0-3.2 2.2-5.3 3.6-7.4.3 1.6 1 2.7 2.1 3.3C11 7.3 12.4 4.4 15 2.5c-.4 3 1 4.8 2.3 6.6 1 1.4 1.5 3 1.5 4.9 0 4.4-3 7.5-6.8 7.5z" />
    <path d="M12 21.5c-1.8 0-3-1.3-3-3 0-1.9 1.6-3 2.4-4.6.9 1.7 3.6 2.4 3.6 4.7 0 1.6-1.3 2.9-3 2.9z" />
  </Svg>
);
const Stopwatch = () => (
  <Svg>
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 13.5V9.5M12 13.5l2.8 2M10 2.5h4M12 2.5V6M18.2 6.8l1.3-1.3" />
  </Svg>
);

// ---------- which drawing goes with which name ----------
const TYPE_ICONS = {
  Cardiovascular: Heart,
  'Strength & Resistance': Dumbbell,
  HIIT: Lightning,
  'Flexibility & Mobility': Stretch,
  'Balance & Stability': TreePose,
  'Functional Training': Kettlebell,
  [OTHER]: Pencil,
};

const EQUIPMENT_ICONS = {
  'None (bodyweight)': Person,
  Dumbbells: Dumbbell,
  Barbell,
  Kettlebell,
  'Resistance bands': Band,
  'Pull-up bar': PullUpBar,
  'Medicine ball': Ball,
  'Jump rope': Rope,
  'Yoga mat': Mat,
  Treadmill: Runner,
  Elliptical: Runner,
  'Stair climber': Runner,
  'Stationary bike': Bike,
  'Rowing machine': Rowing,
  [OTHER]: Pencil,
  // benches and the machines: a dumbbell (the default below)
};

// The goal types (lib/goalTypes.js): calories, duration, workouts.
const GOAL_ICONS = { calories: Flame, duration: Stopwatch, workouts: Dumbbell };

export function GoalIcon({ type }) {
  const Icon = GOAL_ICONS[type] || Person;
  return <Icon />;
}

// Nothing chosen yet: a person with arms up for the type, a dumbbell for equipment.
export function TypeIcon({ type }) {
  const Icon = TYPE_ICONS[type] || Person;
  return <Icon />;
}

export function EquipmentIcon({ equipment }) {
  const Icon = EQUIPMENT_ICONS[equipment] || Dumbbell;
  return <Icon />;
}
