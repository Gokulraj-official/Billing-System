"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { 
  getProducts, 
  getMembers, 
  createMember, 
  createInvoice,
  updateProductStock,
  Product,
  Member,
  Invoice
} from "@/lib/database";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { 
  Search, 
  Plus, 
  Trash2, 
  Minus, 
  UserPlus, 
  Leaf, 
  Download, 
  CheckCircle2, 
  Barcode,
  Keyboard,
  Users,
  ShoppingCart
} from "lucide-react";
import InvoicePDF from "@/components/InvoicePDF";

// Import PDFDownloadLink dynamically to prevent NextJS SSR (Server Side Rendering) issues
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export default function BillingPage() {
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("walk-in");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>("");
  const [newMemberPhone, setNewMemberPhone] = useState<string>("");
  const [newMemberAddress, setNewMemberAddress] = useState<string>("");
  
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState<boolean>(false);
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [checkoutMember, setCheckoutMember] = useState<Member | null>(null);

  // Load Data
  useEffect(() => {
    async function loadData() {
      try {
        const [prodList, memList] = await Promise.all([getProducts(), getMembers()]);
        setProducts(prodList);
        setMembers(memList);
      } catch (err) {
        console.error("Error fetching POS data:", err);
      }
    }
    loadData();
  }, []);

  // Filter products based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSelectedIndex(-1);
      return;
    }
    const filtered = products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filtered);
    setSelectedIndex(filtered.length > 0 ? 0 : -1);
  }, [searchQuery, products]);

  // Bind Keyboard Shortcut F10 & search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F10") {
        e.preventDefault();
        handleSaveInvoice();
      }
      // Focus search shortcut Alt+S
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cart, selectedMemberId, products]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock.`,
        variant: "destructive"
      });
      return;
    }

    const existingIndex = cart.findIndex((item) => item.product_id === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= product.stock) {
        toast({
          title: "Insufficient Stock",
          description: `Cannot add more. Only ${product.stock} units available.`,
          variant: "destructive"
        });
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      newCart[existingIndex].total = newCart[existingIndex].quantity * newCart[existingIndex].price;
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          total: product.price
        }
      ]);
    }
    
    setSearchQuery("");
    setSearchResults([]);
    searchInputRef.current?.focus();
    
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added.`,
      variant: "success"
    });
  };

  const updateQuantity = (productId: string, val: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newCart = cart.map((item) => {
      if (item.product_id === productId) {
        const targetQty = Math.max(1, item.quantity + val);
        if (targetQty > product.stock) {
          toast({
            title: "Stock Limit Exceeded",
            description: `Only ${product.stock} units are available in stock.`,
            variant: "destructive"
          });
          return item;
        }
        return {
          ...item,
          quantity: targetQty,
          total: targetQty * item.price
        };
      }
      return item;
    });
    setCart(newCart);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product_id !== productId));
    toast({
      title: "Removed from Cart",
      description: "Item has been removed from your cart."
    });
  };

  // Keyboard navigation for search query autocomplete
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
        addToCart(searchResults[selectedIndex]);
      }
    }
  };

  // Create new member dialog submit
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      toast({ title: "Validation Error", description: "Member name is required", variant: "destructive" });
      return;
    }
    try {
      const created = await createMember(newMemberName, newMemberPhone, newMemberAddress);
      setMembers([...members, created]);
      setSelectedMemberId(created.id);
      setIsMemberDialogOpen(false);
      setNewMemberName("");
      setNewMemberPhone("");
      setNewMemberAddress("");
      toast({
        title: "Member Created",
        description: `${created.name} is now selected.`,
        variant: "success"
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to create member", variant: "destructive" });
    }
  };

  // Save the invoice
  const handleSaveInvoice = async () => {
    if (cart.length === 0) {
      toast({
        title: "Invoice Blocked",
        description: "Your cart is empty. Please add some products.",
        variant: "destructive"
      });
      return;
    }

    try {
      const grandTotal = cart.reduce((acc, item) => acc + item.total, 0);
      const memberId = selectedMemberId === "walk-in" ? null : selectedMemberId;
      const currentMember = members.find((m) => m.id === selectedMemberId) || null;

      const invoice = await createInvoice(memberId, grandTotal, cart);
      
      // Update stocks in database
      await Promise.all(
        cart.map(async (item) => {
          const product = products.find((p) => p.id === item.product_id);
          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity);
            await updateProductStock(item.product_id, newStock);
          }
        })
      );
      
      // Update stocks locally
      const updatedProducts = products.map((p) => {
        const cartItem = cart.find((item) => item.product_id === p.id);
        if (cartItem) {
          return {
            ...p,
            stock: Math.max(0, p.stock - cartItem.quantity)
          };
        }
        return p;
      });
      setProducts(updatedProducts);
      
      // Trigger Confetti
      const confetti = (await import("canvas-confetti")).default;
      if (confetti) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }

      setCheckoutMember(currentMember);
      setSavedInvoice(invoice);
      setIsSuccessDialogOpen(true);
      setCart([]);
      setSelectedMemberId("walk-in");
      
      toast({
        title: "Invoice Saved",
        description: `Bill ${invoice.invoice_no} saved successfully!`,
        variant: "success"
      });
    } catch (err: any) {
      console.error("Save Invoice Error:", {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        error: err
      });
      toast({
        title: "Failed to Save Bill",
        description: `Error: ${err?.message || "Something went wrong saving the invoice."}`,
        variant: "destructive"
      });
    }
  };

  // Calculate totals
  const grandTotal = cart.reduce((acc, item) => acc + item.total, 0);
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const activeMember = members.find((m) => m.id === selectedMemberId) || null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Title bar / Keyboard helper banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Billing Terminal</h1>
          <p className="text-xs text-muted-foreground">Process purchases and print receipt</p>
        </div>
        <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground bg-secondary/30 border border-border/40 p-2 rounded-xl">
          <div className="flex items-center gap-1"><Keyboard className="w-3.5 h-3.5 text-emerald-600" /> <span className="font-semibold text-foreground">POS Keyboard Shortcuts:</span></div>
          <div><kbd className="px-1.5 py-0.5 bg-background border border-border rounded shadow-sm text-[10px] font-mono">F10</kbd> Save Bill</div>
          <div><kbd className="px-1.5 py-0.5 bg-background border border-border rounded shadow-sm text-[10px] font-mono">Alt + S</kbd> Search products</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Products search & Customer Select (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Member Selection */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" /> Member Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <Select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                  >
                    <option value="walk-in">Walk-in Customer</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.phone || "No Phone"})
                      </option>
                    ))}
                  </Select>
                </div>
                <Button 
                  onClick={() => setIsMemberDialogOpen(true)}
                  variant="outline" 
                  className="w-full sm:w-auto shrink-0 border-dashed hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/20"
                >
                  <UserPlus className="w-4 h-4 text-emerald-600" /> Add Member
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product Command Search */}
          <Card className="shadow-sm relative">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Barcode className="w-4 h-4 text-emerald-600" /> Product Command Palette
              </CardTitle>
              <CardDescription>Type the product name to lookup items. Use Up/Down arrows and Enter key.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search by product name..."
                  className="pl-11 h-11 text-sm bg-secondary/10"
                />
              </div>

              {/* Command Palette Dropdown Search Results */}
              {searchResults.length > 0 && (
                <div className="absolute left-6 right-6 top-[105px] z-30 bg-white border border-border/80 shadow-2xl rounded-2xl overflow-hidden animate-zoom-in">
                  <div className="max-h-[260px] overflow-y-auto p-1.5 flex flex-col gap-0.5">
                    {searchResults.map((product, idx) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-xl text-xs transition-colors cursor-pointer ${
                          idx === selectedIndex 
                            ? "bg-emerald-50 text-emerald-800 font-semibold" 
                            : "hover:bg-secondary/50 text-foreground"
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">{product.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            Stock: {product.stock} units
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-emerald-600">
                            {formatCurrency(product.price)}
                          </span>
                          <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-background border rounded text-[9px] font-mono text-muted-foreground">
                            ⏎ Add
                          </kbd>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Cart Summary (lg:col-span-5) */}
        <div className="lg:col-span-5">
          <Card className="shadow-lg border-emerald-500/10 flex flex-col min-h-[480px]">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" /> Shopping Cart
                </CardTitle>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
                  {totalItemsCount} units
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[300px]">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-3">
                  <div className="p-4 bg-secondary/40 rounded-full">
                    <ShoppingCart className="w-8 h-8 text-muted-foreground/60" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="font-bold text-sm text-foreground">Cart is empty</p>
                    <p className="text-xs">Search and add items to generate a bill.</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Product</TableHead>
                      <TableHead className="text-center w-28">Quantity</TableHead>
                      <TableHead className="text-right pr-4">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.product_id}>
                        <TableCell className="pl-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-xs text-foreground leading-tight">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency(item.price)} each</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => updateQuantity(item.product_id, -1)}
                              className="p-1 rounded-md border border-border hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors active:scale-95"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 font-bold text-xs">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product_id, 1)}
                              className="p-1 rounded-md border border-border hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.product_id)}
                              className="p-1 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors ml-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-4 font-bold text-xs text-foreground/90">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>

            <CardFooter className="flex flex-col p-6 border-t border-border/40 bg-secondary/10 rounded-b-2xl gap-4">
              {/* Calculations Box */}
              <div className="w-full flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Sales Tax (0%)</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t border-border/40 my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-foreground">Grand Total</span>
                  <span className="font-extrabold text-xl text-emerald-600">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Big Green Checkout Button */}
              <Button
                onClick={handleSaveInvoice}
                disabled={cart.length === 0}
                variant="gradient"
                size="lg"
                className="w-full h-12 shadow-lg shadow-emerald-500/10 font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
                F10 - Save Bill
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* DIALOG 1: ADD MEMBER MODAL */}
      <Dialog
        isOpen={isMemberDialogOpen}
        onClose={() => setIsMemberDialogOpen(false)}
        title="Add New Member"
      >
        <form onSubmit={handleCreateMember} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Name</label>
            <Input
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="e.g. Alice Johnson"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Phone Number</label>
            <Input
              value={newMemberPhone}
              onChange={(e) => setNewMemberPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Address (Optional)</label>
            <Input
              value={newMemberAddress}
              onChange={(e) => setNewMemberAddress(e.target.value)}
              placeholder="e.g. 123 Main Street, Sector 4, Bangalore"
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="outline" onClick={() => setIsMemberDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient">
              Save Member
            </Button>
          </div>
        </form>
      </Dialog>

      {/* DIALOG 2: CHECKOUT SUCCESS MODAL */}
      <Dialog
        isOpen={isSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
        title="Invoice Saved Successfully"
      >
        {savedInvoice && (
          <div className="flex flex-col items-center text-center gap-6 p-4">
            {/* Logo placeholder icon */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
              <Leaf className="w-8 h-8 animate-bounce" />
            </div>

            <div className="flex flex-col gap-1">
              <h4 className="text-lg font-extrabold text-foreground">{savedInvoice.invoice_no}</h4>
              <p className="text-xs text-muted-foreground">
                Date: {savedInvoice.date} {savedInvoice.billing_time ? `at ${savedInvoice.billing_time}` : ""} • Total: {formatCurrency(savedInvoice.total)}
              </p>
              {checkoutMember && (
                <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 mt-2">
                  Client: {checkoutMember.name}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4 justify-center">
              {/* PDF Download Link Wrapper */}
              <PDFDownloadLink
                document={<InvoicePDF invoice={savedInvoice} member={checkoutMember} />}
                fileName={`${savedInvoice.invoice_no}.pdf`}
                className="w-full sm:w-auto"
              >
                {/* Wait, the parameter passed contains loading state */}
                {({ loading }) => (
                  <Button variant="gradient" disabled={loading} className="w-full cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10">
                    <Download className="w-4 h-4 text-white" />
                    {loading ? "Generating PDF..." : "Download Invoice PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
              
              <Button 
                variant="outline" 
                onClick={() => setIsSuccessDialogOpen(false)}
                className="w-full sm:w-auto cursor-pointer"
              >
                Start New Bill
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
