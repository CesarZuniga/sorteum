
'use client';

import { useActionState, useFormStatus } from 'react-dom';
import { drawWinnerAction, notifyWinnersAction } from '@/lib/actions';
import type { Raffle } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Send, Trophy, AlertCircle, CheckCircle } from 'lucide-react';
import React from 'react';

function SubmitButton({ text, loadingText }: { text: string; loadingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Sparkles className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        text
      )}
    </Button>
  );
}

interface WinnerDrawingProps {
    raffle: Raffle;
    winnerCount: number;
    setWinnerCount: (count: number) => void;
}

export function WinnerDrawing({ raffle, winnerCount, setWinnerCount }: WinnerDrawingProps) {
  const [drawState, drawFormAction] = useActionState(drawWinnerAction, { success: false });
  const [notifyState, notifyFormAction] = useActionState(notifyWinnersAction, { success: false });
  
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
            Draw Winners with AI
          </CardTitle>
          <CardDescription>
            Use GenAI to select winners based on your criteria. This process is transparent and the reasoning will be recorded.
          </CardDescription>
        </CardHeader>
        <form action={drawFormAction}>
          <CardContent className="space-y-4">
            <input type="hidden" name="raffleId" value={raffle.id} />
            <div>
              <Label htmlFor="criteria">Winning Criteria</Label>
              <Textarea
                id="criteria"
                name="criteria"
                placeholder="e.g., 'Select the winners with pure randomness, ensuring a fair chance for every ticket number.'"
                required
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="winnerCount">Number of Winners</Label>
              <Input id="winnerCount" name="winnerCount" type="number" min="1" value={winnerCount} onChange={handleWinnerCountChange} required />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton text="Draw Winners" loadingText="Drawing..." />
          </CardFooter>
        </form>
        {drawState.error && (
            <CardFooter>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{drawState.error}</AlertDescription>
              </Alert>
            </CardFooter>
        )}
      </Card>
      
      {drawState.success && drawState.result && (
        <Card className="bg-primary/10 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="text-primary"/>Winning Numbers!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {drawState.result.winningTicketNumbers.map(num => (
                    <div key={num} className="bg-primary text-primary-foreground font-bold text-lg rounded-md px-4 py-2">
                        {String(num).padStart(3, '0')}
                    </div>
                ))}
            </div>
            <div>
                <p className="font-semibold">AI's Reasoning:</p>
                <p className="text-sm text-muted-foreground italic">"{drawState.result.reasoning}"</p>
            </div>
          </CardContent>
          <CardFooter>
            <form action={notifyFormAction} className="w-full">
              <input type="hidden" name="raffleId" value={raffle.id} />
              <input type="hidden" name="winningNumbers" value={drawState.result.winningTicketNumbers.join(', ')} />
              <Button type="submit" variant="secondary" className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Notify All Participants via SMS
              </Button>
            </form>
          </CardFooter>
          {notifyState.message && (
             <CardFooter>
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Notifications Sent</AlertTitle>
                    <AlertDescription>{notifyState.message}</AlertDescription>
                </Alert>
             </CardFooter>
          )}
           {notifyState.error && (
             <CardFooter>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Notification Error</AlertTitle>
                    <AlertDescription>{notifyState.error}</AlertDescription>
                </Alert>
             </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
