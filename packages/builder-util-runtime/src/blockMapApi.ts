export interface FileChunks {
  checksums: string[];
  sizes: number[];
}

export interface BlockMap {
  files: BlockMapFile[];
  version: "1" | "2";
}

export interface BlockMapFile extends FileChunks {
  name: string;
  offset: number;
}
