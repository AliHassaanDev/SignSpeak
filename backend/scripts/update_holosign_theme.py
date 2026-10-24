import re

filepath = r"c:\Users\User\Documents\SignSpeak Project\SignSpeak\frontend\public\holosign_75.html"

with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update <html lang="en" class="dark"> -> <html lang="en">
text = text.replace('<html lang="en" class="dark">', '<html lang="en">')

# 2. Update style block
style_pattern = re.compile(r'<style>.*?</style>', re.DOTALL)
new_style = """<style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            overflow: hidden;
            user-select: none;
        }
        .mono {
            font-family: 'JetBrains Mono', monospace;
        }
        /* Custom Scrollbars */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #6366f1;
        }
        input[type=range] {
            -webkit-appearance: none;
            background: transparent;
        }
        input[type=range]::-webkit-slider-runnable-track {
            height: 6px;
            border-radius: 999px;
            background: #e2e8f0;
        }
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #6366f1;
            margin-top: -5px;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(99, 102, 241, 0.45);
            transition: transform 0.1s ease;
        }
        input[type=range]::-webkit-slider-thumb:hover {
            transform: scale(1.15);
        }
        .glass-panel {
            background: rgba(255, 255, 255, 0.94);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(226, 232, 240, 0.9);
            box-shadow: 0 4px 20px -2px rgba(99, 102, 241, 0.08);
            color: #0f172a;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .quick-chip {
            transition: all 0.16s ease;
            white-space: nowrap;
        }
        .quick-chip:hover {
            transform: translateY(-1px);
        }
        .quick-chip.active-chip {
            background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
            color: #ffffff !important;
            border-color: transparent !important;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3) !important;
        }
    </style>"""

text = style_pattern.sub(new_style, text, count=1)

# 3. Replace the body HTML before <script>
body_start = '<body class="h-screen w-screen flex flex-col overflow-hidden">'
script_start = '<script>'

pos_body = text.find(body_start)
pos_script = text.find(script_start)

if pos_body == -1 or pos_script == -1:
    print("ERROR: body or script not found!")
    exit(1)

