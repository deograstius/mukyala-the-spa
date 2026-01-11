export interface NavLink {
  label: string;
  path: string;
}

export interface SocialLink {
  key: string; // e.g., 'instagram', 'tiktok'
  label: string;
  url: string;
  icon: string; // path to icon asset
  username?: string;
}

export interface TimeRange {
  open: string; // 'HH:mm' 24h
  close: string; // 'HH:mm' 24h
}

export interface HoursByDay {
  mon: TimeRange[];
  tue: TimeRange[];
  wed: TimeRange[];
  thu: TimeRange[];
  fri: TimeRange[];
  sat: TimeRange[];
  sun: TimeRange[];
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ContactPhone {
  tel: string; // E.164 like '+14436810463'
  display: string; // '(443) 681 0463'
}

export interface Location {
  id: string;
  name: string;
  address: Address;
  mapUrl: string;
  phone: ContactPhone;
  email: string;
  timezone: string;
  hoursByDay: HoursByDay;
  weekdayHours?: string; // e.g., "Tue–Fri: 10 am – 6 pm"
  weekendHours?: string; // e.g., "Sun: 11 am – 4 pm"
}

export interface SiteMeta {
  name: string;
  logo: { main: string; altText: string };
  seoTitlePattern: string; // e.g., "${page} – ${site.name}"
}
