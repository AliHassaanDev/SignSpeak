export interface PSLSign {
  id: string;
  urdu: string;
  gloss: string;
  english: string;
  category: "greeting" | "question" | "emergency" | "daily" | "alphabet" | "number";
  duration: number; // in milliseconds
  description: string;
  avatarPose: {
    leftArm: { shoulderAngle: number; elbowAngle: number; handShape: "open" | "fist" | "point" | "wave" | "peace" | "thumbsUp" | "chest" | "spread" };
    rightArm: { shoulderAngle: number; elbowAngle: number; handShape: "open" | "fist" | "point" | "wave" | "peace" | "thumbsUp" | "chest" | "spread" };
    headTilt: number;
    expression: "neutral" | "smile" | "question" | "alert";
    motionType: "wave" | "chestTouch" | "forwardPush" | "circle" | "pointForward" | "handsTogether" | "sideToSide" | "nod";
  };
}

export const PSL_DICTIONARY: Record<string, PSLSign> = {
  "السلام علیکم": {
    id: "salam",
    urdu: "السلام علیکم",
    gloss: "PEACE_BE_UPON_YOU",
    english: "Peace be upon you (Hello)",
    category: "greeting",
    duration: 1800,
    description: "Raise right hand to forehead in respectful salute, then bring both hands towards chest.",
    avatarPose: {
      leftArm: { shoulderAngle: 20, elbowAngle: 45, handShape: "open" },
      rightArm: { shoulderAngle: 65, elbowAngle: 85, handShape: "spread" },
      headTilt: 4,
      expression: "smile",
      motionType: "wave",
    },
  },
  "سلام": {
    id: "salam_short",
    urdu: "سلام",
    gloss: "SALAM",
    english: "Hello / Peace",
    category: "greeting",
    duration: 1500,
    description: "Open right hand gently waved from forehead outward.",
    avatarPose: {
      leftArm: { shoulderAngle: 15, elbowAngle: 30, handShape: "open" },
      rightArm: { shoulderAngle: 60, elbowAngle: 80, handShape: "spread" },
      headTilt: 0,
      expression: "smile",
      motionType: "wave",
    },
  },
  "شکریہ": {
    id: "shukriya",
    urdu: "شکریہ",
    gloss: "THANK_YOU",
    english: "Thank you",
    category: "greeting",
    duration: 1600,
    description: "Touch fingertips to chin/lips and move hand forward and downward with a slight bow.",
    avatarPose: {
      leftArm: { shoulderAngle: 15, elbowAngle: 30, handShape: "open" },
      rightArm: { shoulderAngle: 50, elbowAngle: 95, handShape: "chest" },
      headTilt: 6,
      expression: "smile",
      motionType: "forwardPush",
    },
  },
  "آپ کیسے ہیں؟": {
    id: "aap_kaisay_hain",
    urdu: "آپ کیسے ہیں؟",
    gloss: "HOW_ARE_YOU",
    english: "How are you?",
    category: "question",
    duration: 2000,
    description: "Point right index finger forward towards listener, then open both palms upward with raised eyebrows.",
    avatarPose: {
      leftArm: { shoulderAngle: 40, elbowAngle: 75, handShape: "open" },
      rightArm: { shoulderAngle: 45, elbowAngle: 75, handShape: "point" },
      headTilt: -4,
      expression: "question",
      motionType: "pointForward",
    },
  },
  "کیسے ہیں": {
    id: "kaisay_hain",
    urdu: "کیسے ہیں",
    gloss: "HOW_ARE_YOU",
    english: "How are you",
    category: "question",
    duration: 1800,
    description: "Both hands palms up rotate outward inquiringly.",
    avatarPose: {
      leftArm: { shoulderAngle: 35, elbowAngle: 70, handShape: "open" },
      rightArm: { shoulderAngle: 35, elbowAngle: 70, handShape: "open" },
      headTilt: -3,
      expression: "question",
      motionType: "sideToSide",
    },
  },
  "براہ کرم مدد کریں": {
    id: "madad_karein",
    urdu: "براہ کرم مدد کریں",
    gloss: "PLEASE_HELP",
    english: "Please help me",
    category: "emergency",
    duration: 2000,
    description: "Place closed right fist (thumbs up) on flat open left palm and lift both hands upward.",
    avatarPose: {
      leftArm: { shoulderAngle: 35, elbowAngle: 85, handShape: "open" },
      rightArm: { shoulderAngle: 40, elbowAngle: 90, handShape: "thumbsUp" },
      headTilt: 0,
      expression: "alert",
      motionType: "handsTogether",
    },
  },
  "مدد": {
    id: "madad",
    urdu: "مدد",
    gloss: "HELP",
    english: "Help",
    category: "emergency",
    duration: 1500,
    description: "Right fist with thumb up supported on left palm moving upward.",
    avatarPose: {
      leftArm: { shoulderAngle: 30, elbowAngle: 80, handShape: "open" },
      rightArm: { shoulderAngle: 35, elbowAngle: 85, handShape: "thumbsUp" },
      headTilt: 0,
      expression: "alert",
      motionType: "handsTogether",
    },
  },
  "خوش آمدید": {
    id: "khushamdeed",
    urdu: "خوش آمدید",
    gloss: "WELCOME",
    english: "Welcome",
    category: "greeting",
    duration: 1800,
    description: "Both palms extended outward facing up, swept inward toward chest warmly.",
    avatarPose: {
      leftArm: { shoulderAngle: 45, elbowAngle: 60, handShape: "open" },
      rightArm: { shoulderAngle: 45, elbowAngle: 60, handShape: "open" },
      headTilt: 3,
      expression: "smile",
      motionType: "chestTouch",
    },
  },
  "اللہ حافظ": {
    id: "allah_hafiz",
    urdu: "اللہ حافظ",
    gloss: "GOODBYE_ALLAH_PROTECT",
    english: "Goodbye",
    category: "greeting",
    duration: 1700,
    description: "Raise right hand and wave side to side gently.",
    avatarPose: {
      leftArm: { shoulderAngle: 10, elbowAngle: 25, handShape: "open" },
      rightArm: { shoulderAngle: 65, elbowAngle: 75, handShape: "wave" },
      headTilt: 2,
      expression: "smile",
      motionType: "wave",
    },
  },
  "پاکستان": {
    id: "pakistan",
    urdu: "پاکستان",
    gloss: "PAKISTAN",
    english: "Pakistan",
    category: "daily",
    duration: 1800,
    description: "Form crescent moon shape with right hand curved above left hand representing star/crescent.",
    avatarPose: {
      leftArm: { shoulderAngle: 30, elbowAngle: 80, handShape: "fist" },
      rightArm: { shoulderAngle: 55, elbowAngle: 85, handShape: "spread" },
      headTilt: 0,
      expression: "neutral",
      motionType: "circle",
    },
  },
  "ہسپتال": {
    id: "hospital",
    urdu: "ہسپتال",
    gloss: "HOSPITAL",
    english: "Hospital",
    category: "emergency",
    duration: 1800,
    description: "Draw a cross on upper left shoulder using right index and middle fingers.",
    avatarPose: {
      leftArm: { shoulderAngle: 20, elbowAngle: 45, handShape: "open" },
      rightArm: { shoulderAngle: 45, elbowAngle: 100, handShape: "peace" },
      headTilt: -2,
      expression: "alert",
      motionType: "chestTouch",
    },
  },
  "ڈاکٹر": {
    id: "doctor",
    urdu: "ڈاکٹر",
    gloss: "DOCTOR",
    english: "Doctor",
    category: "emergency",
    duration: 1700,
    description: "Tap right fingers on inside of left wrist as if checking pulse.",
    avatarPose: {
      leftArm: { shoulderAngle: 25, elbowAngle: 85, handShape: "open" },
      rightArm: { shoulderAngle: 30, elbowAngle: 90, handShape: "peace" },
      headTilt: 0,
      expression: "neutral",
      motionType: "chestTouch",
    },
  },
  "پانی": {
    id: "paani",
    urdu: "پانی",
    gloss: "WATER",
    english: "Water",
    category: "daily",
    duration: 1500,
    description: "Form 'W' shape with 3 fingers and tap twice near the chin.",
    avatarPose: {
      leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" },
      rightArm: { shoulderAngle: 40, elbowAngle: 105, handShape: "spread" },
      headTilt: 0,
      expression: "neutral",
      motionType: "chestTouch",
    },
  },
  "کھانا": {
    id: "khana",
    urdu: "کھانا",
    gloss: "FOOD_EAT",
    english: "Food / Eat",
    category: "daily",
    duration: 1500,
    description: "Bring clustered fingertips of right hand to mouth twice.",
    avatarPose: {
      leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" },
      rightArm: { shoulderAngle: 45, elbowAngle: 110, handShape: "fist" },
      headTilt: 0,
      expression: "neutral",
      motionType: "chestTouch",
    },
  },
  "ہاں": {
    id: "haan",
    urdu: "ہاں",
    gloss: "YES",
    english: "Yes",
    category: "daily",
    duration: 1300,
    description: "Right fist nods up and down imitating a nodding head.",
    avatarPose: {
      leftArm: { shoulderAngle: 15, elbowAngle: 30, handShape: "open" },
      rightArm: { shoulderAngle: 35, elbowAngle: 75, handShape: "fist" },
      headTilt: 6,
      expression: "smile",
      motionType: "nod",
    },
  },
  "نہیں": {
    id: "nahin",
    urdu: "نہیں",
    gloss: "NO",
    english: "No",
    category: "daily",
    duration: 1400,
    description: "Extend right index finger and shake side to side while head shakes gently.",
    avatarPose: {
      leftArm: { shoulderAngle: 15, elbowAngle: 30, handShape: "open" },
      rightArm: { shoulderAngle: 40, elbowAngle: 70, handShape: "point" },
      headTilt: -5,
      expression: "alert",
      motionType: "sideToSide",
    },
  },
  "دوست": {
    id: "dost",
    urdu: "دوست",
    gloss: "FRIEND",
    english: "Friend",
    category: "daily",
    duration: 1700,
    description: "Hook index fingers of both hands together, then switch and hook the other way.",
    avatarPose: {
      leftArm: { shoulderAngle: 35, elbowAngle: 80, handShape: "point" },
      rightArm: { shoulderAngle: 35, elbowAngle: 80, handShape: "point" },
      headTilt: 2,
      expression: "smile",
      motionType: "handsTogether",
    },
  },
  "اسکول": {
    id: "school",
    urdu: "اسکول",
    gloss: "SCHOOL",
    english: "School",
    category: "daily",
    duration: 1600,
    description: "Clap flat right palm horizontally across flat left palm twice.",
    avatarPose: {
      leftArm: { shoulderAngle: 30, elbowAngle: 85, handShape: "open" },
      rightArm: { shoulderAngle: 35, elbowAngle: 90, handShape: "open" },
      headTilt: 0,
      expression: "neutral",
      motionType: "handsTogether",
    },
  },
  "میرا نام": {
    id: "mera_naam",
    urdu: "میرا نام",
    gloss: "MY_NAME",
    english: "My name is",
    category: "daily",
    duration: 1800,
    description: "Tap flat right palm on center chest, then cross index and middle fingers in the 'NAME' sign.",
    avatarPose: {
      leftArm: { shoulderAngle: 25, elbowAngle: 70, handShape: "peace" },
      rightArm: { shoulderAngle: 35, elbowAngle: 95, handShape: "chest" },
      headTilt: 2,
      expression: "smile",
      motionType: "chestTouch",
    },
  },
};

