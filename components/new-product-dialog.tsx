"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProductForm from "@/components/product-form";

type Category = { id: string; name: string; type: string };

export default function NewProductDialog({
  categories,
}: {
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSuccess() {
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Agregar producto</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo producto</DialogTitle>
        </DialogHeader>
        <ProductForm categories={categories} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
