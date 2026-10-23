export type AppLanguage = "en" | "ur";

export interface Translations {
  // Brand
  brandName: string;
  brandTagline: string;

  // Header Nav
  navAbout: string;
  navHowItWorks: string;
  navFeatures: string;
  navImpact: string;
  navLearnPSL: string;
  navGetStarted: string;
  langSwitchBtnLabel: string;
  langSwitchAria: string;

  // Header Dropdowns - About
  aboutTagPSL: string;
  aboutTagAssistive: string;
  aboutLead: string;
  aboutTagTwoWay: string;
  aboutTagVision: string;
  aboutTagAvatar: string;

  // Header Dropdowns - How It Works
  howStep1Title: string;
  howStep1Desc: string;
  howStep2Title: string;
  howStep2Desc: string;
  howStep3Title: string;
  howStep3Desc: string;

  // Header Dropdowns - Features
  feat1Title: string;
  feat1Desc: string;
  feat2Title: string;
  feat2Desc: string;
  feat3Title: string;
  feat3Desc: string;

  // Header Dropdowns - Impact
  impactCommunityLabel: string;
  impactCommunityVal: string;
  impactLanguagesLabel: string;
  impactLanguagesVal: string;
  impactAccessLabel: string;
  impactAccessVal: string;
  impactUseCasesLabel: string;
  impactUseCasesVal: string;
  impactFooterNote: string;

  // Hero Section
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroSubtitle: string;
  heroBtnTranslate: string;
  heroBtnLearn: string;
  heroFeat1Title: string;
  heroFeat1Desc: string;
  heroFeat2Title: string;
  heroFeat2Desc: string;
  heroFeat3Title: string;
  heroFeat3Desc: string;

  // About Modal
  modalAboutTitle: string;
  modalAboutSummary: string;
  modalAboutVisionTitle: string;
  modalAboutVisionDesc: string;
  modalAboutAvatarTitle: string;
  modalAboutAvatarDesc: string;
  modalAboutAccessTitle: string;
  modalAboutAccessDesc: string;
  modalCloseBtn: string;

  // Workspace Tabs
  tabUrduToPSLTitle: string;
  tabUrduToPSLSub: string;
  tabPSLToUrduTitle: string;
  tabPSLToUrduSub: string;

  // Urdu to PSL Workspace
  urduToPSLTitle: string;
  urduToPSLSubtitle: string;
  howItWorksBtn: string;
  modeImages: string;
  modeImagesUrdu: string;
  modeVideo: string;
  modeVideoUrdu: string;
  mode3DModel: string;
  mode3DModelUrdu: string;
  modeTitleImages: string;
  modeTitleVideo: string;
  modeTitle3D: string;
  timelineTitle: string;
  signCounter: (current: number, total: number) => string;
  copyGloss: string;
  copiedGloss: string;
  fullscreenView: string;
  exitFullscreen: string;

  // Urdu Input Panel
  inputPanelTitleUrdu: string;
  inputPanelTitleEn: string;
  inputPlaceholderUrdu: string;
  inputPlaceholderEn: string;
  charCountLabel: (current: number, max: number) => string;
  clearBtn: string;
  translateBtn: string;
  translatingBtn: string;
  catAll: string;
  catGreetings: string;
  catEmergency: string;
  catDaily: string;
  listenBtn: string;
  listeningBtn: string;
  audioPronounceBtn: string;
  urduTranslationBannerTitle: string;

  // PSL Video Player
  playerEmptyTitleVideo: string;
  playerEmptyDescVideo: string;
  playerEmptyTitleImage: string;
  playerEmptyDescImage: string;
  playerPillHDVideo: string;
  playerPillHDImage: string;
  playerPillSOV: string;
  playerPillFingerspelling: string;
  playerLoadingVideo: string;
  playerLoadingImage: string;
  playerNotFound: (token: string, mode: string) => string;
  ctrlPlay: string;
  ctrlPause: string;
  ctrlReplay: string;
  ctrlPrev: string;
  ctrlNext: string;
  ctrlSpeed: string;

