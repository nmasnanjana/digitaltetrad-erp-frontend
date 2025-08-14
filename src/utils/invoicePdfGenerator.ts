import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { type InvoiceRecord } from '@/api/huawei-invoice-api';
import { type SettingsData } from '@/api/settingsApi';
import { type Customer } from '@/types/customer';

interface InvoicePdfData {
  invoiceDetails: InvoiceRecord[];
  settings: SettingsData;
  huaweiCustomer: Customer;
}

export const generateInvoicePDF = async (data: InvoicePdfData): Promise<void> => {
  const { invoiceDetails, settings, huaweiCustomer } = data;
  
  if (invoiceDetails.length === 0) {
    throw new Error('No invoice details provided');
  }

  // Calculate totals
  const subtotal = invoiceDetails.reduce((sum, item) => {
    const subtotalAmount = typeof item.subtotalAmount === 'string' ? parseFloat(item.subtotalAmount) : 
                         typeof item.subtotalAmount === 'number' ? item.subtotalAmount : 0;
    return sum + subtotalAmount;
  }, 0);
  
  const vatTotal = invoiceDetails.reduce((sum, item) => {
    const vatAmount = typeof item.vatAmount === 'string' ? parseFloat(item.vatAmount) : 
                     typeof item.vatAmount === 'number' ? item.vatAmount : 0;
    return sum + vatAmount;
  }, 0);
  
  const totalAmount = invoiceDetails.reduce((sum, item) => {
    const totalAmount = typeof item.totalAmount === 'string' ? parseFloat(item.totalAmount) : 
                       typeof item.totalAmount === 'number' ? item.totalAmount : 0;
    return sum + totalAmount;
  }, 0);

  // Get unique PO numbers and format them
  const uniquePOs = Array.from(new Set(invoiceDetails.map(item => item.huaweiPo?.poNo).filter(Boolean)));
  const formattedPOs = uniquePOs.map(po => {
    // Extract the base PO number (before the dash)
    const basePO = po?.split('-')[0] || '';
    return basePO;
  });
  const poNumbersText = formattedPOs.join(' / ');

  // Format date
  const createdDate = new Date(invoiceDetails[0].createdAt);
  const formattedDate = createdDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '.');

  // Get currency symbol
  const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
      case 'USD': return 'USD';
      case 'LKR': return 'LKR';
      case 'EUR': return 'EUR';
      case 'GBP': return 'GBP';
      default: return currency;
    }
  };

  const currencySymbol = getCurrencySymbol(settings.currency);

  // Convert amount to words
  const amountInWords = numberToWords(totalAmount, currencySymbol);

  // Create HTML content with replaced placeholders
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tax Invoice</title>
    <style>
        @page {
            size: A4;
            margin: 0.5in;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            margin: 0;
            padding: 0;
            width: 210mm;
            height: 297mm;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            margin: 0 auto 0 auto;
            margin-left: 0.5in;
            margin-right: 0.5in;
            box-sizing: border-box;
        }

        .a4-container {
            width: 100%;
            height: 100%;
            padding: 0.5in;
            background: white;
            box-sizing: border-box;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0;
        }

        td {
            vertical-align: top;
            padding: 6px;
            border: 1px solid black;
        }

        .no-border td {
            border: none;
        }

        .center {
            text-align: center;
        }

        .right {
            text-align: right;
        }

        .dotted-line {
            border-bottom: 1px dotted black !important;
        }

        .bold {
            font-weight: bold;
        }

        .underline {
            text-decoration: underline;
        }

        .vat-bottom {
            position: relative;
        }

        .vat-bottom::after {
            content: "YOUR VAT NO.: ${settings.vat_number}";
            position: absolute;
            bottom: 6px;
            left: 6px;
        }

        .no-horizontal-borders td {
            border-left: 1px solid black;
            border-right: 1px solid black;
            border-top: none;
            border-bottom: none;
        }

        .no-horizontal-borders td:first-child {
            border-left: 1px solid black;
        }

        .no-horizontal-borders td:last-child {
            border-right: 1px solid black;
        }

        .dashed-middle {
            border-left: 1px solid black;
            border-right: 1px solid black;
            border-top: none;
            border-bottom: none;
        }

        .dashed-middle td:nth-child(2) {
            border-left: 1px dashed black;
            border-right: 1px dashed black;
            border-top: 1px dashed black;
            border-bottom: none;
        }

        .header-bottom-border td {
            border-bottom: 1px solid black;
        }

        .annexure-price-cell {
            border-top: 1px solid black !important;
            border-bottom: 3px double black !important;
        }

        .single-box-table {
            border: 1px solid black;
            border-collapse: collapse;
            margin-bottom: 0;
        }

        .single-box-table + .single-box-table {
            margin-top: 0;
            border-top: none;
        }

        .single-box-table:has(+ .single-box-table) {
            border-bottom: none;
        }

        .connected-box {
            border-bottom: none;
        }

        .connected-box + .single-box-table {
            border-top: none;
        }

        .full-amount-cell {
            border: 1px solid black !important;
            border-top: 1px solid black !important;
            border-bottom: 1px solid black !important;
            border-left: 1px solid black !important;
            border-right: 1px solid black !important;
        }

        .single-box-table .full-amount-cell {
            border: 1px solid black !important;
            border-top: 1px solid black !important;
            border-bottom: 1px solid black !important;
            border-left: 1px solid black !important;
            border-right: 1px solid black !important;
        }

        .no-horizontal-borders + .single-box-table {
            margin-top: 0;
        }

        .no-horizontal-borders {
            border-bottom: none;
        }

        .single-box-table td {
            border: none !important;
            padding: 6px;
        }

        .single-box-table td:first-child {
            border-bottom: 1px solid black !important;
        }

        .bottom-align {
            vertical-align: bottom;
        }

        #amount-in-words {
            border: 1px solid black;
            border-bottom: none;
            margin-bottom: 0;
        }

        #amount-in-words td {
            border: none !important;
        }

        #note {
            border: 1px solid black;
            border-top: none;
            border-bottom: none;
            margin-top: 0;
            margin-bottom: 0;
        }

        #note td {
            border: none !important;
        }

        #footer {
            border: 1px solid black;
            border-top: none;
            margin-top: 0;
        }

        #footer td {
            border: none !important;
        }

        .rounded-note {
            border: 1px solid black;
            border-radius: 8px;
            padding: 8px;
            margin: 5px;
            display: inline-block;
        }

        .company-logo {
            max-width: 100px;
            max-height: 60px;
            object-fit: contain;
        }
    </style>
