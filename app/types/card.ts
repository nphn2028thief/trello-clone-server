export interface ICard {
  title: string;
  description: string;
  order: number;
  listId: string;
}

export interface IUpdateOrderCard {
  sourceId: string;
  destId: string;
  cardId?: string;
  sourceCards: (ICard & {
    _id: string;
  })[];
  destCards: (ICard & {
    _id: string;
  })[];
}
