import React, { useState } from 'react';
import { Invoice, InvoiceUpdateForm } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Save, Loader2 } from 'lucide-react';

interface InvoiceFormProps {
  invoice: Invoice;
  onAccept: () => void;
  onReject: () => void;
  onSave: (data: InvoiceUpdateForm) => void;
  isSubmitting: boolean;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  onAccept,
  onReject,
  onSave,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<InvoiceUpdateForm>({
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    vendorName: invoice.vendorName,
    poNumber: invoice.poNumber,
    amount: invoice.amount,
    tax: invoice.tax,
  });

  const handleChange = (field: keyof InvoiceUpdateForm, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const totalAmount = formData.amount + formData.tax;

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Invoice Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Editable Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input
              id="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={(e) => handleChange('invoiceNumber', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceDate">Invoice Date</Label>
            <Input
              id="invoiceDate"
              type="date"
              value={formData.invoiceDate}
              onChange={(e) => handleChange('invoiceDate', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendorName">Vendor Name</Label>
            <Input
              id="vendorName"
              value={formData.vendorName}
              onChange={(e) => handleChange('vendorName', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="poNumber">PO Number</Label>
            <Input
              id="poNumber"
              value={formData.poNumber}
              onChange={(e) => handleChange('poNumber', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax">Tax ($)</Label>
            <Input
              id="tax"
              type="number"
              step="0.01"
              value={formData.tax}
              onChange={(e) => handleChange('tax', parseFloat(e.target.value) || 0)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Line Items (Read-only for now) */}
        {invoice.lineItems.length > 0 && (
          <>
            <Separator />
            <div>
              <Label className="text-sm font-medium mb-3 block">Line Items</Label>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Description</th>
                      <th className="text-right p-3 font-medium w-20">Qty</th>
                      <th className="text-right p-3 font-medium w-24">Unit Price</th>
                      <th className="text-right p-3 font-medium w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="p-3">{item.description}</td>
                        <td className="p-3 text-right">{item.quantity}</td>
                        <td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="p-3 text-right font-medium">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Total */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${formData.amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-muted-foreground">Tax</span>
            <span>${formData.tax.toFixed(2)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Amount</span>
            <span className="text-xl font-bold text-primary">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
          <Button
            variant="destructive"
            onClick={onReject}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            Reject Invoice
          </Button>
          <Button
            onClick={onAccept}
            disabled={isSubmitting}
            className="flex-1 bg-success hover:bg-success/90"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Accept Invoice
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceForm;