// Finger spelling alphabet mapping for character fallback (aligned with LETTER_A..LETTER_Z assets)
export const PSL_ALPHABET: Record<string, PSLSign> = {
  "ا": { id: "alif", urdu: "الف", gloss: "LETTER_A", english: "Letter A", category: "alphabet", duration: 1000, description: "Index finger up.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 45, elbowAngle: 85, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "pointForward" } },
  "آ": { id: "alif_madd", urdu: "الف", gloss: "LETTER_A", english: "Letter A", category: "alphabet", duration: 1000, description: "Index finger up.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 45, elbowAngle: 85, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "pointForward" } },
  "ب": { id: "bay", urdu: "بے", gloss: "LETTER_B", english: "Letter B", category: "alphabet", duration: 1000, description: "Flat open hand.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "open" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "پ": { id: "pay", urdu: "پے", gloss: "LETTER_P", english: "Letter P", category: "alphabet", duration: 1000, description: "Three fingers down.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "spread" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ت": { id: "tay", urdu: "تے", gloss: "LETTER_T", english: "Letter T", category: "alphabet", duration: 1000, description: "Two fingers up.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 45, elbowAngle: 85, handShape: "peace" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ٹ": { id: "ttay", urdu: "ٹے", gloss: "LETTER_T", english: "Letter T", category: "alphabet", duration: 1000, description: "Two fingers curled.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 45, elbowAngle: 85, handShape: "peace" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ث": { id: "say", urdu: "ثے", gloss: "LETTER_S", english: "Letter S", category: "alphabet", duration: 1000, description: "Three fingers spread.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "spread" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ج": { id: "jeem", urdu: "جیم", gloss: "LETTER_J", english: "Letter J", category: "alphabet", duration: 1000, description: "Curved finger handshape.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "چ": { id: "chay", urdu: "چے", gloss: "LETTER_C", english: "Letter C", category: "alphabet", duration: 1000, description: "C-shaped hand.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "open" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ح": { id: "hay", urdu: "حے", gloss: "LETTER_H", english: "Letter H", category: "alphabet", duration: 1000, description: "Two horizontal fingers.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "peace" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "خ": { id: "khay", urdu: "خے", gloss: "LETTER_K", english: "Letter K", category: "alphabet", duration: 1000, description: "K shape gesture.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "د": { id: "daal", urdu: "دال", gloss: "LETTER_D", english: "Letter D", category: "alphabet", duration: 1000, description: "Index finger up, thumb touch.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ڈ": { id: "ddaal", urdu: "ڈال", gloss: "LETTER_D", english: "Letter D", category: "alphabet", duration: 1000, description: "Index finger up with curve.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ذ": { id: "zaal", urdu: "ذال", gloss: "LETTER_Z", english: "Letter Z", category: "alphabet", duration: 1000, description: "Index finger z motion.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ر": { id: "ray", urdu: "رے", gloss: "LETTER_R", english: "Letter R", category: "alphabet", duration: 1000, description: "Crossed fingers.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "peace" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ڑ": { id: "rray", urdu: "ڑے", gloss: "LETTER_R", english: "Letter R", category: "alphabet", duration: 1000, description: "Crossed fingers downward.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "peace" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ز": { id: "zay", urdu: "زے", gloss: "LETTER_Z", english: "Letter Z", category: "alphabet", duration: 1000, description: "Index finger tracing Z.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "س": { id: "seen", urdu: "سین", gloss: "LETTER_S", english: "Letter S", category: "alphabet", duration: 1000, description: "Fist with thumb across.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "fist" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ش": { id: "sheen", urdu: "شین", gloss: "LETTER_S", english: "Letter S", category: "alphabet", duration: 1000, description: "Fist with fingers wiggling.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "fist" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ص": { id: "swaad", urdu: "صاد", gloss: "LETTER_S", english: "Letter S", category: "alphabet", duration: 1000, description: "Closed fist S shape.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "fist" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ض": { id: "zwaad", urdu: "ضاد", gloss: "LETTER_Z", english: "Letter Z", category: "alphabet", duration: 1000, description: "Closed fist Z shape.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "fist" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ط": { id: "toye", urdu: "طوئے", gloss: "LETTER_T", english: "Letter T", category: "alphabet", duration: 1000, description: "Thumb under index.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ظ": { id: "zoye", urdu: "ظوئے", gloss: "LETTER_Z", english: "Letter Z", category: "alphabet", duration: 1000, description: "Thumb under index with dot.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ع": { id: "ain", urdu: "عین", gloss: "LETTER_A", english: "Letter A", category: "alphabet", duration: 1000, description: "Curved hand gesture.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "open" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "غ": { id: "ghain", urdu: "غین", gloss: "LETTER_G", english: "Letter G", category: "alphabet", duration: 1000, description: "Curved hand with dot gesture.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "open" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ف": { id: "fay", urdu: "فے", gloss: "LETTER_F", english: "Letter F", category: "alphabet", duration: 1000, description: "OK hand shape.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ق": { id: "qaaf", urdu: "قاف", gloss: "LETTER_Q", english: "Letter Q", category: "alphabet", duration: 1000, description: "Index and thumb downward.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ک": { id: "kaaf", urdu: "کاف", gloss: "LETTER_K", english: "Letter K", category: "alphabet", duration: 1000, description: "Index and middle finger up in V.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "peace" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "گ": { id: "gaaf", urdu: "گاف", gloss: "LETTER_G", english: "Letter G", category: "alphabet", duration: 1000, description: "Index and middle finger with bar.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "peace" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ل": { id: "laam", urdu: "لام", gloss: "LETTER_L", english: "Letter L", category: "alphabet", duration: 1000, description: "L shape with index and thumb.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "م": { id: "meem", urdu: "میم", gloss: "LETTER_M", english: "Letter M", category: "alphabet", duration: 1000, description: "Closed fist with thumb tucked under.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "fist" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ن": { id: "noon", urdu: "نون", gloss: "LETTER_N", english: "Letter N", category: "alphabet", duration: 1000, description: "Cupped hand forming a curve with one dot gesture.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "circle" } },
  "ں": { id: "noon_ghunna", urdu: "نون غنہ", gloss: "LETTER_N", english: "Letter N", category: "alphabet", duration: 1000, description: "Cupped hand curve.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "circle" } },
  "و": { id: "wao", urdu: "واؤ", gloss: "LETTER_W", english: "Letter W", category: "alphabet", duration: 1000, description: "Three fingers forming W.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "spread" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ہ": { id: "gol_hay", urdu: "ہے", gloss: "LETTER_H", english: "Letter H", category: "alphabet", duration: 1000, description: "Index and thumb circle.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "peace" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ھ": { id: "do_chashmi_hay", urdu: "دو چشمی ہے", gloss: "LETTER_H", english: "Letter H", category: "alphabet", duration: 1000, description: "Two loop gesture.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "peace" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ء": { id: "hamza", urdu: "ہمزہ", gloss: "LETTER_A", english: "Letter A", category: "alphabet", duration: 1000, description: "Small crescent wave.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "point" }, headTilt: 0, expression: "neutral", motionType: "pointForward" } },
  "ی": { id: "choti_ye", urdu: "چھوٹی یے", gloss: "LETTER_Y", english: "Letter Y", category: "alphabet", duration: 1000, description: "Pinky finger extended outward in small 'Y' shape.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "peace" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
  "ے": { id: "badi_ye", urdu: "بڑی یے", gloss: "LETTER_Y", english: "Letter Y", category: "alphabet", duration: 1000, description: "Flat hand extending forward.", avatarPose: { leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" }, rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "peace" }, headTilt: 0, expression: "neutral", motionType: "forwardPush" } },
};

/**
 * Parses raw Urdu input text into a sequence of PSL sign gestures.
 * Matches multi-word phrases first, then single dictionary words, and falls back to character finger-spelling.
 */
export function translateUrduToPSL(text: string): { signs: PSLSign[]; breakdown: { original: string; matched: boolean; gloss: string }[] } {
  const trimmed = text.trim();
  if (!trimmed) return { signs: [], breakdown: [] };

  const signs: PSLSign[] = [];
  const breakdown: { original: string; matched: boolean; gloss: string }[] = [];

  // 1. Direct multi-word phrase matching
  const lower = trimmed.replace(/[،۔!؟]/g, "").trim();
  if (PSL_DICTIONARY[lower]) {
    const matchedSign = PSL_DICTIONARY[lower];
    signs.push(matchedSign);
    breakdown.push({ original: trimmed, matched: true, gloss: matchedSign.gloss });
    return { signs, breakdown };
  }

  // 2. Tokenize by words
  const words = lower.split(/\s+/).filter(Boolean);

  let i = 0;
  while (i < words.length) {
    // Check 2-word combinations
    if (i < words.length - 1) {
      const twoWords = `${words[i]} ${words[i + 1]}`;
      if (PSL_DICTIONARY[twoWords]) {
        const sign = PSL_DICTIONARY[twoWords];
        signs.push(sign);
        breakdown.push({ original: twoWords, matched: true, gloss: sign.gloss });
        i += 2;
        continue;
      }
    }

    const currentWord = words[i];
    if (PSL_DICTIONARY[currentWord]) {
      const sign = PSL_DICTIONARY[currentWord];
      signs.push(sign);
      breakdown.push({ original: currentWord, matched: true, gloss: sign.gloss });
      i++;
    } else {
      // Finger-spell characters for unknown word
      let wordMatchedAny = false;
      const chars = Array.from(currentWord);
      for (const char of chars) {
        if (PSL_ALPHABET[char]) {
          signs.push(PSL_ALPHABET[char]);
          wordMatchedAny = true;
        } else {
          // Default generic gesture for unmapped character
          signs.push({
            id: `char_${char}`,
            urdu: char,
            gloss: `SPELL_${char}`,
            english: `Letter ${char}`,
            category: "alphabet",
            duration: 900,
            description: `Finger spelling for character ${char}`,
            avatarPose: {
              leftArm: { shoulderAngle: 10, elbowAngle: 20, handShape: "open" },
              rightArm: { shoulderAngle: 40, elbowAngle: 80, handShape: "point" },
              headTilt: 0,
              expression: "neutral",
              motionType: "forwardPush",
            },
          });
        }
      }
      breakdown.push({ original: currentWord, matched: wordMatchedAny, gloss: `SPELL[${currentWord}]` });
      i++;
    }
  }

  return { signs, breakdown };
}
