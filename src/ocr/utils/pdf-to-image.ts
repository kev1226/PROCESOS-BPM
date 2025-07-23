import { execSync } from 'child_process';
import * as path from 'path';

export async function extraerDatosDesdePDF(pdfPath: string): Promise<string> {
  const rutaAbsoluta = path.resolve(pdfPath);

  try {
    const buffer = execSync(`python ocr_pdf.py "${rutaAbsoluta}"`, {
      encoding: 'utf-8',
    });

    return buffer.trim(); // Retorna el texto plano limpio
  } catch (err: any) {
    console.error('❌ Error ejecutando ocr_pdf.py:', err.message);
    throw new Error('OCR Python falló');
  }
}
