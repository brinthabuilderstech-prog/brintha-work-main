import { LanguageCode } from '../types';

export const LANGUAGES: { code: LanguageCode; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
];

export const translations = {
  en: {
    appTitle: 'Brintha Builders',
    appSubtitle: 'Labour Attendance & Weekly Payroll Portal',
    
    // Navigation
    myDashboard: 'My Dashboard',
    myLogs: 'My Logs',
    myPayroll: 'My Payroll',
    attendance: 'Attendance',
    payroll: 'Payroll',
    workers: 'Workers',
    management: 'Management',
    settings: 'Settings',
    
    // Roles
    admin: 'Admin',
    supervisor: 'Supervisor',
    worker: 'Worker',
    
    // Attendance
    dailyTracker: 'Daily Attendance Tracker',
    present: 'Present',
    halfDay: 'Half Day',
    absent: 'Absent',
    unmarked: 'Unmarked',
    markAllPresent: 'Mark All Present',
    searchPlaceholder: 'Search worker by name, trade or phone...',
    allTrades: 'All Trades',
    exportPdf: 'Export PDF',
    exportCsv: 'Export CSV',
    daily: 'Daily',
    weeklyMatrix: 'Weekly Matrix',
    capacity: 'Capacity',
    
    // Payroll
    payrollSummary: 'Weekly Payroll Summary',
    grossSalary: 'Gross Salary',
    totalAdvances: 'Active Advances',
    netPayable: 'Net Payable',
    totalPaid: 'Total Paid',
    pendingBalance: 'Pending Balance',
    recordAdvance: 'Record Advance',
    clearSalary: 'Clear Salary',
    downloadPayslip: 'Download Payslip',
    cleared: 'Cleared',
    pending: 'Pending',
    
    // Worker Dashboard
    myAttendanceSummary: 'My Attendance Summary',
    myAdvancesHistory: 'My Advances History',
    myPaymentsHistory: 'My Payments History',
    daysWorked: 'Days Worked',
    netSalaryDue: 'Net Salary Due',
    dailyWageRate: 'Daily Wage Rate',
    assignedSite: 'Assigned Site',
    contactNumber: 'Contact Phone',
    noAdvances: 'No active advances recorded.',
    noPayments: 'No payment records found.',
    
    // Management
    userManagement: 'System User & Access Management',
    manageSubtitle: 'Configure Admins, Supervisors and System Roles.',
    workersDirectory: 'Workers Roster & Profile Directory',
    workersSubtitle: 'View and manage all registered site workers.',
    addWorker: 'Add New Worker',
    addSupervisor: 'Add Supervisor',
    addAdmin: 'Add Admin',
    editAccount: 'Edit Account',
    deleteAccount: 'Delete Account',
    
    // Settings
    settingsTitle: 'Settings & Preferences',
    roleSpecificSettings: 'Settings configured for your role',
    language: 'Portal Language',
    currency: 'Currency Symbol',
    notifications: 'Notification Preferences',
    attendanceNotif: 'Daily Attendance Reminder (9:00 AM)',
    paymentNotif: 'Payment Clearance SMS Alert',
    newWorkerNotif: 'New Worker Onboarding SMS',
    pwaStatus: 'Progressive Web App (PWA) Status',
    installPwa: 'Install App Now',
    downloadPdfReports: 'Download PDF Reports',
    downloadCsvReports: 'Download CSV Reports',
    dangerZone: 'Database & System Data',
    resetDemoData: 'Reset System Data',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    today: 'Today',
    logout: 'Logout',
    signIn: 'Sign In',
    quickLogin: 'Sign In',
    accessDenied: 'Access Restricted to Administrators',
    onlySelfInfo: 'You can only view your own records.',
  },

  hi: {
    appTitle: 'ब्रिंता बिल्डर्स (Brintha Builders)',
    appSubtitle: 'श्रमिक उपस्थिति और साप्ताहिक वेतन पोर्टल',
    
    // Navigation
    myDashboard: 'मेरा डैशबोर्ड',
    myLogs: 'मेरी उपस्थिति',
    myPayroll: 'मेरा वेतन',
    attendance: 'उपस्थिति',
    payroll: 'वेतन',
    workers: 'श्रमिक',
    management: 'प्रबंधन',
    settings: 'सेटिंग्स',
    
    // Roles
    admin: 'एडमिन',
    supervisor: 'सुपरवाइजर',
    worker: 'श्रमिक',
    
    // Attendance
    dailyTracker: 'दैनिक उपस्थिति ट्रैकर',
    present: 'उपस्थित (P)',
    halfDay: 'आधा दिन (H)',
    absent: 'अनुपस्थित (A)',
    unmarked: 'अचिह्नित',
    markAllPresent: 'सभी को उपस्थित करें',
    searchPlaceholder: 'नाम, कार्य या फोन से खोजें...',
    allTrades: 'सभी कार्य (Trades)',
    exportPdf: 'PDF डाउनलोड',
    exportCsv: 'CSV डाउनलोड',
    daily: 'दैनिक view',
    weeklyMatrix: 'साप्ताहिक मैट्रिक्स',
    capacity: 'क्षमता',
    
    // Payroll
    payrollSummary: 'साप्ताहिक वेतन सारांश',
    grossSalary: 'कुल वेतन',
    totalAdvances: 'सक्रिय एडवांस',
    netPayable: 'शुद्ध देय राशि',
    totalPaid: 'कुल भुगतान',
    pendingBalance: 'बकाया राशि',
    recordAdvance: 'एडवांस जोड़ें',
    clearSalary: 'वेतन भुगतान करें',
    downloadPayslip: 'पे-स्लिप डाउनलोड करें',
    cleared: 'चुकता',
    pending: 'बकाया',
    
    // Worker Dashboard
    myAttendanceSummary: 'मेरी उपस्थिति सारांश',
    myAdvancesHistory: 'मेरा एडवांस इतिहास',
    myPaymentsHistory: 'भुगतान इतिहास',
    daysWorked: 'कार्य दिवस',
    netSalaryDue: 'देय शुद्ध वेतन',
    dailyWageRate: 'दैनिक मजदूरी दर',
    assignedSite: 'आवंटित साइट',
    contactNumber: 'संपर्क फोन',
    noAdvances: 'कोई सक्रिय एडवांस नहीं है।',
    noPayments: 'कोई भुगतान रिकॉर्ड नहीं मिला।',
    
    // Management
    userManagement: 'उपयोगकर्ता और एक्सेस प्रबंधन',
    manageSubtitle: 'एडमिन और सुपरवाइजर खातों को प्रबंधित करें।',
    workersDirectory: 'श्रमिकों की सूची व प्रोफाइल',
    workersSubtitle: 'सभी पंजीकृत निर्माण श्रमिकों को देखें और प्रबंधित करें।',
    addWorker: 'नया श्रमिक जोड़ें',
    addSupervisor: 'सुपरवाइजर जोड़ें',
    addAdmin: 'एडमिन जोड़ें',
    editAccount: 'खाता संपादित करें',
    deleteAccount: 'खाता हटाएं',
    
    // Settings
    settingsTitle: 'सेटिंग्स और प्राथमिकताएं',
    roleSpecificSettings: 'आपकी भूमिका के लिए सेटिंग्स',
    language: 'पोर्टल भाषा',
    currency: 'मुद्रा प्रतीक',
    notifications: 'अधिसूचना प्राथमिकताएं',
    attendanceNotif: 'दैनिक उपस्थिति अनुस्मारक (सुबह 9:00 बजे)',
    paymentNotif: 'भुगतान क्लीयरेंस अलर्ट',
    newWorkerNotif: 'नया श्रमिक ऑनबोर्डिंग मैसेज',
    pwaStatus: 'एप इंस्टॉलेशन स्थिति (PWA)',
    installPwa: 'अभी एप इंस्टॉल करें',
    downloadPdfReports: 'PDF रिपोर्ट डाउनलोड करें',
    downloadCsvReports: 'CSV रिपोर्ट डाउनलोड करें',
    dangerZone: 'डेटाबेस रीसेट',
    resetDemoData: 'सिस्टम डेटा रीसेट करें',
    
    // Common
    save: 'सहेजें',
    cancel: 'रद्द करें',
    today: 'आज',
    logout: 'लॉगआउट',
    signIn: 'साइन इन',
    quickLogin: 'साइन इन',
    accessDenied: 'केवल व्यवस्थापक के लिए सीमित पहुँच',
    onlySelfInfo: 'आप केवल अपनी जानकारी देख सकते हैं।',
  },

  ta: {
    appTitle: 'பிரிந்தா பில்டர்ஸ் (Brintha Builders)',
    appSubtitle: 'தொழிலாளர் வருகை & வாராந்திர சம்பள தளம்',
    
    // Navigation
    myDashboard: 'என் பக்கம்',
    myLogs: 'என் வருகை',
    myPayroll: 'என் சம்பளம்',
    attendance: 'வருகை',
    payroll: 'சம்பளம்',
    workers: 'தொழிலாளர்',
    management: 'நிர்வாகம்',
    settings: 'அமைப்புகள்',
    
    // Roles
    admin: 'நிர்வாகி (Admin)',
    supervisor: 'மேற்பார்வையாளர்',
    worker: 'தொழிலாளி',
    
    // Attendance
    dailyTracker: 'தினசரி வருகை பதிவேடு',
    present: 'வருகை (P)',
    halfDay: 'அரை நாள் (H)',
    absent: 'வரவில்லை (A)',
    unmarked: 'குறிக்கப்படவில்லை',
    markAllPresent: 'அனைவரையும் வருகை செய்',
    searchPlaceholder: 'பெயர், வேலை அல்லது போன் மூலம் தேடுக...',
    allTrades: 'அனைத்து வேலைகளும்',
    exportPdf: 'PDF பதிவிறக்கம்',
    exportCsv: 'CSV பதிவிறக்கம்',
    daily: 'தினசரி',
    weeklyMatrix: 'வாராந்திர அட்டவணை',
    capacity: 'சதவீதம்',
    
    // Payroll
    payrollSummary: 'வாராந்திர சம்பள விவரம்',
    grossSalary: 'மொத்த சம்பளம்',
    totalAdvances: 'முன்பணம் (Advance)',
    netPayable: 'நிகர சம்பளம்',
    totalPaid: 'வழங்கப்பட்டது',
    pendingBalance: 'மீதி தொகையும்',
    recordAdvance: 'முன்பணம் பதிவு',
    clearSalary: 'சம்பளம் வழங்கு',
    downloadPayslip: 'சம்பள ரசீது PDF',
    cleared: 'வழங்கப்பட்டது',
    pending: 'நிலுவை',
    
    // Worker Dashboard
    myAttendanceSummary: 'என் வருகை விவரம்',
    myAdvancesHistory: 'என் முன்பண வரலாறு',
    myPaymentsHistory: 'என் சம்பள வரலாறு',
    daysWorked: 'வேலை செய்த நாட்கள்',
    netSalaryDue: 'பெற வேண்டிய சம்பளம்',
    dailyWageRate: 'தினசரி கூலி',
    assignedSite: 'பணிபுரியும் இடம்',
    contactNumber: 'தொலைபேசி எண்',
    noAdvances: 'முன்பணம் எதுவும் இல்லை.',
    noPayments: 'சம்பள வரலாறு எதுவும் இல்லை.',
    
    // Management
    userManagement: 'அமைப்பின் பயனாளர்கள் நிர்வாகம்',
    manageSubtitle: 'நிர்வாகி மற்றும் மேற்பார்வையாளர் கணக்குகள்.',
    workersDirectory: 'தொழிலாளர்கள் விவரம்',
    workersSubtitle: 'பதிவு செய்யப்பட்ட தொழிலாளர்களின் விவரங்களை நிர்வகிக்கவும்.',
    addWorker: 'புதிய தொழிலாளி சேர்க்க',
    addSupervisor: 'மேற்பார்வையாளர் சேர்க்க',
    addAdmin: 'நிர்வாகி சேர்க்க',
    editAccount: 'விவரம் திருத்து',
    deleteAccount: 'கணக்கை நீக்கு',
    
    // Settings
    settingsTitle: 'செயலி அமைப்புகள்',
    roleSpecificSettings: 'உங்கள் பொறுப்பிற்கான அமைப்புகள்',
    language: 'மொழி தேர்வு',
    currency: 'நாணய குறியீடு',
    notifications: 'அறிவிப்பு அமைப்புகள்',
    attendanceNotif: 'தினசரி வருகை நினைவூட்டல் (காலை 9:00)',
    paymentNotif: 'சம்பளம் வழங்கல் செய்தி',
    newWorkerNotif: 'புதிய தொழிலாளி சேர்க்கை செய்தி',
    pwaStatus: 'செயலி நிறுவல் நிலை',
    installPwa: 'செயலியை நிறுவு',
    downloadPdfReports: 'PDF அறிக்கை பதிவிறக்கம்',
    downloadCsvReports: 'CSV அறிக்கை பதிவிறக்கம்',
    dangerZone: 'தரவுத்தள மீட்டமைப்பு',
    resetDemoData: 'சிஸ்டம் தரவை மீட்டமை',
    
    // Common
    save: 'சேமி',
    cancel: 'ரத்து',
    today: 'இன்று',
    logout: 'வெளியேறு',
    signIn: 'உள்நுழைக',
    quickLogin: 'உள்நுழைவு',
    accessDenied: 'நிர்வாகிக்கு மட்டுமே அனுமதி உண்டு',
    onlySelfInfo: 'உங்கள் சொந்த விவரங்களை மட்டுமே பார்க்க முடியும்.',
  },
};

export const getTranslation = (lang: LanguageCode = 'en') => {
  return translations[lang] || translations.en;
};
