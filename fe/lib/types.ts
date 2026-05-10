export type Chunk = {
  id: string;
  title: string;
  children?: Chunk[];
};
