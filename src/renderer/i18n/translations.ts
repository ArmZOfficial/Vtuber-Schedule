import type { Lang } from '../types'

export interface Translations {
  tabTheme: string
  clickRowHint: string
  tapRowHint: string
  themeSection: string
  themeHueLabel: string
  themeSatLabel: string
  themeLightLabel: string
  themeResetBtn: string
  // Artwork colours (per-part pins on top of the hue rotation)
  artColorSection: string
  artColorHint: string
  partBackground: string
  partFrame: string
  partPanel: string
  partTitleFlowers: string
  partWeekRibbon: string
  partRowAccent: string
  partOfflineRibbon: string
  // Text styling (colours + fonts)
  textStyleSection: string
  textColorSection: string
  textColorHint: string
  roleTitleTop: string
  roleTitleBottom: string
  roleWeekOf: string
  roleDayOnline: string
  roleDayOffline: string
  roleTime: string
  roleSubtitle: string
  roleOffline: string
  roleArtCredit: string
  resetAllColors: string
  colorPickerAria: string
  fontSection: string
  fontHint: string
  fontSlotEn: string
  fontSlotTh: string
  fontSlotJp: string
  fontDefaultOption: string
  fontUploadBtn: string
  fontUploadOk: string
  fontUploadFail: string
  fontRemoveAria: string
  fontAddSystem: string
  fontAddGoogle: string
  fontLoading: string
  fontSystemSearch: string
  fontSystemEmpty: string
  fontSystemUnavailable: string
  fontListTruncated: string
  fontGoogleSearch: string
  fontGoogleAdd: string
  fontGoogleFail: string
  fontGoogleNote: string
  fontGroupEn: string
  fontGroupTh: string
  fontGroupJp: string
  // App Header & Bar
  appTitle: string
  appSubtitle: string
  undo: string
  redo: string
  savedAt: string
  loading: string
  themeSwitchDark: string
  themeSwitchLight: string
  /** tooltip ปุ่มลูกโลก — `{lang}` ถูกแทนด้วยชื่อภาษาปลายทาง */
  langSwitch: string
  dropzoneUnsupported: string
  chooseFileBtn: string
  closeNotification: string
  navAria: string
  mobileNavAria: string
  winMinimize: string
  winMaximize: string
  winRestore: string
  winClose: string
  comingSoon: string
  charCounterAria: string
  infoTipAria: string
  draftSavedToast: string
  errorUiTitle: string
  errorUiMsg: string
  errorUiRetry: string

  // Tabs
  tabGeneral: string
  tabSchedule: string
  tabAssets: string
  tabExport: string
  tabDrafts: string
  tabHelp: string
  tabMore: string

  // General Tab
  generalTitle: string

  creditSection: string
  showCreditLabel: string
  showCreditHint: string
  creditBgLabel: string
  creditBgHint: string

  dateSection: string
  startDateLabel: string
  startDateHint: string
  startDateTooltip: string
  cardLanguageLabel: string
  cardLanguageHint: string
  cardLanguageNote: string

  // Schedule Tab
  scheduleTitle: string
  editSelectedDay: string
  fullWeekSection: string
  selectDayHint: string
  closeBtn: string
  weekSection: string
  weekOfLabel: string
  prevWeek: string
  nextWeek: string
  thisWeek: string
  duplicateLastWeek: string
  duplicatedWeek: string
  noPrevWeek: string
  cancelBtn: string
  saveBtn: string
  offBadgeLabel: string
  offBadgeHint: string
  offNoteLabel: string
  offNoteHint: string
  startTimeLabel: string
  timeFormatLabel: string
  timeFormatHint: string
  timeFormat12: string
  timeFormat24: string
  customPlatformName: string
  customPlatformIcon: string
  uploadIcon: string
  hasStream: string
  noStream: string
  customStream: string
  offTextLabel: string
  savePresetTooltip: string
  itemCount: string
  specialActivity: string
  dayOff: string
  dayFree: string
  addItemBtn: string

  // DayEditPanel
  dayEditTitle: string
  dayEditHint: string
  itemNumber: string
  specialEvent: string
  deleteBtn: string
  platformLabel: string
  timeLabel: string
  streamTitleLabel: string
  streamTitlePlaceholder: string
  collabSectionTitle: string
  collabHint: string
  addCollabBtn: string
  collabNamePlaceholder: string

  // Design Tab

  // Theme Tab

  // Assets Tab
  artSection: string
  uploadCharacterArt: string
  characterArtHint: string
  zoomLabel: string
  positionLabel: string
  rotationLabel: string
  flipXBtn: string
  flipYBtn: string
  resetPos: string
  changeArt: string

  // Animation Tab
  animSection: string
  motionSection: string

  // Export Tab
  exportSection: string
  presetPlatform: string
  fileFormat: string
  customSizeLabel: string
  batchLabel: string
  exportBtn: string
  exportingMsg: string
  gifCapturing: string
  gifEncoding: string
  gifHint: string
  exportAllSizes: string
  exportSavedLabel: string
  openFolderBtn: string

