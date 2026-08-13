import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WorkerCalculatedPayroll, AttendanceRecord, User, AppSettings } from '../types';

export const exportAttendancePDF = (
  date: string,
  workers: User[],
  attendance: AttendanceRecord[],
  settings?: AppSettings
) => {
  const doc = new jsPDF();

  // Title Header
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, 210, 24, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('BRINTHA BUILDERS - DAILY ATTENDANCE REPORT', 14, 15);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${date}`, 14, 32);
  doc.text(`Total Workers: ${workers.length}`, 14, 38);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 130, 32);

  const tableData: (string | number)[][] = [];

  workers.forEach((w, index) => {
    const rec = attendance.find((a) => a.workerId === w.id && a.date === date);
    const statusStr = rec ? rec.status.toUpperCase().replace('_', ' ') : 'UNMARKED';
    
    tableData.push([
      index + 1,
      w.name,
      w.trade || 'Helper',
      w.phone,
      `₹${w.dailyRate || 0}`,
      statusStr,
      rec?.markedBy || 'N/A'
    ]);
  });

  autoTable(doc, {
    startY: 44,
    head: [['#', 'Worker Name', 'Trade', 'Phone', 'Daily Rate', 'Status', 'Marked By']],
    body: tableData,
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  doc.save(`Attendance_Report_${date}.pdf`);
};

export const exportPayrollPDF = (
  payrolls: WorkerCalculatedPayroll[],
  startDate: string,
  endDate: string,
  settings?: AppSettings
) => {
  const doc = new jsPDF();
  const currency = settings?.currency || '₹';

  // Title Header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 24, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('BRINTHA BUILDERS - WEEKLY PAYROLL SUMMARY', 14, 15);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${startDate} to ${endDate}`, 14, 32);
  doc.text(`Total Workers: ${payrolls.length}`, 14, 38);

  const totalGross = payrolls.reduce((acc, p) => acc + p.grossSalary, 0);
  const totalAdvances = payrolls.reduce((acc, p) => acc + p.totalAdvances, 0);
  const totalNet = payrolls.reduce((acc, p) => acc + p.netSalary, 0);

  doc.text(`Total Gross: ${currency}${totalGross.toLocaleString()}`, 130, 32);
  doc.text(`Total Advances: -${currency}${totalAdvances.toLocaleString()}`, 130, 38);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Net Payable: ${currency}${totalNet.toLocaleString()}`, 130, 44);

  const tableData: (string | number)[][] = [];

  payrolls.forEach((p, index) => {
    tableData.push([
      index + 1,
      p.workerName,
      p.trade,
      `${currency}${p.dailyRate}`,
      `${p.daysWorked} Days`,
      `${currency}${p.grossSalary}`,
      `-${currency}${p.totalAdvances}`,
      `${currency}${p.netSalary}`,
      `${currency}${p.totalPaid}`,
      p.isCleared ? 'CLEARED' : 'PENDING'
    ]);
  });

  autoTable(doc, {
    startY: 50,
    head: [['#', 'Worker Name', 'Trade', 'Daily Rate', 'Days Worked', 'Gross', 'Advance', 'Net Payable', 'Paid', 'Status']],
    body: tableData,
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
    },
  });

  doc.save(`Payroll_Summary_${startDate}_to_${endDate}.pdf`);
};

export const exportWorkersPDF = (workers: User[], settings?: AppSettings) => {
  const doc = new jsPDF();
  const currency = settings?.currency || '₹';

  // Title Header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 24, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('BRINTHA BUILDERS - WORKERS MASTER DIRECTORY', 14, 15);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Registered Workers: ${workers.length}`, 14, 32);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 130, 32);

  const tableData: (string | number)[][] = [];

  workers.forEach((w, index) => {
    tableData.push([
      index + 1,
      w.name,
      w.trade || 'Helper',
      w.phone,
      `${currency}${w.dailyRate || 0}`
    ]);
  });

  autoTable(doc, {
    startY: 40,
    head: [['#', 'Worker Name', 'Trade / Specialty', 'Phone Number', 'Daily Rate']],
    body: tableData,
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  doc.save(`Workers_Master_Directory.pdf`);
};

export const exportWorkerPayslipPDF = (
  worker: User,
  payroll: WorkerCalculatedPayroll,
  settings?: AppSettings
) => {
  const doc = new jsPDF();
  const currency = settings?.currency || '₹';

  // Header Box
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BRINTHA BUILDERS', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL WORKER SALARY PAYSLIP', 14, 23);

  // Worker Info Block
  doc.setLineWidth(0.5);
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 36, 182, 38, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Worker Name: ${worker.name}`, 20, 48);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Trade: ${worker.trade || 'Helper'}`, 20, 56);
  doc.text(`Phone: ${worker.phone}`, 20, 64);

  doc.text(`Daily Rate: ${currency}${worker.dailyRate || 0}`, 120, 48);
  doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, 120, 56);

  // Earnings & Deductions Table
  autoTable(doc, {
    startY: 80,
    head: [['Description', 'Days / Count', 'Amount']],
    body: [
      ['Days Worked (Present + Half Days)', `${payroll.daysWorked} Days`, `${currency}${payroll.grossSalary}`],
      ['Active Advance Deductions', '-', `-${currency}${payroll.totalAdvances}`],
      ['NET PAYABLE SALARY', '-', `${currency}${payroll.netSalary}`],
      ['Total Amount Paid', '-', `${currency}${payroll.totalPaid}`],
      ['Remaining Balance Due', '-', `${currency}${payroll.pendingBalance}`],
    ],
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
  });

  // Stamp / Sign line
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Payment Status: ' + (payroll.isCleared ? 'CLEARED & PAID' : 'PENDING APPROVAL'), 14, finalY + 15);

  doc.line(130, finalY + 30, 190, finalY + 30);
  doc.text('Authorized Site Supervisor Signature', 130, finalY + 36);

  doc.save(`Payslip_${worker.name.replace(/\s+/g, '_')}.pdf`);
};
