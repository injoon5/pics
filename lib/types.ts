export type ExifData = {
  make: string | null;
  model: string | null;
  lens: string | null;
  aperture: number | null;
  shutter: string | null;
  iso: number | null;
  focalLength: number | null;
  takenAt: string | null;
};

export type PhotoColor = {
  average: string;
  palette: string[];
  isDark: boolean;
};

export type Photo = {
  slug: string;
  album: string;
  src: string;
  alt: string;
  order: number;
  note: string;
  exif: ExifData | null;
  color: PhotoColor;
};

export type Album = {
  slug: string;
  title: string;
  subtitle: string | null;
  date: string | null;
  accent: string | null;
  description: string;
  photos: Photo[];
};
