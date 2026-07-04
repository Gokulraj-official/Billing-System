import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Invoice, Member } from '@/lib/database';

// A4 spacing styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#374151', // slate-700
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#10b981', // Herbalife Green
    paddingBottom: 15,
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'column',
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#047857', // emerald-700
    letterSpacing: 0.5,
  },
  logoSubtext: {
    fontSize: 7,
    color: '#6b7280',
    letterSpacing: 2,
    marginTop: 2,
  },
  invoiceInfo: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  metaText: {
    marginTop: 3,
    fontSize: 8,
    color: '#6b7280',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  billToContainer: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  billToName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },
  billToPhone: {
    marginTop: 2,
    color: '#4b5563',
  },
  table: {
    flexDirection: 'column',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  totalsBox: {
    width: 180,
    paddingTop: 4,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2.5,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#10b981',
    marginTop: 4,
    fontWeight: 'bold',
  },
  grandTotalLabel: {
    fontSize: 10,
    color: '#111827',
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 11,
    color: '#047857',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7.5,
    color: '#9ca3af',
  }
});

interface InvoicePDFProps {
  invoice: Invoice;
  member: Member | null;
}

export default function InvoicePDF({ invoice, member }: InvoicePDFProps) {
  const formatCurrencyPDF = (val: number) => {
    return `Rs. ${val.toFixed(2)}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>KEERTHI BILLING SYSTEM</Text>
            <Text style={styles.logoSubtext}>SALES INVOICE RECEIPT</Text>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.metaText}>Invoice No: {invoice.invoice_no}</Text>
            <Text style={styles.metaText}>Date: {invoice.date}</Text>
            {invoice.billing_time && (
              <Text style={styles.metaText}>Time: {invoice.billing_time}</Text>
            )}
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.billToContainer}>
            {member ? (
              <>
                <Text style={styles.billToName}>{member.name}</Text>
                {member.phone && <Text style={styles.billToPhone}>Phone: {member.phone}</Text>}
                {member.address && <Text style={styles.billToPhone}>Address: {member.address}</Text>}
              </>
            ) : (
              <Text style={{ color: '#6b7280', fontStyle: 'italic' }}>Walk-in Customer</Text>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, { fontWeight: 'bold' }]}>Product / Description</Text>
            <Text style={[styles.colQty, { fontWeight: 'bold' }]}>Qty</Text>
            <Text style={[styles.colPrice, { fontWeight: 'bold' }]}>Price</Text>
            <Text style={[styles.colTotal, { fontWeight: 'bold' }]}>Total</Text>
          </View>

          {invoice.items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.name}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrencyPDF(item.price)}</Text>
              <Text style={styles.colTotal}>{formatCurrencyPDF(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={{ color: '#6b7280' }}>Subtotal</Text>
              <Text>{formatCurrencyPDF(invoice.total)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={{ color: '#6b7280' }}>Tax (0%)</Text>
              <Text>Rs. 0.00</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrencyPDF(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business! Stay healthy and active.</Text>
          <Text style={[styles.footerText, { marginTop: 2, fontSize: 6.5 }]}>
            Generated by Keerthi Billing System
          </Text>
        </View>
      </Page>
    </Document>
  );
}
