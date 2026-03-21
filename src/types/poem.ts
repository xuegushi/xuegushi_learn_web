export interface PoemDetail {
  poem?: {
    title?: string;
    author?: string;
    dynasty?: string;
    type?: string;
    id?: number;
    content?: {
      content?: string[];
    };
    xu?: string | null;
    intro?: string;
    background?: string;
  };
  detail?: {
    yi?: {
      content?: string[];
    };
    zhu?: {
      content?: string[];
    };
    shangxi?: {
      content?: string[];
    };
  };
  author?: {
    author_name?: string;
    dynasty?: string;
    profile?: string;
  };
}

export interface CatalogItem {
  _id: string;
  catalog: string;
  catalog_name: string;
  thumbnail: string;
  intro: string;
  description: string;
  profile: string;
}

export interface PoemItem {
  _id: string;
  type: string;
  title: string;
  author: string;
  dynasty: string;
  target_id: number;
  target_type?: string;
  tag?: string;
  order?: number;
}

export interface Fascicule {
  _id: string;
  fascicule: string;
  fascicule_name: string;
  doc_list: PoemItem[];
}

export interface CatalogDetail {
  catalog: string;
  catalog_name: string;
  thumbnail: string;
  intro: string;
  description: string;
  profile: string;
  fasciculeList: Fascicule[];
}

export interface Poem {
  targetId: number;
  title: string;
  author: string;
  dynasty: string;
  grade: string;
}

export interface PinyinData {
  title?: string[];
  author?: string[];
  content?: string[][];
  xu?: string | null;
}
