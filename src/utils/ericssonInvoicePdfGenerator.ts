import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface EricssonBoqItemData {
  id: number;
  boq_id: number;
  service_number: string;
  item_description: string;
  uom: string;
  qty: number;
  unit_price: number;
  total_amount: number;
  is_additional_work: boolean;
  invoiced_percentage?: number;
  need_to_invoice_percentage?: number;
}

interface EricssonBoqRemoveMaterialData {
  id: number;
  boq_id: number;
  sl_no: string;
  material_description: string;
  qty: string;
  remarks?: string;
}

interface EricssonBoqSurplusMaterialData {
  id: number;
  boq_id: number;
  sl_no: string;
  material_description: string;
  qty: string;
  remarks?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  jobId: string;
  jobTitle: string;
  customerName: string;
  customerAddress: string;
  project: string;
  siteId: string;
  siteName: string;
  purchaseOrderNumber: string;
  items: EricssonBoqItemData[];
  removeMaterials: EricssonBoqRemoveMaterialData[];
  surplusMaterials: EricssonBoqSurplusMaterialData[];
  subtotal: number;
  vatAmount: number;
  sslAmount: number;
  totalAmount: number;
}

export const generateEricssonInvoicePDF = async (invoiceData: InvoiceData): Promise<void> => {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 105, 20, { align: 'center' });
  
  // Invoice details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice Number: ${invoiceData.invoiceNumber}`, 20, 40);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
  doc.text(`Job ID: ${invoiceData.jobId}`, 20, 60);
  doc.text(`Job Name: ${invoiceData.jobTitle}`, 20, 70);
  
  // Customer information
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Information:', 20, 90);
  doc.setFont('helvetica', 'normal');
  doc.text(`Customer: ${invoiceData.customerName}`, 20, 100);
  doc.text(`Address: ${invoiceData.customerAddress}`, 20, 110);
  doc.text(`Project: ${invoiceData.project}`, 20, 120);
  doc.text(`Site ID: ${invoiceData.siteId}`, 20, 130);
  doc.text(`Site Name: ${invoiceData.siteName}`, 20, 140);
  doc.text(`Purchase Order: ${invoiceData.purchaseOrderNumber}`, 20, 150);
  
  let yPosition = 160;
  
  // BOQ Items table
  if (invoiceData.items && invoiceData.items.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('BOQ Items:', 20, yPosition);
    yPosition += 10;
    
    const itemsTableData = invoiceData.items
      .filter(item => (item.need_to_invoice_percentage || 0) > 0)
      .map(item => [
        item.service_number,
        item.item_description,
        item.uom,
        item.qty,
        `${item.need_to_invoice_percentage || 0}%`,
        `$${item.unit_price.toFixed(2)}`,
        `$${((item.total_amount || 0) * (item.need_to_invoice_percentage || 0) / 100).toFixed(2)}`,
        item.is_additional_work ? 'Additional Work' : 'Regular'
      ]);
    
    (doc as any).autoTable({
      startY: yPosition,
      head: [['Service Number', 'Item Description', 'UOM', 'Qty', 'Invoice %', 'Unit Price', 'Invoice Amount', 'Type']],
      body: itemsTableData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 45 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 20 },
        6: { cellWidth: 25 },
        7: { cellWidth: 25 }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }
  

  
  // Summary section
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Summary:', 20, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal: $${invoiceData.subtotal.toFixed(2)}`, 120, yPosition);
  yPosition += 10;
  doc.text(`VAT: $${invoiceData.vatAmount.toFixed(2)}`, 120, yPosition);
  yPosition += 10;
  doc.text(`SSL: $${invoiceData.sslAmount.toFixed(2)}`, 120, yPosition);
  yPosition += 10;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Amount: $${invoiceData.totalAmount.toFixed(2)}`, 120, yPosition);
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Thank you for your business!', 105, pageHeight - 20, { align: 'center' });
  
  // Save the PDF
  doc.save(`Ericsson_Invoice_${invoiceData.invoiceNumber}_${invoiceData.jobId}.pdf`);
}; 