import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { formatCurrency } from './formatUtils.js';

export function exportExcel(residents, payments, expenses, initialCash, totalCash) {
  const wb = XLSX.utils.book_new();
  const wsResidents = XLSX.utils.json_to_sheet(residents);
  const wsPayments = XLSX.utils.json_to_sheet(payments);
  const wsExpenses = XLSX.utils.json_to_sheet(expenses);
  const summary = [{
    initialCash,
    totalPayments: payments.reduce((s, p) => s + Number(p.amount || 0), 0),
    totalExpenses: expenses.reduce((s, e) => s + Number(e.amount || 0), 0),
    currentCash: totalCash()
  }];
  const wsSummary = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, wsResidents, 'Residents');
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments');
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `rt-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportPDF(residents, payments, expenses, initialCash, totalCash) {
  const doc = new jsPDF();
  doc.setFontSize(12);
  doc.text('Laporan RT Keuangan', 10, 10);
  doc.text(`Tanggal: ${new Date().toLocaleDateString()}`, 10, 18);
  doc.text(`Kas Awal: Rp ${formatCurrency(initialCash)}`, 10, 26);
  doc.text(`Total Iuran & Donasi: Rp ${formatCurrency(payments.reduce((s, p) => s + Number(p.amount || 0), 0))}`, 10, 34);
  doc.text(`Total Pengeluaran: Rp ${formatCurrency(expenses.reduce((s, e) => s + Number(e.amount || 0), 0))}`, 10, 42);
  doc.text(`Saldo Saat Ini: Rp ${formatCurrency(totalCash())}`, 10, 50);

  let y = 60;
  doc.setFontSize(10);
  doc.text('Pembayaran:', 10, y);
  y += 6;
  payments.slice(-30).reverse().forEach(p => {
    const r = residents.find(r => r.id === p.residentId);
    const line = `${p.date} | ${r?.name || '-'} | ${p.type} | Rp ${formatCurrency(p.amount)} | ${p.note || ''}`;
    if (y > 270) { doc.addPage(); y = 10; }
    doc.text(line, 10, y);
    y += 6;
  });

  doc.save(`rt-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
