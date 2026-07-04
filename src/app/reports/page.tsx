"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { getInvoices, getMembers, deleteInvoice, Invoice, Member } from "@/lib/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { 
  BarChart3, 
  Download, 
  Calendar, 
  User, 
  FileSpreadsheet,
  FileText,
  Trash2
} from "lucide-react";
import InvoicePDF from "@/components/InvoicePDF";

// Import PDFDownloadLink dynamically to prevent NextJS SSR issues
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters State
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      try {
        const [invList, memList] = await Promise.all([getInvoices(), getMembers()]);
        setInvoices(invList);
        setMembers(memList);
      } catch (err) {
        console.error("Failed to load reports data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter logic
  const filteredInvoices = invoices.filter((inv) => {
    // Member Filter
    if (selectedMemberId !== "all") {
      if (selectedMemberId === "walk-in" && inv.member_id !== null) return false;
      if (selectedMemberId !== "walk-in" && inv.member_id !== selectedMemberId) return false;
    }

    // Start Date Filter
    if (startDate && inv.date < startDate) return false;

    // End Date Filter
    if (endDate && inv.date > endDate) return false;

    return true;
  });

  // Calculate stats for filtered set
  const filteredTotalSales = filteredInvoices.reduce((acc, inv) => acc + Number(inv.total), 0);
  const totalInvoicesCount = filteredInvoices.length;

  // Export CSV
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      toast({ title: "Export Error", description: "No data available to export.", variant: "destructive" });
      return;
    }

    // CSV Headers
    const headers = [
      "Date", 
      "Time", 
      "Invoice No", 
      "Customer Name", 
      "Customer Phone", 
      "Customer Address", 
      "Product Name", 
      "Quantity", 
      "Price Per Unit (INR)", 
      "Item Total (INR)", 
      "Invoice Grand Total (INR)"
    ];
    
    // CSV Rows
    const rows: string[][] = [];
    filteredInvoices.forEach((inv) => {
      const member = members.find((m) => m.id === inv.member_id);
      const customerName = member ? member.name : "Walk-in Customer";
      
      // Excel-safe text formulas to prevent Date hashtags & Phone scientific notations without shifting columns
      const dateVal = `"=""${inv.date}"""`;
      const timeVal = inv.billing_time ? `"=""${inv.billing_time}"""` : '""';
      const phoneVal = member && member.phone ? `"=""${member.phone}"""` : '""';
      const addressVal = member && member.address ? `"${member.address.replace(/"/g, '""')}"` : '""';
      const invoiceNoVal = `"=""${inv.invoice_no}"""`;
      
      inv.items.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        rows.push([
          dateVal,
          timeVal,
          invoiceNoVal,
          `"${customerName.replace(/"/g, '""')}"`,
          phoneVal,
          addressVal,
          `"${item.name.replace(/"/g, '""')}"`,
          item.quantity.toString(),
          item.price.toFixed(2),
          itemTotal.toFixed(2),
          inv.total.toFixed(2)
        ]);
      });
    });

    const csvContent = 
      "data:text/csv;charset=utf-8,\uFEFF" + // Include UTF-8 BOM
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `keerthi_sales_report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMemberName = (memberId: string | null) => {
    if (!memberId) return "Walk-in Customer";
    const mem = members.find((m) => m.id === memberId);
    return mem ? mem.name : "Unknown Member";
  };

  const getMemberObj = (memberId: string | null) => {
    if (!memberId) return null;
    return members.find((m) => m.id === memberId) || null;
  };

  const handleDeleteInvoice = async (id: string, invoiceNo: string) => {
    if (!confirm(`Are you sure you want to delete invoice "${invoiceNo}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteInvoice(id);
      setInvoices(invoices.filter((inv) => inv.id !== id));
      toast({
        title: "Invoice Deleted",
        description: `Invoice ${invoiceNo} was successfully removed.`,
        variant: "success"
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to delete invoice.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" /> Sales & Reports
          </h1>
          <p className="text-xs text-muted-foreground">Analyze sales performance and export historic invoice records</p>
        </div>
        <Button 
          onClick={handleExportCSV}
          disabled={filteredInvoices.length === 0}
          variant="gradient"
          className="w-full sm:w-auto shadow-md shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4 text-white" /> Export CSV Report
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Start Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs"
              />
            </div>
            {/* End Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs"
              />
            </div>
            {/* Member Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" /> Member Filter
              </label>
              <Select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="text-xs"
              >
                <option value="all">All Customers</option>
                <option value="walk-in">Walk-in Customers</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border border-border/40 shadow-sm">
          <CardContent className="p-5 flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Filtered Revenue</span>
            <span className="text-2xl font-black text-emerald-600">
              {formatCurrency(filteredTotalSales)}
            </span>
          </CardContent>
        </Card>
        <Card className="border border-border/40 shadow-sm">
          <CardContent className="p-5 flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Filtered Receipts</span>
            <span className="text-2xl font-black text-foreground">
              {totalInvoicesCount} invoices
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">
              Loading sales transactions...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-3">
              <FileText className="w-8 h-8 text-muted-foreground/60" />
              <div>
                <p className="font-bold text-sm text-foreground">No invoices match search filters</p>
                <p className="text-xs mt-0.5">Adjust date ranges or change member selection to find invoices.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Purchased Items</TableHead>
                  <TableHead>Total Bill</TableHead>
                  <TableHead className="text-right pr-6">PDF Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="pl-6 text-xs text-muted-foreground font-medium">
                      <div className="flex flex-col">
                        <span>{inv.date}</span>
                        {inv.billing_time && <span className="text-[10px] opacity-75 mt-0.5">{inv.billing_time}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-foreground/90">
                      {inv.invoice_no}
                    </TableCell>
                    <TableCell className="text-xs">
                      {getMemberName(inv.member_id)}
                    </TableCell>
                    <TableCell className="text-xs max-w-[240px] truncate text-muted-foreground">
                      {inv.items.map((it) => `${it.name} (x${it.quantity})`).join(", ")}
                    </TableCell>
                    <TableCell className="font-bold text-emerald-600">
                      {formatCurrency(inv.total)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <PDFDownloadLink
                          document={<InvoicePDF invoice={inv} member={getMemberObj(inv.member_id)} />}
                          fileName={`${inv.invoice_no}.pdf`}
                        >
                          {({ loading }) => (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={loading}
                              className="cursor-pointer gap-1.5 text-xs border-border/80 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/10"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-600" />
                              {loading ? "..." : "PDF"}
                            </Button>
                          )}
                        </PDFDownloadLink>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteInvoice(inv.id, inv.invoice_no)}
                          className="cursor-pointer hover:border-red-500 hover:text-red-700 hover:bg-red-50/10 gap-1.5 text-xs text-red-600 border-border/80"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