new_body_html = """<body class="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900">

    <!-- Top Header Bar -->
    <header class="h-13 glass-panel border-b border-slate-200/90 px-3 flex items-center justify-between z-20 shrink-0">
        <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"></path>
                </svg>
            </div>
            <div>
                <div class="flex items-center gap-2">
                    <h1 class="font-bold text-sm tracking-tight text-slate-900">HoloSign <span class="text-indigo-600">75</span></h1>
                    <span class="text-[9px] mono uppercase px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Holistic Rig v2.4</span>
                </div>
                <p class="text-[10px] text-slate-500 hidden sm:block">33 Pose + 21 Left Hand + 21 Right Hand Benchmarks</p>
            </div>
        </div>

        <!-- Visual Toggles & Mode Bar -->
        <div class="flex items-center gap-1.5 flex-wrap">
            <!-- Toggle Presets Drawer -->
            <button id="btnTogglePresets" onclick="toggleDrawer('presets')" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition flex items-center gap-1.5 shadow-sm">
                <span>📋 Presets &amp; Nodes</span>
            </button>

            <!-- Avatar selector -->
            <div class="flex items-center bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-sm gap-1">
                <span class="text-[10px] mono uppercase text-slate-500">Avatar:</span>
                <select id="avatarStyleSelect" onchange="setAvatarStyle(this.value)" class="bg-transparent text-xs font-medium text-slate-800 rounded py-0.5 focus:outline-none">
                    <option value="REALISTIC" selected>Realistic Skin &amp; Underwear</option>
                    <option value="MANNEQUIN">Studio Porcelain Mannequin</option>
                    <option value="XRAY">X-Ray Translucent</option>
                    <option value="HIDDEN">Skeleton Only</option>
                </select>
            </div>

            <!-- Layer buttons -->
            <button id="toggleBonesBtn" onclick="toggleLayer('bones')" class="px-2 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition flex items-center gap-1.5 shadow-sm">
                <span class="w-2 h-2 rounded-full bg-indigo-500"></span> Bones
            </button>
            <button id="togglePointsBtn" onclick="toggleLayer('points')" class="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1.5 shadow-sm">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span> 75 Nodes
            </button>
            <button id="toggleLabelsBtn" onclick="toggleLayer('labels')" class="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition">
                # IDs
            </button>

            <!-- Camera View Presets -->
            <div class="hidden md:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button onclick="setCameraView('front')" class="px-2 py-0.5 rounded hover:bg-white text-slate-700 font-medium">Full</button>
                <button onclick="setCameraView('portrait')" class="px-2 py-0.5 rounded hover:bg-white text-indigo-600 font-medium">Face</button>
                <button onclick="setCameraView('FaceHands')" class="px-2 py-0.5 rounded hover:bg-white text-purple-700 font-semibold bg-white shadow-sm">Signer</button>
                <button onclick="setCameraView('leftHand')" class="px-2 py-0.5 rounded hover:bg-white text-emerald-700 font-medium">L-Hand</button>
                <button onclick="setCameraView('rightHand')" class="px-2 py-0.5 rounded hover:bg-white text-amber-700 font-medium">R-Hand</button>
            </div>

            <!-- Toggle Inspector Drawer -->
            <button id="btnToggleInspector" onclick="toggleDrawer('inspector')" class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition flex items-center gap-1">
                <span>🔍 Inspector</span>
            </button>

            <!-- JSON Data I/O -->
            <button onclick="openJsonModal()" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-95 transition shadow-sm flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                JSON I/O
            </button>
        </div>
    </header>

    <!-- Main Workspace: Canvas is 100% full width and height, centering the Avatar -->
    <div class="flex-1 flex overflow-hidden relative">

        <!-- Center 3D Viewport & Floating HUD -->
        <main class="flex-1 relative flex flex-col w-full h-full" style="background: radial-gradient(circle at 50% 35%, #ffffff 0%, #f8fafc 55%, #eef2ff 100%);">
            <!-- 3D Canvas Container -->
            <div id="canvasContainer" class="flex-1 relative w-full h-full cursor-grab active:cursor-grabbing">
                <!-- Floating Quick Sign Presets Chip Strip (Pinned at Top Center) -->
                <div class="absolute top-2.5 left-2 right-2 z-10 flex items-center justify-center pointer-events-none">
                    <div id="quickPresetsStrip" class="glass-panel px-2 py-1 rounded-full flex items-center gap-1 shadow-md border border-slate-200/90 max-w-full overflow-x-auto no-scrollbar pointer-events-auto">
                        <!-- Populated dynamically via JS -->
                    </div>
                </div>

                <!-- Floating Toast Notification -->
                <div id="toastBanner" class="hidden absolute top-14 right-4 z-30 glass-panel border-indigo-500/40 text-indigo-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-xl"></div>

                <!-- Renderer Backend Badge -->
                <div id="rendererModeBadge" class="absolute bottom-2.5 right-3 z-10 pointer-events-none glass-panel px-2 py-0.5 rounded-lg text-[10px] mono text-slate-500 flex items-center gap-1.5 shadow-sm border border-slate-200">
                    <span id="rendererDot" class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span id="rendererModeText">3D Engine Ready</span>
                </div>

                <!-- 2D Floating ID Labels Layer -->
                <div id="labelsOverlay" class="absolute inset-0 pointer-events-none overflow-hidden hidden"></div>
            </div>

            <!-- Bottom Timeline & Keyframe Animation Player -->
            <div class="h-16 glass-panel border-t border-slate-200/90 px-4 flex items-center gap-3 z-10 shrink-0">
                <div class="flex items-center gap-2">
                    <button id="playPauseBtn" onclick="togglePlayAnimation()" class="w-9 h-9 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 transition">
                        <svg id="playIcon" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path>
                        </svg>
                        <svg id="pauseIcon" class="w-4 h-4 hidden" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                    <button onclick="resetToNeutralPose()" title="Reset to Natural Signer Pose" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-medium border border-slate-200 transition">
                        Reset Pose
                    </button>
                </div>

                <!-- Scrubber Bar -->
                <div class="flex-1 flex flex-col gap-0.5">
                    <div class="flex justify-between items-center text-[11px]">
                        <span class="text-slate-600 font-medium">Sign Sequence: <span id="timelineSignName" class="text-indigo-600 font-semibold">Hello / Salute</span></span>
                        <span class="mono text-slate-500"><span id="timelineProgressText" class="font-bold text-slate-700">0%</span> | Frame <span id="frameCounterText">0 / 60</span></span>
                    </div>
                    <input id="timelineSlider" type="range" min="0" max="100" value="0" step="0.5" oninput="scrubTimeline(this.value)" class="w-full">
                </div>

                <!-- Playback Speed & Keyframe Capture -->
                <div class="flex items-center gap-2">
                    <div class="flex flex-col">
                        <label class="text-[9px] text-slate-500 uppercase mono">Speed</label>
                        <select id="speedSelect" onchange="setPlaybackSpeed(this.value)" class="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-800 font-medium focus:outline-none">
                            <option value="0.5">0.5x Slow</option>
                            <option value="1" selected>1.0x Normal</option>
                            <option value="1.5">1.5x Fast</option>
                            <option value="2">2.0x Rapid</option>
                        </select>
                    </div>
                    <button onclick="captureCustomKeyframe()" class="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium transition shadow-sm">
                        + Keyframe (<span id="customKfCount">0</span>)
                    </button>
                </div>
            </div>
        </main>

        <!-- Left Sliding Drawer: 75 Benchmark Directory & Sign Presets (Floating Overlay) -->
        <aside id="presetsDrawer" class="hidden absolute left-3 top-3 bottom-3 w-80 max-w-[90vw] glass-panel rounded-2xl border border-slate-200 flex flex-col z-30 shadow-2xl overflow-hidden">
            <!-- Header with close button -->
            <div class="p-3 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/70">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-700">Sign Presets &amp; Nodes</span>
                    <span id="activeSignBadge" class="text-[10px] mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Rest / Neutral</span>
                </div>
                <button onclick="closeDrawer('presets')" class="w-6 h-6 rounded-lg bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold transition">✕</button>
            </div>

            <!-- Sign Presets Grid -->
            <div class="p-3 border-b border-slate-200/90 overflow-y-auto max-h-48">
                <div class="grid grid-cols-2 gap-1.5" id="presetButtonsContainer">
                    <!-- Populated via JS -->
                </div>
            </div>

            <!-- Filter & Search 75 Benchmarks -->
            <div class="p-3 border-b border-slate-200/90 space-y-2 bg-slate-50/40">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-600">75 Benchmark Explorer</span>
                    <div class="flex gap-1 text-[10px] mono">
                        <span class="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">0-32 Pose</span>
                        <span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">33-53 L</span>
                        <span class="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">54-74 R</span>
                    </div>
                </div>
                <div class="relative">
                    <input id="landmarkSearch" type="text" placeholder="Search index (0-74) or joint name..." oninput="renderLandmarkList()"
                        class="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm">
                    <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
                <!-- Category Filter Pills -->
                <div class="grid grid-cols-4 gap-1 text-[11px]">
                    <button onclick="setCategoryFilter('ALL')" id="cat_ALL" class="py-1 rounded bg-indigo-600 text-white font-semibold shadow-sm">All (75)</button>
                    <button onclick="setCategoryFilter('POSE')" id="cat_POSE" class="py-1 rounded bg-slate-100 text-indigo-700 hover:bg-slate-200">Pose (33)</button>
                    <button onclick="setCategoryFilter('LEFT_HAND')" id="cat_LEFT_HAND" class="py-1 rounded bg-slate-100 text-emerald-700 hover:bg-slate-200">L-Hand (21)</button>
                    <button onclick="setCategoryFilter('RIGHT_HAND')" id="cat_RIGHT_HAND" class="py-1 rounded bg-slate-100 text-amber-700 hover:bg-slate-200">R-Hand (21)</button>
                </div>
            </div>

            <!-- Scrollable List of all 75 Landmarks -->
            <div id="landmarkListContainer" class="flex-1 overflow-y-auto p-2 space-y-1">
                <!-- Populated dynamically -->
            </div>
        </aside>

        <!-- Right Sliding Drawer: Selected Benchmark Inspector & Quick Hand Curl Controls (Floating Overlay) -->
        <aside id="inspectorDrawer" class="hidden absolute right-3 top-3 bottom-3 w-80 max-w-[90vw] glass-panel rounded-2xl border border-slate-200 flex flex-col z-30 shadow-2xl overflow-y-auto">
            <!-- Header with close button -->
            <div class="p-3 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/70">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-700">Benchmark Inspector</span>
                    <span id="inspectorGroupBadge" class="text-[10px] mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">POSE</span>
                </div>
                <button onclick="closeDrawer('inspector')" class="w-6 h-6 rounded-lg bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold transition">✕</button>
            </div>

            <div class="p-3 border-b border-slate-200/90">
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3">
                    <div class="flex items-baseline justify-between">
                        <span class="text-xs text-slate-500">Benchmark ID</span>
                        <span id="inspIndex" class="text-lg font-bold mono text-indigo-600">#16</span>
                    </div>
                    <div id="inspName" class="text-sm font-bold text-slate-900 mt-0.5 truncate">RIGHT_WRIST</div>
                    <div id="inspDesc" class="text-[11px] text-slate-500 mt-1">Right wrist anchor driving the right-hand benchmarks.</div>
                </div>

                <!-- X, Y, Z Coordinate Sliders -->
                <div class="space-y-3">
                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="text-rose-500 font-semibold mono">X (Lateral)</span>
                            <span id="valX" class="mono text-slate-800 font-bold">0.000</span>
                        </div>
                        <input id="sliderX" type="range" min="-1.5" max="1.5" step="0.005" oninput="onCoordSliderChange('x', this.value)" class="w-full">
                    </div>
                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="text-emerald-600 font-semibold mono">Y (Vertical)</span>
                            <span id="valY" class="mono text-slate-800 font-bold">0.000</span>
                        </div>
                        <input id="sliderY" type="range" min="-1.2" max="1.5" step="0.005" oninput="onCoordSliderChange('y', this.value)" class="w-full">
                    </div>
                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="text-indigo-600 font-semibold mono">Z (Depth)</span>
                            <span id="valZ" class="mono text-slate-800 font-bold">0.000</span>
                        </div>
                        <input id="sliderZ" type="range" min="-1.2" max="1.2" step="0.005" oninput="onCoordSliderChange('z', this.value)" class="w-full">
                    </div>
                </div>
            </div>

            <!-- Hand Sign Articulator -->
            <div class="p-3 border-b border-slate-200/90 space-y-3">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-700">Hand Sign Articulator</span>
                    <button onclick="mirrorHand('RtoL')" class="text-[11px] text-indigo-600 hover:underline font-semibold">Mirror R → L</button>
                </div>

                <div class="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                    <button id="artHandLeft" onclick="selectArticulatorHand('LEFT')" class="py-1 rounded font-semibold text-emerald-700 bg-white shadow-sm border border-emerald-200">Left Hand [33-53]</button>
                    <button id="artHandRight" onclick="selectArticulatorHand('RIGHT')" class="py-1 rounded font-medium text-slate-600 hover:text-slate-900">Right Hand [54-74]</button>
                </div>

                <!-- 5 Finger Flexion Sliders -->
                <div class="space-y-2 text-xs">
                    <div>
                        <div class="flex justify-between mb-0.5"><span class="text-slate-700">Thumb Curl</span><span id="curlVal0" class="mono text-slate-500 font-semibold">0%</span></div>
                        <input id="curlSlider0" type="range" min="0" max="100" value="0" oninput="setFingerCurl(0, this.value)" class="w-full">
                    </div>
                    <div>
                        <div class="flex justify-between mb-0.5"><span class="text-slate-700">Index Finger</span><span id="curlVal1" class="mono text-slate-500 font-semibold">0%</span></div>
                        <input id="curlSlider1" type="range" min="0" max="100" value="0" oninput="setFingerCurl(1, this.value)" class="w-full">
                    </div>
                    <div>
                        <div class="flex justify-between mb-0.5"><span class="text-slate-700">Middle Finger</span><span id="curlVal2" class="mono text-slate-500 font-semibold">0%</span></div>
                        <input id="curlSlider2" type="range" min="0" max="100" value="0" oninput="setFingerCurl(2, this.value)" class="w-full">
                    </div>
                    <div>
                        <div class="flex justify-between mb-0.5"><span class="text-slate-700">Ring Finger</span><span id="curlVal3" class="mono text-slate-500 font-semibold">0%</span></div>
                        <input id="curlSlider3" type="range" min="0" max="100" value="0" oninput="setFingerCurl(3, this.value)" class="w-full">
                    </div>
                    <div>
                        <div class="flex justify-between mb-0.5"><span class="text-slate-700">Pinky Finger</span><span id="curlVal4" class="mono text-slate-500 font-semibold">0%</span></div>
                        <input id="curlSlider4" type="range" min="0" max="100" value="0" oninput="setFingerCurl(4, this.value)" class="w-full">
                    </div>
                </div>
            </div>
        </aside>
    </div>

    <!-- JSON Importer / Exporter Modal -->
    <div id="jsonModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 hidden items-center justify-center p-4">
        <div class="glass-panel border border-slate-200 rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh] shadow-2xl">
            <div class="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                    <h2 class="text-base font-bold text-slate-900">75-Benchmark Holistic JSON Data I/O</h2>
                    <p class="text-xs text-slate-500">Compatible with MediaPipe Holistic 75-Landmark arrays</p>
                </div>
                <button onclick="closeJsonModal()" class="text-slate-400 hover:text-slate-700 font-bold p-1">✕</button>
            </div>
            <div class="p-4 flex-1 overflow-hidden flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <div class="flex gap-2">
                        <button onclick="exportCurrentPoseJSON()" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200">
                            Load Current 75 Points
                        </button>
                        <button onclick="copyJsonToClipboard()" class="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 border border-indigo-200">
                            Copy JSON to Clipboard
                        </button>
                    </div>
                    <span id="jsonStatusMsg" class="text-xs mono text-emerald-600 font-bold"></span>
                </div>
                <textarea id="jsonTextarea" spellcheck="false" class="w-full flex-1 min-h-[320px] bg-slate-900 border border-slate-800 rounded-xl p-3 mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500"></textarea>
            </div>
            <div class="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50/50">
                <button onclick="closeJsonModal()" class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700">Cancel</button>
                <button onclick="importPoseFromJSON()" class="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-xs font-semibold text-white shadow-md">
                    Apply 75 Benchmarks to 3D Model
                </button>
            </div>
        </div>
    </div>
"""

