<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    public function index()
    {
        $invoices = Invoice::with('customer:id,name,email')
                           ->orderBy('created_at', 'DESC')
                           ->get();

        $formattedInvoices = $invoices->map(function ($inv) {
            return [
                'id' => $inv->id,
                'invoice_no' => $inv->invoice_no,
                'order_id' => 'ORD-' . $inv->order_id,
                'customer' => $inv->customer ? $inv->customer->name : 'Guest',
                'email' => $inv->customer ? $inv->customer->email : 'N/A',
                'date' => $inv->issued_date,
                'amount' => $inv->total_amount,
                'tax' => $inv->tax_amount,
                'status' => $inv->status
            ];
        });

        return response()->json([
            'status' => true,
            'data' => $formattedInvoices
        ], 200);
    }

   public function download($invoice_no)
    {
        // Invoice ke sath Order, Customer aur Order Items ko bhi fetch karna
        $invoice = Invoice::with(['order.items.product', 'customer'])->where('invoice_no', $invoice_no)->first();

        if (!$invoice) {
            return response()->json(['status' => false, 'message' => 'Invoice not found'], 404);
        }

        $customerName = $invoice->customer ? $invoice->customer->name : 'Guest Customer';
        $customerEmail = $invoice->customer ? $invoice->customer->email : 'N/A';
        $invoiceDate = \Carbon\Carbon::parse($invoice->issued_date)->format('d M Y');
        
        $subtotal = number_format($invoice->total_amount - $invoice->tax_amount, 2);
        $tax = number_format($invoice->tax_amount, 2);
        $total = number_format($invoice->total_amount, 2);

        $statusColor = strtolower($invoice->status) === 'paid' ? '#10b981' : '#f59e0b';

        // --- DYNAMIC ITEMS HTML GENERATION ---
        $itemsHtml = '';
        if ($invoice->order && $invoice->order->items && count($invoice->order->items) > 0) {
            $i = 1;
            foreach ($invoice->order->items as $item) {
                $itemName = $item->product ? $item->product->name : 'Product Item';
                $itemPrice = number_format($item->price, 2);
                $itemTotal = number_format($item->price * $item->quantity, 2);
                
                $itemsHtml .= '
                <tr>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">'.$i.'</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0;">
                        <strong style="color: #0f172a;">'.$itemName.'</strong><br>
                        <span style="font-size: 10px; color: #64748b;">HSN: 8517 / Taxable via E-commerce</span>
                    </td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">'.$item->quantity.'</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹'.$itemPrice.'</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹'.$itemTotal.'</td>
                </tr>';
                $i++;
            }
        } else {
            // Fallback agar items relation na mile
            $itemsHtml = '
            <tr>
                <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">1</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0;">
                    <strong style="color: #0f172a;">Products from Order ORD-'.$invoice->order_id.'</strong><br>
                    <span style="font-size: 10px; color: #64748b;">HSN: 8517 / IGST applicable</span>
                </td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">1</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹'.$subtotal.'</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹'.$subtotal.'</td>
            </tr>';
        }

        // ✅ FINAL MODERN CLEAN INVOICE HTML
        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
            <style>
                body {
                    font-family: "DejaVu Sans", sans-serif;
                    margin: 0;
                    padding: 30px;
                    color: #334155;
                    font-size: 12px;
                    line-height: 1.5;
                    background-color: #ffffff;
                }
                .top-header { width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 25px; }
                .brand { font-size: 26px; font-weight: bold; color: #0f172a; margin: 0; }
                .invoice-heading { font-size: 22px; font-weight: bold; color: #0f172a; text-align: right; text-transform: uppercase; margin: 0; }
                
                .info-table { width: 100%; margin-bottom: 25px; }
                .info-table td { width: 50%; vertical-align: top; }
                .card { border: 1px solid #e2e8f0; background-color: #f8fafc; border-radius: 8px; padding: 15px; min-height: 110px; }
                .card-title { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
                
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
                .items-table th { background-color: #0f172a; color: #ffffff; padding: 10px; font-size: 11px; text-transform: uppercase; text-align: left; }
                
                .summary-table { width: 100%; border-collapse: collapse; }
                .summary-table td { padding: 8px 0; color: #475569; }
                .grand-total-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: 2px solid #0f172a; padding: 12px 15px; margin-top: 10px; font-size: 15px; font-weight: bold; color: #0f172a; }
                
                .footer-note { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 10px; color: #94a3b8; }
            </style>
        </head>
        <body>

            <!-- Header -->
            <table class="top-header">
                <tr>
                    <td>
                        <h1 class="brand">My Shop</h1>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                            123, E-commerce Business Park, New Delhi, India<br>
                            <strong>GSTIN:</strong> 07AABCU1234R1Z5
                        </div>
                    </td>
                    <td style="text-align: right;">
                        <h2 class="invoice-heading">Tax Invoice</h2>
                        <div style="font-size: 10px; color: #64748b; margin-top: 3px;">Original for Recipient</div>
                    </td>
                </tr>
            </table>

            <!-- Billed To & Invoice Details Cards -->
            <table class="info-table">
                <tr>
                    <td style="padding-right: 12px;">
                        <div class="card">
                            <div class="card-title">Billed To:</div>
                            <strong style="color: #0f172a; font-size: 13px;">'.$customerName.'</strong><br>
                            <span style="color: #64748b;">Email:</span> '.$customerEmail.'<br>
                            <span style="color: #64748b;">Phone:</span> +91-9876543210<br>
                            <span style="color: #64748b;">State Code:</span> 07 (Delhi)
                        </div>
                    </td>
                    <td style="padding-left: 12px;">
                        <div class="card">
                            <div class="card-title">Invoice Details:</div>
                            <table style="width: 100%; font-size: 12px;">
                                <tr><td><strong>Invoice No:</strong></td><td style="text-align: right;">'.$invoice->invoice_no.'</td></tr>
                                <tr><td><strong>Invoice Date:</strong></td><td style="text-align: right;">'.$invoiceDate.'</td></tr>
                                <tr><td><strong>Order ID:</strong></td><td style="text-align: right;">ORD-'.$invoice->order_id.'</td></tr>
                                <tr><td><strong>Status:</strong></td><td style="text-align: right; color: '.$statusColor.'; font-weight: bold;">'.strtoupper($invoice->status).'</td></tr>
                            </table>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Items Table -->
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 5%; text-align: center;">#</th>
                        <th style="width: 50%;">Item Description</th>
                        <th style="width: 10%; text-align: center;">Qty</th>
                        <th style="width: 17%; text-align: right;">Unit Price</th>
                        <th style="width: 18%; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    '.$itemsHtml.'
                </tbody>
            </table>

            <!-- Totals Section -->
            <table style="width: 100%;">
                <tr>
                    <td style="width: 55%; vertical-align: top; padding-right: 20px;">
                        <div style="font-size: 11px; font-weight: bold; color: #0f172a; margin-bottom: 5px;">Declaration:</div>
                        <div style="font-size: 10px; color: #64748b; line-height: 1.4;">
                            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Goods once sold will not be taken back.
                        </div>
                    </td>
                    <td style="width: 45%; vertical-align: top;">
                        <table class="summary-table">
                            <tr><td>Subtotal (before tax):</td><td style="text-align: right; font-weight: bold;">₹'.$subtotal.'</td></tr>
                            <tr><td>Tax Amount (IGST 18%):</td><td style="text-align: right; font-weight: bold;">₹'.$tax.'</td></tr>
                        </table>
                        <div class="grand-total-box">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="font-size: 13px; text-transform: uppercase; color: #0f172a;">Grand Total:</td>
                                    <td style="text-align: right; font-size: 18px; color: #0f172a;">₹'.$total.'</td>
                                </tr>
                            </table>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Signature & Footer -->
            <div style="margin-top: 40px; width: 100%;">
                <table style="width: 100%;">
                    <tr>
                        <td></td>
                        <td style="text-align: right; width: 40%;">
                            <div style="font-weight: bold; color: #0f172a; font-size: 11px;">For My Shop E-Commerce</div>
                            <br><br>
                            <div style="border-top: 1px solid #cbd5e1; display: inline-block; padding-top: 4px; font-size: 11px; font-weight: bold; color: #475569; width: 180px; text-align: center;">Authorized Signatory</div>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="footer-note">
                This is a computer-generated document and does not require a physical signature.<br>
                For any support queries, contact support@myshop.com
            </div>

        </body>
        </html>
        ';

        $pdf = Pdf::loadHTML($html);
        $pdf->setOptions(['defaultFont' => 'DejaVu Sans']);

        return $pdf->download($invoice->invoice_no . '.pdf');
    }
}