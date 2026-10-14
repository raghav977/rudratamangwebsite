export type Lang = "en" | "np";

/** Content rows are flat: localized fields come as `title` + `title_np`. */
export type Item = Record<string, unknown> & {
  id: number;
  slug?: string | null;
  published?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

export interface GalleryImage {
  url: string;
  width?: number | null;
  height?: number | null;
  caption?: string;
}

export interface Stat {
  value: string;
  label?: string;
  label_np?: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "richtext"
    | "number"
    | "date"
    | "datetime"
    | "select"
    | "boolean"
    | "image"
    | "file"
    | "gallery"
    | "url"
    | "email"
    | "list"
    | "stats";
  localized?: boolean;
  required?: boolean;
  options?: string[];
  help?: string;
  column?: boolean;
  group?: string;
  private?: boolean;
  half?: boolean;
}

export interface CollectionDef {
  key: string;
  label: string;
  singular: string;
  description: string;
  kind: "content" | "inbox";
  icon: string;
  fields: FieldDef[];
  slugFrom?: string;
  titleField: string;
  /** Left out of the dashboard menu (campaign sections while switched off). */
  hidden?: boolean;
}

export interface List<T = Item> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
