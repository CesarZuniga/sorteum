'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getRaffles } from '@/lib/data';
import type { Raffle } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteRaffleAction } from '@/lib/actions';


export default function RafflesPage() {
  const [raffles, setRaffles] = useState<Raffle[]>(getRaffles());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Raffles</h1>
          <p className="text-muted-foreground">Manage all your raffles here.</p>
        </div>
        <Button asChild>
          <Link href="/admin/raffles/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Raffle
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Tickets Sold</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {raffles.map((raffle) => {
                const sold = raffle.tickets.filter(t => t.status !== 'available').length;
                return (
                  <TableRow key={raffle.id}>
                    <TableCell className="font-medium">
                        <Link href={`/admin/raffles/${raffle.id}`} className="hover:underline">{raffle.name}</Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={raffle.active ? 'default' : 'secondary'}>
                        {raffle.active ? 'Active' : 'Ended'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(raffle.price)}</TableCell>
                    <TableCell>{sold} / {raffle.ticketCount}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                           <DropdownMenuItem asChild><Link href={`/admin/raffles/${raffle.id}`}>View</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href={`/admin/raffles/${raffle.id}/edit`}>Edit</Link></DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Delete</DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the
                                    "{raffle.name}" raffle and all associated data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <form action={deleteRaffleAction}>
                                      <input type="hidden" name="id" value={raffle.id} />
                                      <AlertDialogAction asChild>
                                          <Button type="submit" variant="destructive">Delete</Button>
                                      </AlertDialogAction>
                                  </form>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
