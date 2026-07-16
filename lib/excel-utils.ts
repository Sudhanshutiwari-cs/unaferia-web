// lib/excel-utils.ts
import ExcelJS from 'exceljs'

export function styleExcelHeader(worksheet: ExcelJS.Worksheet, columnsCount: number): void {
  const headerRow = worksheet.getRow(1)
  headerRow.font = { 
    bold: true, 
    size: 12,
    color: { argb: 'FF000000' }
  }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8E8E8' }
  }
  headerRow.alignment = { 
    vertical: 'middle', 
    horizontal: 'center',
    wrapText: true
  }
  headerRow.height = 25
  
  // Add borders to header
  for (let i = 1; i <= columnsCount; i++) {
    headerRow.getCell(i).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  }
}

export function styleCell(cell: ExcelJS.Cell, options: {
  bold?: boolean
  currency?: boolean
  border?: boolean
  center?: boolean
} = {}): void {
  if (options.bold) {
    cell.font = { bold: true }
  }
  if (options.currency) {
    cell.numFormat = '$#,##0.00'
  }
  if (options.center) {
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  }
  if (options.border) {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD4D4D4' } },
      left: { style: 'thin', color: { argb: 'FFD4D4D4' } },
      bottom: { style: 'thin', color: { argb: 'FFD4D4D4' } },
      right: { style: 'thin', color: { argb: 'FFD4D4D4' } }
    }
  }
}