  /** ท่อนต่อท้าย tooltip undo/redo ที่บอกว่าก้าวนั้นเปลี่ยนอะไร (แผนข้อ 7.2.2) */
  histTemplate: string
  /** `{day}` ถูกแทนด้วยชื่อวันเต็ม */
  histDay: string
  histWeekStart: string
  histArt: string
  histExport: string
  histAnim: string
  histMeta: string
  histEdit: string

  /** ปุ่มสลับระหว่างโทนที่เทมเพลตแนะนำกับทั้ง 6 โทน (แผนข้อ 4.4) */
  tonesAllBtn: string
  tonesRecommendedBtn: string
  exportFailed: string

  // Drafts Tab
  draftsSection: string
  draftNameLabel: string
  saveDraftBtn: string
  autosaveNote: string
  draftListSection: string
  noDraftsTitle: string
  noDraftsMsg: string
  saveFirstDraftBtn: string
  loadBtn: string
  renameBtn: string
  duplicateBtn: string

  /* ══ Quiet Studio redesign — เพิ่มเท่านั้น ห้ามลบคีย์เก่า (แผนข้อ 11) ══ */
  appShort: string
  uiLangGroup: string
  cardLangGroup: string
  exportNowBtn: string
  searchLabel: string
  searchEmpty: string
  resetBtn: string
  allLabel: string
  doneBtn: string
  // พื้นที่พรีวิว
  zoomOut: string
  zoomIn: string
  zoomFit: string
  zoomActual: string
  zoomFieldAria: string
  safeAreaToggle: string
  panHint: string
  // panel
  panelResizeAria: string
  tabTemplate: string
  // แผ่นช่วยเหลือ
  helpTitle: string
  /** ชื่อสั้นบนแถบเมนู — 'วิธีใช้และคีย์ลัด' ยาวเกินกรอบ 76px */
  helpShort: string
  helpShortcutsTitle: string
  helpFlowTitle: string
  helpFlowSteps: string
  kbdUndo: string
  kbdRedo: string
  kbdSaveDraft: string
  kbdExport: string
  kbdFit: string
  kbdActual: string
  kbdPan: string
  kbdZoom: string
  kbdTabs: string
  kbdCloseDay: string
  kbdNextDay: string
  // แท็บเทมเพลต
  templateSection: string
  templateGalleryHint: string
  toneAccordion: string
  elementsAccordion: string
  fontsAccordion: string
  styleNotebook: string
  styleRibbon: string
  styleTicket: string
  styleSticker: string
  styleMinimal: string
  styleFullbleed: string
  templateSwitchedToast: string
  // โหมดแก้วัน
  editingDayTitle: string
  backToWeek: string
  prevDay: string
  nextDay: string
  saveAndNextDay: string
  nextWeekBtn: string
  // ทั่วไป
  datePreviewLabel: string
  // assets
  noArtTitle: string
  noArtMsg: string
  centerArtBtn: string
  fitArtBtn: string
  // export
  exportSizeTitle: string
  exportDoneTitle: string
  exportDoneMsg: string
  // drafts
  draftSearchPlaceholder: string
  sortRecent: string
  sortName: string
  confirmDeleteBtn: string
  draftsCount: string
  // first run
  firstRunTitle: string
  firstRunMsg: string
  firstRunCta: string
  firstRunSkip: string
}