text = text[:pos_body] + new_body_html + "\n\n    " + text[pos_script:]

# 4. Update Three.js and Javascript variables
# A: Update benchmark colors (0x38bdf8 -> 0x6366f1, 0x34d399 -> 0x10b981, 0xfbbf24 -> 0xf59e0b)
text = text.replace("colorHex: 0x38bdf8,\n                    badgeClass: \"text-cyan-300 bg-cyan-500/15 border-cyan-500/30\"",
                    "colorHex: 0x6366f1,\n                    badgeClass: \"text-indigo-700 bg-indigo-50 border-indigo-200\"")
text = text.replace("colorHex: 0x34d399,\n                    badgeClass: \"text-emerald-300 bg-emerald-500/15 border-emerald-500/30\"",
                    "colorHex: 0x10b981,\n                    badgeClass: \"text-emerald-700 bg-emerald-50 border-emerald-200\"")
text = text.replace("colorHex: 0xfbbf24,\n                    badgeClass: \"text-amber-300 bg-amber-500/15 border-amber-500/30\"",
                    "colorHex: 0xf59e0b,\n                    badgeClass: \"text-amber-700 bg-amber-50 border-amber-200\"")

# B: Default selectedIndex = -1 (no benchmark selected on start, no gizmo blocking avatar)
text = text.replace("let selectedIndex = 16; // Default to RIGHT_WRIST", "let selectedIndex = -1; // Deselected by default so avatar is clear & centered")

