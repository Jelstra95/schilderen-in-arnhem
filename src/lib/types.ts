// Domain types shared across the app. These mirror the Postgres schema in
// supabase/migrations/0001_init.sql.

export type Role = "admin" | "participant";
export type CourseStatus = "open" | "closed";
export type EnrollmentStatus = "pending" | "confirmed" | "cancelled";

export interface Profile {
  id: string;
  role: Role;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  // Membership window. Participants see material dated within it (see
  // migration 0003). `access_ends_on` null = open-ended.
  access_starts_on: string | null; // date-only (YYYY-MM-DD)
  access_ends_on: string | null; // date-only (YYYY-MM-DD)
  created_at: string;
}

export interface CourseDate {
  id: string;
  title: string;
  description: string | null;
  starts_at: string; // ISO timestamp
  ends_at: string | null;
  location: string | null;
  capacity: number;
  status: CourseStatus;
  created_at: string;
}

// Row shape of the `course_dates_availability` view.
export interface CourseDateWithAvailability extends CourseDate {
  reserved: number;
  available: number;
}

export interface Enrollment {
  id: string;
  course_date_id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  status: EnrollmentStatus;
  notes: string | null;
  created_at: string;
}

export interface EnrollmentWithCourseDate extends Enrollment {
  course_date: CourseDate | null;
}

export interface Material {
  id: string;
  course_date_id: string | null;
  title: string;
  taught_on: string | null; // date the course took place (YYYY-MM-DD)
  storage_path: string;
  thumbnail_path: string | null; // preview image rendered from the PDF's 2nd page
  mime_type: string;
  size_bytes: number | null;
  created_at: string;
}
