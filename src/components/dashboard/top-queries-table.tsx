"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Query {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export function TopQueriesTable({ queries }: { queries: Query[] }) {
  if (queries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Search Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No query data available yet. Connect Google Search Console to see your top queries.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Top Search Queries</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queries.map((q, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{q.query}</TableCell>
                <TableCell className="text-right">{q.clicks}</TableCell>
                <TableCell className="text-right">{q.impressions.toLocaleString()}</TableCell>
                <TableCell className="text-right">{q.ctr}%</TableCell>
                <TableCell className="text-right">{q.position}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
