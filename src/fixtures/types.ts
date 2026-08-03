export interface PhotoPalette {
  topBand: string;
  bottomBand: string;
  shadowHue: number;
  meanL: number;
}

export interface PhotoExif {
  camera?: string;
  lens?: string;
  focal?: number;
  aperture?: number;
  shutter?: string;
  iso?: number;
  takenAt?: number;
}

export interface Photo {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  note?: string;
  thumbhash?: string;
  palette: PhotoPalette;
  exif: PhotoExif;
  location?: { label: string };
  showLocation?: boolean;
}

export interface Album {
  slug: string;
  title: string;
  subtitle?: string;
  intro: string;
  colophon?: string;
  lang: string;
  coverPhotoId: string;
  photoCount: number;
  published: boolean;
  photos: Photo[];
}
