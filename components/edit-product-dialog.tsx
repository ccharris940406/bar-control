"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import EditProductForm from "./edit-product-form";

type Category = { id: string; name: string; type: string };

type Product = {
  id: string;
  name: string;
  category_id: string;
  price: number;
  display_stock: number;
  warehouse_stock: number;
  min_stock: number;
  unit: string;
  units_per_box: number;
  requires_inventory: boolean;
};

export default function EditProductDialog({
  product,
  categories,
}: {
  product: Product;
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
          <DialogDescription>
            Actualiza los datos del producto {product.name}
          </DialogDescription>
        </DialogHeader>
        <EditProductForm
          product={product}
          categories={categories}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
