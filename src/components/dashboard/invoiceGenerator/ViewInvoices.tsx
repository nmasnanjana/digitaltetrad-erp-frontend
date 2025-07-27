"use client";

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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  OutlinedInput,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { getAllInvoices, deleteInvoice, InvoiceRecord } from '@/api/huaweiInvoiceApi';
import { getSettings } from '@/api/settingsApi';
import { useSettings } from '@/contexts/SettingsContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface FilterState {
  customer: string;
  minAmount: string;
  maxAmount: string;
  fromDate: string;
  toDate: string;
}

export const ViewInvoices: React.FC = () => {
  const { formatCurrency, currencySymbol } = useSettings();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceRecord[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<InvoiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [filters, setFilters] = useState<FilterState>({
    customer: '',
    minAmount: '',
    maxAmount: '',
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    loadAllInvoices();
    loadSettings();
  }, []);

  useEffect(() => {
    // Apply both search and filters
    let filtered = invoices;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => {
        const searchLower = searchTerm.toLowerCase();
        return (
          invoice.invoice_no.toLowerCase().includes(searchLower) ||
          invoice.huaweiPo?.po_no?.toLowerCase().includes(searchLower) ||
          invoice.huaweiPo?.item_code?.toLowerCase().includes(searchLower) ||
          invoice.huaweiPo?.item_description?.toLowerCase().includes(searchLower) ||
          invoice.huaweiPo?.job?.name?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Apply customer filter
    if (filters.customer) {
      filtered = filtered.filter(invoice => 
        invoice.huaweiPo?.job?.customer?.name === filters.customer
      );
    }
    
    // Apply amount filters
    if (filters.minAmount || filters.maxAmount) {
      filtered = filtered.filter(invoice => {
        const totalAmount = typeof invoice.total_amount === 'string' ? parseFloat(invoice.total_amount) : 
                           typeof invoice.total_amount === 'number' ? invoice.total_amount : 0;
        
        const minAmount = filters.minAmount ? parseFloat(filters.minAmount) : 0;
        const maxAmount = filters.maxAmount ? parseFloat(filters.maxAmount) : Infinity;
        
        return totalAmount >= minAmount && totalAmount <= maxAmount;
      });
    }
    
    // Apply date filters
    if (filters.fromDate || filters.toDate) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt);
        const fromDate = filters.fromDate ? new Date(filters.fromDate) : new Date(0);
        const toDate = filters.toDate ? new Date(filters.toDate) : new Date();
        
        return invoiceDate >= fromDate && invoiceDate <= toDate;
      });
    }
    
    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, filters]);

  // Get unique customers for filter dropdown
  const uniqueCustomers = Array.from(new Set(
    invoices
      .map(invoice => invoice.huaweiPo?.job?.customer?.name)
      .filter(Boolean)
  )).sort();

  const clearSearch = () => {
    setSearchTerm('');
  };

  const clearFilters = () => {
    setFilters({
      customer: '',
      minAmount: '',
      maxAmount: '',
      fromDate: '',
      toDate: ''
    });
  };

  const clearAll = () => {
    clearSearch();
    clearFilters();
  };

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

  const loadSettings = async () => {
    try {
      const response = await getSettings();
      setSettings(response);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
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
      console.log('Starting PDF generation...');
      const doc = new jsPDF();
      
      const invoiceNo = selectedInvoiceDetails[0].invoice_no;
      const createdDate = new Date(selectedInvoiceDetails[0].createdAt).toLocaleDateString();
      const vatPercentage = selectedInvoiceDetails[0].vat_percentage;
      const customerName = selectedInvoiceDetails[0].huaweiPo?.job?.customer?.name || 'Customer';
      const customerAddress = (selectedInvoiceDetails[0].huaweiPo?.job?.customer as any)?.address || 'Address not available';
      const jobName = selectedInvoiceDetails[0].huaweiPo?.job?.name || 'Job';
      const jobType = (selectedInvoiceDetails[0].huaweiPo?.job as any)?.type || 'Service';
      
      // Calculate totals
      const subtotal = selectedInvoiceDetails.reduce((sum, item) => {
        const subtotalAmount = typeof item.subtotal_amount === 'string' ? parseFloat(item.subtotal_amount) : 
                             typeof item.subtotal_amount === 'number' ? item.subtotal_amount : 0;
        return sum + subtotalAmount;
      }, 0);
      
      const vatTotal = selectedInvoiceDetails.reduce((sum, item) => {
        const vatAmount = typeof item.vat_amount === 'string' ? parseFloat(item.vat_amount) : 
                         typeof item.vat_amount === 'number' ? item.vat_amount : 0;
        return sum + vatAmount;
      }, 0);
      
      const totalAmount = selectedInvoiceDetails.reduce((sum, item) => {
        const totalAmount = typeof item.total_amount === 'string' ? parseFloat(item.total_amount) : 
                           typeof item.total_amount === 'number' ? item.total_amount : 0;
        return sum + totalAmount;
      }, 0);

      // Get unique PO numbers and subcontract numbers
      const uniquePOs = Array.from(new Set(selectedInvoiceDetails.map(item => item.huaweiPo?.po_no).filter(Boolean)));
      const uniqueSubcontracts = Array.from(new Set(selectedInvoiceDetails.map(item => (item.huaweiPo?.job as any)?.subcontract_no).filter(Boolean)));

      // Set up page
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      let currentY = 30;

      // Header - Company Logo and Name
      doc.setFontSize(28);
      doc.setTextColor(33, 33, 33);
      doc.text(`${settings?.data?.company_name || 'Company Name'}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 20;

      // Tax Invoice Title
      doc.setFontSize(28);
      doc.text('Tax Invoice', pageWidth / 2, currentY, { align: 'center' });
      currentY += 30;

      // First table - Customer and Invoice Details
      const table1Y = currentY;
      const col1Width = contentWidth * 0.333;
      const col2Width = contentWidth * 0.333;
      const col3Width = contentWidth * 0.334;

      // Draw table borders
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);

      // Table 1 - Header row
      doc.line(margin, table1Y, pageWidth - margin, table1Y);
      doc.line(margin, table1Y + 15, pageWidth - margin, table1Y + 15);
      doc.line(margin, table1Y + 30, pageWidth - margin, table1Y + 30);
      doc.line(margin, table1Y + 45, pageWidth - margin, table1Y + 45);
      doc.line(margin, table1Y + 60, pageWidth - margin, table1Y + 60);
      
      // Vertical lines
      doc.line(margin + col1Width, table1Y, margin + col1Width, table1Y + 60);
      doc.line(margin + col1Width + col2Width, table1Y, margin + col1Width + col2Width, table1Y + 60);

      // Column 1 - Customer Address
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('To:', margin + 5, table1Y + 10);
      
      // Split customer address into lines
      const addressLines = customerAddress.split('\n').slice(0, 8); // Max 8 lines
      addressLines.forEach((line: string, index: number) => {
        doc.setFontSize(10);
        doc.text(line, margin + 15, table1Y + 20 + (index * 5));
      });
      
      doc.setFontSize(10);
      doc.text(`YOUR VAT NO.: ${settings?.data?.vat_number || 'N/A'}`, margin + 5, table1Y + 55);

      // Column 2 - Invoice Number
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice No. :', margin + col1Width + 5, table1Y + 10);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceNo, margin + col1Width + 5, table1Y + 20);

      // Column 3 - Date
      doc.setFontSize(12);
      doc.text('Date:', margin + col1Width + col2Width + 5, table1Y + 10);
      doc.setFontSize(10);
      doc.text(createdDate, margin + col1Width + col2Width + 5, table1Y + 20);

      // Row 2 - Subcontract Numbers
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Subcontract No.:', margin + col1Width + 5, table1Y + 35);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const subcontractText = uniqueSubcontracts.length > 0 ? uniqueSubcontracts.join(', ') : 'N/A';
      doc.text(subcontractText, margin + col1Width + 5, table1Y + 45);

      // Row 3 - PO Numbers
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('P.O No.', margin + col1Width + 5, table1Y + 50);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const poText = uniquePOs.length > 0 ? uniquePOs.join(', ') : 'N/A';
      doc.text(poText, margin + col1Width + 5, table1Y + 60);

      // Row 4 - Payment Instructions
      doc.setFontSize(10);
      doc.text('By Cheques or TT.', margin + col1Width + 5, table1Y + 65);
      doc.text('All the Cheques to be drawn in favour of', margin + col1Width + 5, table1Y + 70);
      doc.setFont('helvetica', 'bold');
      doc.text(`"${settings?.data?.company_name || 'Company Name'}"`, margin + col1Width + 5, table1Y + 75);

      currentY = table1Y + 85;

      // Main Items Table
      const table2Y = currentY;
      const itemColWidth = contentWidth * 0.05;
      const descColWidth = contentWidth * 0.80;
      const amountColWidth = contentWidth * 0.15;

      // Table 2 - Header
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1);
      doc.rect(margin, table2Y, contentWidth, 15);
      doc.line(margin + itemColWidth, table2Y, margin + itemColWidth, table2Y + 15);
      doc.line(margin + itemColWidth + descColWidth, table2Y, margin + itemColWidth + descColWidth, table2Y + 15);

      // Table 2 - Header text
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('#', margin + itemColWidth/2, table2Y + 10, { align: 'center' });
      doc.text('Description of Work', margin + itemColWidth + descColWidth/2, table2Y + 10, { align: 'center' });
      doc.text(`Total Amount\n${currencySymbol}`, margin + itemColWidth + descColWidth + amountColWidth/2, table2Y + 10, { align: 'center' });

      currentY = table2Y + 15;

      // Row 1 - Main item
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(margin, currentY, contentWidth, 15);
      doc.line(margin + itemColWidth, currentY, margin + itemColWidth, currentY + 15);
      doc.line(margin + itemColWidth + descColWidth, currentY, margin + itemColWidth + descColWidth, currentY + 15);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('1', margin + itemColWidth/2, currentY + 10, { align: 'center' });
      doc.text(`${jobType}\nPROJECT: ${jobName}`, margin + itemColWidth + 5, currentY + 5);
      doc.text(formatCurrency(subtotal), margin + itemColWidth + descColWidth + amountColWidth/2, currentY + 10, { align: 'right' });

      currentY += 15;

      // Empty rows (2 and 3)
      for (let i = 0; i < 2; i++) {
        doc.rect(margin, currentY, contentWidth, 15);
        doc.line(margin + itemColWidth, currentY, margin + itemColWidth, currentY + 15);
        doc.line(margin + itemColWidth + descColWidth, currentY, margin + itemColWidth + descColWidth, currentY + 15);
        currentY += 15;
      }

      // Row 4 - Refer annexure
      doc.rect(margin, currentY, contentWidth, 15);
      doc.line(margin + itemColWidth, currentY, margin + itemColWidth, currentY + 15);
      doc.line(margin + itemColWidth + descColWidth, currentY, margin + itemColWidth + descColWidth, currentY + 15);
      doc.text('***REFER ANNEXURE FOR MORE DETAILS', margin + itemColWidth + 5, currentY + 5);
      doc.text('Value Excluding VAT', margin + itemColWidth + 5, currentY + 12);
      doc.text(formatCurrency(subtotal), margin + itemColWidth + descColWidth + amountColWidth/2, currentY + 10, { align: 'right' });

      currentY += 15;

      // Payment Terms row
      doc.rect(margin, currentY, contentWidth, 15);
      doc.line(margin + itemColWidth, currentY, margin + itemColWidth, currentY + 15);
      doc.line(margin + itemColWidth + descColWidth, currentY, margin + itemColWidth + descColWidth, currentY + 15);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Terms :', margin + itemColWidth + 5, currentY + 5);
      doc.setFont('helvetica', 'normal');

      currentY += 15;

      // Full Payment row
      doc.rect(margin, currentY, contentWidth, 15);
      doc.line(margin + itemColWidth, currentY, margin + itemColWidth, currentY + 15);
      doc.line(margin + itemColWidth + descColWidth, currentY, margin + itemColWidth + descColWidth, currentY + 15);
      doc.text('Full Payment 100% on AC1-ESAR - Value Including VAT', margin + itemColWidth + 5, currentY + 10);
      doc.text(formatCurrency(totalAmount), margin + itemColWidth + descColWidth + amountColWidth/2, currentY + 10, { align: 'right' });

      currentY += 15;

      // VAT row
      doc.rect(margin, currentY, contentWidth, 15);
      doc.line(margin + itemColWidth, currentY, margin + itemColWidth, currentY + 15);
      doc.line(margin + itemColWidth + descColWidth, currentY, margin + itemColWidth + descColWidth, currentY + 15);
      doc.text(`OUR VAT NO.: ${settings?.data?.vat_number || 'N/A'}`, margin + itemColWidth + 5, currentY + 5);
      doc.text(`Add : VAT ${vatPercentage}%`, margin + itemColWidth + 5, currentY + 12);
      doc.text(formatCurrency(vatTotal), margin + itemColWidth + descColWidth + amountColWidth/2, currentY + 10, { align: 'right' });

      currentY += 25;

      // Amount Chargeable
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Amount Chargeable', margin, currentY);
      doc.text(formatCurrency(totalAmount), pageWidth - margin - 5, currentY, { align: 'right' });

      currentY += 15;

      // Amount in Words
      const amountInWords = numberToWords(totalAmount);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('(In Words)', margin, currentY);
      doc.text(`(${amountInWords})`, margin, currentY + 8);

      currentY += 20;

      // Contact Information
      doc.setFontSize(10);
      doc.text(`Note: Any question concern please contact ${settings?.data?.contact_number || 'N/A'} or e-mail : ${settings?.data?.email || 'N/A'} / ${settings?.data?.finance_email || 'N/A'}`, margin, currentY, { align: 'center' });

      currentY += 20;

      // Signature and Bank Details
      const signatureY = currentY;
      doc.text(`For ${settings?.data?.company_name || 'Company Name'}`, margin + 10, signatureY);
      doc.text('Authorized Signatory', margin + 10, signatureY + 20);

      // Bank details (right side)
      const bankDetails = settings?.data?.bank_account || 'Bank details not available';
      const bankLines = bankDetails.split('\n');
      bankLines.forEach((line: string, index: number) => {
        doc.text(line, margin + contentWidth/2 + 10, signatureY + (index * 5));
      });

      currentY = signatureY + 40;

      // Footer
      doc.setFontSize(8);
      doc.text(`Office : ${settings?.data?.contact_number || 'N/A'}`, margin, currentY);
      doc.text(`Tel: ${settings?.data?.contact_number || 'N/A'} Fax: N/A Email: ${settings?.data?.email || 'N/A'} Web: N/A`, margin, currentY + 5);
      doc.text(`Reg. Office No: ${settings?.data?.business_registration_number || 'N/A'} Tel: ${settings?.data?.contact_number || 'N/A'}`, margin, currentY + 10);
      
      console.log('PDF generation completed successfully');
      
      // Download the PDF
      const fileName = `Invoice_${invoiceNo}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      setSuccess('PDF downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Helper function to convert number to words
  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const convertLessThanOneThousand = (n: number): string => {
      if (n === 0) return '';

      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanOneThousand(n % 100) : '');
      return '';
    };

    const convert = (n: number): string => {
      if (n === 0) return 'Zero';
      if (n < 1000) return convertLessThanOneThousand(n);
      if (n < 1000000) return convertLessThanOneThousand(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertLessThanOneThousand(n % 1000) : '');
      if (n < 1000000000) return convertLessThanOneThousand(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '');
      return convertLessThanOneThousand(Math.floor(n / 1000000000)) + ' Billion' + (n % 1000000000 !== 0 ? ' ' + convert(n % 1000000000) : '');
    };

    const dollars = Math.floor(num);
    const cents = Math.round((num - dollars) * 100);
    
    let result = convert(dollars) + ' Dollars';
    if (cents > 0) {
      result += ' and ' + convert(cents) + ' Cents';
    }
    
    return result;
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
      const totalAmount = typeof invoice.total_amount === 'string' ? parseFloat(invoice.total_amount) : 
                         typeof invoice.total_amount === 'number' ? invoice.total_amount : 0;
      return sum + totalAmount;
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
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            All Invoices
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={clearSearch}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1.5 }}
          />

          {/* Filter Section */}
          <Box sx={{ mb: 2 }}>
            <Card variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 1.5 }}>
                Filters
              </Typography>
              <Grid container spacing={1.5}>
                {/* Customer Filter */}
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Customer</InputLabel>
                    <Select
                      value={filters.customer}
                      onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
                      label="Customer"
                    >
                      <MenuItem value="">All Customers</MenuItem>
                      {uniqueCustomers.map((customer) => (
                        <MenuItem key={customer} value={customer}>
                          {customer}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Amount Range */}
                <Grid item xs={12} md={4}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Min Amount"
                      type="number"
                      size="small"
                      value={filters.minAmount}
                      onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                      placeholder="0.00"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Max Amount"
                      type="number"
                      size="small"
                      value={filters.maxAmount}
                      onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                      placeholder="∞"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{ flex: 1 }}
                    />
                  </Stack>
                </Grid>

                {/* Date Range */}
                <Grid item xs={12} md={4}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="From Date"
                      type="date"
                      size="small"
                      value={filters.fromDate}
                      onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="To Date"
                      type="date"
                      size="small"
                      value={filters.toDate}
                      onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                    />
                  </Stack>
                </Grid>

                {/* Clear Filters Button */}
                <Grid item xs={12} md={1}>
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    size="small"
                    fullWidth
                    disabled={!Object.values(filters).some(v => v)}
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>

              {/* Active Filters Display */}
              {(filters.customer || filters.minAmount || filters.maxAmount || filters.fromDate || filters.toDate) && (
                <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="caption" sx={{ alignSelf: 'center', mr: 1 }}>
                    Active Filters:
                  </Typography>
                  {filters.customer && (
                    <Chip
                      label={`Customer: ${filters.customer}`}
                      size="small"
                      onDelete={() => setFilters({ ...filters, customer: '' })}
                    />
                  )}
                  {(filters.minAmount || filters.maxAmount) && (
                    <Chip
                      label={`Amount: $${filters.minAmount || '0'} - $${filters.maxAmount || '∞'}`}
                      size="small"
                      onDelete={() => setFilters({ ...filters, minAmount: '', maxAmount: '' })}
                    />
                  )}
                  {(filters.fromDate || filters.toDate) && (
                    <Chip
                      label={`Date: ${filters.fromDate || 'Any'} to ${filters.toDate || 'Any'}`}
                      size="small"
                      onDelete={() => setFilters({ ...filters, fromDate: '', toDate: '' })}
                    />
                  )}
                </Box>
              )}
            </Card>
          </Box>
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Card sx={{ mt: 1.5, bgcolor: 'error.light' }}>
          <CardContent sx={{ p: 1.5 }}>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card sx={{ mt: 1.5, bgcolor: 'success.light' }}>
          <CardContent sx={{ p: 1.5 }}>
            <Typography color="success.main">{success}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Invoices List */}
      <Card sx={{ mt: 1.5 }}>
        <CardContent sx={{ p: 2 }}>
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
                        {formatCurrency(summary.total_amount)}
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
                    VAT Percentage
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="#1e40af">
                    {selectedInvoiceDetails[0].vat_percentage}%
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

              {/* Financial Summary for Saved Invoice */}
              <Box sx={{ 
                mb: 3, 
                p: 3, 
                backgroundColor: '#f0fdf4',
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: '#bbf7d0'
              }}>
                <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight="500" sx={{ mb: 2 }}>
                  Financial Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Subtotal
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="text.primary">
                        ${(() => {
                          const subtotal = selectedInvoiceDetails.reduce((sum, item) => {
                            const subtotalAmount = typeof item.subtotal_amount === 'string' ? parseFloat(item.subtotal_amount) : 
                                                 typeof item.subtotal_amount === 'number' ? item.subtotal_amount : 0;
                            return sum + subtotalAmount;
                          }, 0);
                          return subtotal.toFixed(2);
                        })()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        VAT ({selectedInvoiceDetails[0].vat_percentage}%)
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="#1e40af">
                        ${(() => {
                          const vatTotal = selectedInvoiceDetails.reduce((sum, item) => {
                            const vatAmount = typeof item.vat_amount === 'string' ? parseFloat(item.vat_amount) : 
                                            typeof item.vat_amount === 'number' ? item.vat_amount : 0;
                            return sum + vatAmount;
                          }, 0);
                          return vatTotal.toFixed(2);
                        })()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="#059669">
                        ${(() => {
                          const total = selectedInvoiceDetails.reduce((sum, item) => {
                            const totalAmount = typeof item.total_amount === 'string' ? parseFloat(item.total_amount) : 
                                              typeof item.total_amount === 'number' ? item.total_amount : 0;
                            return sum + totalAmount;
                          }, 0);
                          return total.toFixed(2);
                        })()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Invoice Date
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="text.primary">
                        {new Date(selectedInvoiceDetails[0].createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

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
                      <TableCell>Subtotal</TableCell>
                      <TableCell>VAT Amount</TableCell>
                      <TableCell>Total Amount</TableCell>
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
                            <Typography variant="body2" fontWeight="500" color="text.primary">
                              ${(() => {
                                const subtotalAmount = typeof item.subtotal_amount === 'string' ? parseFloat(item.subtotal_amount) : 
                                                     typeof item.subtotal_amount === 'number' ? item.subtotal_amount : 0;
                                return subtotalAmount.toFixed(2);
                              })()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500" color="#1e40af">
                              ${(() => {
                                const vatAmount = typeof item.vat_amount === 'string' ? parseFloat(item.vat_amount) : 
                                                typeof item.vat_amount === 'number' ? item.vat_amount : 0;
                                return vatAmount.toFixed(2);
                              })()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="600" color="#059669">
                              ${(() => {
                                const totalAmount = typeof item.total_amount === 'string' ? parseFloat(item.total_amount) : 
                                                  typeof item.total_amount === 'number' ? item.total_amount : 0;
                                return totalAmount.toFixed(2);
                              })()}
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