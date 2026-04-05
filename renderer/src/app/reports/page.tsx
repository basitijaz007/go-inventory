"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { SalesReportResponse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

function monthStartIso(): string {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().split("T")[0];
}

export default function ReportsPage() {
  const [from, setFrom] = useState(monthStartIso());
  const [to, setTo] = useState(todayIso());
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SalesReportResponse | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getSalesReport(from, to);
      setReport(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load report";
      alert(message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">Sales summary and invoice history.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1">
            <label className="text-sm font-medium">From</label>
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">To</label>
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
          <Button onClick={() => void loadReport()} disabled={loading}>
            {loading ? "Loading..." : "Apply"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rs {(report?.summary.total_sales_amount ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report?.summary.total_invoices ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Packs Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report?.summary.total_items_sold_packs ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!report || report.sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No sales in selected date range.
                  </TableCell>
                </TableRow>
              ) : (
                report.sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.date}</TableCell>
                    <TableCell>{sale.invoice_no || `SALE-${sale.id}`}</TableCell>
                    <TableCell className="text-right">{sale.items.length}</TableCell>
                    <TableCell className="text-right font-semibold">Rs {Number(sale.total_amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
