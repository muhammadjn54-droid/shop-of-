import ExcelJS from 'exceljs';
import type { Sale, SalesSummary } from '../types';
import type { Language, TranslationKey } from '../i18n/translations';

export const exportSalesToExcel = async (
  sales: Sale[],
  summary: SalesSummary | null,
  lang: Language,
  _t: (key: TranslationKey) => string
): Promise<void> => {
  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toLocaleTimeString('ru-RU');

  const title =
    lang === 'tg'
      ? 'ГУЗОРИШИ ФУРӮШ ВА ФОИДА (EXCEL CRM)'
      : lang === 'en'
      ? 'SALES AND PROFIT REPORT (EXCEL CRM)'
      : 'ОТЧЁТ ПО ПРОДАЖАМ И ПРИБЫЛИ (EXCEL CRM)';

  const genAt =
    lang === 'tg'
      ? `Санаи таҳия: ${dateStr} ${timeStr}`
      : lang === 'en'
      ? `Generated on: ${dateStr} ${timeStr}`
      : `Дата формирования: ${dateStr} ${timeStr}`;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Shop Excel CRM';
  workbook.lastModifiedBy = 'Shop Excel CRM';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheetName =
    lang === 'tg' ? 'Фурӯш ва Фоида' : lang === 'en' ? 'Sales & Profit' : 'Продажи и Прибыль';
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  // Common styles
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };

  // 1. Title Banner (Rows 1-2)
  worksheet.mergeCells('A1:N1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF107C41' },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells('A2:N2');
  const subtitleCell = worksheet.getCell('A2');
  subtitleCell.value = genAt;
  subtitleCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF475569' } };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 18;

  // 2. Summary Block (Rows 4-10)
  worksheet.mergeCells('B4:D4');
  const sumTitle = worksheet.getCell('B4');
  sumTitle.value = lang === 'tg' ? 'ХУЛОСАИ МОЛИЯВӢ' : lang === 'en' ? 'FINANCIAL SUMMARY' : 'ФИНАНСОВЫЙ ИТОГ';
  sumTitle.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  sumTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  sumTitle.alignment = { vertical: 'middle', horizontal: 'left' };
  sumTitle.border = thinBorder;
  worksheet.getCell('C4').border = thinBorder;
  worksheet.getCell('D4').border = thinBorder;

  const summaryRows = [
    {
      label: lang === 'tg' ? 'Даромади умумӣ (Выручка)' : lang === 'en' ? 'Total Revenue' : 'Общая выручка',
      val: Number(summary?.total_revenue ?? 0),
      unit: 'сомони',
      numFmt: '#,##0.00',
      color: 'FF0369A1',
    },
    {
      label: lang === 'tg' ? 'Арзиши аслии молҳо (Себестоимость)' : lang === 'en' ? 'Total Cost' : 'Общая себестоимость',
      val: Number(summary?.total_cost ?? 0),
      unit: 'сомони',
      numFmt: '#,##0.00',
      color: 'FF475569',
    },
    {
      label: lang === 'tg' ? 'Фоидаи умумӣ (Чистая прибыль)' : lang === 'en' ? 'Total Profit' : 'Итоговая чистая прибыль',
      val: Number(summary?.total_profit ?? 0),
      unit: 'сомони',
      numFmt: '#,##0.00',
      color: 'FF15803D',
      bold: true,
    },
    {
      label: lang === 'tg' ? 'Зарари умумӣ (Общий убыток)' : lang === 'en' ? 'Total Loss' : 'Общий убыток',
      val: Number(summary?.total_loss ?? 0),
      unit: 'сомони',
      numFmt: '#,##0.00',
      color: 'FFB91C1C',
    },
    {
      label: lang === 'tg' ? 'Ҳамагӣ фурӯхта шуд' : lang === 'en' ? 'Total Items Sold' : 'Всего продано товаров',
      val: Number(summary?.total_quantity ?? 0),
      unit: lang === 'tg' ? 'дона' : lang === 'en' ? 'pcs' : 'шт',
      numFmt: '#,##0',
      color: 'FF1E293B',
    },
    {
      label: lang === 'tg' ? 'Ҳамагӣ бозгардонида шуд' : lang === 'en' ? 'Total Returned' : 'Всего возвращено',
      val: Number(summary?.total_returned ?? 0),
      unit: lang === 'tg' ? 'дона' : lang === 'en' ? 'pcs' : 'шт',
      numFmt: '#,##0',
      color: 'FFB45309',
    },
  ];

  summaryRows.forEach((item, idx) => {
    const rowNum = 5 + idx;
    const cellA = worksheet.getCell(`B${rowNum}`);
    const cellB = worksheet.getCell(`C${rowNum}`);
    const cellC = worksheet.getCell(`D${rowNum}`);

    cellA.value = item.label;
    cellA.font = { name: 'Arial', size: 9, bold: !!item.bold, color: { argb: 'FF334155' } };
    cellA.border = thinBorder;

    cellB.value = item.val;
    cellB.numFmt = item.numFmt;
    cellB.font = { name: 'Arial', size: 9, bold: !!item.bold, color: { argb: item.color } };
    cellB.alignment = { horizontal: 'right' };
    cellB.border = thinBorder;

    cellC.value = item.unit;
    cellC.font = { name: 'Arial', size: 9, color: { argb: 'FF64748B' } };
    cellC.border = thinBorder;
  });

  // 3. Table Column Headers (Row 12)
  const headerRowIndex = 12;
  const headers = [
    { header: '№', key: 'idx', width: 6, align: 'center' },
    { header: 'ID', key: 'id', width: 8, align: 'center' },
    { header: lang === 'tg' ? 'Номи мол' : lang === 'en' ? 'Product' : 'Наименование товара', key: 'name', width: 28, align: 'left' },
    { header: lang === 'tg' ? 'Штрихкод' : lang === 'en' ? 'Barcode' : 'Штрихкод', key: 'barcode', width: 18, align: 'center' },
    { header: lang === 'tg' ? 'Фурӯхта шуд (дона)' : lang === 'en' ? 'Sold (pcs)' : 'Продано (шт)', key: 'quantity', width: 14, align: 'right' },
    { header: lang === 'tg' ? 'Бозгашт (дона)' : lang === 'en' ? 'Returned (pcs)' : 'Возврат (шт)', key: 'returned', width: 14, align: 'right' },
    { header: lang === 'tg' ? 'Холис (дона)' : lang === 'en' ? 'Net Sold (pcs)' : 'Чисто продано (шт)', key: 'net_qty', width: 15, align: 'right' },
    { header: lang === 'tg' ? 'Нархи фурӯш' : lang === 'en' ? 'Selling Price' : 'Цена продажи (сомони)', key: 's_price', width: 18, align: 'right' },
    { header: lang === 'tg' ? 'Нархи харид' : lang === 'en' ? 'Purchase Price' : 'Цена закупки (сомони)', key: 'p_price', width: 18, align: 'right' },
    { header: lang === 'tg' ? 'Маблағи умумӣ' : lang === 'en' ? 'Revenue' : 'Сумма выручки (сомони)', key: 'revenue', width: 19, align: 'right' },
    { header: lang === 'tg' ? 'Арзиши аслӣ' : lang === 'en' ? 'Cost' : 'Себестоимость (сомони)', key: 'cost', width: 18, align: 'right' },
    { header: lang === 'tg' ? 'Фоида' : lang === 'en' ? 'Profit' : 'Чистая прибыль (сомони)', key: 'profit', width: 19, align: 'right' },
    { header: lang === 'tg' ? 'Зарар' : lang === 'en' ? 'Loss' : 'Убыток (сомони)', key: 'loss', width: 14, align: 'right' },
    { header: lang === 'tg' ? 'Санаи фурӯш' : lang === 'en' ? 'Date Sold' : 'Дата и время продажи', key: 'date', width: 22, align: 'center' },
  ];

  const headerRow = worksheet.getRow(headerRowIndex);
  headerRow.height = 26;

  headers.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF107C41' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: col.align as ExcelJS.Alignment['horizontal'],
      wrapText: true,
    };
    cell.border = thinBorder;
  });

  // 4. Data Rows
  sales.forEach((s, idx) => {
    const rowNum = headerRowIndex + 1 + idx;
    const row = worksheet.getRow(rowNum);
    row.height = 20;

    const isEven = idx % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    // №
    const c1 = row.getCell(1);
    c1.value = idx + 1;
    c1.alignment = { vertical: 'middle', horizontal: 'center' };

    // ID
    const c2 = row.getCell(2);
    c2.value = s.id;
    c2.alignment = { vertical: 'middle', horizontal: 'center' };
    c2.font = { name: 'Consolas', size: 9, color: { argb: 'FF64748B' } };

    // Name
    const c3 = row.getCell(3);
    c3.value = s.product_name;
    c3.alignment = { vertical: 'middle', horizontal: 'left' };
    c3.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1E293B' } };

    // Barcode: explicitly text format '@' so leading zeros like '0000123456789' are never lost!
    const c4 = row.getCell(4);
    c4.value = String(s.barcode || '—');
    c4.numFmt = '@';
    c4.alignment = { vertical: 'middle', horizontal: 'center' };
    c4.font = { name: 'Consolas', size: 9, color: { argb: 'FF475569' } };

    // Quantity
    const c5 = row.getCell(5);
    c5.value = Number(s.quantity || 0);
    c5.numFmt = '#,##0';
    c5.alignment = { vertical: 'middle', horizontal: 'right' };

    // Returned
    const c6 = row.getCell(6);
    c6.value = Number(s.returned_quantity || 0);
    c6.numFmt = '#,##0';
    c6.alignment = { vertical: 'middle', horizontal: 'right' };
    c6.font = { name: 'Arial', size: 9, color: { argb: Number(s.returned_quantity) > 0 ? 'FFB45309' : 'FF94A3B8' } };

    // Net Quantity
    const c7 = row.getCell(7);
    c7.value = Number(s.net_quantity ?? s.quantity);
    c7.numFmt = '#,##0';
    c7.alignment = { vertical: 'middle', horizontal: 'right' };
    c7.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF107C41' } };

    // Selling Price
    const c8 = row.getCell(8);
    c8.value = parseFloat(String(s.price_per_item || 0)) || 0;
    c8.numFmt = '#,##0.00';
    c8.alignment = { vertical: 'middle', horizontal: 'right' };

    // Purchase Price
    const c9 = row.getCell(9);
    c9.value = parseFloat(String(s.purchase_price_per_item || 0)) || 0;
    c9.numFmt = '#,##0.00';
    c9.alignment = { vertical: 'middle', horizontal: 'right' };
    c9.font = { name: 'Arial', size: 9, color: { argb: 'FF64748B' } };

    // Revenue
    const c10 = row.getCell(10);
    c10.value = parseFloat(String(s.total_amount || 0)) || 0;
    c10.numFmt = '#,##0.00';
    c10.alignment = { vertical: 'middle', horizontal: 'right' };
    c10.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF0369A1' } };

    // Cost
    const c11 = row.getCell(11);
    c11.value = parseFloat(String(s.cost_amount || 0)) || 0;
    c11.numFmt = '#,##0.00';
    c11.alignment = { vertical: 'middle', horizontal: 'right' };
    c11.font = { name: 'Arial', size: 9, color: { argb: 'FF64748B' } };

    // Profit
    const c12 = row.getCell(12);
    c12.value = parseFloat(String(s.profit || 0)) || 0;
    c12.numFmt = '#,##0.00';
    c12.alignment = { vertical: 'middle', horizontal: 'right' };
    c12.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF15803D' } };

    // Loss
    const c13 = row.getCell(13);
    const lossVal = parseFloat(String(s.loss || 0)) || 0;
    c13.value = lossVal;
    c13.numFmt = '#,##0.00';
    c13.alignment = { vertical: 'middle', horizontal: 'right' };
    c13.font = { name: 'Arial', size: 9, color: { argb: lossVal > 0 ? 'FFB91C1C' : 'FF94A3B8' } };

    // Date
    const c14 = row.getCell(14);
    c14.value = s.sold_at ? new Date(s.sold_at).toLocaleString('ru-RU') : '—';
    c14.alignment = { vertical: 'middle', horizontal: 'center' };
    c14.font = { name: 'Arial', size: 9, color: { argb: 'FF475569' } };

    // Apply borders and zebra fill to all 14 cells
    for (let c = 1; c <= 14; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb },
      };
    }
  });

  // 5. Freeze Header Pane
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: headerRowIndex }];

  // 6. AutoFilter
  worksheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: headers.length },
  };

  // 7. Column Widths
  headers.forEach((col, idx) => {
    const colNumber = idx + 1;
    let maxLen = col.header.length;
    sales.forEach((s) => {
      let valStr = '';
      if (col.key === 'name') valStr = s.product_name || '';
      else if (col.key === 'barcode') valStr = s.barcode || '';
      else if (col.key === 'date') valStr = s.sold_at || '';
      else if (col.key === 'revenue') valStr = String(s.total_amount || '');
      if (valStr.length > maxLen) maxLen = valStr.length;
    });
    worksheet.getColumn(colNumber).width = Math.max(col.width, Math.min(45, maxLen + 3));
  });

  // 8. Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sales_report_${dateStr}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default exportSalesToExcel;
