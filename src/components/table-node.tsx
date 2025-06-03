"use client";

import { type ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type TableNode = {
  name: string;
  status: "Ready" | "NotReady";
  roles: string;
  version: string;
  internalIP: string;
  externalIP: string;
  osImage: string;
  kernelVersion: string;
  containerRuntime: string;
};

export const columns: ColumnDef<TableNode>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "version",
    header: "Version",
  },
];
