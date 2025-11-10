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
  Firestore,
} from 'firebase/firestore';
import type { Raffle, Ticket } from './definitions';

// Configuration for reservation time in minutes
const RESERVATION_DURATION_MINUTES = 15;

const getRaffleDoc = (db: Firestore, id: string) => doc(db, 'raffles', id);
const getTicketsCollection = (db: Firestore, raffleId: string) => collection(db, 'raffles', raffleId, 'tickets');

// Helper to convert Firestore Timestamp to ISO string for client-side usage
const toISOStringOrUndefined = (date: any): string | undefined => {
    if (date instanceof Timestamp) {
        return date.toDate().toISOString();
    }
    return date;
};


export const getRaffles = async (db: Firestore): Promise<Raffle[]> => {
  const rafflesCollection = collection(db, 'raffles');
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
      active: data.deadline ? new Date(data.deadline.toDate()) > new Date() : false,
      tickets: [], // Tickets are now a subcollection
    });
  }
  return raffles;
};

export const getRaffleById = async (db: Firestore, id: string): Promise<Raffle | undefined> => {
  const raffleDoc = await getDoc(getRaffleDoc(db, id));
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
    active: data.deadline ? new Date(data.deadline.toDate()) > new Date() : false,
    tickets: [], // Initialize empty
  };

  // Fetch tickets from subcollection
  const ticketsSnapshot = await getDocs(getTicketsCollection(db, id));
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


export const createRaffle = async (db: Firestore, raffleData: Omit<Raffle, 'id' | 'tickets' | 'active'>): Promise<string> => {
    const rafflesCollection = collection(db, 'raffles');
    const newRaffleData = {
        ...raffleData,
        deadline: Timestamp.fromDate(new Date(raffleData.deadline)),
        createdAt: serverTimestamp(),
    };
    
    const raffleDocRef = await addDoc(rafflesCollection, newRaffleData);

    const batch = writeBatch(db);
    const ticketsCollectionRef = getTicketsCollection(db, raffleDocRef.id);

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

export const updateRaffle = async (db: Firestore, id: string, raffleData: Partial<Omit<Raffle, 'id' | 'tickets' | 'active' | 'ticketCount'>>): Promise<void> => {
    const dataToUpdate: any = { ...raffleData };
    if (raffleData.deadline) {
        dataToUpdate.deadline = Timestamp.fromDate(new Date(raffleData.deadline));
    }
    await updateDoc(getRaffleDoc(db, id), dataToUpdate);
};

export const updateTicketStatus = async (
  db: Firestore,
  raffleId: string,
  ticketNumber: number,
  status: 'reserved' | 'paid' | 'available' | 'winner',
  buyerInfo?: { name: string; email: string; phone: string }
): Promise<boolean> => {
  
  const ticketsQuery = query(getTicketsCollection(db, raffleId), where("number", "==", ticketNumber));
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

export const deleteRaffle = async (db: Firestore, id: string): Promise<boolean> => {
    const ticketsRef = getTicketsCollection(db, id);
    const ticketsSnapshot = await getDocs(ticketsRef);
    const batch = writeBatch(db);
    ticketsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    await deleteDoc(getRaffleDoc(db, id));
    return true;
};
