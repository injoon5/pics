export interface PhotoPalette {
  topBand: string;
  bottomBand: string;
  shadowHue: number;
  meanL: number;
  /** Safari / PWA theme-color — pre-baked from analysis */
  themeColor: string;
  /** 0–1 progressive blur strength at the top edge */
  blurTop: number;
  /** 0–1 progressive blur strength at the bottom edge */
  blurBottom: number;
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