# C: Update Three.js lighting & grid in initThreeScene
old_three_init = """            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 50);
            camera.position.set(0, 0.34, 1.85);

            renderer = createResilientRenderer(width, height);
            container.appendChild(renderer.domElement);

            // Update Renderer Status Badge
            const modeText = document.getElementById("rendererModeText");
            const modeDot = document.getElementById("rendererDot");
            if (modeText && modeDot) {
                if (isSoftwareRenderer) {
                    modeText.textContent = "3D Canvas Projection Engine (WebGL-Free)";
                    modeDot.className = "w-2 h-2 rounded-full bg-cyan-400";
                } else {
                    modeText.textContent = "WebGL 3D Hardware Accelerated";
                    modeDot.className = "w-2 h-2 rounded-full bg-emerald-400";
                }
            }

            // Three-Point Cinematic Studio Lighting for Sculpted Face & Finger Definition
            const ambientLight = new THREE.HemisphereLight(0xf8fafc, 0x0f172a, 0.72);
            scene.add(ambientLight);

            // Warm Key Light (Front-Right)
            const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.25);
            keyLight.position.set(1.8, 2.6, 2.8);
            scene.add(keyLight);

            // Soft Cool Fill Light (Front-Left)
            const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.65);
            fillLight.position.set(-2.2, 1.4, 2.0);
            scene.add(fillLight);

            // Crisp Cyan Back Rim Light (Separates shoulders, hair & fingers from dark background)
            const backRimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
            backRimLight.position.set(0.0, 2.2, -2.5);
            scene.add(backRimLight);

            // Subtle Warm Under-Fill for Chin & Palm Contours
            const bounceLight = new THREE.PointLight(0xfde68a, 0.35, 4);
            bounceLight.position.set(0, -0.4, 1.2);
            scene.add(bounceLight);

            // Studio Floor Grid & Subtle Pedestal Ring
            const gridHelper = new THREE.GridHelper(3.2, 32, 0x1e293b, 0x0f172a);
            gridHelper.position.y = -0.95;
            scene.add(gridHelper);

            // OrbitControls
            orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
            orbitControls.target.set(0, 0.25, 0.08);"""

