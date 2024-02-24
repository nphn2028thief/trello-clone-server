export interface IImage {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  username: string;
  linkHtml: string;
}

export interface IBoard {
  orgId: string;
  title: string;
  image: IImage;
}
