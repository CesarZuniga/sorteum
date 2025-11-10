
import type { Raffle, Ticket } from './definitions';
import { PlaceHolderImages } from './placeholder-images';
import {
  collection,
  doc,
  getDocs,
  writeBatch,
  query,
  where,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  Firestore,
} from 'firebase/firestore';

export const createRaffle = async (
  firestore: Firestore,
  raffleData: Omit<Raffle, 'id' | 'tickets' | 'active'>
): Promise<Raffle> => {
  const batch = writeBatch(firestore);
  const raffleDocRef = doc(collection(firestore, 'raffles'));

  const newRaffle: Raffle = {
    ...raffleData,
    id: raffleDocRef.id,
    active: new Date(raffleData.deadline) > new Date(),
    tickets: [], // tickets will be a subcollection
  };

  batch.set(raffleDocRef, {
    ...raffleData,
    // we dont store tickets array in the document
  });

  const ticketsCollectionRef = collection(raffleDocRef, 'tickets');
  for (let i = 0; i < raffleData.ticketCount; i++) {
    const ticketNumber = i + 1;
    const ticketDocRef = doc(ticketsCollectionRef);
    const newTicket: Omit<Ticket, 'id'> = {
      raffleId: raffleDocRef.id,
      number: ticketNumber,
      status: 'available',
    };
    batch.set(ticketDocRef, newTicket);
  }

  await batch.commit();

  return newRaffle;
};

export const updateTicketStatus = async (
  firestore: Firestore,
  raffleId: string,
  ticketNumber: number,
  status: 'reserved' | 'paid' | 'available' | 'winner',
  buyerInfo?: { name: string; email: string; phone: string }
): Promise<boolean> => {
  const ticketsQuery = query(
    collection(firestore, 'raffles', raffleId, 'tickets'),
    where('number', '==', ticketNumber)
  );

  const querySnapshot = await getDocs(ticketsQuery);
  if (querySnapshot.empty) {
    return false;
  }

  const ticketDoc = querySnapshot.docs[0];
  const ticketRef = doc(
    firestore,
    'raffles',
    raffleId,
    'tickets',
    ticketDoc.id
  );

  const updateData: Partial<Ticket> = {
    status: status as 'available' | 'reserved' | 'paid',
  };

  if (status === 'winner') {
    updateData.isWinner = true;
  } else if (status === 'available') {
    updateData.buyerName = undefined;
    updateData.buyerEmail = undefined;
    updateData.buyerPhone = undefined;
    updateData.purchaseDate = undefined;
    updateData.reservationExpiresAt = undefined;
    updateData.isWinner = false;
  } else {
    if (buyerInfo) {
      updateData.buyerName = buyerInfo.name;
      updateData.buyerEmail = buyerInfo.email;
      updateData.buyerPhone = buyerInfo.phone;
    }
    if (status === 'paid') {
      updateData.purchaseDate = new Date().toISOString();
      updateData.reservationExpiresAt = undefined;
    }
    if (status === 'reserved') {
      const RESERVATION_DURATION_MINUTES = 15;
      updateData.purchaseDate = undefined;
      updateData.reservationExpiresAt = new Date(
        Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000
      ).toISOString();
    }
  }

  await updateDoc(ticketRef, updateData);
  return true;
};

export const deleteRaffle = async (firestore: Firestore, id: string): Promise<boolean> => {
    const raffleRef = doc(firestore, 'raffles', id);
    const ticketsSnapshot = await getDocs(collection(raffleRef, 'tickets'));
    
    const batch = writeBatch(firestore);
    
    ticketsSnapshot.forEach(ticketDoc => {
        batch.delete(ticketDoc.ref);
    });

    batch.delete(raffleRef);
    
    await batch.commit();
    return true;
};

export const updateRaffle = async (
  firestore: Firestore,
  id: string,
  raffleData: Partial<Omit<Raffle, 'id' | 'tickets' | 'active' | 'ticketCount'>>
): Promise<Raffle | undefined> => {
    const raffleRef = doc(firestore, 'raffles', id);
    await updateDoc(raffleRef, raffleData);
    const updatedDoc = await getDoc(raffleRef);
    if(updatedDoc.exists()) {
        return { id: updatedDoc.id, ...updatedDoc.data() } as Raffle;
    }
    return undefined;
};