new_three_init = """            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera(38, width / height, 0.05, 50);
            // Center and frame avatar prominently: upper body, face, and signing hands
            camera.position.set(0, 0.28, 1.45);

            renderer = createResilientRenderer(width, height);
            container.appendChild(renderer.domElement);

            // Update Renderer Status Badge
            const modeText = document.getElementById("rendererModeText");
            const modeDot = document.getElementById("rendererDot");
            if (modeText && modeDot) {
                if (isSoftwareRenderer) {
                    modeText.textContent = "3D Canvas Projection (WebGL-Free)";
                    modeDot.className = "w-2 h-2 rounded-full bg-indigo-500";
                } else {
                    modeText.textContent = "WebGL 3D Studio Ready";
                    modeDot.className = "w-2 h-2 rounded-full bg-emerald-500";
                }
            }

            // Three-Point Studio Lighting matching SignSpeak light aesthetic
            const ambientLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.90);
            scene.add(ambientLight);

            // Warm Key Light (Front-Right)
            const keyLight = new THREE.DirectionalLight(0xfffbf5, 1.25);
            keyLight.position.set(1.8, 2.6, 2.8);
            scene.add(keyLight);

            // Soft Fill Light (Front-Left)
            const fillLight = new THREE.DirectionalLight(0xf1f5f9, 0.70);
            fillLight.position.set(-2.2, 1.4, 2.0);
            scene.add(fillLight);

            // Soft Indigo Rim Light (Matches SignSpeak theme)
            const backRimLight = new THREE.DirectionalLight(0xa5b4fc, 0.75);
            backRimLight.position.set(0.0, 2.2, -2.5);
            scene.add(backRimLight);

            // Subtle Under-Fill for Chin & Hands
            const bounceLight = new THREE.PointLight(0xfef08a, 0.25, 4);
            bounceLight.position.set(0, -0.4, 1.2);
            scene.add(bounceLight);

            // Studio Floor Grid in soft lavender/slate
            const gridHelper = new THREE.GridHelper(3.2, 32, 0xc7d2fe, 0xe2e8f0);
            gridHelper.position.y = -0.95;
            scene.add(gridHelper);

            // OrbitControls centered on upper chest / signer
            orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
            orbitControls.target.set(0, 0.25, 0.0);"""

