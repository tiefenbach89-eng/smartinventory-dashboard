import { ColumnDef } from "@tanstack/react-table";

export interface ProductRow {
  id: string;
  name: string;
  supplier: string;
  price: number;
  description: string;
  stock: string;
  photo_url: string;
}

export const columns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: "photo_url",
    header: "Image",
    cell: ({ row }) => {
      const url = row.original.photo_url;
      return url ? (
        <img
          src={url}
          alt={row.original.name}
          className="h-10 w-10 rounded-md object-cover"
        />
      ) : (
        <div className="h-10 w-10 rounded-md bg-muted text-xs flex items-center justify-center text-muted-foreground">
          No Image
        </div>
      );
    },
  },
  {
    accessorKey: "id",
    header: "Article Number",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.original.id}</div>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "supplier",
    header: "Supplier",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.supplier}</span>
    ),
  },
  {
    accessorKey: "price",
    header: "Price (€)",
    cell: ({ row }) => (
      <div className="font-semibold">{row.original.price.toFixed(2)} €</div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.description}</span>
    ),
  },
  {
    accessorKey: "stock",
    header: "Stock / Min",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.stock}</span>
    ),
  },
];
