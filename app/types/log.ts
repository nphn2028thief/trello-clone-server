import { ACTION, ENTITY_TYPE } from "../constants/log";

export interface IEntity {
  id: string;
  type: ENTITY_TYPE;
  title: string;
}

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  image: string;
}

export interface ILogSchema {
  action: ACTION;
  orgId: string;
  entity: IEntity;
  user: IUser;
}