text = text.replace(old_three_init, new_three_init)

# D: Update bone colors in WebGL
text = text.replace("let boneColor = 0x38bdf8;", "let boneColor = 0x6366f1;")
text = text.replace("boneColor = 0x10b981;", "boneColor = 0x10b981;")
text = text.replace("boneColor = 0xf59e0b;", "boneColor = 0xf59e0b;")

# E: Update skin and underwear materials to match SignSpeak brand
old_mats = """            // Fabric Underwear Material (Replacing the full mocap suit)
            suitMaterial = new THREE.MeshStandardMaterial({
                color: 0x1e293b,
                roughness: 0.9,
                metalness: 0.1,
                side: THREE.DoubleSide
            });"""

new_mats = """            // Fabric Underwear Material in SignSpeak Royal Indigo
            suitMaterial = new THREE.MeshStandardMaterial({
                color: 0x4f46e5,
                roughness: 0.65,
                metalness: 0.15,
                side: THREE.DoubleSide
            });"""

text = text.replace(old_mats, new_mats)

# F: Detach gizmo and deselected by default on startup
old_start_sync = """            // Sync Initial Positions & Attach Gizmo to Default Selected Benchmark
            sync3DSceneToLandmarks();
            selectBenchmark(16);"""

new_start_sync = """            // Sync Initial Positions with pristine centered avatar (no gizmo obstructing)
            sync3DSceneToLandmarks();
            if (transformControl) transformControl.detach();
            if (selectionRingMesh) selectionRingMesh.visible = false;"""

