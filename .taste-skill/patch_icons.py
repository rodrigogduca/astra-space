import re, sys, os

root = sys.argv[1]


def edit(rel, fn):
    p = os.path.join(root, rel)
    s = open(p, encoding="utf-8").read()
    s2 = fn(s)
    open(p, "w", encoding="utf-8").write(s2)


IND = ["heart-pulse", "activity", "gauge", "gauge", "droplets", "wind", "thermometer", "droplet", "radiation", "air-vent",
       "moon", "glass-water", "dumbbell", "zap", "smile", "brain", "sparkles", "earth", "flower"]


def indicators(s):
    it = iter(IND)
    s = re.sub(r'    icon: "[^"]+",', lambda m: f'    icon: "{next(it)}",', s)
    s = s.replace('import type { IndicatorCode, Pillar } from "./types";', 'import type { IndicatorCode, Pillar } from "./types";\nimport type { IconName } from "./icons";')
    s = s.replace("  icon: string;", "  icon: IconName;")
    return s


MIS = {"🌅": "sunrise", "🩺": "stethoscope", "💧": "glass-water", "🏋️": "dumbbell", "🫧": "wind", "🌍": "earth", "🪟": "scan-eye",
       "🙏": "hand-heart", "🌌": "moon-star", "🛰️": "orbit", "🔥": "flame", "🌠": "sparkles", "🌏": "earth", "📡": "satellite-dish",
       "🏆": "trophy", "🎖️": "medal", "🌙": "moon", "🧘": "flower", "🚀": "rocket"}


def gamification(s):
    s = re.sub(r'icon: "([^"]+)"', lambda m: f'icon: "{MIS[m.group(1)]}"', s)
    s = re.sub(r', avatar: "[^"]+"', "", s)
    s = s.replace('import type { Observation, Pillar } from "./types";', 'import type { Observation, Pillar } from "./types";\nimport type { IconName } from "./icons";')
    s = s.replace("  icon: string;", "  icon: IconName;")
    return s


edit("domain/indicators.ts", indicators)
edit("domain/gamification.ts", gamification)
edit("domain/astrido.ts", lambda s: s.replace("Você é uma estrela de verdade ⭐", "Você é uma estrela de verdade."))
print("ok")
