"use client";

import React, { useState, useEffect } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct, updateProductStock, Product } from "@/lib/database";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { 
  Package, 
  Search, 
  Plus, 
  PlusCircle,
  AlertTriangle, 
  CheckCircle,
  Archive,
  Pencil,
  Trash2
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Dialog State
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [newProductName, setNewProductName] = useState<string>("");
  const [newProductPrice, setNewProductPrice] = useState<string>("");
  const [newProductStock, setNewProductStock] = useState<string>("");

  // Edit Dialog State
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductName, setEditProductName] = useState<string>("");
  const [editProductPrice, setEditProductPrice] = useState<string>("");
  const [editProductStock, setEditProductStock] = useState<string>("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const list = await getProducts();
        setProducts(list);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice || !newProductStock) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(newProductPrice);
    const stock = parseInt(newProductStock);

    if (isNaN(price) || price <= 0) {
      toast({ title: "Validation Error", description: "Price must be a valid positive number.", variant: "destructive" });
      return;
    }
    if (isNaN(stock) || stock < 0) {
      toast({ title: "Validation Error", description: "Stock must be a non-negative integer.", variant: "destructive" });
      return;
    }

    try {
      const newProd = await createProduct(newProductName, price, stock);
      setProducts([newProd, ...products]);
      setIsOpen(false);
      
      // Reset form
      setNewProductName("");
      setNewProductPrice("");
      setNewProductStock("");

      toast({
        title: "Product Added",
        description: `${newProd.name} successfully created.`,
        variant: "success"
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to add product.", variant: "destructive" });
    }
  };

  const handleQuickRestock = async (productId: string, currentStock: number) => {
    try {
      const increment = 10;
      const newStock = currentStock + increment;
      await updateProductStock(productId, newStock);
      
      setProducts(
        products.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
      );

      toast({
        title: "Stock Updated",
        description: `Successfully added ${increment} units to stock.`,
        variant: "success"
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update stock.", variant: "destructive" });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditProductName(product.name);
    setEditProductPrice(product.price.toString());
    setEditProductStock(product.stock.toString());
    setIsEditOpen(true);
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editProductName.trim() || !editProductPrice || !editProductStock) {
      toast({ title: "Validation Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    const price = parseFloat(editProductPrice);
    const stock = parseInt(editProductStock);
    if (isNaN(price) || price <= 0) {
      toast({ title: "Validation Error", description: "Price must be a valid positive number.", variant: "destructive" });
      return;
    }
    if (isNaN(stock) || stock < 0) {
      toast({ title: "Validation Error", description: "Stock must be a non-negative integer.", variant: "destructive" });
      return;
    }

    try {
      const updated = await updateProduct(editingProduct.id, editProductName, price, stock);
      setProducts(products.map(p => p.id === editingProduct.id ? updated : p));
      setIsEditOpen(false);
      setEditingProduct(null);
      toast({ title: "Product Updated", description: `${updated.name} successfully updated.`, variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update product.", variant: "destructive" });
    }
  };

  const handleDeleteProduct = async () => {
    if (!editingProduct) return;
    if (!confirm(`Are you sure you want to delete "${editingProduct.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteProduct(editingProduct.id);
      setProducts(products.filter((p) => p.id !== editingProduct.id));
      setIsEditOpen(false);
      setEditingProduct(null);
      toast({
        title: "Product Deleted",
        description: "The product was successfully removed.",
        variant: "success"
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to delete product.",
        variant: "destructive"
      });
    }
  };

  // Filter list
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockBadge = (stock: number) => {
    if (stock < 10) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
          <AlertTriangle className="w-3 h-3 text-red-600" />
          Critical ({stock})
        </span>
      );
    }
    if (stock < 25) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Low ({stock})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
        <CheckCircle className="w-3 h-3 text-emerald-600" />
        Healthy ({stock})
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Archive className="w-6 h-6 text-emerald-600" /> Product Inventory
          </h1>
          <p className="text-xs text-muted-foreground">Manage your product catalog and stock levels</p>
        </div>
        <Button 
          onClick={() => setIsOpen(true)}
          variant="gradient"
          className="w-full sm:w-auto shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" /> Add New Product
        </Button>
      </div>

      {/* Main Table view */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name..."
              className="pl-10 h-11 text-sm bg-secondary/10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">
              Loading inventory list...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-3">
              <Package className="w-8 h-8 text-muted-foreground/60" />
              <div>
                <p className="font-bold text-sm text-foreground">No products found</p>
                <p className="text-xs mt-0.5">Try searching with a different product name or add a new one.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Product Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead className="text-right pr-6">Quick Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-6 font-semibold text-foreground/90">
                      {p.name}
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600 text-sm">
                      {formatCurrency(p.price)}
                    </TableCell>
                    <TableCell>{getStockBadge(p.stock)}</TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(p)}
                          className="cursor-pointer gap-1.5 text-xs border-border/80 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50/10"
                        >
                          <Pencil className="w-3.5 h-3.5 text-blue-600" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickRestock(p.id, p.stock)}
                          className="cursor-pointer border-dashed hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/10 text-xs gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                          +10 Restock
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

      {/* ADD PRODUCT DIALOG MODAL */}
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add New Product"
      >
        <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Product Name</label>
            <Input
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="e.g. Formula 1 Nutritional Shake Mix"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Price (INR ₹)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                placeholder="499.00"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Initial Stock</label>
              <Input
                type="number"
                min="0"
                value={newProductStock}
                onChange={(e) => setNewProductStock(e.target.value)}
                placeholder="20"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient">
              Save Product
            </Button>
          </div>
        </form>
      </Dialog>

      {/* EDIT PRODUCT DIALOG MODAL */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Product"
      >
        <form onSubmit={handleEditProductSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Product Name</label>
            <Input
              value={editProductName}
              onChange={(e) => setEditProductName(e.target.value)}
              placeholder="e.g. Formula 1 Nutritional Shake Mix"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Price (INR ₹)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editProductPrice}
                onChange={(e) => setEditProductPrice(e.target.value)}
                placeholder="499.00"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Current Stock</label>
              <Input
                type="number"
                min="0"
                value={editProductStock}
                onChange={(e) => setEditProductStock(e.target.value)}
                placeholder="20"
                required
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteProduct}
              className="cursor-pointer flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Product
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient">
                Update Product
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
