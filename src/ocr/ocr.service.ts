import { Injectable } from '@nestjs/common';
import { detectOCR } from './utils/ocr-utils';

@Injectable()
export class OcrService {
  async procesarOCRDesdeArchivo(rutaArchivo: string) {
    return await detectOCR(rutaArchivo);
  }
}