  // PSL to Urdu Workspace
  pslToUrduTitle: string;
  pslToUrduSubtitle: string;
  cameraModeCamera: string;
  cameraModeUpload: string;
  cameraOffTitle: string;
  cameraOffDesc: string;
  startCameraBtn: string;
  uploadChangeFile: string;
  uploadDropzoneText: string;
  uploadDropzoneHint: string;
  uploadTranslatingBtn: string;
  uploadAnalyzingBtn: string;
  uploadTranslateBtn: string;

  // Transcript Panel
  liveTranslationTitle: string;
  undoBtn: string;
  clearAllBtn: string;
  historyBtnTitle: string;
  historyDropdownTitle: string;
  noHistoryLogs: string;
  waitingGesturesTitle: string;
  waitingGesturesDesc: string;
  copyBtn: string;
  copiedBtn: string;

  // Recognition Tips
  tipsTitle: string;
  tip1: string;
  tip2: string;
  tip3: string;

  // Info Modal - PSL Recognition
  pslInfoTitle: string;
  pslInfoDesc: string;

  // Info Modal - PSL Translation
  urduInfoTitle: string;
  urduInfoDesc: string;
  urduInfoFeature1Title: string;
  urduInfoFeature1Desc: string;
  urduInfoFeature2Title: string;
  urduInfoFeature2Desc: string;
  urduInfoFeature3Title: string;
  urduInfoFeature3Desc: string;

  // ChatBot
  botFabTooltip: string;
  botTitle: string;
  botTag: string;
  botSubtitle: string;
  botThinking: string;
  botResetTitle: string;
  botInputPlaceholder: string;
}

