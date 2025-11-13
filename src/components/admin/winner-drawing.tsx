'use client';

import type { Raffle } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Trophy, AlertCircle } from 'lucide-react';
import React from 'react';


interface WinnerDrawingProps {
    raffle: Raffle;
    winnerCount: number;
    setWinnerCount: (count: number) => void;
}

export function WinnerDrawing({ raffle, winnerCount, setWinnerCount }: WinnerDrawingProps) {
  
  const handleWinnerCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value, 10);
    if (!isNaN(count)) {
        setWinnerCount(count);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="text-primary" />
            Draw Winners (Manual)
          </CardTitle>
          <CardDescription>
            This section is for manually drawing winners. AI functionality has been removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
              <Label htmlFor="winnerCount">Number of Winners</Label>
              <Input id="winnerCount" name="winnerCount" type="number" min="1" value={winnerCount} onChange={handleWinnerCountChange} required />
            </div>
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>AI Functionality Removed</AlertTitle>
                <AlertDescription>
                    The AI-powered winner drawing and notification features have been removed. 
                    Please manage winners manually in the "Ticket Management" tab.
                </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button disabled className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Draw Winners (Disabled)
            </Button>
          </CardFooter>
      </Card>
    </div>
  );
}