export const translations: Record<'en' | 'th', Translations> = {
  en: {
    tabTheme: 'Theme',
    clickRowHint: 'Click a day row on the image to edit it right away',
    tapRowHint: 'Tap a day row to edit',
    themeSection: 'Theme',
    themeHueLabel: 'Hue',
    themeSatLabel: 'Saturation',
    themeLightLabel: 'Brightness',
    themeResetBtn: 'Reset to template default',
    artColorSection: 'Artwork colours',
    artColorHint: 'Pin an exact colour to one part of the artwork — it wins over the hue rotation for that part only',
    partBackground: 'Background',
    partFrame: 'Art frame',
    partPanel: 'Schedule panel',
    partTitleFlowers: 'Title flowers',
    partWeekRibbon: 'WEEK OF ribbon',
    partRowAccent: 'Row dot & dash',
    partOfflineRibbon: 'OFFLINE ribbon',
    textStyleSection: 'Text styling',
    textColorSection: 'Text colours',
    textColorHint: 'Pin an exact colour to each text — it wins over the hue slider',
    roleTitleTop: 'Title “Weekly”',
    roleTitleBottom: 'Title “Schedule”',
    roleWeekOf: 'WEEK OF ribbon',
    roleDayOnline: 'Day name (stream day)',
    roleDayOffline: 'Day name (off day)',
    roleTime: 'Time',
    roleSubtitle: 'Stream title',
    roleOffline: 'OFFLINE badge text',
    roleArtCredit: 'Artist credit',
    resetAllColors: 'Reset all colours',
    colorPickerAria: '{role} — pick a colour',
    fontSection: 'Fonts',
    fontHint:
      'Each slot applies to text of that script on the card. Upload .ttf, .otf, .woff or .woff2 files to add your own faces.',
    fontSlotEn: 'English font',
    fontSlotTh: 'Thai font',
    fontSlotJp: 'Japanese font',
    fontDefaultOption: 'Template default',
    fontUploadBtn: 'Upload font file',
    fontUploadOk: 'Added font “{name}”',
    fontUploadFail: 'Could not read that font file',
    fontRemoveAria: 'Remove font {name}',
    fontAddSystem: 'From this computer',
    fontAddGoogle: 'Google Fonts',
    fontLoading: 'Loading…',
    fontSystemSearch: 'Search installed fonts…',
    fontSystemEmpty: 'No usable font files found',
    fontSystemUnavailable: 'Reading installed fonts needs the desktop app',
    fontListTruncated: '…and {n} more — narrow the search',
    fontGoogleSearch: 'Family name, e.g. Poppins',
    fontGoogleAdd: 'Download',
    fontGoogleFail: 'Could not fetch that family — check the name and your connection',
    fontGoogleNote: 'Downloaded once and kept in the app, so it still draws offline.',
    fontGroupEn: 'English',
    fontGroupTh: 'Thai',
    fontGroupJp: 'Japanese',
    appTitle: 'VTuber Schedule Generator',
    appSubtitle: 'Tarot-style Weekly Schedule',
    undo: 'Undo (Ctrl+Z)',
    redo: 'Redo (Ctrl+Y)',
    savedAt: 'Saved at',
    loading: 'Loading...',
    themeSwitchDark: 'Switch to Dark Mode',
    themeSwitchLight: 'Switch to Light Mode',
    langSwitch: 'App language → {lang}',
    dropzoneUnsupported: 'Unsupported file — use PNG or JPG only',
    chooseFileBtn: 'Choose file',
    closeNotification: 'Dismiss notification',
    navAria: 'Navigation',
    mobileNavAria: 'Mobile navigation',
    winMinimize: 'Minimize',
    winMaximize: 'Maximize',
    winRestore: 'Restore',
    winClose: 'Close',
    comingSoon: 'Coming soon',
    charCounterAria: '{current} of {max} characters',
    infoTipAria: 'More info: {text}',
    draftSavedToast: 'Draft saved (Ctrl+S)',
    errorUiTitle: 'Something went wrong',
    errorUiMsg:
      'This part of the app stopped working. Nothing is lost — your schedule was saved automatically. Try again, and if it keeps happening, restart the app.',
    errorUiRetry: 'Try again',

    tabGeneral: 'General',
    tabSchedule: 'Schedule',
    tabAssets: 'Assets',
    tabExport: 'Export',
    tabDrafts: 'Drafts',
    tabHelp: 'Help',
    tabMore: 'More',

    generalTitle: 'General Info',

    creditSection: 'Signature & Credit Watermark',
    showCreditLabel: 'Show artist credit at bottom-left',
    showCreditHint: 'Controls signature text visibility on the card',
    creditBgLabel: 'Background shade chip for credit',
    creditBgHint: 'Adds dark backing strip for legibility on bright art',

    dateSection: 'Language & Time Zone',
    startDateLabel: 'Week Start Date',
    startDateHint: 'Pick any day of the week, Monday is auto-normalized',
    startDateTooltip: 'Automatically calculates Monday–Sunday dates, month/year headers, and cross-month weeks',
    cardLanguageLabel: 'Schedule Display Language',
    cardLanguageHint: 'Event titles can be localized per event in the Schedule tab',
    cardLanguageNote: 'This language is used for day/month names on the card. Toggle quickly on the top toolbar',

    scheduleTitle: 'Weekly Schedule',
    editSelectedDay: 'Edit Selected Day',
    fullWeekSection: 'Full Week Overview',
    selectDayHint: 'Click a day to edit',
    closeBtn: 'Close',
    weekSection: 'Week',
    weekOfLabel: 'Week of',
    prevWeek: 'Previous week',
    nextWeek: 'Next week',
    thisWeek: 'This week',
    duplicateLastWeek: 'Duplicate last week',
    duplicatedWeek: 'Copied last week’s schedule',
    noPrevWeek: 'No saved schedule for last week yet',
    cancelBtn: 'Cancel',
    saveBtn: 'Save',
    offBadgeLabel: 'Off-day badge text',
    offBadgeHint: 'Shown in the status pill at the end of the row',
    offNoteLabel: 'Off-day message',
    offNoteHint: 'Sub-line under the day name, e.g. “Day off, sorry!”',
    startTimeLabel: 'Start',
    timeFormatLabel: 'Time format on schedule',
    timeFormatHint: '12-hour shows AM / PM next to the time',
    timeFormat12: '12-hour',
    timeFormat24: '24-hour',
    customPlatformName: 'Platform name',
    customPlatformIcon: 'Platform icon',
    uploadIcon: 'Upload icon',
    hasStream: 'Stream On',
    noStream: 'Day Off',
    customStream: 'Custom',
    offTextLabel: 'Off-day Text (replaces event list)',
    savePresetTooltip: 'Save this text as a preset',
    itemCount: 'events',
    specialActivity: 'Special Event',
    dayOff: 'Rest',
    dayFree: 'Off',
    addItemBtn: '＋ Add Stream Event (Max 2/day)',

    dayEditTitle: 'Day Editor',
    dayEditHint: 'Click a row on the canvas to open that day\'s panel',
    itemNumber: 'Event',
    specialEvent: 'Special Highlight Event',
    deleteBtn: 'Delete',
    platformLabel: 'Platform',
    timeLabel: 'Time',
    streamTitleLabel: 'Stream Title',
    streamTitlePlaceholder: 'Stream title on schedule',
    collabSectionTitle: 'Collab Partners',
    collabHint: 'Names here are added after the stream title on the schedule, e.g. “Karaoke  w/ Aki, Miku”.',
    addCollabBtn: 'Add Collab',
    collabNamePlaceholder: 'Name or @handle',



    artSection: 'Character Art',
    uploadCharacterArt: 'Upload Character Art',
    characterArtHint: 'Recommended transparent PNG — Drag & drop or click to upload',
    zoomLabel: 'Zoom / Scale',
    positionLabel: 'Position Offset',
    rotationLabel: 'Rotation',
    flipXBtn: 'Mirror',
    flipYBtn: 'Flip',
    resetPos: 'Reset Position',
    changeArt: 'Change Image',

    animSection: 'Animation Effects',
    motionSection: 'Animation Effects',

    exportSection: 'Export Resolution',
    presetPlatform: 'Export Size (16:9 only)',
    fileFormat: 'File Format',
    customSizeLabel: 'Custom size',
    batchLabel: 'Batch Export All Languages (TH/EN/JP in 1 click)',
    exportBtn: 'Export',
    exportingMsg: 'Exporting...',
    gifCapturing: 'Capturing',
    gifEncoding: 'Encoding',
    gifHint: 'GIF capture at 12 fps across 1 loop = {frames} frames ({size})',
    exportAllSizes: '⚡ Export All Sizes',
    exportSavedLabel: 'Saved to',
    openFolderBtn: 'Open folder',

    histTemplate: 'template change',
    histDay: 'edit to {day}',
    histWeekStart: 'week change',
    histArt: 'character art change',
    histExport: 'export settings',
    histAnim: 'animation settings',
    histMeta: 'card details',
    histEdit: 'last edit',

    tonesAllBtn: 'Show all tones',
    tonesRecommendedBtn: 'Show recommended only',
    exportFailed: 'Export failed. Please try again.',

    draftsSection: 'Save Draft',
    draftNameLabel: 'Draft Name',
    saveDraftBtn: 'Save Current Draft',
    autosaveNote: 'All edits are saved automatically. Load a previous week draft to reuse layout and theme!',
    draftListSection: 'Saved Drafts',
    noDraftsTitle: 'No Saved Drafts Yet',
    noDraftsMsg: 'Save this week\'s schedule as a template to reuse next week!',
    saveFirstDraftBtn: 'Save First Draft',
    loadBtn: 'Load',
    renameBtn: 'Rename',
    duplicateBtn: 'Duplicate',

    appShort: 'VSG',
    uiLangGroup: 'App',
    cardLangGroup: 'Card',
    exportNowBtn: 'Export',
    searchLabel: 'Search',
    searchEmpty: 'Nothing matches that',
    resetBtn: 'Reset',
    allLabel: 'All',
    doneBtn: 'Done',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    zoomFit: 'Fit to window',
    zoomActual: 'Actual size (100%)',
    zoomFieldAria: 'Zoom level, percent',
    safeAreaToggle: 'Safe-area guides',
    panHint: 'Hold Space and drag to pan · Ctrl + wheel to zoom',
    panelResizeAria: 'Drag to resize the editor panel — double-click to reset',
    tabTemplate: 'Template',
    helpTitle: 'Help & shortcuts',
    helpShort: 'Help',
    helpShortcutsTitle: 'Keyboard shortcuts',
    helpFlowTitle: 'From opening the app to your first file',
    helpFlowSteps:
      'Pick a template → the week fills in by itself → click a day on the card to edit it → press Export.',
    kbdUndo: 'Undo',
    kbdRedo: 'Redo',
    kbdSaveDraft: 'Save a draft',
    kbdExport: 'Open the Export tab',
    kbdFit: 'Fit the card to the window',
    kbdActual: 'Show the card at 100%',
    kbdPan: 'Pan the preview',
    kbdZoom: 'Zoom the preview',
    kbdTabs: 'Switch panel tabs',
    kbdCloseDay: 'Leave day editing',
    kbdNextDay: 'Confirm and go to the next day',
    templateSection: 'Template',
    templateGalleryHint: 'Pick a look first — everything else adjusts on top of it.',
    toneAccordion: 'Colour tone',
    elementsAccordion: 'Elements',
    fontsAccordion: 'Fonts',
    styleNotebook: 'Notebook',
    styleRibbon: 'Ribbon',
    styleTicket: 'Ticket',
    styleSticker: 'Sticker',
    styleMinimal: 'Minimal',
    styleFullbleed: 'Full bleed',
    templateSwitchedToast: 'Now using {name}',
    editingDayTitle: 'Editing {day}',
    backToWeek: 'Back to the week',
    prevDay: 'Previous day',
    nextDay: 'Next day',
    saveAndNextDay: 'Save & next day',
    nextWeekBtn: 'Next week',
    datePreviewLabel: 'On the card it reads',
    noArtTitle: 'No character art yet',
    noArtMsg: 'A transparent PNG sits best inside the frame. The card works without one too.',
    centerArtBtn: 'Centre',
    fitArtBtn: 'Fit frame',
    exportSizeTitle: 'Output size',
    exportDoneTitle: 'Saved',
    exportDoneMsg: 'Exported {count} file(s).',
    draftSearchPlaceholder: 'Search drafts',
    sortRecent: 'Last edited',
    sortName: 'Name',
    confirmDeleteBtn: 'Delete for good?',
    draftsCount: '{n} saved',
    firstRunTitle: 'Start from a template',
    firstRunMsg:
      'Every template arrives finished — this week is already filled in. Pick one, change what you need, and export.',
    firstRunCta: 'Choose a template',
    firstRunSkip: 'Keep the current one',
  },
  th: {
    tabTheme: 'ธีม',
    clickRowHint: 'คลิกที่แถววันบนภาพเพื่อแก้ไขได้ทันที',
    tapRowHint: 'แตะแถววันเพื่อแก้ไข',
    themeSection: 'ธีม',
    themeHueLabel: 'เฉดสี',
    themeSatLabel: 'ความอิ่มสี',
    themeLightLabel: 'ความสว่าง',
    themeResetBtn: 'กลับเป็นค่าเริ่มต้นของเทมเพลต',
    artColorSection: 'สีภาพประกอบ',
    artColorHint: 'ปักสีตรงให้ภาพส่วนใดส่วนหนึ่ง — ทับค่าจากการหมุนเฉดสีเฉพาะส่วนนั้น',
    partBackground: 'พื้นหลัง',
    partFrame: 'กรอบรูป',
    partPanel: 'แผงตาราง',
    partTitleFlowers: 'ดอกไม้หัวเรื่อง',
    partWeekRibbon: 'ริบบิ้น WEEK OF',
    partRowAccent: 'จุด-เส้นประในแถว',
    partOfflineRibbon: 'ริบบิ้น OFFLINE',
    textStyleSection: 'สไตล์ข้อความ',
    textColorSection: 'สีข้อความ',
    textColorHint: 'กำหนดสีเองให้แต่ละข้อความ — ทับค่าจากสไลเดอร์เฉดสี',
    roleTitleTop: 'หัวเรื่อง “Weekly”',
    roleTitleBottom: 'หัวเรื่อง “Schedule”',
    roleWeekOf: 'ริบบิน WEEK OF',
    roleDayOnline: 'ชื่อวัน (วันสตรีม)',
    roleDayOffline: 'ชื่อวัน (วันหยุด)',
    roleTime: 'เวลา',
    roleSubtitle: 'ชื่อรายการ',
    roleOffline: 'ข้อความป้าย OFFLINE',
    roleArtCredit: 'เครดิตศิลปิน',
    resetAllColors: 'คืนค่าสีทั้งหมด',
    colorPickerAria: '{role} — เลือกสี',
    fontSection: 'ฟอนต์',
    fontHint:
      'ช่องตั้งค่าใช้กับข้อความภาษานั้นบนการ์ด อัปโหลดไฟล์ .ttf, .otf, .woff หรือ .woff2 เพื่อเพิ่มฟอนต์ของคุณเอง',
    fontSlotEn: 'ฟอนต์ภาษาอังกฤษ',
    fontSlotTh: 'ฟอนต์ภาษาไทย',
    fontSlotJp: 'ฟอนต์ภาษาญี่ปุ่น',
    fontDefaultOption: 'ฟอนต์เทมเพลต',
    fontUploadBtn: 'อัปโหลดไฟล์ฟอนต์',
    fontUploadOk: 'เพิ่มฟอนต์ “{name}” แล้ว',
    fontUploadFail: 'อ่านไฟล์ฟอนต์นี้ไม่สำเร็จ',
    fontRemoveAria: 'ลบฟอนต์ {name}',
    fontAddSystem: 'ฟอนต์ในเครื่อง',
    fontAddGoogle: 'Google Fonts',
    fontLoading: 'กำลังโหลด…',
    fontSystemSearch: 'ค้นหาฟอนต์ที่ติดตั้งไว้…',
    fontSystemEmpty: 'ไม่พบไฟล์ฟอนต์ที่ใช้ได้',
    fontSystemUnavailable: 'อ่านฟอนต์ในเครื่องได้เฉพาะในแอปเดสก์ท็อป',
    fontListTruncated: '…อีก {n} รายการ — พิมพ์ค้นหาเพิ่ม',
    fontGoogleSearch: 'ชื่อฟอนต์ เช่น Poppins',
    fontGoogleAdd: 'ดาวน์โหลด',
    fontGoogleFail: 'โหลดฟอนต์จาก Google ไม่สำเร็จ — ตรวจชื่อฟอนต์และอินเทอร์เน็ต',
    fontGoogleNote: 'ดาวน์โหลดครั้งเดียวแล้วเก็บไว้ในแอป ใช้ต่อได้แม้ออฟไลน์',
    fontGroupEn: 'อังกฤษ',
    fontGroupTh: 'ไทย',
    fontGroupJp: 'ญี่ปุ่น',
    appTitle: 'VTuber Schedule Generator',
    appSubtitle: 'ตารางประจำสัปดาห์สไตล์ไพ่ทาโรต์',
    undo: 'เลิกทำ (Ctrl+Z)',
    redo: 'ทำซ้ำ (Ctrl+Y)',
    savedAt: 'บันทึกแล้ว',
    loading: 'กำลังโหลด...',
    themeSwitchDark: 'เปลี่ยนเป็นโหมดมืด',
    themeSwitchLight: 'เปลี่ยนเป็นโหมดสว่าง',
    langSwitch: 'ภาษาเมนู → {lang}',
    dropzoneUnsupported: 'ไฟล์นี้ไม่รองรับ ใช้ PNG หรือ JPG เท่านั้น',
    chooseFileBtn: 'เลือกไฟล์',
    closeNotification: 'ปิดการแจ้งเตือน',
    navAria: 'แถบนำทาง',
    mobileNavAria: 'แถบนำทาง (มือถือ)',
    winMinimize: 'ย่อหน้าต่าง',
    winMaximize: 'ขยายหน้าต่าง',
    winRestore: 'คืนขนาดเดิม',
    winClose: 'ปิดหน้าต่าง',
    comingSoon: 'เร็ว ๆ นี้',
    charCounterAria: '{current} จาก {max} ตัวอักษร',
    infoTipAria: 'ดูข้อมูลเพิ่มเติม: {text}',
    draftSavedToast: 'บันทึกฉบับร่างแล้ว (Ctrl+S)',
    errorUiTitle: 'เกิดข้อผิดพลาด',
    errorUiMsg:
      'ส่วนนี้ของแอปหยุดทำงาน งานของคุณไม่หาย ตารางถูกบันทึกอัตโนมัติไว้แล้ว กดลองใหม่ได้เลย ถ้ายังเป็นซ้ำให้ปิดแล้วเปิดแอปใหม่',
    errorUiRetry: 'ลองใหม่',

    tabGeneral: 'ทั่วไป',
    tabSchedule: 'ตาราง',
    tabAssets: 'ภาพ',
    tabExport: 'ส่งออก',
    tabDrafts: 'ฉบับร่าง',
    tabHelp: 'ช่วยเหลือ',
    tabMore: 'เพิ่มเติม',

    generalTitle: 'ข้อมูลทั่วไป',

    creditSection: 'ลายเซ็น & watermark',
    showCreditLabel: 'แสดงเครดิตศิลปินมุมล่างซ้าย',
    showCreditHint: 'ควบคุมการแสดงผลข้อความลายเซ็นบนการ์ด',
    creditBgLabel: 'แถบแรเงาพื้นหลังข้อความเครดิต',
    creditBgHint: 'เพิ่มแถบมืดใต้ตัวอักษร อ่านง่ายขึ้นบนภาพพื้นหลังสว่าง',

    dateSection: 'ภาษา & โซนเวลา',
    startDateLabel: 'วันเริ่มต้นสัปดาห์',
    startDateHint: 'เลือกวันใดวันหนึ่งในสัปดาห์ก็ได้ ระบบหาวันจันทร์ให้อัตโนมัติ',
    startDateTooltip: 'ระบบคำนวณวันจันทร์–อาทิตย์ของสัปดาห์นั้นให้อัตโนมัติ รวมถึงช่วงเดือน/ปี และรองรับสัปดาห์ข้ามเดือน เช่น 31 ก.ค. – 6 ส.ค.',
    cardLanguageLabel: 'ภาษาบนตาราง',
    cardLanguageHint: 'ชื่อรายการแยกภาษาได้ในแต่ละรายการ (แท็บตาราง)',
    cardLanguageNote: 'ภาษานี้ใช้กับชื่อวัน/เดือนบนการ์ด — สลับด่วนได้ที่แถบเครื่องมือเหนือพรีวิว',

    scheduleTitle: 'กำหนดการประจำสัปดาห์',
    editSelectedDay: 'แก้ไขวันที่เลือก',
    fullWeekSection: 'ภาพรวมทั้งสัปดาห์',
    selectDayHint: 'คลิกที่วันเพื่อแก้ไข',
    closeBtn: 'ปิด',
    weekSection: 'สัปดาห์',
    weekOfLabel: 'สัปดาห์ของ',
    prevWeek: 'สัปดาห์ก่อนหน้า',
    nextWeek: 'สัปดาห์ถัดไป',
    thisWeek: 'สัปดาห์นี้',
    duplicateLastWeek: 'คัดลอกจากสัปดาห์ก่อน',
    duplicatedWeek: 'คัดลอกตารางสัปดาห์ก่อนมาแล้ว',
    noPrevWeek: 'ยังไม่มีตารางของสัปดาห์ก่อนให้คัดลอก',
    cancelBtn: 'ยกเลิก',
    saveBtn: 'บันทึก',
    offBadgeLabel: 'ข้อความบนป้ายวันหยุด',
    offBadgeHint: 'แสดงในป้ายสถานะท้ายแถวของวันนั้น',
    offNoteLabel: 'ข้อความวันหยุด',
    offNoteHint: 'บรรทัดรองใต้ชื่อวัน เช่น “Day off, sorry!”',
    startTimeLabel: 'เริ่ม',
    timeFormatLabel: 'รูปแบบเวลาบนตาราง',
    timeFormatHint: 'แบบ 12 ชั่วโมงจะมี AM / PM ต่อท้ายเวลา',
    timeFormat12: '12 ชั่วโมง',
    timeFormat24: '24 ชั่วโมง',
    customPlatformName: 'ชื่อแพลตฟอร์ม',
    customPlatformIcon: 'ไอคอนแพลตฟอร์ม',
    uploadIcon: 'อัปโหลดไอคอน',
    hasStream: 'มีสตรีม',
    noStream: 'ไม่มีสตรีม',
    customStream: 'กำหนดเอง',
    offTextLabel: 'ข้อความสำหรับวันหยุด',
    savePresetTooltip: 'บันทึกเป็นข้อความที่ใช้บ่อย',
    itemCount: 'รายการ',
    specialActivity: 'กิจกรรมพิเศษ',
    dayOff: 'พัก',
    dayFree: 'ว่าง',
    addItemBtn: '＋ เพิ่มรอบ (สูงสุด 2 รอบ/วัน)',

    dayEditTitle: 'แก้ไขวัน',
    dayEditHint: 'คลิกแถววันบนภาพเพื่อเปิดแผงแก้วันนั้น',
    itemNumber: 'รายการที่',
    specialEvent: 'กิจกรรมพิเศษ',
    deleteBtn: 'ลบ',
    platformLabel: 'แพลตฟอร์ม',
    timeLabel: 'เวลา',
    streamTitleLabel: 'ชื่อรายการ',
    streamTitlePlaceholder: 'ชื่อรายการบนตาราง',
    collabSectionTitle: 'เพื่อนร่วมคอลแลบ (Collab)',
    collabHint: 'ชื่อที่ใส่จะไปต่อท้ายชื่อรายการบนตาราง เช่น “ร้องเพลง  ร่วมกับ Aki, Miku”',
    addCollabBtn: 'เพิ่มเพื่อน',
    collabNamePlaceholder: 'ชื่อหรือ @handle',



    artSection: 'ภาพตัวละคร',
    uploadCharacterArt: 'อัปโหลดภาพตัวละคร',
    characterArtHint: 'แนะนำ PNG โปร่งใส — ลากไฟล์มาวางหรือคลิกเลือก',
    zoomLabel: 'ซูม',
    positionLabel: 'ตำแหน่ง',
    rotationLabel: 'หมุนภาพ',
    flipXBtn: 'พลิกซ้ายขวา',
    flipYBtn: 'พลิกบนล่าง',
    resetPos: 'รีเซ็ตตำแหน่ง',
    changeArt: 'เปลี่ยนภาพ',

    animSection: 'เอฟเฟกต์แอนิเมชัน',
    motionSection: 'เอฟเฟกต์แอนิเมชัน',

    exportSection: 'ความละเอียดที่ส่งออก',
    presetPlatform: 'ขนาดที่ส่งออก (16:9 เท่านั้น)',
    fileFormat: 'รูปแบบไฟล์',
    customSizeLabel: 'ขนาดกำหนดเอง',
    batchLabel: 'ส่งออกทุกภาษา (TH/EN/JP รวดเดียว 3 ไฟล์)',
    exportBtn: 'ส่งออก',
    exportingMsg: 'กำลังส่งออก…',
    gifCapturing: 'กำลังจับภาพ',
    gifEncoding: 'กำลังเข้ารหัส',
    gifHint: 'GIF จะ capture ที่ 12 fps ตลอด 1 ลูป = {frames} เฟรม ({size})',
    exportAllSizes: '⚡ ส่งออกครบทุกขนาด',
    exportSavedLabel: 'บันทึกไว้ที่',
    openFolderBtn: 'เปิดโฟลเดอร์',

    histTemplate: 'เปลี่ยนเทมเพลต',
    histDay: 'แก้{day}',
    histWeekStart: 'เปลี่ยนสัปดาห์',
    histArt: 'เปลี่ยนรูปตัวละคร',
    histExport: 'ตั้งค่าส่งออก',
    histAnim: 'ตั้งค่าภาพเคลื่อนไหว',
    histMeta: 'รายละเอียดการ์ด',
    histEdit: 'การแก้ล่าสุด',

    tonesAllBtn: 'ดูโทนสีทั้งหมด',
    tonesRecommendedBtn: 'ดูเฉพาะโทนที่แนะนำ',
    exportFailed: 'ส่งออกไม่สำเร็จ ลองใหม่อีกครั้ง',

    draftsSection: 'บันทึกฉบับร่าง',
    draftNameLabel: 'ชื่อฉบับร่าง',
    saveDraftBtn: 'บันทึกฉบับร่าง',
    autosaveNote: 'การแก้ไขทุกครั้งถูกบันทึกอัตโนมัติ — เปิดฉบับร่างของสัปดาห์ก่อนแล้วแก้เฉพาะที่เปลี่ยนได้เลย',
    draftListSection: 'รายการฉบับร่าง',
    noDraftsTitle: 'ยังไม่มีฉบับร่าง',
    noDraftsMsg: 'บันทึกตารางสัปดาห์นี้ไว้ใช้ซ้ำได้ — โหลดกลับมาแก้เฉพาะวันที่เปลี่ยน',
    saveFirstDraftBtn: 'บันทึกฉบับร่างแรก',
    loadBtn: 'โหลด',
    renameBtn: 'เปลี่ยนชื่อ',
    duplicateBtn: 'ทำสำเนา',

    appShort: 'VSG',
    uiLangGroup: 'แอป',
    cardLangGroup: 'การ์ด',
    exportNowBtn: 'ส่งออก',
    searchLabel: 'ค้นหา',
    searchEmpty: 'ไม่พบรายการที่ตรง',
    resetBtn: 'รีเซ็ต',
    allLabel: 'ทั้งหมด',
    doneBtn: 'เสร็จแล้ว',
    zoomOut: 'ซูมออก',
    zoomIn: 'ซูมเข้า',
    zoomFit: 'พอดีหน้าต่าง',
    zoomActual: 'ขนาดจริง (100%)',
    zoomFieldAria: 'ระดับการซูม เป็นเปอร์เซ็นต์',
    safeAreaToggle: 'เส้นบอกขอบเขตพื้นที่ปลอดภัย',
    panHint: 'กด Space ค้างแล้วลากเพื่อเลื่อน · Ctrl + ล้อเมาส์เพื่อซูม',
    panelResizeAria: 'ลากเพื่อปรับความกว้างแผงแก้ไข — ดับเบิลคลิกเพื่อรีเซ็ต',
    tabTemplate: 'เทมเพลต',
    helpTitle: 'วิธีใช้และคีย์ลัด',
    helpShort: 'วิธีใช้',
    helpShortcutsTitle: 'คีย์ลัด',
    helpFlowTitle: 'จากเปิดแอปถึงไฟล์แรก',
    helpFlowSteps: 'เลือกเทมเพลต → สัปดาห์เติมให้เอง → คลิกวันบนการ์ดเพื่อแก้ → กดส่งออก',
    kbdUndo: 'ย้อนกลับ',
    kbdRedo: 'ทำซ้ำ',
    kbdSaveDraft: 'บันทึกฉบับร่าง',
    kbdExport: 'เปิดแท็บส่งออก',
    kbdFit: 'ย่อการ์ดให้พอดีหน้าต่าง',
    kbdActual: 'ดูการ์ดขนาดจริง 100%',
    kbdPan: 'เลื่อนพรีวิว',
    kbdZoom: 'ซูมพรีวิว',
    kbdTabs: 'สลับแท็บในแผง',
    kbdCloseDay: 'ออกจากโหมดแก้วัน',
    kbdNextDay: 'ยืนยันแล้วไปวันถัดไป',
    templateSection: 'เทมเพลต',
    templateGalleryHint: 'เลือกหน้าตาก่อน — ที่เหลือปรับทับลงไปทีหลังได้',
    toneAccordion: 'โทนสี',
    elementsAccordion: 'องค์ประกอบ',
    fontsAccordion: 'ฟอนต์',
    styleNotebook: 'สมุดโน้ต',
    styleRibbon: 'ริบบิ้น',
    styleTicket: 'ตั๋ว',
    styleSticker: 'สติกเกอร์',
    styleMinimal: 'มินิมอล',
    styleFullbleed: 'เต็มจอ',
    templateSwitchedToast: 'เปลี่ยนเป็น {name} แล้ว',
    editingDayTitle: 'กำลังแก้ {day}',
    backToWeek: 'กลับไปทั้งสัปดาห์',
    prevDay: 'วันก่อนหน้า',
    nextDay: 'วันถัดไป',
    saveAndNextDay: 'บันทึกแล้วไปวันถัดไป',
    nextWeekBtn: 'สัปดาห์หน้า',
    datePreviewLabel: 'บนการ์ดจะขึ้นว่า',
    noArtTitle: 'ยังไม่มีภาพตัวละคร',
    noArtMsg: 'PNG พื้นโปร่งใสจะเข้ากรอบสวยที่สุด — ไม่ใส่ก็ใช้การ์ดได้ตามปกติ',
    centerArtBtn: 'จัดกึ่งกลาง',
    fitArtBtn: 'พอดีกรอบ',
    exportSizeTitle: 'ขนาดไฟล์ที่ส่งออก',
    exportDoneTitle: 'บันทึกแล้ว',
    exportDoneMsg: 'ส่งออกแล้ว {count} ไฟล์',
    draftSearchPlaceholder: 'ค้นหาฉบับร่าง',
    sortRecent: 'แก้ล่าสุด',
    sortName: 'ชื่อ',
    confirmDeleteBtn: 'ลบถาวรใช่ไหม',
    draftsCount: 'บันทึกไว้ {n} รายการ',
    firstRunTitle: 'เริ่มจากเทมเพลต',
    firstRunMsg:
      'ทุกเทมเพลตมาแบบเสร็จแล้ว สัปดาห์นี้ถูกเติมให้เรียบร้อย เลือกสักอัน แก้เท่าที่อยากแก้ แล้วกดส่งออกได้เลย',
    firstRunCta: 'เลือกเทมเพลต',
    firstRunSkip: 'ใช้อันเดิมต่อ',
  },
}

export function useTranslation(lang: Lang): Translations {
  if (lang === 'th') return translations.th
  return translations.en
}
