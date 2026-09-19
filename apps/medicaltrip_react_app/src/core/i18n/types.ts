/**
 * Medical Trip Colombia S.A.S. - i18n Translation & Territory Types
 * Zero-dependency typed internationalization system supporting Caribbean multilingual ergonomics:
 * - Papiamento (pap) - Curaçao, Aruba, Bonaire
 * - Dutch / Nederlands (nl) - Kingdom of the Netherlands & ABC Islands
 * - English (en) - International Caribbean Travelers & Medical Tourism
 * - Spanish / Español (es) - Colombian Clinical Corridor (Medellín & Oriente Antioqueño)
 */

export type LanguageCode = 'es' | 'en' | 'nl' | 'pap';
export type CaribbeanCountryCode = 'CW' | 'AW' | 'BQ' | 'NL' | 'US' | 'CO';

export interface CaribbeanTerritoryProfile {
  countryCode: CaribbeanCountryCode;
  countryName: string;
  flagEmoji: string;
  defaultLanguages: LanguageCode[];
  primaryLanguage: LanguageCode;
}

export interface TranslationDictionary {
  common: {
    today: string;
    cancel: string;
    save: string;
    close: string;
    complete: string;
    offline: string;
    loading: string;
    error: string;
    actions: string;
    included: string;
    day: string;
    days: string;
    person: string;
    persons: string;
    flight: string;
  };
  navigation: {
    month: string;
    week: string;
    day: string;
    agenda: string;
    balance: string;
    newPatient: string;
    smartItinerary: string;
    newEvent: string;
  };
  patient: {
    title: string;
    patientName: string;
    pax: string;
    origin: string;
    originPax: string;
    language: string;
    hotel: string;
    assignedHotel: string;
    arrival: string;
    arrivalDate: string;
    departure: string;
    departureDate: string;
    airline: string;
    flight: string;
    contact: string;
    contactLanguage: string;
    phone: string;
    email: string;
    companions: string;
    status: string;
    notes: string;
  };
  signature: {
    modalTitle: string;
    modalSubtitle: string;
    signerRole: string;
    signerName: string;
    signerNamePlaceholder: string;
    patientRole: string;
    guideRole: string;
    coordinatorRole: string;
    canvasTitle: string;
    canvasInstruction: string;
    clearCanvas: string;
    signOnly: string;
    signAndDownload: string;
    legalConsentTitle: string;
    legalConsentText: (bookingCode: string) => string;
    errorNoSignature: string;
    errorNoSignerName: string;
    errorNoBooking: string;
    successNotice: string;
  };
  pdfStatement: {
    documentTitle: string;
    companySubtitle1: string;
    companySubtitle2: string;
    statusSettled: string;
    statusCredit: string;
    statusDebt: string;
    bookingCodeLabel: string;
    issueDateLabel: string;
    patientDossierTitle: string;
    patientNameLabel: string;
    originPaxLabel: string;
    hotelAssignedLabel: string;
    arrivalDateLabel: string;
    departureDateLabel: string;
    contactLanguageLabel: string;
    itineraryTableTitle: string;
    colDayDate: string;
    colSchedule: string;
    colCategory: string;
    colConceptProvider: string;
    colResponsible: string;
    colAmountCop: string;
    roleGuide: string;
    roleFleet: string;
    roleClinical: string;
    costBreakdownTitle: string;
    fleetTransfersLabel: string;
    guideFeesLabel: string;
    expensesLabel: string;
    subtotalDebitsLabel: string;
    balanceTitle: string;
    totalDebitsLabel: string;
    advancesReceivedLabel: string;
    netBalanceLabel: string;
    patientSignatureTitle: string;
    patientSignatureSubtitle: string;
    auditCoordinationTitle: string;
    auditCoordinationSubtitle: string;
    validationCodeLabel: string;
    verifiedLabel: string;
    footerNote: string;
  };
  arrivalLogistics: {
    trackingTitle: string;
    terminalPickup: string;
    flightDetails: string;
    flightNumber: string;
    scheduledArrival: string;
    terminal: string;
    driverAssigned: string;
    vehiclePlate: string;
    driverCheckIn: string;
    driverCheckedInSuccess: string;
    driverCheckingIn: string;
    destinationHotel: string;
    transferStatusTimeline: string;
    statusRequested: string;
    statusInTransit: string;
    statusCompleted: string;
    welcomeKitTitle: string;
    openWelcomeKit: string;
    closeKit: string;
    simCardTitle: string;
    simCardStatus: string;
    simPlan: string;
    simTariff: string;
    simAssignedNumber: string;
    simDeliveredBadge: string;
    emergencyContactsTitle: string;
    emergencyContacts: string;
    conciergeHotline: string;
    guideContact: string;
    driverContact: string;
    hotelContact: string;
    police123: string;
    currencyTitle: string;
    currencyGuidance: string;
    exchangeRatesRef: string;
    authorizedHouses: string;
    atmAdvice: string;
    fastingReminder: string;
  };
  companion: {
    turnTitle: string;
    turnSubtitle: string;
    openTurnSheet: string;
    guideAssigned: string;
    selectGuide: string;
    shiftDate: string;
    dayNumber: string;
    hoursLogged: string;
    hoursPrecision: string;
    hourlyRate: string;
    prepAllowance: string;
    prepAllowanceIncluded: string;
    mealSubsidy: string;
    autoTierSuggested: string;
    subtotal: string;
    hourlySubtotal: string;
    digitalSignOff: string;
    patientOrGuideSign: string;
    signerName: string;
    signTurn: string;
    saveTurn: string;
    turnSavedSuccess: string;
    sha256Seal: string;
    notes: string;
    notesPlaceholder: string;
    status: string;
    statusScheduled: string;
    statusInProgress: string;
    statusCompleted: string;
    statusApproved: string;
    tier0Label: string;
    tier1Label: string;
    tier2Label: string;
    tier3Label: string;
    tier4Label: string;
    exportReceipt: string;
    errorNoGuide: string;
    errorNoHours: string;
    pettyCashReceived: string;
    pettyCashHelp: string;
    whatSpentToday: string;
    addExpense: string;
    expenseDescription: string;
    expenseAmount: string;
    expenseCategory: string;
    dailyExpensesSubtotal: string;
    pettyCashSurplus: string;
    pettyCashDeficit: string;
    companionNetPayout: string;
    saveAndSettleDay: string;
  };
  territories: Record<CaribbeanCountryCode, string>;
  languages: Record<LanguageCode, string>;
}

export interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationDictionary;
  resolveLanguage: (langInput?: string) => LanguageCode;
  resolveTerritory: (countryInput?: string) => CaribbeanTerritoryProfile;
}
