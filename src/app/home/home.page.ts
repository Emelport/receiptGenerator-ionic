import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  receiptForm: FormGroup;
  addItemForm: FormGroup;
  isModalOpen = false;

  constructor(private fb: FormBuilder) {
    this.receiptForm = this.fb.group({
      from: ['', [Validators.required]],
      concept: ['', [Validators.required]],
      items: this.fb.array([]),
      comments: [''],
      receivedBy: ['Teresita Portillo', [Validators.required]],
      phone: ['6682311921', [Validators.required]],
      date: ['', [Validators.required]],
    });

    this.addItemForm = this.fb.group({
      description: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    });
  }

  get items(): FormArray {
    return this.receiptForm.get('items') as FormArray;
  }

  calculateTotal(): number {
    return this.items.controls.reduce((total, item) => {
      const amount = item.get('amount')?.value || 0;
      return total + parseFloat(amount);
    }, 0);
  }

  openAddItemModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveItem() {
    if (this.addItemForm.valid) {
      const item = this.fb.group({
        description: this.addItemForm.value.description,
        amount: this.addItemForm.value.amount,
      });
      this.items.push(item);
      this.addItemForm.reset();
      this.closeModal();
    }
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  formatDate(date: string): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('es-MX', options);
  }

  onSubmit() {
    if (this.receiptForm.valid) {
      const receiptData = this.receiptForm.value;
  
      // Crear documento con tamaño personalizado (A5, mitad del tamaño horizontal de A4)
      const doc = new jsPDF('landscape', 'mm', [210, 148]); // A5 en formato horizontal
  
      // Encabezado del recibo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('RECIBO DE PAGO', 105, 10, { align: 'center' }); // Ajustar posición hacia arriba
  
      // Línea divisoria
      doc.setDrawColor(0);
      doc.line(10, 15, 200, 15); // Ajustar línea a la parte superior
  
      // Información del recibo
      autoTable(doc, {
        head: [['Detalle', 'Información']],
        body: [
          ['Recibí de:', receiptData.from],
          ['Fecha:', this.formatDate(receiptData.date)],
          ['Concepto:', receiptData.concept],
          ['Comentarios:', receiptData.comments || 'N/A'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] },
        bodyStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        startY: 20, // Ajustado para que empiece más cerca de la parte superior
      });
  
      // Lista de productos/servicios
      autoTable(doc, {
        head: [['Descripción del Producto/Servicio', 'Monto']],
        body: receiptData.items.map((item: any) => [item.description, `$${item.amount}`]),
        theme: 'grid',
        headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] },
        bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
        startY: (doc as any).lastAutoTable.finalY + 5,
      });
  

      // Formato personalizado para mostrar el total con mayor tamaño y color verde
      const totalAmount = this.calculateTotal();
      doc.setFontSize(18); // Aumentar el tamaño de la fuente para que sea más grande
      doc.setTextColor(0, 128, 0); // Establecer el color a verde (RGB)
      
      // Total acumulado
      autoTable(doc, {
        body: [
          ['Total:', `$${totalAmount.toFixed(2)}`], // Formato de dinero con 2 decimales
        ],
        theme: 'plain',
        bodyStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
        startY: (doc as any).lastAutoTable.finalY + 5,
      });

      doc.setTextColor(0, 0, 0); // Establecer el color a verde (RGB)


      // Agregar la firma
      const signatureImage = 'assets/Firma.png';
  
      // Tamaño de la imagen para mantenerla proporcional
      const imageWidth = 60; // Ajustar el ancho
      const imageHeight = 25; // Ajustar la altura (mantener proporción)
  
      // Centrar la imagen y moverla más hacia abajo
      const centerX = (doc.internal.pageSize.width - imageWidth) / 2; // Centra la imagen
      const imageYPosition = doc.internal.pageSize.height - 60; // Baja más la firma
  
      // Añadir la imagen sin estirarla
      doc.addImage(signatureImage, 'PNG', centerX, imageYPosition, imageWidth, imageHeight); // Agregar imagen de la firma
  
      // Línea de la firma (posicionada un poco más abajo)
      doc.setDrawColor(0);
      doc.line(centerX, imageYPosition + imageHeight , centerX + imageWidth, imageYPosition + imageHeight ); // Baja la línea
  
      // Nombre de quien recibió (más abajo)
      doc.setFontSize(12);
      doc.text(`Recibido Por:`, 105, imageYPosition + imageHeight + 7, { align: 'center' }); // Baja el nombre
      doc.text(`${receiptData.receivedBy}`, 105, imageYPosition + imageHeight + 15, { align: 'center' }); // Baja el nombre
  
      // Guardar el PDF
      doc.save('recibo-pago.pdf');
    }
  }
  
  
}