</head>
<body>

    <div class="a4-container">
        <p class="center" style="font-size: 28px;">
            ${settings.company_logo ? `<img src="${settings.company_logo}" alt="Company Logo" class="company-logo" style="vertical-align: middle; margin-right: 10px;">` : ''}
            ${settings.company_name}
        </p>
        <p class="center" style="font-size: 28px;">TAX INVOICE</p>

        <!-- Customer & Invoice Details -->
        <table>
            <tr>
                <td rowspan="4" style="width: 33.33%;" class="vat-bottom">
                    To:<br>
                    ${huaweiCustomer.address ? huaweiCustomer.address.split('\n').map(line => `&nbsp;&nbsp;&nbsp;${line}`).join('<br>') : '&nbsp;&nbsp;&nbsp;Address not available'}
                </td>
                <td style="width: 33.33%;"><strong>Invoice No. :</strong><br>${invoiceDetails[0].invoiceNo}</td>
                <td style="width: 33.33%;">Date:<br>${formattedDate}</td>
            </tr>
            <tr>
                <td colspan="2"><strong>Subcontract No.:</strong><br>&lt;subcontract_numbers&gt;</td>
            </tr>
            <tr>
                <td colspan="2"><strong>P.O No.:</strong><br>${poNumbersText}</td>
            </tr>
            <tr>
                <td colspan="2" class="center">
                    By Cheques or TT.<br>
                    All the Cheques to be drawn in favour of<br>
                    "${settings.company_name}"
                </td>
            </tr>
        </table>

        <!-- Work Details Table -->
        <table class="no-horizontal-borders">
            <tr class="header-bottom-border">
                <td class="center" style="width: 5%;">#</td>
                <td class="center" style="width: 80%;">Description of Work</td>
                <td class="center">Total Amount<br>${currencySymbol}</td>
            </tr>
            <tr>
                <td class="center">1</td>
                <td>
                    &lt;Job Type&gt;<br>
                    <strong>PROJECT:</strong> &lt;Job Name&gt;
                </td>
                <td class="right">${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
                <td class="center">&nbsp;</td>
                <td class="center">&nbsp;</td>
                <td class="center">&nbsp;</td>
            </tr>
            <tr>
                <td class="center">&nbsp;</td>
                <td class="center">&nbsp;</td>
                <td class="center">&nbsp;</td>
            </tr>
            <tr>
                <td class="center">&nbsp;</td>
                <td>***REFER ANNEXURE FOR MORE DETAILS — Value Excluding VAT</td>
                <td class="right annexure-price-cell">${subtotal.toFixed(2)}</td>
            </tr>
            <tr class="dashed-middle">
                <td class="center">&nbsp;</td>
                <td><strong><u>Payment Terms:</u></strong></td>
                <td class="center">&nbsp;</td>
            </tr>
            <tr>
                <td class="center">&nbsp;</td>
                <td class="center">Full Payment 100% on AC1-ESAR - Value Including VAT</td>
                <td class="right">${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
                <td class="center">&nbsp;</td>
                <td>
                    OUR VAT NO.: ${settings.vat_number}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Add: VAT ${settings.vat_percentage}%
                </td>
                <td class="right">${vatTotal.toFixed(2)}</td>
            </tr>
        </table>

        <!-- Amount Chargeable -->
        <table class="single-box-table">
            <tr>
                <td style="width: 85%;">Amount Chargeable</td>
                <td class="right full-amount-cell" style="width: 15%;">${totalAmount.toFixed(2)}</td>
            </tr>
        </table>

        <!-- Amount in Words -->
        <table class="single-box-table" id="amount-in-words">
            <tr>
                <td>(In Words)<br>(${amountInWords})</td>
            </tr>
        </table>

        <!-- Note -->
        <table class="single-box-table connected-box" id="note">
            <tr>
                <td class="center">
                    <div class="rounded-note">
                        Note: Any question or concern please contact ${settings.contact_number} or e-mail: ${settings.email} / ${settings.finance_email}
                    </div>
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <table id="footer">
            <tr>
                <td style="width: 50%;">
                    For ${settings.company_name}<br><br><br>
                    Authorized Signatory
                </td>
                <td style="width: 50%;">
                    ${settings.bank_account ? settings.bank_account.split('\n').join('<br>') : 'Bank details not available'}
                </td>
            </tr>
        </table>

        <!-- Office Contact Info -->
        <p>
            Office: &lt;invoice single lines address&gt;<br>
            Tel: &lt;contact number&gt; Fax: &lt;Fax Number&gt; Email: &lt;contact_email&gt; Web: &lt;website_url&gt;<br>
            Reg. Office No: &lt;single line address&gt; Tel: &lt;reg_contact_no&gt;
        </p>
    </div>

</body>
</html>`;

  // Create a temporary div element to render the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  document.body.appendChild(tempDiv);

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Create PDF
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download the PDF
    const fileName = `Huawei_Invoice_${invoiceDetails[0].invoiceNo}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } finally {
    // Clean up
    document.body.removeChild(tempDiv);
  }
};

