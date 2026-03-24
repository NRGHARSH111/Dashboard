import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToCSV = (data, filename) => {
  const csvHeaders = ['Timestamp', 'Type', 'RRN', 'From Bank', 'To Bank', 'Amount', 'Status', 'Latency'];
  const csvRows = data.map(tx => [
    tx.timestamp,
    tx.type,
    tx.rrn,
    tx.fromBank,
    tx.toBank,
    tx.amount,
    tx.status,
    tx.latency
  ]);
  
  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (data, filename) => {
  const ws = XLSX.utils.json_to_sheet(data.map(tx => ({
    'Timestamp': tx.timestamp,
    'Type': tx.type,
    'RRN': tx.rrn,
    'From Bank': tx.fromBank,
    'To Bank': tx.toBank,
    'Amount': tx.amount,
    'Status': tx.status,
    'Latency (ms)': tx.latency
  })));
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (data, filename) => {
  const doc = new jsPDF();
  
  const tableColumn = ['Timestamp', 'Type', 'RRN', 'From', 'To', 'Amount', 'Status', 'Latency'];
  const tableRows = data.map(tx => [
    new Date(tx.timestamp).toLocaleString(),
    tx.type,
    tx.rrn,
    `${tx.fromBank} (${tx.fromAccount.substring(0, 4)}****)`,
    `${tx.toBank} (${tx.toAccount.substring(0, 4)}****)`,
    `₹${parseFloat(tx.amount).toLocaleString('en-IN')}`,
    tx.status,
    `${tx.latency}ms`
  ]);
  
  doc.text('TFL Transaction Report', 14, 15);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
  
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [0, 31, 63],
      textColor: 255
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });
  
  doc.save(`${filename}.pdf`);
};

export const exportKPIData = (kpiData, filename) => {
  const kpiReport = {
    'Total Transactions Today': kpiData.totalTxnToday.value.toLocaleString(),
    'Success Rate': `${kpiData.successRate.value}%`,
    'Average Latency': `${kpiData.avgLatency.value}ms`,
    'Pending Transactions': `${kpiData.pendingTxns.value}%`,
    'NPCI Status': kpiData.npciStatus.value,
    'Generated At': new Date().toLocaleString()
  };
  
  const ws = XLSX.utils.json_to_sheet([kpiReport]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'KPI Summary');
  
  XLSX.writeFile(wb, `${filename}_kpi.xlsx`);
};
