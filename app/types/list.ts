import { ICard } from "./card";

export interface IList {
  title: string;
  order: number;
  boardId: string;
}

export interface IUpdateOrderList {
  lists: {
    _id: string;
    title: string;
    order: number;
    cards: ICard[];
  }[];
}
