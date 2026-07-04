"use client";

import React, { useState, useEffect } from "react";
import { getMembers, createMember, updateMember, deleteMember, Member } from "@/lib/database";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { 
  Users, 
  Search, 
  Plus, 
  AlertTriangle, 
  Pencil,
  Trash2,
  Phone,
  MapPin
} from "lucide-react";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>( "");
  const [loading, setLoading] = useState<boolean>(true);

  // Add Dialog State
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>("");
  const [newMemberPhone, setNewMemberPhone] = useState<string>("");
  const [newMemberAddress, setNewMemberAddress] = useState<string>("");

  // Edit Dialog State
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editMemberName, setEditMemberName] = useState<string>("");
  const [editMemberPhone, setEditMemberPhone] = useState<string>("");
  const [editMemberAddress, setEditMemberAddress] = useState<string>("");

  useEffect(() => {
    async function loadMembers() {
      try {
        const list = await getMembers();
        setMembers(list);
      } catch (err) {
        console.error("Failed to load members:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      toast({
        title: "Validation Error",
        description: "Member Name is required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const created = await createMember(newMemberName, newMemberPhone, newMemberAddress);
      setMembers([created, ...members]);
      setIsOpen(false);
      
      // Reset form
      setNewMemberName("");
      setNewMemberPhone("");
      setNewMemberAddress("");

      toast({
        title: "Member Created",
        description: `${created.name} successfully registered.`,
        variant: "success"
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to add member.", variant: "destructive" });
    }
  };

  const handleEditMemberClick = (member: Member) => {
    setEditingMember(member);
    setEditMemberName(member.name);
    setEditMemberPhone(member.phone || "");
    setEditMemberAddress(member.address || "");
    setIsEditOpen(true);
  };

  const handleEditMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editMemberName.trim()) {
      toast({ title: "Validation Error", description: "Member Name is required.", variant: "destructive" });
      return;
    }

    try {
      const updated = await updateMember(editingMember.id, editMemberName, editMemberPhone, editMemberAddress);
      setMembers(members.map(m => m.id === editingMember.id ? updated : m));
      setIsEditOpen(false);
      setEditingMember(null);
      toast({ title: "Member Updated", description: `${updated.name} updated successfully.`, variant: "success" });
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: "Error", 
        description: `Failed to update member: ${err.message || "Unknown error"}`, 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteMember = async () => {
    if (!editingMember) return;
    if (!confirm(`Are you sure you want to delete "${editingMember.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteMember(editingMember.id);
      setMembers(members.filter((m) => m.id !== editingMember.id));
      setIsEditOpen(false);
      setEditingMember(null);
      toast({
        title: "Member Deleted",
        description: "The customer profile was successfully removed.",
        variant: "success"
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to delete member.",
        variant: "destructive"
      });
    }
  };

  // Filter list
  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" /> Customer Directory
          </h1>
          <p className="text-xs text-muted-foreground">Search, view, register, edit, and delete store customer profiles</p>
        </div>
        <Button 
          variant="gradient" 
          onClick={() => setIsOpen(true)}
          className="cursor-pointer font-bold shadow-md shadow-emerald-500/10 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-white" /> Add New Member
        </Button>
      </div>

      {/* Main Container */}
      <Card className="shadow-sm border-border/40">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">POS Client List</CardTitle>
            <CardDescription>
              {loading ? "Fetching client index..." : `Found ${filteredMembers.length} customers`}
            </CardDescription>
          </div>
          
          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone..."
              className="pl-10 text-xs py-1.5"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-100 border-t-emerald-600 animate-spin" />
              <span className="text-xs text-muted-foreground font-semibold">Loading Directory...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">No members found</p>
                <p className="text-xs mt-0.5">Try searching with a different keyword or create a new member profile.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Client Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Address Details</TableHead>
                  <TableHead className="text-right pr-6">Quick Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="pl-6 font-semibold text-foreground/90">
                      {m.name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      {m.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-600/70" />
                          {m.phone}
                        </span>
                      ) : (
                        <span className="italic opacity-50">No phone</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium max-w-[280px] truncate">
                      {m.address ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600/70 shrink-0" />
                          {m.address}
                        </span>
                      ) : (
                        <span className="italic opacity-50">No address details</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMemberClick(m)}
                        className="cursor-pointer gap-1.5 text-xs border-border/80 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50/10"
                      >
                        <Pencil className="w-3.5 h-3.5 text-blue-600" />
                        Edit details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ADD MEMBER DIALOG MODAL */}
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add New Member"
      >
        <form onSubmit={handleAddMember} className="flex flex-col gap-4">
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
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient">
              Save Member
            </Button>
          </div>
        </form>
      </Dialog>

      {/* EDIT MEMBER DIALOG MODAL */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Member Details"
      >
        <form onSubmit={handleEditMemberSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Name</label>
            <Input
              value={editMemberName}
              onChange={(e) => setEditMemberName(e.target.value)}
              placeholder="e.g. Alice Johnson"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Phone Number</label>
            <Input
              value={editMemberPhone}
              onChange={(e) => setEditMemberPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Address (Optional)</label>
            <Input
              value={editMemberAddress}
              onChange={(e) => setEditMemberAddress(e.target.value)}
              placeholder="e.g. 123 Main Street, Sector 4, Bangalore"
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteMember}
              className="cursor-pointer flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Member
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient">
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