// Number to words conversion function
const numberToWords = (num: number, currencySymbol: string): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convertLessThanOneThousand = (n: number): string => {
    if (n === 0) return '';

    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ` ${  ones[n % 10]}` : '');
    }
    if (n < 1000) {
      return `${ones[Math.floor(n / 100)]  } Hundred${  n % 100 !== 0 ? ` and ${  convertLessThanOneThousand(n % 100)}` : ''}`;
    }
    return '';
  };

  const convert = (n: number): string => {
    if (n === 0) return 'Zero';
    if (n < 1000) return convertLessThanOneThousand(n);
    if (n < 100000) {
      return `${convertLessThanOneThousand(Math.floor(n / 1000))  } Thousand${  n % 1000 !== 0 ? ` ${  convertLessThanOneThousand(n % 1000)}` : ''}`;
    }
    if (n < 10000000) {
      return `${convertLessThanOneThousand(Math.floor(n / 100000))  } Lakh${  n % 100000 !== 0 ? ` ${  convert(n % 100000)}` : ''}`;
    }
    return `${convertLessThanOneThousand(Math.floor(n / 10000000))  } Crore${  n % 10000000 !== 0 ? ` ${  convert(n % 10000000)}` : ''}`;
  };

  // Handle decimal part
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let result = convert(integerPart);
  
  if (decimalPart > 0) {
    result += ` and ${  convert(decimalPart)  } Cents`;
  }

  return `${currencySymbol} ${result}`;
}; 