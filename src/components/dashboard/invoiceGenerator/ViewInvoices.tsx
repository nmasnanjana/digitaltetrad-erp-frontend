import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  TextField,
  InputAdornment,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import { getAllInvoices, deleteInvoice, InvoiceRecord } from '@/api/huaweiInvoiceApi';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const ViewInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceRecord[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<InvoiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAllInvoices();
  }, []);

  useEffect(() => {
    // Filter invoices based on search term
    const filtered = invoices.filter(invoice => {
      const searchLower = searchTerm.toLowerCase();
      return (
        invoice.invoice_no.toLowerCase().includes(searchLower) ||
        invoice.huaweiPo?.po_no?.toLowerCase().includes(searchLower) ||
        invoice.huaweiPo?.item_code?.toLowerCase().includes(searchLower) ||
        invoice.huaweiPo?.item_description?.toLowerCase().includes(searchLower) ||
        invoice.huaweiPo?.job?.name?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredInvoices(filtered);
  }, [invoices, searchTerm]);

  const loadAllInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await getAllInvoices();
      console.log('All invoices response:', response);
      console.log('First invoice structure:', response[0]);
      console.log('First invoice huaweiPo:', response[0]?.huaweiPo);
      console.log('First invoice job:', response[0]?.huaweiPo?.job);
      console.log('First invoice customer:', response[0]?.huaweiPo?.job?.customer);
      setInvoices(response);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInvoice = async (invoiceNo: string) => {
    try {
      const details = invoices.filter(invoice => invoice.invoice_no === invoiceNo);
      setSelectedInvoiceDetails(details);
      setViewDialogOpen(true);
    } catch (err) {
      console.error('Error loading invoice details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoice details');
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this invoice? This will also reduce the invoiced percentages from the PO records.')) {
      return;
    }

    try {
      await deleteInvoice(id);
      setSuccess('Invoice deleted successfully');
      await loadAllInvoices();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete invoice');
    }
  };

  const handleDownloadPDF = async () => {
    if (selectedInvoiceDetails.length === 0) return;

    setIsDownloadingPDF(true);
    setError(null);

    try {
      const doc = new jsPDF();
      const invoiceNo = selectedInvoiceDetails[0].invoice_no;
      const createdDate = new Date(selectedInvoiceDetails[0].createdAt).toLocaleDateString();
      
      // Calculate total amount
      const totalAmount = selectedInvoiceDetails.reduce((sum, item) => {
        const unitPriceStr = item.huaweiPo?.unit_price;
        const unitPrice = typeof unitPriceStr === 'string' ? parseFloat(unitPriceStr) : 
                         typeof unitPriceStr === 'number' ? unitPriceStr : 0;
        const percentage = item.invoiced_percentage;
        const itemAmount = unitPrice * percentage / 100;
        return sum + itemAmount;
      }, 0);

      // Header
      doc.setFontSize(20);
      doc.setTextColor(33, 150, 243);
      doc.text('INVOICE DETAILS', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Invoice Number: ${invoiceNo}`, 20, 40);
      doc.text(`Date: ${createdDate}`, 20, 50);
      doc.text(`Total Records: ${selectedInvoiceDetails.length}`, 20, 60);
      doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 20, 70);

      // Table data
      const tableData = selectedInvoiceDetails.map((item) => {
        const unitPriceStr = item.huaweiPo?.unit_price;
        const unitPrice = typeof unitPriceStr === 'string' ? parseFloat(unitPriceStr) : 
                         typeof unitPriceStr === 'number' ? unitPriceStr : 0;
        const qtyStr = item.huaweiPo?.requested_quantity;
        const requestedQty = typeof qtyStr === 'string' ? parseFloat(qtyStr) : 
                            typeof qtyStr === 'number' ? qtyStr : 0;
        const amount = unitPrice * item.invoiced_percentage / 100;
        
        return [
          item.huaweiPo?.po_no || '',
          item.huaweiPo?.line_no || '',
          item.huaweiPo?.item_code || '',
          item.huaweiPo?.item_description || '',
          `$${unitPrice.toFixed(2)}`,
          requestedQty.toFixed(0),
          `${item.invoiced_percentage}%`,
          `$${amount.toFixed(2)}`
        ];
      });

      // Create table
      (doc as any).autoTable({
        startY: 85,
        head: [['PO NO.', 'Line NO.', 'Item Code', 'Item Description', 'Unit Price', 'Requested Qty', 'Invoiced %', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [33, 150, 243],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 15 },
          2: { cellWidth: 20 },
          3: { cellWidth: 40 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 },
          7: { cellWidth: 20 }
        },
        styles: {
          overflow: 'linebreak',
          cellPadding: 3
        }
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by ERP System', 105, finalY, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, finalY + 10, { align: 'center' });

      // Download the PDF
      doc.save(`Invoice_${invoiceNo}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setSuccess('PDF downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Group invoices by invoice number
  const groupedInvoices = filteredInvoices.reduce((groups, invoice) => {
    const invoiceNo = invoice.invoice_no;
    if (!groups[invoiceNo]) {
      groups[invoiceNo] = [];
    }
    groups[invoiceNo].push(invoice);
    return groups;
  }, {} as Record<string, InvoiceRecord[]>);

  // Calculate summaries for each invoice group
  const invoiceSummaries = Object.entries(groupedInvoices).map(([invoiceNo, invoices]) => {
    const totalAmount = invoices.reduce((sum, invoice) => {
      const unitPriceStr = invoice.huaweiPo?.unit_price;
      const unitPrice = typeof unitPriceStr === 'string' ? parseFloat(unitPriceStr) : 
                       typeof unitPriceStr === 'number' ? unitPriceStr : 0;
      const amount = unitPrice * invoice.invoiced_percentage / 100;
      return sum + amount;
    }, 0);

    return {
      invoice_no: invoiceNo,
      total_records: invoices.length,
      total_amount: totalAmount,
      created_at: invoices[0].createdAt,
      customer_name: invoices[0].huaweiPo?.job?.customer?.name || 'Unknown',
      job_name: invoices[0].huaweiPo?.job?.name || 'Unknown'
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Invoices
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            View and manage all invoices across all customers
          </Typography>
          
          {/* Search Bar */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by invoice number, PO number, item code, description, or job name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Card sx={{ mt: 2, bgcolor: 'error.light' }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card sx={{ mt: 2, bgcolor: 'success.light' }}>
          <CardContent>
            <Typography color="success.main">{success}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Invoices List */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Invoice Summary ({invoiceSummaries.length} invoices)
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice Number</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Job</TableCell>
                  <TableCell>Total Records</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceSummaries.map((summary) => (
                  <TableRow key={summary.invoice_no}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {summary.invoice_no}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {summary.customer_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {summary.job_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={summary.total_records} color="primary" size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        ${summary.total_amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(summary.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleViewInvoice(summary.invoice_no)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => {
                            const firstInvoice = groupedInvoices[summary.invoice_no][0];
                            handleDeleteInvoice(firstInvoice.id);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* View Invoice Details Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Invoice Details
            {selectedInvoiceDetails.length > 0 && (
              <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>
                {selectedInvoiceDetails[0].invoice_no}
              </Typography>
            )}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedInvoiceDetails.length > 0 ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Invoice Number
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedInvoiceDetails[0].invoice_no}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Records
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoiceDetails.length}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    ${(() => {
                      const total = selectedInvoiceDetails.reduce((sum, item) => {
                        const unitPriceStr = item.huaweiPo?.unit_price;
                        const unitPrice = typeof unitPriceStr === 'string' ? parseFloat(unitPriceStr) : 
                                         typeof unitPriceStr === 'number' ? unitPriceStr : 0;
                        const percentage = item.invoiced_percentage;
                        const itemAmount = unitPrice * percentage / 100;
                        return sum + itemAmount;
                      }, 0);
                      return total.toFixed(2);
                    })()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedInvoiceDetails[0].createdAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Invoice Items
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>PO NO.</TableCell>
                      <TableCell>Line NO.</TableCell>
                      <TableCell>Item Code</TableCell>
                      <TableCell>Item Description</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Requested Qty</TableCell>
                      <TableCell>Invoiced %</TableCell>
                      <TableCell>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoiceDetails.map((item) => {
                      const unitPriceStr = item.huaweiPo?.unit_price;
                      const unitPrice = typeof unitPriceStr === 'string' ? parseFloat(unitPriceStr) : 
                                       typeof unitPriceStr === 'number' ? unitPriceStr : 0;
                      
                      const qtyStr = item.huaweiPo?.requested_quantity;
                      const requestedQty = typeof qtyStr === 'string' ? parseFloat(qtyStr) : 
                                         typeof qtyStr === 'number' ? qtyStr : 0;
                      
                      const amount = unitPrice * item.invoiced_percentage / 100;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.huaweiPo?.po_no}</TableCell>
                          <TableCell>{item.huaweiPo?.line_no}</TableCell>
                          <TableCell>{item.huaweiPo?.item_code}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                              {item.huaweiPo?.item_description}
                            </Typography>
                          </TableCell>
                          <TableCell>${unitPrice.toFixed(2)}</TableCell>
                          <TableCell>{requestedQty.toFixed(0)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`${item.invoiced_percentage}%`} 
                              color="primary" 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              ${amount.toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Loading invoice details...
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
          {selectedInvoiceDetails.length > 0 && (
            <Button onClick={handleDownloadPDF} startIcon={<DownloadIcon />} disabled={isDownloadingPDF}>
              {isDownloadingPDF ? 'Downloading...' : 'Download PDF'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 