text = text.replace(old_start_sync, new_start_sync)

# G: Update selectBenchmark to show selection ring and open inspector drawer
old_select_bm = """        function selectBenchmark(index) {
            selectedIndex = index;
            const targetMesh = landmarkMeshes[index];
            if (targetMesh && transformControl) {
                transformControl.attach(targetMesh);
            }
            updateInspectorUI();
            renderLandmarkList();
        }"""

new_select_bm = """        function selectBenchmark(index) {
            selectedIndex = index;
            const targetMesh = landmarkMeshes[index];
            if (targetMesh && transformControl) {
                transformControl.attach(targetMesh);
            }
            if (selectionRingMesh) selectionRingMesh.visible = true;
            updateInspectorUI();
            renderLandmarkList();
            openDrawer('inspector');
        }

        function deselectBenchmark() {
            selectedIndex = -1;
            if (transformControl) transformControl.detach();
            if (selectionRingMesh) selectionRingMesh.visible = false;
            renderLandmarkList();
        }"""

text = text.replace(old_select_bm, new_select_bm)

# H: Update camera presets
old_cam_view = """            if (preset === 'front') {
                camera.position.set(0, 0.30, 1.95);
                orbitControls.target.set(0, 0.22, 0.08);
            } else if (preset === 'portrait') {
                const nose = currentLandmarks[0];
                camera.position.set(0, nose.y + 0.02, nose.z + 0.48);
                orbitControls.target.set(0, nose.y - 0.01, nose.z - 0.04);
            } else if (preset === 'FaceHands') {
                camera.position.set(0, 0.44, 1.05);
                orbitControls.target.set(0, 0.38, 0.15);"""

