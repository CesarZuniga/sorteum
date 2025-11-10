import {
  collection,
  doc,
  getDocs,
  writeBatch,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import type { Raffle, Ticket } from './definitions';
import { firestore } from './firebase-config'; // Assuming you have this config

// Configuration for reservation time in minutes
const RESERVATION_DURATION_MINUTES = 15;

const rafflesCollection = collection(firestore, 'raffles');

const getRaffleDoc = (id: string) => doc(firestore, 'raffles', id);
const getTicketsCollection = (raffleId: string) => collection(firestore, 'raffles', raffleId, 'tickets');
const getTicketDoc = (raffleId: string, ticketId: string) => doc(firestore, 'raffles', raffleId, 'tickets', ticketId);


// Helper to convert Firestore Timestamp to ISO string for client-side usage
const toISOStringOrUndefined = (date: any): string | undefined => {
    if (date instanceof Timestamp) {
        return date.toDate().toISOString();
    }
    return date;
};


export const getRaffles = async (): Promise<Raffle[]> => {
  const snapshot = await getDocs(rafflesCollection);
  const raffles: Raffle[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    raffles.push({
      id: doc.id,
      name: data.name,
      description: data.description,
      image: data.image,
      price: data.price,
      ticketCount: data.ticketCount,
      deadline: toISOStringOrUndefined(data.deadline) || new Date().toISOString(),
      active: new Date(data.deadline.toDate()) > new Date(),
      tickets: [], // Tickets are now a subcollection
    });
  }
  return raffles;
};

export const getRaffleById = async (id: string): Promise<Raffle | undefined> => {
  const raffleDoc = await getDoc(getRaffleDoc(id));
  if (!raffleDoc.exists()) {
    return undefined;
  }
  
  const data = raffleDoc.data();
  
  const raffle: Raffle = {
    id: raffleDoc.id,
    name: data.name,
    description: data.description,
    image: data.image,
    price: data.price,
    ticketCount: data.ticketCount,
    deadline: toISOStringOrUndefined(data.deadline) || new Date().toISOString(),
    active: new Date(data.deadline.toDate()) > new Date(),
    tickets: [], // Initialize empty
  };

  // Fetch tickets from subcollection
  const ticketsSnapshot = await getDocs(getTicketsCollection(id));
  raffle.tickets = ticketsSnapshot.docs.map(ticketDoc => {
      const ticketData = ticketDoc.data();
      return {
          id: ticketDoc.id,
          raffleId: id,
          number: ticketData.number,
          status: ticketData.status,
          buyerName: ticketData.buyerName,
          buyerEmail: ticketData.buyerEmail,
          buyerPhone: ticketData.buyerPhone,
          purchaseDate: toISOStringOrUndefined(ticketData.purchaseDate),
          reservationExpiresAt: toISOStringOrUndefined(ticketData.reservationExpiresAt),
          isWinner: ticketData.isWinner,
      } as Ticket;
  });

  return raffle;
};


export const createRaffle = async (raffleData: Omit<Raffle, 'id' | 'tickets' | 'active'>): Promise<string> => {
    const newRaffleData = {
        ...raffleData,
        deadline: Timestamp.fromDate(new Date(raffleData.deadline)),
        createdAt: serverTimestamp(),
    };
    
    const raffleDocRef = await addDoc(rafflesCollection, newRaffleData);

    const batch = writeBatch(firestore);
    const ticketsCollectionRef = getTicketsCollection(raffleDocRef.id);

    for (let i = 1; i <= raffleData.ticketCount; i++) {
        const ticketDocRef = doc(ticketsCollectionRef); // Auto-generate ID
        batch.set(ticketDocRef, {
            number: i,
            raffleId: raffleDocRef.id,
            status: 'available',
            isWinner: false,
        });
    }

    await batch.commit();
    return raffleDocRef.id;
};

export const updateRaffle = async (id: string, raffleData: Partial<Omit<Raffle, 'id' | 'tickets' | 'active' | 'ticketCount'>>): Promise<void> => {
    const dataToUpdate: any = { ...raffleData };
    if (raffleData.deadline) {
        dataToUpdate.deadline = Timestamp.fromDate(new Date(raffleData.deadline));
    }
    await updateDoc(getRaffleDoc(id), dataToUpdate);
};

export const updateTicketStatus = async (
  raffleId: string,
  ticketNumber: number,
  status: 'reserved' | 'paid' | 'available' | 'winner',
  buyerInfo?: { name: string; email: string; phone: string }
): Promise<boolean> => {
  
  const ticketsQuery = query(getTicketsCollection(raffleId), where("number", "==", ticketNumber));
  const querySnapshot = await getDocs(ticketsQuery);
  
  if (querySnapshot.empty) {
      console.error(`Ticket ${ticketNumber} not found in raffle ${raffleId}`);
      return false;
  }
  
  const ticketDoc = querySnapshot.docs[0];
  const ticketRef = ticketDoc.ref;

  const updateData: any = { status };

  if (status === 'winner') {
      updateData.isWinner = true;
  } else if (status === 'available') {
      updateData.buyerName = null;
      updateData.buyerEmail = null;
      updateData.buyerPhone = null;
      updateData.purchaseDate = null;
      updateData.reservationExpiresAt = null;
      updateData.isWinner = false;
  } else {
      if (buyerInfo) {
          updateData.buyerName = buyerInfo.name;
          updateData.buyerEmail = buyerInfo.email;
          updateData.buyerPhone = buyerInfo.phone;
      }
      if (status === 'paid') {
          updateData.purchaseDate = serverTimestamp();
          updateData.reservationExpiresAt = null;
      }
      if (status === 'reserved') {
          updateData.purchaseDate = null;
          updateData.reservationExpiresAt = Timestamp.fromDate(new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000));
      }
  }

  await updateDoc(ticketRef, updateData);
  return true;
};

export const deleteRaffle = async (id: string): Promise<boolean> => {
    // Note: Deleting a document does not delete its subcollections.
    // For a production app, a Cloud Function would be needed to clean up tickets.
    // For this project, we'll just delete the raffle document.
    await deleteDoc(getRaffleDoc(id));
    return true;
};