export const translations: Record<AppLanguage, Translations> = {
  en: {
    brandName: "SignSpeak",
    brandTagline: "Two-Way PSL Translator",

    navAbout: "About SignSpeak",
    navHowItWorks: "How It Works",
    navFeatures: "Features",
    navImpact: "Impact & Reach",
    navLearnPSL: "Learn PSL",
    navGetStarted: "Get Started",
    langSwitchBtnLabel: "اردو میں دیکھیں",
    langSwitchAria: "Switch entire app interface language to Urdu",

    aboutTagPSL: "PSL ↔ Urdu AI",
    aboutTagAssistive: "Assistive Technology",
    aboutLead:
      "SignSpeak is a bidirectional assistive communication platform that breaks communication barriers between 1.5M+ deaf individuals and hearing communities in Pakistan through real-time sign language translation.",
    aboutTagTwoWay: "Two-Way Translation",
    aboutTagVision: "Live Vision AI",
    aboutTagAvatar: "3D Sign Avatar",

    howStep1Title: "Live Landmark & Gesture Tracking",
    howStep1Desc:
      "High-speed camera pipeline tracks 21 hand landmarks, finger articulation & sign motion dynamics.",
    howStep2Title: "Neural PSL-to-Urdu Translation",
    howStep2Desc:
      "Deep learning architecture interprets spatial PSL grammar and constructs natural Urdu sentences.",
    howStep3Title: "Speech Synthesis & 3D Signer",
    howStep3Desc:
      "Outputs natural Urdu voice audio for signs, or animates the real-time 3D avatar for typed Urdu text.",

    feat1Title: "Sign to Urdu Translation",
    feat1Desc:
      "Live camera and video recognition translating PSL signs into instant Urdu text and spoken audio.",
    feat2Title: "Urdu to 3D Sign Avatar",
    feat2Desc:
      "Responsive 3D animated sign language avatar with replay, pause, and playback speed adjustments.",
    feat3Title: "Bidirectional Live Sync",
    feat3Desc:
      "Enables natural, two-way conversational flow between deaf signers and hearing individuals.",

    impactCommunityLabel: "Target Community",
    impactCommunityVal: "1.5M+ Deaf Citizens in Pakistan",
    impactLanguagesLabel: "Supported Languages",
    impactLanguagesVal: "Pakistani Sign Language (PSL) & Urdu",
    impactAccessLabel: "Platform Access",
    impactAccessVal: "Universal Web (No special hardware)",
    impactUseCasesLabel: "Key Use Cases",
    impactUseCasesVal: "Healthcare, Education & Daily Life",
    impactFooterNote:
      "Built on localized Pakistani Sign Language standards to deliver accessible, private assistive communication.",

    heroTitleLine1: "Speak Freely.",
    heroTitleLine2: "Understand Deeply.",
    heroSubtitle:
      "SignSpeak is a two-way sign language translator that bridges the gap between silence and speech. Because every conversation matters.",
    heroBtnTranslate: "Start Translating",
    heroBtnLearn: "Learn PSL",
    heroFeat1Title: "Two-Way Translation",
    heroFeat1Desc: "PSL to Urdu & Urdu to PSL",
    heroFeat2Title: "AI Powered",
    heroFeat2Desc: "Advanced AI for accurate and real-time translation",
    heroFeat3Title: "Easy to Use",
    heroFeat3Desc: "Simple, intuitive and accessible for everyone",

    modalAboutTitle: "About SignSpeak",
    modalAboutSummary:
      "SignSpeak is a bidirectional assistive platform designed to enable natural, real-time communication between Pakistani Sign Language (PSL) signers and hearing individuals.",
    modalAboutVisionTitle: "PSL to Urdu Vision Translation",
    modalAboutVisionDesc:
      "Live camera and video recognition translating continuous hand gestures into instant Urdu text and spoken voice.",
    modalAboutAvatarTitle: "Urdu to 3D Sign Language Avatar",
    modalAboutAvatarDesc:
      "Text-to-sign conversion rendering anatomically accurate 3D Pakistani Sign Language animations with playback controls.",
    modalAboutAccessTitle: "Universal Browser-First Access",
    modalAboutAccessDesc:
      "Runs smoothly directly in web browsers with zero installation, designed for Pakistan's 1.5M+ deaf community.",
    modalCloseBtn: "Close",

    tabUrduToPSLTitle: "Urdu to PSL",
    tabUrduToPSLSub: "Urdu text to signs",
    tabPSLToUrduTitle: "PSL to Urdu",
    tabPSLToUrduSub: "Signs to Urdu translation",

    urduToPSLTitle: "Urdu to PSL Translator",
    urduToPSLSubtitle:
      "Convert Urdu or English sentences into real-time Pakistani Sign Language (PSL) sequential video signs powered by Gemini AI.",
    howItWorksBtn: "How It Works",
    modeImages: "Images",
    modeImagesUrdu: "تصویر",
    modeVideo: "Video",
    modeVideoUrdu: "ویڈیو",
    mode3DModel: "3D Model",
    mode3DModelUrdu: "ماڈل",
    modeTitleImages: "Understand by Images (تصویر)",
    modeTitleVideo: "Understand by Video (ویڈیو)",
    modeTitle3D: "3D Model Studio (تھری ڈی ماڈل)",
    timelineTitle: "Sign Sequence Timeline",
    signCounter: (current, total) => `Sign ${current} of ${total}`,
    copyGloss: "Copy Gloss",
    copiedGloss: "Copied Gloss",
    fullscreenView: "Expanded Fullscreen View",
    exitFullscreen: "Exit Fullscreen",

    inputPanelTitleUrdu: "اردو متن درج کریں",
    inputPanelTitleEn: "Enter English Text",
    inputPlaceholderUrdu:
      "یہاں اردو لکھیں یا بولیں... (مثال: ہسپتال کہاں ہے؟ / میرا نام امان ہے / السلام علیکم)",
    inputPlaceholderEn:
      "Type or speak English here... (e.g., Where is the hospital? / My name is Amaan)",
    charCountLabel: (current, max) => `${current} / ${max} characters`,
    clearBtn: "Clear",
    translateBtn: "Translate to PSL Signs",
    translatingBtn: "Translating with Gemini...",
    catAll: "All",
    catGreetings: "Greetings",
    catEmergency: "Emergency",
    catDaily: "Daily",
    listenBtn: "Listen",
    listeningBtn: "Stop listening",
    audioPronounceBtn: "Listen to pronunciation",
    urduTranslationBannerTitle: "Urdu Translation (اردو ترجمہ)",

    playerEmptyTitleVideo: "Understand by Video (ویڈیو)",
    playerEmptyDescVideo:
      "Enter Urdu or English text on the left and click Translate. Signs will play sequentially as natural Pakistani Sign Language videos.",
    playerEmptyTitleImage: "Understand by Images (تصویر)",
    playerEmptyDescImage:
      "Enter Urdu or English text on the left and click Translate. Signs will display sequentially as high-definition PSL illustration image cards.",
    playerPillHDVideo: "HD Sign Video",
    playerPillHDImage: "HD Sign Images",
    playerPillSOV: "SOV Word Order",
    playerPillFingerspelling: "Alphabet Fingerspelling",
    playerLoadingVideo: "Loading next sign video...",
    playerLoadingImage: "Loading next sign image...",
    playerNotFound: (token, mode) =>
      `Sign ${mode === "image" ? "image" : "video"} for ${token} not in library`,
    ctrlPlay: "Play",
    ctrlPause: "Pause",
    ctrlReplay: "Replay",
    ctrlPrev: "Previous Sign",
    ctrlNext: "Next Sign",
    ctrlSpeed: "Playback Speed",

    pslToUrduTitle: "PSL to Urdu Translator",
    pslToUrduSubtitle:
      "Recognize Pakistani Sign Language gestures via live camera, demo testbed, or video upload into Urdu & English text and speech.",
    cameraModeCamera: "Live Camera",
    cameraModeUpload: "Upload Media",
    cameraOffTitle: "Camera is off (کیمرا بند ہے)",
    cameraOffDesc:
      "Click below to allow camera access for real-time sign recognition",
    startCameraBtn: "Start Real Camera",
    uploadChangeFile: "Change File",
    uploadDropzoneText: "Upload PSL Video or Gesture Image",
    uploadDropzoneHint:
      "Drag & drop video clips (.mp4, .webm) or click to browse files",
    uploadTranslatingBtn: "Uploading video…",
    uploadAnalyzingBtn: "Analyzing signs…",
    uploadTranslateBtn: "Translate",

    liveTranslationTitle: "Live Translation (ترجمہ)",
    undoBtn: "Undo",
    clearAllBtn: "Clear",
    historyBtnTitle: "View translation history",
    historyDropdownTitle: "Translation History Logs",
    noHistoryLogs: "No logs saved yet.",
    waitingGesturesTitle: "Waiting for PSL Signs...",
    waitingGesturesDesc:
      "Turn on the camera or upload a video clip to begin real-time gesture recognition.",
    copyBtn: "Copy",
    copiedBtn: "Copied",

    tipsTitle: "Recognition Performance Tips:",
    tip1: "Good frontal lighting",
    tip2: "High hand contrast against torso",
    tip3: "Hold signs stably for ~300ms",

    pslInfoTitle: "Pakistani Sign Language (PSL) Recognition System",
    pslInfoDesc:
      "SignSpeak utilizes client-side landmark extraction and temporal sequence recognition to identify dynamic PSL words and Urdu alphabet fingerspelling in real time.",

    urduInfoTitle: "About Pakistani Sign Language (PSL) Translation",
    urduInfoDesc:
      "Pakistani Sign Language (PSL) utilizes visual-spatial gestures to enable direct communication for Pakistan's deaf community.",
    urduInfoFeature1Title: "Dual Language Translation",
    urduInfoFeature1Desc:
      "Supports English and Urdu text or voice input, translating sentences into PSL Subject-Object-Verb (SOV) grammatical sequence.",
    urduInfoFeature2Title: "Video-Like Sequential Sign Display",
    urduInfoFeature2Desc:
      "Signs are displayed sequentially for ~2 seconds per sign with smooth crossfading, simulating high-definition sign language video clips.",
    urduInfoFeature3Title: "Alphabet Fingerspelling Fallback",
    urduInfoFeature3Desc:
      "Proper nouns, names, and uncataloged words are automatically split into letters and fingerspelled using authentic PSL manual alphabet signs.",

    botFabTooltip: "Ethical PSL & App Help",
    botTitle: "SignBot",
    botTag: "Ethical PSL AI",
    botSubtitle: "Ethical Sign Language & SignSpeak Assistant",
    botThinking: "SignBot is thinking…",
    botResetTitle: "New conversation",
    botInputPlaceholder: "Type a question in Urdu or English...",
  },

  ur: {
    brandName: "سائن اسپیک",
    brandTagline: "دو طرفہ اشاراتی زبان کا مترجم",

    navAbout: "سائن اسپیک کے بارے میں",
    navHowItWorks: "طریقہ کار",
    navFeatures: "خصوصیات",
    navImpact: "اثرات اور وسعت",
    navLearnPSL: "اشارات سیکھیں",
    navGetStarted: "شروع کریں",
    langSwitchBtnLabel: "Switch to English",
    langSwitchAria: "تمام ایپلیکیشن کا انٹرفیس انگریزی میں تبدیل کریں",

    aboutTagPSL: "پی ایس ایل ↔ اردو اے آئی",
    aboutTagAssistive: "معاون ٹیکنالوجی",
    aboutLead:
      "سائن اسپیک ایک دو طرفہ معاون مواصلاتی پلیٹ فارم ہے جو پاکستان میں 15 لاکھ سے زائد قوتِ سماعت سے محروم افراد اور بولنے والی برادریوں کے درمیان لائیو اشاروں کے ترجمے کے ذریعے رابطے کی تمام رکاوٹوں کو دور کرتا ہے۔",
    aboutTagTwoWay: "دو طرفہ ترجمہ",
    aboutTagVision: "لائیو وژن اے آئی",
    aboutTagAvatar: "تھری ڈی اشاراتی اوتار",

    howStep1Title: "لائیو لینڈ مارک اور اشارات ٹریکنگ",
    howStep1Desc:
      "تیز رفتار کیمرا پائپ لائن ہاتھوں کے 21 لینڈ مارکس، انگلیوں کی حرکات اور اشاروں کے انداز کو درستگی سے ٹریک کرتی ہے۔",
    howStep2Title: "نیورل پی ایس ایل سے اردو ترجمہ",
    howStep2Desc:
      "ڈیپ لرننگ ماڈل پی ایس ایل کی گرامر کو سمجھ کر بامعنی، باقاعدہ اور فطری اردو جملے تشکیل دیتا ہے۔",
    howStep3Title: "آواز کی تخلیق اور تھری ڈی اشارے",
    howStep3Desc:
      "اشاروں کے لیے قدرتی اردو آواز بولتا ہے، یا درج شدہ اردو متن کے لیے لائیو تھری ڈی اوتار کے ذریعے اشارے پیش کرتا ہے۔",

    feat1Title: "اشارات سے اردو ترجمہ",
    feat1Desc:
      "لائیو کیمرے اور ویڈیو کے ذریعے پی ایس ایل اشاروں کو فوری اردو متن اور بولتی آواز میں تبدیل کریں۔",
    feat2Title: "اردو سے تھری ڈی اشاراتی اوتار",
    feat2Desc:
      "ری پلے، پاز اور پلے بیک کی رفتار کی مکمل سہولت کے ساتھ متحرک تھری ڈی اشاراتی ماڈل۔",
    feat3Title: "دو طرفہ لائیو ہم آہنگی",
    feat3Desc:
      "قوتِ سماعت سے محروم اور بولنے والے افراد کے درمیان فطری، روانی سے بھرپور دو طرفہ گفتگو ممکن بناتا ہے۔",

    impactCommunityLabel: "ہدف برادری",
    impactCommunityVal: "پاکستان میں 15 لاکھ+ بہرے شہری",
    impactLanguagesLabel: "معاون زبانیں",
    impactLanguagesVal: "پاکستانی اشاروں کی زبان (PSL) اور اردو",
    impactAccessLabel: "پلیٹ فارم رسائی",
    impactAccessVal: "براؤزر پر دستیاب (کسی خاص آلے کی ضرورت نہیں)",
    impactUseCasesLabel: "اہم استعمالات",
    impactUseCasesVal: "صحت، تعلیم اور روزمرہ زندگی",
    impactFooterNote:
      "پاکستانی اشاروں کی زبان کے مقامی معیارات پر تیار کردہ قابلِ اعتماد اور محفوظ معاون مواصلاتی نظام۔",

    heroTitleLine1: "روانی سے بولیں۔",
    heroTitleLine2: "گہرائی سے سمجھیں۔",
    heroSubtitle:
      "سائن اسپیک اشاروں کی زبان کا جدید دو طرفہ مترجم ہے جو خاموشی اور آواز کے درمیان فاصلہ مٹاتا ہے۔ کیونکہ ہر انسان کی گفتگو اہم ہے۔",
    heroBtnTranslate: "ترجمہ شروع کریں",
    heroBtnLearn: "اشارات سیکھیں",
    heroFeat1Title: "دو طرفہ ترجمہ",
    heroFeat1Desc: "اشارات سے اردو اور اردو سے اشارات",
    heroFeat2Title: "مصنوعی ذہانت",
    heroFeat2Desc: "درست اور حقیقی وقت میں ترجمے کے لیے جدید اے آئی",
    heroFeat3Title: "انتہائی آسان",
    heroFeat3Desc: "ہر فرد کے لیے سادہ، سہل اور فوری قابلِ رسائی",

    modalAboutTitle: "سائن اسپیک کے بارے میں",
    modalAboutSummary:
      "سائن اسپیک ایک دو طرفہ معاون پلیٹ فارم ہے جو پاکستانی اشاروں کی زبان (PSL) بولنے والوں اور عام افراد کے درمیان حقیقی وقت میں باہمی گفتگو کو ممکن بناتا ہے۔",
    modalAboutVisionTitle: "اشارات سے اردو وژن ترجمہ",
    modalAboutVisionDesc:
      "لائیو کیمرے اور ویڈیو پہچان کے ذریعے مسلسل ہاتھوں کے اشاروں کو فوری اردو متن اور آواز میں بدلتا ہے۔",
    modalAboutAvatarTitle: "اردو سے تھری ڈی اشاراتی اوتار",
    modalAboutAvatarDesc:
      "متن سے اشاروں کی تخلیق جو جسمانی لحاظ سے درست پاکستانی اشاروں کی متحرک 3D اینیمیشن پیش کرتی ہے۔",
    modalAboutAccessTitle: "ہر براؤزر پر فوری رسائی",
    modalAboutAccessDesc:
      "کسی انسٹالیشن کے بغیر سیدھا ویب براؤزر پر چلتا ہے، پاکستان کی 15 لاکھ سے زائد بہری آبادی کے لیے تیار کردہ۔",
    modalCloseBtn: "بند کریں",

    tabUrduToPSLTitle: "اردو سے اشارات",
    tabUrduToPSLSub: "اردو متن سے اشارات",
    tabPSLToUrduTitle: "اشارات سے اردو",
    tabPSLToUrduSub: "اشارات سے اردو ترجمہ",

    urduToPSLTitle: "اردو سے پی ایس ایل مترجم",
    urduToPSLSubtitle:
      "جیمینائی اے آئی کی مدد سے اردو یا انگریزی جملوں کو فوری طور پر پاکستانی اشاروں کی زبان (PSL) کی ویڈیوز اور اینیمیشنز میں تبدیل کریں۔",
    howItWorksBtn: "طریقہ کار",
    modeImages: "تصاویر",
    modeImagesUrdu: "تصویر",
    modeVideo: "ویڈیوز",
    modeVideoUrdu: "ویڈیو",
    mode3DModel: "تھری ڈی ماڈل",
    mode3DModelUrdu: "ماڈل",
    modeTitleImages: "تصاویر کے ذریعے سمجھیں (Images)",
    modeTitleVideo: "ویڈیو کے ذریعے سمجھیں (Video)",
    modeTitle3D: "تھری ڈی ماڈل اسٹوڈیو (3D Model)",
    timelineTitle: "اشارات کی ترتیب ٹائم لائن",
    signCounter: (current, total) => `اشارہ ${current} از ${total}`,
    copyGloss: "اشارات کاپی کریں",
    copiedGloss: "کاپی ہو گیا",
    fullscreenView: "فل اسکرین منظر",
    exitFullscreen: "فل اسکرین سے نکلیں",

    inputPanelTitleUrdu: "اردو متن درج کریں",
    inputPanelTitleEn: "انگریزی متن درج کریں",
    inputPlaceholderUrdu:
      "یہاں اردو لکھیں یا بولیں... (مثال: ہسپتال کہاں ہے؟ / میرا نام امان ہے / السلام علیکم)",
    inputPlaceholderEn:
      "یہاں انگریزی لکھیں یا بولیں... (مثال: Where is the hospital? / My name is Amaan)",
    charCountLabel: (current, max) => `${current} / ${max} حروف`,
    clearBtn: "صاف کریں",
    translateBtn: "اشارات میں ترجمہ کریں",
    translatingBtn: "جیمینائی سے ترجمہ ہو رہا ہے...",
    catAll: "تمام",
    catGreetings: "سلام و دعائیں",
    catEmergency: "ہیلپ و ایمرجنسی",
    catDaily: "روزمرہ گفتگو",
    listenBtn: "سنیں",
    listeningBtn: "آواز سننا بند کریں",
    audioPronounceBtn: "تلفظ سنیں",
    urduTranslationBannerTitle: "اردو ترجمہ (Urdu Translation)",

    playerEmptyTitleVideo: "ویڈیو کے ذریعے سمجھیں (ویڈیو)",
    playerEmptyDescVideo:
      "بائیں جانب اردو یا انگریزی متن درج کریں اور ترجمہ پر کلک کریں۔ اشارات تسلسل کے ساتھ قدرتی پاکستانی اشاروں کی ویڈیوز کے طور پر چلیں گے۔",
    playerEmptyTitleImage: "تصاویر کے ذریعے سمجھیں (تصویر)",
    playerEmptyDescImage:
      "بائیں جانب اردو یا انگریزی متن درج کریں اور ترجمہ پر کلک کریں۔ اشارات تسلسل کے ساتھ اعلیٰ کوالٹی تصویروں کے طور پر دکھائے جائیں گے۔",
    playerPillHDVideo: "ایچ ڈی ویڈیو",
    playerPillHDImage: "ایچ ڈی تصویر",
    playerPillSOV: "پی ایس ایل گرامر (SOV)",
    playerPillFingerspelling: "حروفِ تہجی کے اشارے",
    playerLoadingVideo: "اگلی ویڈیو لوڈ ہو رہی ہے...",
    playerLoadingImage: "اگلا اشارہ لوڈ ہو رہا ہے...",
    playerNotFound: (token, mode) =>
      `اشارہ برائے ${token} (${mode === "image" ? "تصویر" : "ویڈیو"}) لائبریری میں دستیاب نہیں`,
    ctrlPlay: "چلائیں",
    ctrlPause: "روکیں",
    ctrlReplay: "دوبارہ",
    ctrlPrev: "پچھلا اشارہ",
    ctrlNext: "اگلا اشارہ",
    ctrlSpeed: "رفتار",

    pslToUrduTitle: "اشارات سے اردو مترجم",
    pslToUrduSubtitle:
      "لائیو کیمرے یا ویڈیو اپلوڈ کے ذریعے پاکستانی اشاروں کی پہچان کر کے فوری اردو اور انگریزی متن اور آواز میں ترجمہ کریں۔",
    cameraModeCamera: "لائیو کیمرا",
    cameraModeUpload: "ویڈیو اپلوڈ",
    cameraOffTitle: "کیمرا بند ہے (Camera is off)",
    cameraOffDesc:
      "حقیقی وقت میں اشاروں کی پہچان کے لیے نیچے دیے گئے بٹن سے کیمرا آن کریں",
    startCameraBtn: "کیمرا شروع کریں",
    uploadChangeFile: "فائل تبدیل کریں",
    uploadDropzoneText: "اشاروں کی ویڈیو یا تصویر اپلوڈ کریں",
    uploadDropzoneHint:
      "ویڈیو فائلیں (.mp4, .webm) یہاں ڈریگ کریں یا فائل منتخب کرنے کے لیے کلک کریں",
    uploadTranslatingBtn: "ویڈیو اپلوڈ ہو رہی ہے…",
    uploadAnalyzingBtn: "اشارات کا تجزیہ جاری ہے…",
    uploadTranslateBtn: "ترجمہ کریں",

    liveTranslationTitle: "لائیو ترجمہ (اردو)",
    undoBtn: "واپس لیں",
    clearAllBtn: "صاف کریں",
    historyBtnTitle: "ترجمے کی تاریخ دیکھیں",
    historyDropdownTitle: "ترجمے کی سابقہ تاریخ",
    noHistoryLogs: "ابھی تک کوئی ریکارڈ محفوظ نہیں ہے۔",
    waitingGesturesTitle: "اشارات کے منتظر...",
    waitingGesturesDesc:
      "لائیو پہچان شروع کرنے کے لیے کیمرا آن کریں یا ویڈیو فائل اپلوڈ کریں۔",
    copyBtn: "کاپی کریں",
    copiedBtn: "کاپی ہو گیا",

    tipsTitle: "بہترین نتائج کے لیے اہم ہدایات:",
    tip1: "سامنے سے مناسب روشنی کا ہونا",
    tip2: "ہاتھوں کا لباس کے مقابلے میں واضح پس منظر",
    tip3: "ہر اشارہ تقریباً 300 ملی سیکنڈ تک تھامیں",

    pslInfoTitle: "پاکستانی اشاروں کی زبان (PSL) پہچان کا نظام",
    pslInfoDesc:
      "سائن اسپیک کلائنٹ سائیڈ لینڈ مارک ایکسٹریکشن اور وقتی تسلسل کی مدد سے لائیو پی ایس ایل الفاظ اور حروفِ تہجی کے اشاروں کی فوری پہچان کرتا ہے۔",

    urduInfoTitle: "پاکستانی اشاروں کی زبان (PSL) ترجمے کے بارے میں",
    urduInfoDesc:
      "پاکستانی اشاروں کی زبان (PSL) بصری اور مکانی حرکات کے ذریعے پاکستان کی بہری برادری کے لیے باہمی رابطے کی بنیادی زبان ہے۔",
    urduInfoFeature1Title: "دو لسانی ترجمہ",
    urduInfoFeature1Desc:
      "انگریزی اور اردو متن یا آواز کی حمایت کرتا ہے اور جملوں کو پی ایس ایل کے فاعل-مفعول-فعل (SOV) گرامر کے مطابق ترتیب دیتا ہے۔",
    urduInfoFeature2Title: "تسلسل کے ساتھ اشاراتی ویڈیوز",
    urduInfoFeature2Desc:
      "اشارات دو سیکنڈ فی اشارہ ہموار ٹرانزیشن کے ساتھ دکھائے جاتے ہیں، جو باقاعدہ اشاروں کی ویڈیو کا منظر پیش کرتے ہیں۔",
    urduInfoFeature3Title: "حروفِ تہجی کے اشاروں کا بیک اپ",
    urduInfoFeature3Desc:
      "خاص ناموں اور غیر درج شدہ الفاظ کو خود بخود الگ الگ حروف میں تقسیم کر کے مستند پی ایس ایل دستی حروف کے ساتھ دکھایا جاتا ہے۔",

    botFabTooltip: "اخلاقی اشارات اور ایپ رہنمائی",
    botTitle: "سائن بوٹ",
    botTag: "پی ایس ایل اے آئی",
    botSubtitle: "اخلاقی اشاراتی زبان اور سائن اسپیک معاون",
    botThinking: "سائن بوٹ سوچ رہا ہے…",
    botResetTitle: "نئی گفتگو شروع کریں",
    botInputPlaceholder: "اردو یا انگریزی میں اپنا سوال لکھیں...",
  },
};