new_cam_view = """            if (preset === 'front') {
                camera.position.set(0, 0.28, 1.45);
                orbitControls.target.set(0, 0.24, 0.0);
            } else if (preset === 'portrait') {
                const nose = currentLandmarks[0];
                camera.position.set(0, nose.y + 0.02, nose.z + 0.48);
                orbitControls.target.set(0, nose.y - 0.01, nose.z - 0.04);
            } else if (preset === 'FaceHands') {
                camera.position.set(0, 0.35, 1.15);
                orbitControls.target.set(0, 0.30, 0.05);"""

text = text.replace(old_cam_view, new_cam_view)

# I: Add Drawer Toggle & Quick Presets Functions
drawer_helpers = """
        /* ── Drawer & Quick Presets UI Helpers ── */
        function toggleDrawer(name) {
            const drawer = document.getElementById(name + "Drawer");
            if (!drawer) return;
            const isHidden = drawer.classList.contains("hidden");
            if (isHidden) {
                openDrawer(name);
            } else {
                closeDrawer(name);
            }
        }

        function openDrawer(name) {
            const drawer = document.getElementById(name + "Drawer");
            if (!drawer) return;
            // Close other drawer to avoid overlay clutter
            const other = name === "presets" ? "inspector" : "presets";
            closeDrawer(other);
            drawer.classList.remove("hidden");
            if (name === "presets") renderLandmarkList();
            if (name === "inspector" && selectedIndex >= 0) updateInspectorUI();
        }

        function closeDrawer(name) {
            const drawer = document.getElementById(name + "Drawer");
            if (drawer) drawer.classList.add("hidden");
        }

        function renderQuickPresets() {
            const strip = document.getElementById("quickPresetsStrip");
            if (!strip) return;
            strip.innerHTML = SIGN_PRESETS.map(p => `
                <button onclick="triggerSignPreset('${p.id}', '${p.label}')"
                    class="quick-chip px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        activeSignId === p.id
                            ? 'active-chip'
                            : 'bg-white hover:bg-indigo-50 text-slate-700 border-slate-200 shadow-sm'
                    } flex items-center gap-1.5 shrink-0">
                    <span class="text-xs">${p.icon}</span>
                    <span>${p.label.split(' / ')[0]}</span>
                </button>
            `).join('');
        }
"""

text = text.replace("function renderPresetButtons() {", drawer_helpers + "\n        function renderPresetButtons() {")

# Update triggerSignPreset to refresh quick chips
old_trigger = """            timelineProgress = 0;
            isPlaying = true;
            updatePlayPauseButtonUI();
        }"""

new_trigger = """            timelineProgress = 0;
            isPlaying = true;
            updatePlayPauseButtonUI();
            renderQuickPresets();
        }"""

text = text.replace(old_trigger, new_trigger)

# Update window.onload
old_onload = """        window.onload = function () {
            renderPresetButtons();
            initThreeScene();
            renderLandmarkList();
            animateLoop();
        };"""

new_onload = """        window.onload = function () {
            renderPresetButtons();
            renderQuickPresets();
            initThreeScene();
            renderLandmarkList();
            animateLoop();
        };"""

text = text.replace(old_onload, new_onload)

# Update palette in software renderer
old_palette = """                return {
                    skin: { light: "#f6d5be", mid: "#e6b89c", dark: "#9c6b53", stroke: "rgba(120,73,52,0.35)" },
                    suit: { light: "#334155", mid: "#1e293b", dark: "#0f172a", stroke: "rgba(56,189,248,0.32)" },
                    hair: "#1c1917",
                    lip: "#c97a76",
                    alpha: 1.0
                };"""

new_palette = """                return {
                    skin: { light: "#fae8de", mid: "#f3cbb5", dark: "#c78d70", stroke: "rgba(168,110,82,0.35)" },
                    suit: { light: "#6366f1", mid: "#4f46e5", dark: "#3730a3", stroke: "rgba(99,102,241,0.4)" },
                    hair: "#1e1b18",
                    lip: "#d9777f",
                    alpha: 1.0
                };"""

text = text.replace(old_palette, new_palette)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(text)

print("Successfully transformed holosign_75.html! New length:", len(text))
