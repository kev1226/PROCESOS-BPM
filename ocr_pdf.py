import fitz
import io
from PIL import Image
from google.cloud import vision
from google.oauth2 import service_account
import re
import sys
import json

SERVICE_ACCOUNT_FILE = "credentials.json"
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE
)
client = vision.ImageAnnotatorClient(credentials=credentials)


def ocr_pdf_pymupdf(path):
    pdf_file = fitz.open(path)
    full_text = ""

    for page_number in range(len(pdf_file)):
        page = pdf_file.load_page(page_number)
        pix = page.get_pixmap(dpi=300)
        image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        buf = io.BytesIO()
        image.save(buf, format="JPEG")
        vision_image = vision.Image(content=buf.getvalue())
        response = client.document_text_detection(image=vision_image)
        full_text += response.full_text_annotation.text + "\n"

    return full_text


# Solo devuelve el texto OCR del PDF
def extraerDatosDesdePDF(path):
    pdf_file = fitz.open(path)
    full_text = ""

    for page_number in range(len(pdf_file)):
        page = pdf_file.load_page(page_number)
        pix = page.get_pixmap(dpi=400)
        image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        buf = io.BytesIO()
        image.save(buf, format="JPEG")
        vision_image = vision.Image(content=buf.getvalue())
        response = client.document_text_detection(image=vision_image)
        full_text += response.full_text_annotation.text + "\n"

    return full_text

    factura = re.search(
        r"(?:Factura Número|Nº Autorización|No[.:]?)\D*(\d{3}-\d{3}-\d+)", texto
    )
    ruc = re.search(r"\b\d{13}\b", texto)
    fecha = re.search(r"Emisión[^\d]*(\d{2}/\d{2}/\d{4})", texto)
    if not fecha:
        fecha = re.search(r"Fecha[^\d]*(\d{2}/\d{2}/\d{4})", texto)
    valor_total = re.search(r"Valor Total[^\d]*(\d{1,3}(?:[.,]\d{2}))", texto)

    return {
        "numero_factura": factura.group(1) if factura else "",
        "ruc": ruc.group(0) if ruc else "",
        "fecha_emision": fecha.group(1) if fecha else "",
        "valor_total": valor_total.group(1).replace(",", ".") if valor_total else "",
        "texto_completo": texto[:300],
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: ocr_pdf.py path_to_pdf", file=sys.stderr)
        sys.exit(1)

    path = sys.argv[1]
    texto = ocr_pdf_pymupdf(path)

    print(texto)  # 👈 Devuelve resultado como JSON para NestJS
